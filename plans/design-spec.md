# FCA Vibe-Coding Sessions — Visual Design Specification

## 1. Palette

Use CSS custom properties exactly as named. The scheme is deliberately light, printed and restrained: contrast comes from ink, typography, whitespace and rules—not effects.

| Token | Hex | Use and rationale |
|---|---:|---|
| `--paper` | `#F7F5F0` | Page background; a warm, low-glare paper white that feels editorial rather than app-like. |
| `--paper-raised` | `#FCFBF8` | Major sections and header/footer fields; a barely lifted reading surface. |
| `--card` | `#FFFFFF` | Cards and controls; true white provides quiet separation from the paper field. |
| `--rule` | `#DDD9D1` | Standard 1px hairlines; visible enough to structure without becoming chrome. |
| `--rule-strong` | `#B9B3A9` | Active, focus-adjacent and section-emphasis borders; firm but still warm. |
| `--ink` | `#172431` | Primary text and deep institutional ink; sober, highly legible navy-charcoal. |
| `--ink-secondary` | `#52606B` | Supporting copy; retains clarity while allowing hierarchy. |
| `--ink-muted` | `#7C858A` | Eyebrows, metadata and labels; deliberately quiet, never low-contrast grey. |
| `--accent` | `#173B4D` | Primary actions, navigation state and key numeric emphasis; deep regulator-blue. |
| `--accent-hover` | `#0F2D3C` | Hover/pressed state; a denser ink rather than a bright interaction colour. |
| `--highlight` | `#876B2A` | Sparse editorial emphasis and curated tags; muted ochre reads as considered, not promotional. |
| `--highlight-tint` | `#F3EEDC` | Highlight backgrounds; warm, quiet contrast for annotation and labels. |
| `--success` | `#2E6A52` | Positive/verified status; an understated institutional green. |
| `--warning` | `#9A6816` | Caution state; dark enough for text on paper and harmonious with ochre. |
| `--danger` | `#923D3D` | Critical state; restrained claret-red, avoiding alarmist bright red. |

Never use gradients, glow colours, translucent colour washes, or coloured shadows. Standard text must meet WCAG AA contrast against its declared background.

## 2. Typography

Load `Newsreader` (`variable`) and `Inter` (`variable`) with `next/font/google`. Use `Newsreader` for display headings only; use `Inter` everywhere else. Enable tabular numerals where numbers compare or align.

```ts
// app/layout.tsx
import { Inter, Newsreader } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display" });
```

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---:|---:|---:|---:|
| Hero | Newsreader | `clamp(48px, 6vw, 80px)` | 500 | 0.98 | `-0.035em` |
| H1 | Newsreader | `clamp(40px, 4.5vw, 60px)` | 500 | 1.02 | `-0.03em` |
| H2 | Newsreader | `clamp(30px, 3vw, 42px)` | 500 | 1.08 | `-0.025em` |
| H3 | Newsreader | `26px` | 550 | 1.15 | `-0.018em` |
| Body large | Inter | `20px` | 400 | 1.55 | `-0.01em` |
| Body | Inter | `16px` | 400 | 1.6 | `-0.005em` |
| Small | Inter | `14px` | 450 | 1.5 | `0` |
| Micro-label | Inter | `11px` | 600 | 1.25 | `0.11em` |

- Hero/H1 measure: max `13ch`; essay headings may reach `18ch`. Body copy: max `68ch`.
- Eyebrows and metadata use Inter micro-label, `text-transform: uppercase`; use actual small caps (`font-variant-caps: all-small-caps`) only where the font supports it. Do not fake small caps with a heavy weight.
- Use `font-variant-numeric: tabular-nums lining-nums` for stats, option numbers, dates and time; use proportional lining figures in prose.
- Avoid all-caps headlines. Serif headings use sentence case with no trailing full stop unless grammatically necessary.

## 3. Spacing and Layout

- Content container: `max-width: 1240px; margin-inline: auto; padding-inline: 32px`; below `768px`, use `20px`; below `480px`, use `16px`.
- Reading container for Method: `max-width: 760px`; lead text may be `max-width: 690px`.
- Spacing scale: `4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 112, 144px`. Use only these values (except 1px rules).
- Page-to-hero top: `112px` desktop / `72px` mobile. Major section spacing: `112px` desktop / `72px` mobile. Within a section: `32px` or `48px`.
- Standard grid gap: `24px`; dense metadata rows: `12px`; editorial two-column layouts: `48px`.
- Demo options grid: 3 columns at `>=1100px`, 2 columns at `>=700px`, 1 column below. Do not make card columns narrower than `280px`.
- Cards: `padding: 28px` desktop / `24px` mobile. Card internal rhythm: number-to-label `16px`, label-to-title `12px`, title-to-hook `16px`, hook-to-stat/rule `24px`.

## 4. Demo-option Cards

Each of the ten cards is a calm, equal-weight editorial unit—not a product tile.

- Surface: `--card`; `border: 1px solid var(--rule)`; `border-radius: 2px`; no box shadow. Keep corners almost square.
- Number: a two-digit typographic numeral (`01`–`10`) in Inter, `12px/600`, tabular numerals, `--ink-muted`; place above the category label. Do not use a numbered circle, icon or badge.
- Category/eyebrow: micro-label, `--ink-muted`. Title: H3 serif, `--ink`. Hook: body-small, `--ink-secondary`, limited to 2–3 lines. Separate the stat/footer with a `1px` `--rule` divider.
- Stat: use a label above an unboxed value, e.g. `PUBLIC DATASET` / `8 sources`. Value uses Inter `20px/600`, tabular numerals; no giant KPI treatment inside every card.
- Hover: `border-color: var(--accent)`; translate only `-1px` on Y; apply `transition: border-color 160ms ease, transform 160ms ease`; no shadow. Keyboard focus uses a `2px` outline in `--accent` with `3px` offset.
- “Most novel” / “Most visual”: replace pill UI with a small inline editorial note above the title: a `2px` left rule in `--highlight`, `padding-left: 8px`, micro-label text in `--highlight`, e.g. `EDITOR'S NOTE — MOST NOVEL`. Never use a filled rounded tag.
- “Public data · verified”: render in the footer as plain micro-label text with a `1px` left rule in `--success`: `PUBLIC DATA · VERIFIED`. Its meaning comes from copy and a quiet rule, not a checkmark icon or badge outline.

## 5. Component Notes

### Header and navigation

- Header is `--paper-raised`, sticky only if existing behaviour requires it; `border-bottom: 1px solid var(--rule)`, no blur or glass effect.
- Wordmark is pure type: `FCA / VIBE-CODING SESSIONS` in Inter `12px/650`, uppercase, `0.12em` tracking; `/` uses `--highlight`. No logo, monogram, symbol or icon.
- Nav links: Inter `12px/600`, uppercase, `0.09em`; default `--ink-secondary`. Active state is `--ink` with a `1px` bottom border; hover changes text to `--accent`. Do not use tabs/pills.

### Footer

- Begin with a full-width `1px` strong rule. Use a restrained two-column layout: wordmark/copyright at left, operational links or session context at right.
- Keep footer text at `12px` / `--ink-muted`; it should feel like publication colophon, not a SaaS footer.

### Buttons and links

- Primary button: rectangular `2px` radius, `--accent` fill, `--paper-raised` text, `14px/600`, `padding: 12px 18px`. Hover `--accent-hover`; focus is the standard offset outline. No gradient, glow, arrow icon or oversized radius.
- Secondary button: transparent surface, `1px solid var(--rule-strong)`, `--ink` text, same size. Hover uses `--paper-raised` fill and `--accent` border/text.
- Inline text links: `--accent`, `text-decoration: underline`, underline offset `3px`, thickness `1px`; hover changes to `--accent-hover`.

### Rules and backgrounds

- Use rules as primary segmentation: `1px solid var(--rule)` between editorial regions; use `--rule-strong` only for deliberately important boundaries.
- Delete `GlowField` entirely. Default replacement is no decorative background: let paper and spacing do the work.
- If a hero needs texture after implementation review, use only a near-imperceptible `repeating-linear-gradient` rule grid: `rgba(23,36,49,0.035)` at 1px every `48px`, opacity capped at `0.45`, behind content. No radial gradients, blur, animation or pointer interaction.

## 6. What to Avoid

- Neon, gradients, bloom/glow, glassmorphism, strong shadows and luminous borders.
- Pills, oversized rounded corners, floating KPI tiles, icon-led navigation and emoji.
- Cyan/teal fintech colourways, electric hover states, rainbow status systems and decorative data visualisation.
- Dense layouts, centred long-form copy, all-caps display headlines and more than one accent colour per component.
- Generic AI imagery, stock finance photography and visual ornament that does not convey regulatory seriousness.
