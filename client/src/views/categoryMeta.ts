// Maps API category names -> a distinct color + icon, so the worker
// registration cards can render a recognizable colored block instead of a photo.
import {
  Zap, Droplets, Hammer, AirVent, PaintRoller, HardHat, KeyRound, Cpu, Wrench,
} from 'lucide-react'
import type { ElementType } from 'react'

export interface CategoryMeta {
  /** lucide icon representing the trade */
  Icon: ElementType
  /** Tailwind bg class for the icon block (kept as literal so JIT picks it up) */
  bg: string
  /** Tailwind text/icon color class */
  text: string
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
  { match: ['electronica', 'electrodomestico', 'electronic'], meta: { Icon: Cpu,        bg: 'bg-pink-100',   text: 'text-pink-600',   count: 121 } },
  { match: ['electricidad', 'electricista', 'electric'],       meta: { Icon: Zap,        bg: 'bg-amber-100',  text: 'text-amber-600',  count: 342 } },
  { match: ['plomeria', 'plomero', 'gasista', 'plumb'],        meta: { Icon: Droplets,   bg: 'bg-blue-100',   text: 'text-blue-600',   count: 289 } },
  { match: ['carpinteria', 'carpintero', 'madera', 'carpentr', 'carpenter', 'wood'], meta: { Icon: Hammer, bg: 'bg-orange-100', text: 'text-orange-600', count: 218 } },
  { match: ['pintura', 'pintor', 'paint'],                     meta: { Icon: PaintRoller, bg: 'bg-violet-100', text: 'text-violet-600', count: 267 } },
  { match: ['albanileria', 'albanil', 'construccion', 'mason', 'brick'], meta: { Icon: HardHat, bg: 'bg-stone-200', text: 'text-stone-600', count: 198 } },
  { match: ['cerrajeria', 'cerrajero', 'seguridad', 'locksmith', 'lock'], meta: { Icon: KeyRound, bg: 'bg-indigo-100', text: 'text-indigo-600', count: 134 } },
  { match: ['hvac', 'aire', 'acondicionado', 'climatiz', 'calefacc', 'ventilac', 'refriger', 'air condition', 'heating', 'cooling'], meta: { Icon: AirVent, bg: 'bg-cyan-100', text: 'text-cyan-600', count: 156 } },
]

// Neutral fallback so an unmapped category still gets a colored block + icon.
const FALLBACK: CategoryMeta = { Icon: Wrench, bg: 'bg-slate-100', text: 'text-slate-500', count: 0 }

export function getCategoryMeta(name: string): CategoryMeta {
  const n = normalize(name)
  for (const rule of RULES) {
    if (rule.match.some((m) => n.includes(m))) return rule.meta
  }
  return FALLBACK
}
