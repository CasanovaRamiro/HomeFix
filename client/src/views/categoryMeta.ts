// Maps API category names -> local thumbnail image + job count, so the worker
// registration cards can show imagery the /categories endpoint doesn't provide.
import electricidad from '../assets/categories/electricidad.jpg'
import plomeria from '../assets/categories/plomeria.jpg'
import carpinteria from '../assets/categories/carpinteria.jpg'
import hvac from '../assets/categories/hvac.jpg'
import pintura from '../assets/categories/pintura.jpg'
import albanileria from '../assets/categories/albanileria.jpg'
import cerrajeria from '../assets/categories/cerrajeria.jpg'
import electronica from '../assets/categories/electronica.jpg'

export interface CategoryMeta {
  image: string
  count: number
}

interface Rule {
  match: string[]
  meta: CategoryMeta
}

// Normalize: lowercase + strip accents so "Albañilería" === "albanileria".
const normalize = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// NOTE: the /categories API may return English or Spanish names — match both.
// Electronics is checked before Electricity so "electronic" doesn't fall into "electric".
const RULES: Rule[] = [
  { match: ['electronica', 'electrodomestico', 'electronic'], meta: { image: electronica, count: 121 } },
  { match: ['electricidad', 'electricista', 'electric'], meta: { image: electricidad, count: 342 } },
  { match: ['plomeria', 'plomero', 'gasista', 'plumb'], meta: { image: plomeria, count: 289 } },
  { match: ['carpinteria', 'carpintero', 'madera', 'carpentr', 'carpenter', 'wood'], meta: { image: carpinteria, count: 218 } },
  { match: ['pintura', 'pintor', 'paint'], meta: { image: pintura, count: 267 } },
  { match: ['albanileria', 'albanil', 'construccion', 'mason', 'brick'], meta: { image: albanileria, count: 198 } },
  { match: ['cerrajeria', 'cerrajero', 'seguridad', 'locksmith', 'lock'], meta: { image: cerrajeria, count: 134 } },
  { match: ['hvac', 'aire', 'acondicionado', 'climatiz', 'calefacc', 'ventilac', 'refriger', 'air condition', 'heating', 'cooling'], meta: { image: hvac, count: 156 } },
]

export function getCategoryMeta(name: string): CategoryMeta | null {
  const n = normalize(name)
  for (const rule of RULES) {
    if (rule.match.some((m) => n.includes(m))) return rule.meta
  }
  return null
}
