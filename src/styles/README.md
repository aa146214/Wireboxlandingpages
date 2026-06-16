# Wirebox Design System

A small, layered system so styling lives in one place instead of being
hardcoded across components. Three layers, lowest → highest:

```
tokens.css   →  patterns.css  →  components (*.astro <style>, Button, Icon…)
(variables)     (utility CSS)     (compose tokens + patterns; declare only
                                   what is unique to the component)
```

Source of truth for values: the Figma "Wirebox" style guide.

## 1. Tokens — `tokens.css`

All design values are CSS custom properties on `:root`. Two tiers:

- **Primitives** — raw palette, type scale, line-heights, letter-spacing,
  radii, easing/durations. Named by what they _are_ (`--color-primary-blue`,
  `--fs-h2`).
- **Semantic roles** — primitives mapped to a _job_. Components should
  reference these so a palette change propagates everywhere:
  - Surfaces: `--surface-page`, `--surface-subtle`, `--surface-muted`,
    `--surface-card`, `--surface-brand`, `--surface-brand-deep`,
    `--surface-invert`, `--surface-input`, `--surface-glass`,
    `--surface-footer-bar`, `--surface-placeholder`, `--surface-overlay`
  - Text: `--text-heading`, `--text-body`, `--text-on-brand`, `--text-on-dark`,
    `--text-on-dark-muted`, `--text-on-dark-subtle`, `--text-on-dark-placeholder`
  - Borders: `--border-subtle`, `--border-on-dark[-strong|-faint]`,
    `--border-on-image`
  - State: `--color-primary-hover`, `--color-brand-deep-hover`, `--color-youtube`
  - Elevation: `--shadow-card`, `--shadow-soft`
  - Rhythm: `--section-py-sm | --section-py | --section-py-lg` (section padding),
    `--space-3xs … --space-2xl` (spacing scale)
  - Stacking: `--z-header`, `--z-skip-link`

**Shape language is binary**: corners are sharp (`--radius-sm/md/lg: 0`) or
fully rounded (`--radius-pill`). There are no intermediate radii.

## 2. Patterns — `patterns.css`

Global, composable classes for blocks that recur across sections. Added in
markup; the component's scoped `<style>` only sets what's unique.

- `.section-heading` — the recurring H2-scale section title. Component sets
  colour + margin.
- `.play-button` (+ `--solid` filled disc / `--ghost` outlined-over-photo) —
  circular play affordance. Component sets size + position.

## 3. Components

- `components/Button.astro` — all CTA variants (`primary`, `outline`,
  `outline-dark`, `solid`) + optional icon.
- `components/Icon.astro` — inline SVG icon set (`lib/icons.ts`).
- Section components in `storyblok/*.astro` map 1:1 to Storyblok bloks and
  consume tokens + patterns.

## Conventions

- Reach for a **semantic token** first; a primitive only when no role fits;
  a raw value never (the one exception is the `theme-color` meta tag, which
  can't take a CSS variable).
- New recurring block? Add a token/pattern here rather than duplicating it.
- Vertical section padding always uses a `--section-py*` token.
