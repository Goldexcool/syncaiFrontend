# VOII Design Language — "Dusk"

The single source of truth for how VOII looks, on the marketing site and inside the app.
Everything earlier (the "arc" canvas colours, Bricolage, the theme toggle, `/classic`) is retired.

Reference: the Verity Framer template (verrity.framer.website). We borrow its *temperament* —
editorial serif, warm paper, dusk sky, the product shown working — not its assets or copy.

---

## 1. Idea

VOII turns what was said in a room — a client call, a stand-up, a lecture — into notes that
**show their work**: every line links back to the moment it was said.

The design says the same thing:

- **Calm, not loud.** One serif voice, lots of air, a warm palette. No gradients-as-decoration, no neon.
- **The product is the illustration.** We show real VOII UI (notes, sources, tasks, formulas), never abstract blobs or stock people.
- **Two lights.** *Paper* (cream) for reading and decisions; *Ink* (warm near-black) for the product and focus. Pages alternate between them deliberately.
- **Sources are visible.** Timestamps, speaker names and "linked to 12:04" chips are first-class UI, not footnotes.

## 2. Colour

All colour lives in CSS custom properties in `app/globals.css`. Never hard-code hex in components.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4EEE6` | Page background, light sections |
| `--paper-2` | `#EBE3D8` | Cards / wells on paper |
| `--ink` | `#13110F` | Dark sections, app background, text on paper |
| `--ink-2` | `#1C1916` | Cards, panels, app surfaces on ink |
| `--ink-3` | `#26221E` | Raised / hover surface on ink |
| `--line` | `rgba(244,233,214,.08)` | Hairlines on ink |
| `--line-2` | `rgba(244,233,214,.16)` | Stronger hairlines / inputs on ink |
| `--line-paper` | `rgba(19,17,15,.10)` | Hairlines on paper |
| `--text-on-ink` | `#FFFFFF` | Primary text on ink |
| `--muted-on-ink` | `rgba(255,255,255,.62)` | Secondary text on ink |
| `--muted` | `rgba(19,17,15,.58)` | Secondary text on paper |
| `--peach` | `#F2C8A8` | Primary accent — CTAs on ink, highlights, "needs you" |
| `--sage` | `#B4C7A6` | Success, "verified", "done", source-linked |
| `--clay` | `#C9785B` | Destructive / attention / error |
| `--dusk` | gradient | Hero sky only (see below) |

**Dusk sky** (hero + auth panel only): a vertical gradient from slate blue `#3B4152` → mauve `#7A6A78`
→ peach `#D9A58C` → horizon haze `#E9C9B0`, with a dark cloud band at the bottom fading into `--ink`.
It is built in CSS — no photography.

Rules:
- Peach is the only "call to action" colour. One peach button per view.
- Sage only ever means *done / verified / linked to source*.
- Clay only ever means *problem*. Never decorative.
- Text contrast: body text ≥ 4.5:1. `--muted-on-ink` is the floor on ink.

## 3. Type

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / headings | **Newsreader** (serif) | 300 (light), 400 for ≤ 28px | Tight tracking: `-0.03em` at display sizes, `-0.01em` at 24px |
| UI / body | **Geist** | 400, 500 | Never above 500 |
| Data / timestamps / code | **Geist Mono** | 400 | Timestamps, keyboard hints, formula source |

Scale (fluid with `clamp`):

| Token | Size | Line height |
|---|---|---|
| `--t-hero` | `clamp(44px, 7vw, 88px)` | 1.0 |
| `--t-h1` | `clamp(36px, 5vw, 60px)` | 1.05 |
| `--t-h2` | `clamp(30px, 3.6vw, 44px)` | 1.08 |
| `--t-h3` | `24px` | 1.2 |
| `--t-lede` | `17px` | 1.55 |
| `--t-body` | `15px` | 1.5 |
| `--t-small` | `13px` | 1.45 |
| `--t-micro` | `12px` | 1.4 |

Rules:
- Headlines are **sentence case**, short, and end with a full stop. "The notes that show their work."
- Italic serif (`<em>`) may emphasise one phrase in a headline. Once per heading, max.
- Eyebrows: Geist 13px, muted, no uppercase shouting, no letter-spacing tricks.

## 4. Shape, space, depth

- Radius: `--r-pill: 999px` (buttons, chips, inputs in hero), `--r-lg: 24px` (sections, windows),
  `--r-md: 16px` (cards), `--r-sm: 8px` (rows, small inputs).
- Spacing is on an 4px grid. Sections breathe: `padding-block: clamp(80px, 12vw, 160px)`.
- Max content width `1200px`; reading width `640px`.
- Depth comes from **surface colour steps** (ink → ink-2 → ink-3) and hairlines, not shadows.
  The one shadow (`--shadow-window`) is for the product window floating over the dusk sky.

## 5. Components

**Buttons**
- `.btn` pill, 44px tall, Geist 500 15px.
- `.btn--primary` — on ink: white fill, ink text. On paper: ink fill, white text.
- `.btn--peach` — peach fill, ink text. Hero/close CTA only.
- `.btn--ghost` — transparent, hairline border.
- Arrow glyph `→` trails the label. No `↗`.

**Email capture pill** (hero): translucent dark pill, input left, white `.btn` inside right. Submits to `/signup?email=`.

**Window** (`.win`): the product mock. Ink-2 background, 18px radius, hairline border, 3-column grid
(sidebar / main / sources) collapsing to one column under 860px.

**Chips** (`.chip`): small pill, hairline border, Geist 12–13px. Variants: `--sage` (verified/linked), `--peach` (needs you).

**Source line** (`.src`): `12:04 · Dr. Adeyemi` in Geist Mono, muted, with a sage dot when verified.

**Formula block** (`.formula`): serif italic maths on an ink-3 well, with a mono source timestamp beneath.
Student notes use this; it must look like a textbook, not a code block.

**Cards** (`.card`): ink-2 on ink, paper-2 on paper. 16px radius, 24–32px padding, hairline border.

**Forms**: labels above inputs, 44px inputs, 8px radius, hairline border, peach focus ring
(`outline: 2px solid var(--peach); outline-offset: 2px`). Errors in clay, below the field.

## 6. Layout patterns

- **Marketing page** = `SiteHeader` (transparent over hero, ink/blurred on scroll) → hero → alternating
  paper/ink sections → close CTA on dusk → `SiteFooter` on ink.
- **App** (`/dashboard`, onboarding) = full ink. Sidebar 248px, topbar 64px, content max 1120px.
  Headings in Newsreader, everything else Geist. This is the Verity product-window look, full screen.
- **Auth** = split: paper form column on the left, dusk panel with a live-looking note card on the right.
  Panel hides under 960px.

## 7. Motion

- Entrances: 600ms fade + 12px rise, `cubic-bezier(.2,.7,.2,1)`, staggered 60ms. CSS only.
- Hover: 150ms colour/opacity. No scale bounces, no magnetic buttons.
- `prefers-reduced-motion: reduce` → all animation off.

## 8. Voice

- Short sentences. Concrete nouns. "Notes, tasks and formulas — each linked to the moment it was said."
- Two audiences, one product: **teams & client work** and **students**. Name both; never make one an afterthought.
- No invented numbers, logos, testimonials or ratings. If we don't have the proof, we show the product instead.

## 9. Don'ts

- No theme toggle. Paper and ink are both always in the page by design.
- No purple/blue SaaS gradients, glassmorphism stacks, or emoji icons.
- No uppercase eyebrows with wide tracking.
- No more than one italic phrase per heading; no italic body text.
- No new colours without adding a token here first.
