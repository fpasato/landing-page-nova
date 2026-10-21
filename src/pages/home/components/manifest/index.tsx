import { useEffect, useState } from 'react'
import styles from './styles.module.css'

const manifest = {
  tag: 'Manifesto',
  lead: 'Não seguimos tendências. Criamos nossa própria direção.',
  intro:
    'A NOVA nasce da expressão individual, da cultura urbana e da liberdade de ser quem você é. Acreditamos que a roupa vai além da aparência: é uma extensão da identidade, uma forma de expressão e uma maneira de ocupar o mundo sem precisar pedir permissão.',
  principles: [
    {
      label: 'Autenticidade',
      text: 'Vivemos em um mundo que insiste em definir padrões, ditar comportamentos e dizer o que devemos vestir. Escolhemos outro caminho. Acreditamos na autenticidade, na individualidade e na coragem de fazer diferente.',
    },
    {
      label: 'Estética',
      text: 'Nossa estética combina minimalismo, atitude e influência urbana. Cada detalhe importa. Cada corte, textura e silhueta carrega um propósito. Criamos peças para quem valoriza o essencial, mas não aceita passar despercebido.',
    },
    {
      label: 'Presença',
      text: 'Não se trata de chamar atenção a qualquer custo. Trata-se de ter presença, construir sua própria identidade e não depender da aprovação dos outros para expressá-la.',
    },
    {
      label: 'Perspectiva',
      text: 'A NOVA representa uma nova perspectiva sobre o streetwear: menos regras, mais personalidade. Menos necessidade de pertencer, mais liberdade para ser.',
    },
  ],
  quote: 'Não vestimos apenas corpos. Vestimos ideias, movimentos e formas de enxergar o mundo.',
  callToAction: 'Vista sua identidade',
}

const INTERVAL = 7000

export function Manifest() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setTimeout(
      () => setActive((i) => (i + 1) % manifest.principles.length),
      INTERVAL,
    )
    return () => clearTimeout(id)
  }, [active, paused])

  const current = manifest.principles[active]

  return (
    <section className={styles.manifest}>
      <div className={styles.content}>
        <div className={styles.left}>
          <span className={styles.tag}>{manifest.tag}</span>
          <h1 className={styles.title}>
            Vá além do <em>comum.</em>
          </h1>
          <p className={styles.lead}>{manifest.lead}</p>
          <p className={styles.intro}>{manifest.intro}</p>
        </div>

        <div
          className={styles.right}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div key={active} className={styles.panel}>
            <span className={styles.number}>0{active + 1}</span>
            <h2 className={styles.label}>{current.label}</h2>
            <p className={styles.text}>{current.text}</p>
          </div>

          <ul className={styles.nav}>
            {manifest.principles.map((item, i) => (
              <li key={item.label}>
                <button
                  type="button"
                  className={styles.navItem}
                  data-active={i === active}
                  onClick={() => setActive(i)}
                  aria-label={item.label}
                >
                  <span className={styles.bar}>
                    <span
                      className={styles.fill}
                      style={{ animationPlayState: paused ? 'paused' : 'running' }}
                    />
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className={styles.footer}>
        <blockquote className={styles.quote}>{manifest.quote}</blockquote>
        <a href="#colecao" className={styles.btn}>
          {manifest.callToAction}
        </a>
      </footer>
    </section>
  )
}