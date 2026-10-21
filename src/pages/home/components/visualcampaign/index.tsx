import { useEffect, useRef } from 'react'
import styles from './styles.module.css'
import logo from '../../../../assets/logo.png'
import campaign from '../../../../assets/campaign.jpg'

const content = {
    headline: ['NÃO SEJA', 'MAIS UM'],
    subline: 'Sua identidade. Suas regras. Sua movimentação.',
    cta: 'Explore a coleção',
}

export function VisualCampaign() {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.dataset.visible = 'true'
                } else {
                    // reset para poder reanimar na próxima entrada
                    delete el.dataset.visible
                }
            },
            {
                threshold: 0.25,
                // margem para o reset acontecer só quando sair bem da tela
                rootMargin: '-10% 0% -10% 0%',
            },
        )

        io.observe(el)
        return () => io.disconnect()
    }, [])

    return (
        <section ref={ref} id="campanha" className={styles.campaign}>
            <div className={styles.frame}>
                <img
                    className={styles.photo}
                    src={campaign}
                    alt="Modelo vestindo peças oversized pretas em um cenário urbano de concreto"
                />

                <img className={styles.logo} src={logo} alt="NOVA" />

                <div className={styles.content}>
                    <h2 className={styles.headline}>
                        <span className={styles.line}>{content.headline[0]}</span>
                        <span className={styles.line}>
                            {content.headline[1]}
                            <em>.</em>
                        </span>
                    </h2>

                    <div className={styles.footer}>
                        <p className={styles.subline}>{content.subline}</p>
                        <a href="#colecao" className={styles.cta}>
                            {content.cta}
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}