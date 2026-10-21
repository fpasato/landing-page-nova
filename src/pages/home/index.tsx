import styles from './styles.module.css'
import { Header } from '../../components/header'
import { Hero } from './components/hero'
import { Collection } from './components/collection'
import { Manifest } from './components/manifest'
import { VisualCampaign } from './components/visualcampaign'
import { Newsletter } from './components/newsletter'
import { Footer } from '../../components/footer'


export function Home() {
    return (
        <div className={styles.home}>
            <Header />
            <Hero />
            <Collection />
            <Manifest />
            <VisualCampaign />
            <Newsletter />
            <Footer />
        </div>
    )
}