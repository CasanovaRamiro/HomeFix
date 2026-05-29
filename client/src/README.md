# HomeFix — Design System

**HomeFix** (stylized with an "✕" monogram; internal/MVP codename **OFIX**) is a trust-first **marketplace for at-home repair services** built for the **Argentine market** (Buenos Aires / Capital + GBA). It connects households with verified tradespeople — plumbers, electricians, A/C techs, carpenters, painters, locksmiths, etc. — and leans hard on a *triple-verification* trust system (identity / professional license / background check) as its core differentiator.

The product is bilingual-feeling but written entirely in **Argentine Spanish (voseo)**. The tone is reassuring, safety-forward, and plain-spoken: "Soluciones para tu hogar, con total confianza."

## Products / surfaces represented

This system is derived from **one product**: the HomeFix consumer web platform (Next.js 16 + React 19 + Tailwind + shadcn/ui). It contains two user roles that reshape the same shell:

| Role | What they see |
|------|---------------|
| **Guest** | Marketing landing, search, worker profiles, diagnostic wizard |
| **Cliente** (homeowner) | Dashboard, search, new request, my requests, appointments, chat |
| **Trabajador** (pro) | Worker dashboard, available jobs, applications, validations |

Core flows / routes: `/` landing · `/search` (filterable pro directory) · `/worker/[id]` (pro profile + chat + booking) · `/diagnostico` (3-step assisted-diagnosis wizard) · `/dashboard` (appointments + messages) · plus a global floating **SOS** emergency button. Auth screens: `/login`, `/register`.

## Sources

All foundations were reverse-engineered from a single attached codebase (read-only, mounted locally — not bundled here):

- **Codebase:** `home-fix-platform-development/` — Next.js App Router app. Key files:
  - `app/globals.css` — **the source of truth for colors & type** (the navy/emerald + Montserrat theme). Note: the repo's own `README.md` / `OFIX_SUMMARY.md` describe an *older* blue `#0066CC` "OFIX" palette — that is stale; the shipped theme is navy + emerald "HomeFix".
  - `app/page.tsx` — landing page (hero, security cards, how-it-works, categories, features, reviews, CTA)
  - `app/search/page.tsx`, `app/worker/[id]/page.tsx`, `app/diagnostico/page.tsx`, `app/dashboard/page.tsx`
  - `components/` — Navbar, Footer, WorkerCard, ReviewCard, RatingStars, VerificationBadge, CategoryCard, DiagnosticoWizard, SOS
  - `components/ui/` — shadcn/ui primitives (button, card, input, badge, …)
  - `lib/data/` — mock data (workers, reviews, categories, bookings, conversations)
  - `public/` — logos, icons, hero + category imagery (copied into `assets/`)

No Figma file or slide decks were provided.

---

## CONTENT FUNDAMENTALS

How HomeFix writes.

**Language & dialect.** Argentine Spanish using **voseo** imperatives — *"Usá", "Buscá", "Compará", "Coordiná", "Recibí", "Calificá", "¿Buscás trabajo?"* (never the tú forms *usa/busca*). Addresses the reader directly as **vos/tu** ("tu hogar", "cerca de ti", "lo que necesitas").

**Voice.** Reassuring and protective. The recurring promise is **safety and trust** — almost every section reinforces that pros are vetted. Sample copy:
- Hero: *"Soluciones para tu hogar, con total confianza"* → *"con total confianza"* is set in emerald to land the emotional payoff.
- Security: *"Tu seguridad es nuestra prioridad"* / *"Sabes exactamente quien entrara a tu hogar."*
- How it works: *"Simple, rapido y seguro"* — three short adjectives.
- CTA: *"Resuelve tu problema hoy mismo"*, *"Buscar profesional ahora"*.

**Casing.** **Sentence case** everywhere — headlines, buttons, nav. The *only* uppercase is the **eyebrow/kicker** label above section titles (e.g. `SISTEMA DE CONFIANZA`, `COMO FUNCIONA`, `SERVICIOS`), set small, letter-spaced, in emerald.

**Accents are applied inconsistently** in the source (e.g. "diagnostico", "calificacion", "rapido" often appear without their tildes, while "Reseñas", "Miércoles" keep them). Treat this as a known data-entry quirk, not a deliberate style — **prefer correct accents** in new copy.

**Buttons** are short verb phrases, frequently paired with a trailing arrow icon: *"Buscar profesional →"*, *"Comenzar ahora →"*, *"Ver Perfil"*, *"Iniciar diagnostico gratuito →"*. Secondary/outline buttons ask questions: *"¿Cómo funciona?"*, *"¿Buscás trabajo?"*.

**Numbers / proof.** Stats are punchy and rounded with a `+`: **15,000+** servicios, **2,500+** profesionales, **4.9** calificación, **< 1hs** respuesta. Trust badges read *"DNI verificado", "Verificación facial biométrica", "Verificación Triple"*.

**Emoji.** Used **sparingly and only as data**, never in UI chrome: category records carry an emoji (⚡ 🔧 🪵 ❄️ 🎨 🧱 🔐 💨) and the diagnostic steps use 🔧 📝 ⏰. Marketing/body copy is emoji-free. **Do not sprinkle emoji into headings or buttons.**

**Vibe:** professional, local, dependable — a serious utility you'd trust with keys to your home, not a playful consumer app.

---

## VISUAL FOUNDATIONS

**Color.** Two-color brand. **Navy `#13243B`** is the workhorse — primary text, headers, footer, dark section backgrounds, the "How it works" and final-CTA bands, button-on-light. **Emerald `#10B981`** is the single accent — primary CTAs, eyebrows, active/verified states, links-on-dark, focus rings, the second half of the logo. White is the dominant canvas; soft gray `#F6F7F8` separates alternating sections. Red `#EF4444` is reserved for **destructive / SOS emergency** only. Star ratings use yellow `#FACC15`. The palette is deliberately tight — no secondary brand hues, no rainbow.

**Type.** **Montserrat** throughout (weights 300–800; geometric, friendly-but-solid). Hierarchy: **Bold 700** titles → **SemiBold 600** subtitles/eyebrows → **Regular 400** body. Hero display runs 36–60px with tight tracking (`-0.02em`) and `text-balance`. Body is 16px at `line-height 1.6`; captions 12–14px in muted gray. Mono (Geist Mono) appears only for reference codes.

**Backgrounds.** Mostly flat white and flat navy. Two background treatments recur: (1) **full-bleed photography** with a **navy gradient overlay** for the hero and category tiles — `linear-gradient` from `navy/95 → navy/40` left-to-right on the hero, `navy → transparent` bottom-to-top on category cards, so white text stays legible; (2) **soft blurred emerald glow blobs** (`bg-accent/10` + `blur-3xl`, absolutely positioned and off-edge) decorating navy CTA bands and the logo lockup. No noise/grain, no repeating patterns. Imagery is **warm, real, full-color photography** of tradespeople at work (sourced from Unsplash in the MVP) — not illustration, not B&W.

**Corner radii.** Generous but not pill-everything. Base `0.5rem (8px)` for buttons & inputs; **cards are `rounded-xl (12px)`**; icon tiles & chips `rounded-lg/xl`; avatars, verified pills, eyebrow badges and the SOS button are **fully round**. Category tiles `rounded-xl`.

**Cards.** White fill, **1px `#E2E6EB` border**, `rounded-xl`, `shadow-sm` at rest. On hover they **lift to `shadow-xl` and the border turns emerald** (`hover:border-accent`). The security cards add a decorative oversized `accent/5` circle bleeding off the top-right corner that scales up on hover, plus a navy gradient icon tile (`rounded-2xl`, navy→navy/80) that scales 110% on hover.

**Shadows / elevation.** Subtle, navy-tinted. `shadow-sm` resting → `shadow-xl` on hover for interactive cards. The SOS button and dropdown menus use `shadow-xl`. No hard/black drop shadows.

**Buttons.** Three main looks: **primary** = emerald fill, white text, `hover:bg-accent/90`; **navy** = navy fill white text (used inside cards / WorkerCard); **outline** = transparent with border, often `border-primary text-primary hover:bg-primary hover:text-white`, or a **glassy** white-on-image variant (`bg-white/10 backdrop-blur-sm border-white/30`). Heights step up for marketing CTAs (h-12 → h-14 → h-16). Always `font-semibold`.

**Hover states.** Color-shift + subtle motion: fills go to `/90`; muted text → primary or emerald; cards lift in shadow & swap border to emerald; images inside cards `scale-105`–`scale-110`; icon tiles `scale-110`. Nav links get a faint `primary/8` or `secondary/60` fill.

**Press / active.** The SOS button uses `active:scale-95` (and `hover:scale-110`). Active nav route = soft `primary/8` fill with primary text.

**Animation.** Restrained and functional. Standard `transition-all duration-300` on cards, `duration-500` on image zooms. A gentle `animate-pulse` on the hero scroll indicator and SOS phone icon; `animate-bounce` dot in the scroll cue. Diagnostic wizard has an animated progress bar. No bounces, springs, or parallax — calm, professional easing (default ease).

**Borders & dividers.** Hairline `#E2E6EB`. Section dividers use the same; on navy, dividers/borders are `white/10`. Inputs have a `border-input` fill and a **3px emerald focus ring** (`ring-ring/50`).

**Transparency & blur.** Used for: hero/category image overlays (navy alpha gradients), the **sticky navbar** (`bg-background/95 backdrop-blur-md`), glassy outline buttons over images, the SOS modal scrim (`bg-background/80 backdrop-blur-sm`), and emerald glow blobs. Tints (`/5 /8 /10 /20`) are everywhere for soft fills.

**Layout.** Max content width **`max-w-7xl` (1280px)**, centered, with `px-4 sm:px-6 lg:px-8` gutters. Vertical rhythm via big section padding (`py-16` → `py-24`). Mobile-first; breakpoints sm 640 / md 768 / lg 1024 / xl 1280. **Sticky** navbar (top) and **sticky** filter sidebar (`top-24`) on search. The SOS button is **fixed** bottom-right (`bottom-6 right-6`). Grids: 3-col security, 4-col categories, 3-col results/reviews, collapsing to 1–2 on mobile.

---

## ICONOGRAPHY

**Primary icon set: [lucide-react](https://lucide.dev)** — used pervasively and consistently. Thin, rounded **stroke** icons (≈2px), no fills except deliberate accents (e.g. a filled emerald star `fill-accent`). Common glyphs in use: `Shield, ShieldCheck, BadgeCheck, CheckCircle2, Fingerprint, FileCheck` (the trust cluster); `Search, MapPin, Clock, Star, MessageSquare, Phone, ArrowRight, ChevronDown, Menu, X`; nav role icons `Home, Briefcase, ClipboardList, Calendar, User, LogOut`; SOS emergency icons `AlertTriangle, Zap, Droplets, Flame, Lock`. Icons are sized `w-4` (inline/buttons) up to `w-8` inside `w-16` tiles, and inherit `currentColor`.

For HTML deliverables, **load Lucide from CDN** (`https://unpkg.com/lucide@latest`) and call `lucide.createIcons()` — this matches the source exactly, so there is **no substitution**. Icon tiles are typically a `rounded-2xl` navy gradient square with a white icon centered.

**Logo / brand mark.** A custom **"✕" monogram** built from two arrow/chevron strokes — the left stroke **navy**, the right stroke **emerald** — followed by the **HomeFix** wordmark ("Home" navy, "Fix" emerald), Montserrat-bold. Assets in `assets/`:
- `homefix-logo.png` — full color logo (mark + wordmark) for light backgrounds
- `homefix-logo-negative.png` — the ✕ mark for **dark/navy** backgrounds (footer, CTA bands)
- `icon.svg` — app-icon monogram (rounded-rect tile + ✕ mark; uses `.background`/`.foreground` CSS classes for theming)
- `icon-light-32x32.png`, `icon-dark-32x32.png`, `apple-icon.png` — favicons / touch icon

**Emoji** appear only as category/diagnostic *data* (see Content Fundamentals) — never as interface iconography. **Unicode stars** (`★ ☆`) are used by the lightweight `RatingStars` component, though `Star` from Lucide (filled emerald) is preferred in newer surfaces.

**Imagery assets** copied into `assets/`: `hero-bg.jpg`, `hero-workers.jpg`, and 8 category photos under `assets/categories/` (electricidad, plomeria, carpinteria, hvac, pintura, albanileria, cerrajeria, electronica).

---

## INDEX — what's in this system

| Path | What it is |
|------|-----------|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | CSS custom properties (color + type tokens) + base type classes. **Import this in every deliverable.** |
| `SKILL.md` | Agent-Skill manifest (for use in Claude Code) |
| `assets/` | Logos, app icons, favicons, hero + category photography |
| `preview/` | Small HTML spec cards rendered in the Design System tab |
| `ui_kits/web/` | High-fidelity, interactive recreation of the HomeFix web platform (React/JSX components + `index.html`) |

To build something on-brand: import `colors_and_type.css`, pull Montserrat (already imported by the CSS) and Lucide (CDN), reuse components from `ui_kits/web/`, and follow the rules above. For throwaway mocks/slides, copy assets out and produce static HTML.
