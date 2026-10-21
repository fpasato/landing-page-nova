import styles from './styles.module.css'

const content = {
    tag: 'Drop 001 · Edição limitada',
    title: 'Vista o que você é.',
    description: 'Streetwear urbano pra quem não pede licença pra existir. Produção limitada. Identidade infinita.',
    primaryCta: 'Ver a coleção',
}


export function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroContent}>
                <span className={styles.tag}>{content.tag}</span>
                <h1>{content.title}</h1>
                <p>{content.description}</p>
                <div className={styles.heroActions}>
                    <a href="#drop" className={styles.btnPrimary}>
                        Ver a coleção
                    </a>
                    <a href="#missao" className={styles.btnGhost}>
                        Nossa missão
                    </a>
                </div>
            </div>
        </section>
    )
}