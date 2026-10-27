// src/views/Landing.tsx
import './landing-grid.css'
import Hero from '../components/landing/Hero'
import TrustSection from '../components/landing/TrustSection'
import HowItWorks from '../components/landing/HowItWorks'
import Categories from '../components/landing/Categories'
import Features from '../components/landing/Features'
import Reviews from '../components/landing/Reviews'
import FinalCta from '../components/landing/FinalCta'
import LandingFooter from '../components/landing/LandingFooter'

export default function Landing() {
  return (
    <main className="client-landing-grid min-h-screen bg-white">
      <Hero />
      <TrustSection />
      <HowItWorks />
      <Categories />
      <div className="client-landing-features">
        <Features />
      </div>
      <Reviews />
      <div className="client-landing-final-cta">
        <FinalCta />
      </div>
      <LandingFooter audience="client" />
    </main>
  )
}
