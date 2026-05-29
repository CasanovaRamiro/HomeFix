---
name: homefix-design
description: Use this skill to generate well-branded interfaces and assets for HomeFix, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. HomeFix is an Argentine (voseo Spanish) marketplace for verified at-home repair services — navy + emerald, Montserrat, trust-first tone.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — product context, content & visual foundations, iconography, full index
- `colors_and_type.css` — color + type tokens and base classes. **Import in every deliverable.**
- `assets/` — logos, app icons, favicons, hero + category photography
- `preview/` — small spec cards (colors, type, spacing, components, brand)
- `ui_kits/web/` — interactive React/JSX recreation of the HomeFix platform; reuse its components

## The essentials (don't re-derive — confirm against README)
- **Colors:** navy `#13243B` (primary/text/dark bands), emerald `#10B981` (single accent — CTAs, eyebrows, verified), white canvas, `#F6F7F8` soft-gray sections, red `#EF4444` for destructive/SOS only.
- **Type:** Montserrat — Bold 700 titles, SemiBold 600 subtitles/eyebrows, Regular 400 body. Eyebrow kickers are the only uppercase.
- **Icons:** Lucide (thin rounded strokes), from CDN. No substitution.
- **Tone:** Argentine voseo ("Buscá", "Compará"), trust/safety-forward, sentence case, emoji only as category data.
- **Cards:** white, 1px `#E2E6EB` border, `rounded-xl`, `shadow-sm` → hover lifts to `shadow-xl` with emerald border.
