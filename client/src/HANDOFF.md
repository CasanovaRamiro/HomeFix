# HomeFix — Landing Page Handoff (client/)

A ready-to-drop-in landing page for the **`HomeFix/client`** app, written in your exact stack: **React 19 + Vite + Tailwind v4 + react-router-dom v7 + lucide-react**, TypeScript, es-AR voseo copy. It reuses the theme tokens already in your `src/index.css` (`accent` = `#10B981`, dark bands = `#0F172A`, Montserrat).

All the code is in **`handoff/code/`** and the images in **`handoff/assets/`** (in this design-system project). Copy them across as described below.

---

## 1. Copy the assets

Into `client/src/assets/`:

```
handoff/assets/homefix-logo.png            →  client/src/assets/homefix-logo.png
handoff/assets/homefix-logo-negative.png   →  client/src/assets/homefix-logo-negative.png
handoff/assets/hero-bg.jpg                 →  client/src/assets/hero-bg.jpg
handoff/assets/categories/*.jpg            →  client/src/assets/categories/
```

(8 category jpgs: electricidad, plomeria, carpinteria, hvac, pintura, albanileria, cerrajeria, electronica.)
You already have `src/assets/hero.png` — if you prefer it, point `Hero.tsx` at it instead of `hero-bg.jpg`.

## 2. Copy the code

Preserve these paths under `client/src/`:

```
handoff/code/data/landingData.ts                      →  client/src/data/landingData.ts
handoff/code/views/Landing.tsx                        →  client/src/views/Landing.tsx
handoff/code/components/landing/LandingNav.tsx        →  client/src/components/landing/LandingNav.tsx
handoff/code/components/landing/Hero.tsx              →  client/src/components/landing/Hero.tsx
handoff/code/components/landing/TrustSection.tsx      →  client/src/components/landing/TrustSection.tsx
handoff/code/components/landing/HowItWorks.tsx        →  client/src/components/landing/HowItWorks.tsx
handoff/code/components/landing/Categories.tsx        →  client/src/components/landing/Categories.tsx
handoff/code/components/landing/Features.tsx          →  client/src/components/landing/Features.tsx
handoff/code/components/landing/Reviews.tsx           →  client/src/components/landing/Reviews.tsx
handoff/code/components/landing/FinalCta.tsx          →  client/src/components/landing/FinalCta.tsx
handoff/code/components/landing/LandingFooter.tsx     →  client/src/components/landing/LandingFooter.tsx
```

(`src/data/` is a new folder — fine, it matches your `services/` / `hooks/` flat-folder style.)

## 3. Wire the route (`src/App.tsx`)

The landing is **public** (no `PrivateRoute`). Add the import and a `/` route, and point the catch-all at `/` instead of `/login`:

```tsx
import Landing from './views/Landing'
// ...
<Routes>
  <Route path="/" element={<Landing />} />        {/* NEW — public home */}
  <Route path="/login" element={<Login />} />
  {/* ...all your existing routes... */}
  <Route path="*" element={<Navigate to="/" replace />} />   {/* was /login */}
</Routes>
```

## 4. Run

```bash
pnpm dev-fe        # from repo root  →  http://localhost:5173
```

Open `/`. No new dependencies are required — `lucide-react` and `react-router-dom` are already in `client/package.json`.

---

## How it maps to your conventions

| This landing uses | Because your repo does |
|---|---|
| `bg-[#0F172A]` for dark bands, `text-white/60` subtext | exactly how `TrabajadorFeed.tsx` styles its header band |
| `text-accent` / `bg-accent` / `hover:bg-accent-hover` | `@theme` tokens in `index.css` (`--color-accent`, `--color-accent-hover`) |
| `rounded-2xl border border-slate-200 bg-white shadow-sm` cards | matches your feed cards |
| `lucide-react` named icons (`<ArrowRight />`) | your icon library |
| `useNavigate()` for all CTAs | your routing pattern |
| `export default function` views + per-domain `components/<area>/` | your file structure (`components/post/`, `components/worker/`) |
| Montserrat, es-AR voseo ("Buscá", "Resolvé") | your font + copy voice |

### CTA destinations (adjust to taste)
Since the feed/diagnosis are behind `PrivateRoute`, the landing currently routes:
- **Registrarse / "Buscar profesional" / "Comenzar ahora"** → `/register`
- **Iniciar Sesión / category tiles / footer links** → `/login`
- **"¿Cómo funciona?" / "Diagnóstico gratuito" / "Iniciar diagnóstico"** → `/diagnosis`
- **"Soy Profesional" / "¿Buscás trabajo?"** → `/register/worker`

Change these in each section component if you want different targets.

---

## Driving it with Claude Code instead

If you'd rather have Claude Code apply it (and adapt as it goes), drop this whole design system into the repo as a skill and prompt it:

1. Copy `SKILL.md`, `README.md`, `colors_and_type.css`, `assets/`, `ui_kits/`, and this `handoff/` folder into `HomeFix/.claude/skills/homefix-design/`.
2. Prompt:
   > "Using the homefix-design skill, add a public landing page to `client/`. The finished TSX is in the skill's `handoff/code/` — copy those files to the matching `src/` paths, copy `handoff/assets/` into `src/assets/`, and wire a public `/` route in `App.tsx` (catch-all → `/`). Keep our Tailwind v4 theme tokens, `lucide-react`, and `useNavigate`. Then run `pnpm dev-fe` and fix any type errors."

---

## Notes / things to confirm
- Your `@theme` defines `--color-primary-dark: #0F172A` (slate-900). The brand's "true" navy is `#13243B`; I matched **your repo's** `#0F172A` so the landing blends with `TrabajadorFeed`. If you want the warmer navy everywhere, change `--color-primary-dark` to `#13243B` in `index.css` and swap the `bg-[#0F172A]` literals for `bg-primary-dark`.
- Worker portraits aren't used on the landing (no people photos needed) — only the hero photo, category photos, and logos.
- Strict TS: helper functions are typed; if your ESLint requires explicit return types on the components too, add `: React.JSX.Element`.
