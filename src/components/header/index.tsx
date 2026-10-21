import { useEffect, useRef, useState, type CSSProperties } from 'react'
import styles from './styles.module.css'
import logo from '../../assets/logo.png'

const links = [
    { href: '#novidades', label: 'Novidades' },
    { href: '#camisetas', label: 'Camisetas' },
    { href: '#moletons', label: 'Moletons' },
    { href: '#calcas', label: 'Calças' },
    { href: '#acessorios', label: 'Acessórios' },
    { href: '#outlet', label: 'Outlet' },
]

type HeaderProps = {
    cartCount?: number
    onCartClick?: () => void
}

const Icon = {
    search: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m20 20-4.2-4.2" />
        </svg>
    ),
    heart: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
        </svg>
    ),
    user: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.7" />
            <path d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6" />
        </svg>
    ),
    bag: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 8h14l-1 12H6L5 8Z" />
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </svg>
    ),
}

export function Header({ cartCount = 0, onCartClick }: HeaderProps) {
    const [open, setOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false)
                setSearchOpen(false)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKey)
        }
    }, [open])

    useEffect(() => {
        if (searchOpen) searchRef.current?.focus()
    }, [searchOpen])

    const close = () => setOpen(false)

    return (
        <header className={styles.header} data-open={open}>
            <div className={styles.promo}>
                Frete grátis em compras acima de <strong>R$ 299</strong>
            </div>

            <div className={styles.container}>
                <a href="/" className={styles.logoContainer} onClick={close}>
                    <img src={logo} alt="Logo Nova" />
                </a>

                <nav className={styles.nav} aria-label="Principal">
                    {links.map((l) => (
                        <a key={l.href} href={l.href}>
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label="Buscar"
                        aria-expanded={searchOpen}
                        onClick={() => setSearchOpen((v) => !v)}
                    >
                        {Icon.search}
                    </button>

                    <a
                        href="#favoritos"
                        className={`${styles.iconBtn} ${styles.hideMobile}`}
                        aria-label="Favoritos"
                    >
                        {Icon.heart}
                    </a>

                    <a
                        href="#conta"
                        className={`${styles.iconBtn} ${styles.hideMobile}`}
                        aria-label="Minha conta"
                    >
                        {Icon.user}
                    </a>

                    <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
                        onClick={onCartClick}
                    >
                        {Icon.bag}
                        {cartCount > 0 && (
                            <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
                        )}
                    </button>

                    <button
                        type="button"
                        className={styles.menuButton}
                        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                    >
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* ---------- busca ---------- */}
            <div className={styles.search} data-open={searchOpen}>
                <form
                    className={styles.searchInner}
                    role="search"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <input
                        ref={searchRef}
                        type="search"
                        placeholder="Buscar peças, coleções..."
                        aria-label="Buscar"
                        tabIndex={searchOpen ? 0 : -1}
                    />
                    <button type="submit" tabIndex={searchOpen ? 0 : -1}>
                        Buscar
                    </button>
                </form>
            </div>

            {/* ---------- menu mobile ---------- */}
            <div className={styles.drawer} aria-hidden={!open}>
                <nav className={styles.drawerNav}>
                    {links.map((l, i) => (
                        <a
                            key={l.href}
                            href={l.href}
                            onClick={close}
                            style={{ '--i': i } as CSSProperties}
                            tabIndex={open ? 0 : -1}
                        >
                            <span>0{i + 1}</span>
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className={styles.drawerFooter}>
                    <a href="#conta" onClick={close} tabIndex={open ? 0 : -1}>
                        Minha conta
                    </a>
                    <a href="#favoritos" onClick={close} tabIndex={open ? 0 : -1}>
                        Favoritos
                    </a>
                </div>
            </div>
        </header>
    )
}