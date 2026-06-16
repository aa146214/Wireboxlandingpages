# Wirebox Landing Page

A pixel-perfect, responsive, fully CMS-driven landing page for Wirebox, built
with [Astro](https://astro.build) and [Storyblok](https://www.storyblok.com)
(block-based — every section is an editable Storyblok blok).

- **Framework:** Astro 6 (SSR, `output: 'server'`) + `@storyblok/astro`
- **CMS:** Storyblok (Delivery API for reads, Management API for setup/seed)
- **Fonts:** self-hosted Inter (`@fontsource-variable/inter`)
- **Styling:** a small layered design system — see [`src/styles/README.md`](src/styles/README.md)
- **Deploy target:** Vercel

---

## 1. Prerequisites

- Node.js 18+ (Node 20/22 recommended)
- A Storyblok space (EU region for this project) with two tokens — see below

## 2. Install

```sh
git clone git@github.com:Dchole/wirebox.git
cd wirebox
npm install
```

## 3. Environment variables

Create a `.env` file in the project root. `.env` is git-ignored — never commit
tokens.

```sh
# Read side — used by the app at runtime (Delivery API)
STORYBLOK_DELIVERY_API_TOKEN=<your preview access token>
STORYBLOK_REGION=eu
```

| Variable | Used by | Where to find it |
| --- | --- | --- |
| `STORYBLOK_DELIVERY_API_TOKEN` | the running app | Storyblok → **Settings → Access Tokens** → *preview* token |
| `STORYBLOK_REGION` | the running app | the space's region (`eu`, `us`, `ap`, `ca`, `cn`); this project is `eu` |

The **Management token** used for seeding is **not** stored in `.env` — it's
passed inline only when you run the seed script (see [section 6](#6-seed-storyblok)).

## 4. Run the dev server

```sh
npm run dev
```

The site is served at `http://localhost:4321`. The home page
([`src/pages/index.astro`](src/pages/index.astro)) fetches the `home` story from
Storyblok; if the CMS is unreachable it falls back to the local fixture
([`src/data/home-content.ts`](src/data/home-content.ts)) so the page still
renders during development.

## 5. How the content is wired

```
Storyblok "home" story (content_type: page)
        │  Delivery API (cdn/stories/home)
        ▼
src/pages/index.astro ──► Page.astro ──► splits body[] into <header>/<main>/<footer>
                                   └────► StoryblokComponent renders each blok
                                          via the map in astro.config.mjs
```

- Every section maps 1:1 to a component in [`src/storyblok/`](src/storyblok)
  (registered in [`astro.config.mjs`](astro.config.mjs)).
- `src/pages/[...slug].astro` renders any other Storyblok story by slug.
- Editorial **images** live in the Storyblok Asset Manager; **theme assets**
  (logo, social SVGs) stay in `public/` and are referenced directly.

---

## 6. Seed Storyblok

All schema + content setup is automated by one idempotent script:
[`scripts/storyblok-setup.mjs`](scripts/storyblok-setup.mjs). Re-running it is
safe — it updates existing components in place and reuses already-uploaded
assets (matched by filename).

### What it does

1. **Components** — creates/updates all 28 block schemas (mirrors
   `src/storyblok/*.astro`: `page`, `header`, `hero`, `services` →
   `service_category` → `service_item`, `testimonials` → `testimonial`, …).
2. **Assets** — uploads the source images from `public/seed-assets/` to the
   Asset Manager, reusing any already in the space (matched by filename). The
   live site serves these from the CMS; `public/seed-assets/` is the seed
   source only and is never referenced by the site. The rest of `public/`
   holds just theme assets (logo, social icons, favicons).
3. **Story** — builds the `home` story `body[]` (same content as the local
   fixture, but with CDN asset references + proper link fields) and
   **publishes** it.

### Requirements

- A **Management API token** (a Personal Access Token with *Components* and
  *Stories* scope): Storyblok → **My account → Personal access tokens**, or
  **Settings → Access Tokens** for a space-scoped management token.
- An existing `home` story (`content_type: page`) in the space. New blueprint
  spaces already include one. The script *updates* it — it does not create it.

### Configuration

The script reads these environment variables (the space defaults are baked in
for this project; override them for a different space):

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `SB_MANAGEMENT_TOKEN` | **yes** | — | Management API token |
| `SB_SPACE_ID` | no | `293147646055661` | target space id |
| `SB_HOME_STORY_ID` | no | `186762709919814` | id of the `home` story to update |

> Find the space id under **Settings → General**, and the story id in the URL
> while editing the story (`.../stories/<id>`).

### Run it

Pass the token inline so it never lands in the repo.

**bash / zsh:**

```sh
# Everything (components → assets → story):
SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/storyblok-setup.mjs

# Or one phase at a time:
SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/storyblok-setup.mjs components
SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/storyblok-setup.mjs assets
SB_MANAGEMENT_TOKEN=sb_pat_xxx node scripts/storyblok-setup.mjs story
```

**PowerShell (Windows):**

```powershell
$env:SB_MANAGEMENT_TOKEN = "sb_pat_xxx"; node scripts/storyblok-setup.mjs
```

On success you'll see each component created/updated, each asset uploaded (or
`reused`), and `published "home" with 14 sections`. Reload the dev server and
the page now renders entirely from Storyblok.

---

## 7. Connect the Visual Editor (optional)

1. Storyblok → **Settings → Visual Editor** → set the preview URL to your dev
   or deployed URL.
2. Open the **Home** story → **Config** → set **Real path** to `/`.

> The Visual Editor expects HTTPS for local preview. This project runs dev over
> plain HTTP; use the deployed URL for the Visual Editor, or enable HTTPS
> locally per the [Astro guide](https://www.storyblok.com/docs/guides/astro/visual-preview).

## 8. Build & deploy

```sh
npm run build      # production build
npm run preview    # preview the build locally
```

Deploys to Vercel (`@astrojs/vercel` adapter). Set `STORYBLOK_DELIVERY_API_TOKEN`
and `STORYBLOK_REGION` as environment variables in the Vercel project.

## Project structure

```
public/                     theme assets (logo, social SVGs, favicon)
scripts/storyblok-setup.mjs Storyblok schema + asset + content seeder
src/
  components/               Button, Icon, PlayButton-style primitives
  data/home-content.ts      local content fixture (dev fallback)
  layouts/Layout.astro      <head>, fonts, global styles, SEO meta
  pages/
    index.astro             home (fetches the "home" story)
    [...slug].astro         any other Storyblok story by slug
  storyblok/                one component per blok (Hero, Services, …)
  styles/                   design system — tokens.css, patterns.css, README.md
```

## Resources

- [Storyblok + Astro guide](https://www.storyblok.com/docs/guides/astro/)
- [`@storyblok/astro` reference](https://storyblok.com/docs/packages/storyblok-astro)
- [Storyblok Management API](https://www.storyblok.com/docs/api/management)
- [Astro docs](https://docs.astro.build)
