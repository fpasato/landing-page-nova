import { useState, type FormEvent } from 'react'
import styles from './styles.module.css'

type Status = 'idle' | 'loading' | 'success' | 'error'

type NewsletterProps = {
    onSubscribe?: (email: string) => Promise<void>
}

const content = {
    tag: 'Newsletter',
    title: 'Fique por dentro',
    text: 'Drops antecipados, lançamentos e bastidores da NOVA direto no seu e-mail. Sem spam, só o que importa.',
    cta: 'Inscrever',
    note: 'Ao se inscrever, você concorda em receber e-mails da NOVA. Cancele quando quiser.',
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export function Newsletter({ onSubscribe }: NewsletterProps) {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<Status>('idle')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (status === 'loading') return

        if (!isEmail(email.trim())) {
            setStatus('error')
            return
        }

        try {
            setStatus('loading')
            await onSubscribe?.(email.trim())
            setStatus('success')
            setEmail('')
        } catch {
            setStatus('error')
        }
    }

    return (
        <section id="newsletter" className={styles.newsletter}>
            <div className={styles.inner}>
                <div className={styles.copy}>
                    <span className={styles.tag}>{content.tag}</span>
                    <h2 className={styles.title}>
                        {content.title}
                        <span>.</span>
                    </h2>
                    <p className={styles.text}>{content.text}</p>
                </div>

                <div className={styles.formWrap}>
                    {status === 'success' ? (
                        <div className={styles.success} role="status">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m5 12.5 4.5 4.5L19 7.5" />
                            </svg>
                            <p>Você está dentro. Em breve chegam as novidades.</p>
                        </div>
                    ) : (
                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            <div className={styles.field} data-error={status === 'error'}>
                                <label htmlFor="newsletter-email">E-mail</label>
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (status === 'error') setStatus('idle')
                                    }}
                                    aria-invalid={status === 'error'}
                                    aria-describedby="newsletter-msg"
                                />
                                <button
                                    type="submit"
                                    className={styles.btn}
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? 'Enviando...' : content.cta}
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                    </svg>
                                </button>
                            </div>

                            <p id="newsletter-msg" className={styles.msg} role="alert">
                                {status === 'error' ? 'Digite um e-mail válido para continuar.' : ''}
                            </p>

                            <p className={styles.note}>{content.note}</p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}