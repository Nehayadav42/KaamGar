import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import HowItWorks from '../components/landing/HowItWorks'
import Benefits from '../components/landing/Benefits'
import Principles from '../components/landing/Principles'
import Faq from '../components/landing/Faq'
import ClosingCta from '../components/landing/ClosingCta'
import Footer from '../components/landing/Footer'
import RoleOverlay from '../components/RoleOverlay'

export default function Landing() {
  const location = useLocation()
  const [chooserOpen, setChooserOpen] = useState(Boolean(location.state?.openChooser))
  const openChooser = useCallback(() => setChooserOpen(true), [])
  const closeChooser = useCallback(() => setChooserOpen(false), [])

  return (
    <div className="landing-backdrop min-h-screen">
      <Navbar onChooseRole={openChooser} />
      <main>
        <Hero onChooseRole={openChooser} />
        <HowItWorks />
        <Benefits />
        <Principles />
        <Faq />
        <ClosingCta onChooseRole={openChooser} />
      </main>
      <Footer />
      <RoleOverlay open={chooserOpen} onClose={closeChooser} />
    </div>
  )
}
