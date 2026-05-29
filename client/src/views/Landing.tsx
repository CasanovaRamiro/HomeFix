// src/views/Landing.tsx
import LandingNav from '../components/landing/LandingNav'
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
    <main className="min-h-screen bg-white">
      <LandingNav />
      <Hero />
      <TrustSection />
      <HowItWorks />
      <Categories />
      <Features />
      <Reviews />
      <FinalCta />
      <LandingFooter />
    </main>
  )
}
