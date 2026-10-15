import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Features } from './components/Features'
import { Showcase } from './components/Showcase'
import { Download } from './components/Download'
import { Faq } from './components/Faq'
import { Footer } from './components/Footer'

export function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Showcase />
        <Download />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
