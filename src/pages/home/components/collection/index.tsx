import { useEffect, useRef, type CSSProperties } from 'react'
import { createZipperFabric } from './zipper-fabric'
import styles from './styles.module.css'

/* ------------------------------------------------------------------
   Linha do tempo (progress 0..1 do scroll dentro da seção)

   0.00 - 0.08  o cursor desce até HOLD_Y e abre o zíper bem afastado
   0.08 - 0.74  o cursor fica ali; a roupa sobe e cada produto sai da
                abertura, um de cada vez (destaque)
   0.74 - 0.94  o cursor continua até o fim e o tecido abre por completo,
                mostrando todos os produtos
   0.94 - 1.00  segura a tela aberta antes de soltar a seção
------------------------------------------------------------------- */
const PULL_END = 0.08
const FINAL_START = 0.74
const FINAL_LEN = 0.2
const START_Y = 1.06 // cursor acima do topo
const HOLD_Y = 0.14 // 0..1 de baixo para cima (0.14 = 86% da altura)
const END_Y = -0.14 // cursor sai pela base
const STEP = 0.78 // distância entre produtos, em alturas de tela

const content = {
    title: 'Coleção 001',
    hint: 'Role para abrir o zíper',
    revealTitle: 'Noite Zero',
    revealText: 'Quatro peças. Produção limitada.',
    background: 'https://picsum.photos/seed/nova-bg/1920/1080',
}

const products = [
    {
        id: 1,
        name: 'Jaqueta Noir',
        category: 'Jaquetas',
        description: 'Nylon ripstop, forro refletivo e zíper YKK.',
        price: 689,
        image: 'https://images.unsplash.com/photo-1557418669-db3f781a58c0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    },
    {
        id: 2,
        name: 'Moletom Static',
        category: 'Moletons',
        description: 'Oversized, 480 g/m², lavagem acid.',
        price: 429,
        image: 'https://i.pinimg.com/736x/97/d6/30/97d630a8b9b030b0227017a240649b6c.jpg',
    },
    {
        id: 3,
        name: 'Camiseta Boxy Signal',
        category: 'Camisetas',
        description: 'Algodão pesado, corte boxy, estampa em silk.',
        price: 219,
        image: 'https://i.pinimg.com/736x/1d/8d/2f/1d8d2f12c26c592b581cb7622073a261.jpg',
    },
    {
        id: 4,
        name: 'Calça Cargo Utility',
        category: 'Calças',
        description: 'Seis bolsos, barra ajustável, sarja técnica.',
        price: 459,
        image: 'https://images.unsplash.com/photo-1711888386245-9ca3477a5977?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    },
]

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const smoothstep = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)

export function Collection() {
    const sectionRef = useRef<HTMLElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const featureRefs = useRef<(HTMLElement | null)[]>([])

    useEffect(() => {
        const section = sectionRef.current
        const stage = stageRef.current
        const canvas = canvasRef.current
        if (!section || !stage || !canvas) return

        let fabric: ReturnType<typeof createZipperFabric> | null = null
        try {
            fabric = createZipperFabric(canvas)
        } catch {
            canvas.style.display = 'none'
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        let target = 0
        let current = 0
        let smoothVel = 0
        let raf = 0
        let last = performance.now()

        const readTarget = () => {
            const rect = section.getBoundingClientRect()
            const total = rect.height - window.innerHeight
            target = clamp(-rect.top / total)
        }

        const onMouse = (e: MouseEvent) => {
            const r = stage.getBoundingClientRect()
            fabric?.setMouse((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
        }

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now

            const prev = current
            current += (target - current) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 7))

            const vel = Math.abs(current - prev) / Math.max(dt, 1e-3)
            smoothVel += (vel - smoothVel) * (1 - Math.exp(-dt * 6))
            const velocity = reduceMotion ? 0 : Math.min(smoothVel * 1.2, 1)

            // --- linha do tempo ---
            const pull = easeOutCubic(clamp(current / PULL_END))
            const scrollT =
                clamp((current - PULL_END) / (FINAL_START - PULL_END)) * (products.length - 1)
            const final = clamp((current - FINAL_START) / FINAL_LEN)

            const sliderY = START_Y + (HOLD_Y - START_Y) * pull + (END_Y - HOLD_Y) * final * final
            const offset = scrollT * STEP
            const part = smoothstep(0.3, 1, final)
            const overview = smoothstep(0.35, 0.9, final)
            const featFade = smoothstep(0.05, 0.45, final)

            stage.style.setProperty('--p', current.toFixed(4))
            stage.style.setProperty('--sy', sliderY.toFixed(4))
            stage.style.setProperty('--vel', velocity.toFixed(3))
            stage.style.setProperty('--ov', overview.toFixed(4))
            stage.style.setProperty('--part', part.toFixed(4))
            stage.dataset.open = overview > 0.6 ? 'true' : 'false'

            featureRefs.current.forEach((el, i) => {
                if (!el) return
                const d = i - scrollT
                el.style.setProperty('--d', d.toFixed(4))
                el.style.opacity = String(clamp(1.5 - Math.abs(d) * 1.1) * (1 - featFade))
            })

            fabric?.render({ sliderY, offset, part, velocity, time: now / 1000 })
            raf = requestAnimationFrame(tick)
        }

        // só roda o loop quando a seção está na tela
        const io = new IntersectionObserver(([entry]) => {
            cancelAnimationFrame(raf)
            if (entry.isIntersecting) {
                last = performance.now()
                readTarget()
                raf = requestAnimationFrame(tick)
            }
        })
        io.observe(section)

        readTarget()
        current = target
        window.addEventListener('scroll', readTarget, { passive: true })
        window.addEventListener('resize', readTarget)
        window.addEventListener('mousemove', onMouse, { passive: true })

        return () => {
            cancelAnimationFrame(raf)
            io.disconnect()
            window.removeEventListener('scroll', readTarget)
            window.removeEventListener('resize', readTarget)
            window.removeEventListener('mousemove', onMouse)
            fabric?.dispose()
        }
    }, [])

    return (
        <section ref={sectionRef} id="colecao" className={styles.collection}>
            <div
                ref={stageRef}
                className={styles.stage}
                data-open="false"
                style={{ '--step': `${STEP * 100}svh` } as CSSProperties}
            >
                <div className={styles.reveal}>
                    <img className={styles.bg} src={content.background} alt="" />
                    <div className={styles.tint} />

                    <div className={styles.features} aria-hidden="true">
                        {products.map((product, i) => (
                            <article
                                key={product.id}
                                ref={(el) => {
                                    featureRefs.current[i] = el
                                }}
                                className={styles.feature}
                            >
                                <img src={product.image} alt="" />
                                <div className={styles.featureInfo}>
                                    <span className={styles.category}>{product.category}</span>
                                    <h3>{product.name}</h3>
                                    <p>{product.description}</p>
                                    <strong>{brl.format(product.price)}</strong>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className={styles.overview}>
                        <header className={styles.head} style={{ '--s': 0 } as CSSProperties}>
                            <h2>{content.revealTitle}</h2>
                            <p>{content.revealText}</p>
                        </header>

                        <ul className={styles.grid}>
                            {products.map((product, i) => (
                                <li
                                    key={product.id}
                                    className={styles.card}
                                    style={{ '--s': 0.1 + i * 0.1 } as CSSProperties}
                                >
                                    <img src={product.image} alt={product.name} loading="lazy" />
                                    <div className={styles.info}>
                                        <span className={styles.category}>{product.category}</span>
                                        <h3>{product.name}</h3>
                                        <p className={styles.desc}>{product.description}</p>
                                        <strong>{brl.format(product.price)}</strong>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

                <div className={styles.intro}>
                    <h2>{content.title}</h2>
                    <p>{content.hint}</p>
                </div>

                <div className={styles.slider} aria-hidden="true">
                    <div className={styles.sliderBody} />
                    <div className={styles.pull} />
                </div>
            </div>
        </section>
    )
}