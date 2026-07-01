// src/views/Landing.tsx
import Hero from '../components/landing/Hero'
import Categories from '../components/landing/Categories'
import Reviews from '../components/landing/Reviews'
import FinalCta from '../components/landing/FinalCta'

export default function Landing() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Categories />
      <Reviews />
      <FinalCta />
    </main>
  )
}
