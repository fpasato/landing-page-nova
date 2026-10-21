import styles from './styles.module.css'

const columns = [
    {
        title: 'Loja',
        links: [
            { href: '#novidades', label: 'Novidades' },
            { href: '#camisetas', label: 'Camisetas' },
            { href: '#moletons', label: 'Moletons' },
            { href: '#calcas', label: 'Calças' },
            { href: '#acessorios', label: 'Acessórios' },
        ],
    },
    {
        title: 'Ajuda',
        links: [
            { href: '#trocas', label: 'Trocas e devoluções' },
            { href: '#entregas', label: 'Entregas' },
            { href: '#tamanhos', label: 'Guia de tamanhos' },
            { href: '#faq', label: 'Perguntas frequentes' },
        ],
    },
    {
        title: 'NOVA',
        links: [
            { href: '#manifesto', label: 'Manifesto' },
            { href: '#lookbook', label: 'Lookbook' },
            { href: '#contato', label: 'Contato' },
        ],
    },
]

const socials = [
    { href: 'https://instagram.com', label: 'Instagram' },
    { href: 'https://tiktok.com', label: 'TikTok' },
    { href: 'https://youtube.com', label: 'YouTube' },
]

export function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <p className={styles.tagline}>
                            Beyond the <em>ordinary.</em>
                        </p>
                        <ul className={styles.socials}>
                            {socials.map((s) => (
                                <li key={s.label}>
                                    <a href={s.href} target="_blank" rel="noreferrer">
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav className={styles.columns} aria-label="Rodapé">
                        {columns.map((col) => (
                            <div key={col.title} className={styles.column}>
                                <h3>{col.title}</h3>
                                <ul>
                                    {col.links.map((l) => (
                                        <li key={l.href}>
                                            <a href={l.href}>{l.label}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>
                <div className={styles.bottom}>
                    <p>© {year} NOVA. Todos os direitos reservados.</p>
                    <ul>
                        <li>
                            <a href="#privacidade">Privacidade</a>
                        </li>
                        <li>
                            <a href="#termos">Termos</a>
                        </li>
                        <li>
                            <a href="#top" className={styles.toTop}>
                                Voltar ao topo ↑
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    )
}