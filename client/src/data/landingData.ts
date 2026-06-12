// src/data/landingData.ts
// Static content for the HomeFix landing page.
// Category images live in src/assets/categories/ (copy them from the design-system handoff bundle).
import electricidad from '../assets/categories/electricidad.jpg'
import plomeria from '../assets/categories/plomeria.jpg'
import carpinteria from '../assets/categories/carpinteria.jpg'
import hvac from '../assets/categories/hvac.jpg'
import pintura from '../assets/categories/pintura.jpg'
import albanileria from '../assets/categories/albanileria.jpg'
import cerrajeria from '../assets/categories/cerrajeria.jpg'
import electronica from '../assets/categories/electronica.jpg'

export interface LandingCategory {
  name: string
  image: string
  count: number
}

export interface Testimonial {
  author: string
  date: string
  rating: number
  text: string
}

export const stats: { value: string; label: string }[] = [
  { value: '15,000+', label: 'Servicios completados' },
  { value: '2,500+', label: 'Profesionales verificados' },
  { value: '4.9', label: 'Calificación promedio' },
  { value: '< 1hs', label: 'Tiempo de respuesta' },
]

export const categories: LandingCategory[] = [
  { name: 'Electricidad', image: electricidad, count: 342 },
  { name: 'Plomería', image: plomeria, count: 289 },
  { name: 'Carpintería', image: carpinteria, count: 218 },
  { name: 'Aire Acondicionado', image: hvac, count: 156 },
  { name: 'Pintura', image: pintura, count: 267 },
  { name: 'Albañilería', image: albanileria, count: 198 },
  { name: 'Cerrajería', image: cerrajeria, count: 134 },
  { name: 'Electrónica', image: electronica, count: 112 },
]

export const testimonials: Testimonial[] = [
  { author: 'Lucía Fernández', date: '14 de marzo de 2026', rating: 5, text: 'Excelente trabajo. El plomero llegó puntual y dejó todo impecable. La verificación me dio mucha tranquilidad.' },
  { author: 'Martín Gómez', date: '2 de marzo de 2026', rating: 5, text: 'Resolvieron una urgencia un domingo a la noche. Rápido, prolijo y muy amable. Recomiendo HomeFix totalmente.' },
  { author: 'Sofía Díaz', date: '18 de febrero de 2026', rating: 5, text: 'Saber que el profesional tiene el DNI verificado cambia todo. Contraté con total confianza.' },
  { author: 'Diego Romero', date: '9 de febrero de 2026', rating: 5, text: 'La carpintera hizo un mueble a medida hermoso. El diagnóstico me conectó con la persona indicada.' },
  { author: 'Ana Pérez', date: '28 de enero de 2026', rating: 4, text: 'Muy buena experiencia. El chat directo me permitió coordinar todo antes de la visita.' },
  { author: 'Javier Luna', date: '15 de enero de 2026', rating: 5, text: 'Profesional matriculado, trabajo garantizado. Es la tranquilidad que buscaba para mi casa.' },
]
