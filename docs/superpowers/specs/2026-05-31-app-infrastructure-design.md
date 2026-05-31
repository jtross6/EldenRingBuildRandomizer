# App Infrastructure Design

## Goal

Set up the foundational infrastructure for the Elden Ring Build Randomizer as a client-side React app that runs locally with Vite (HMR, fast rebuilds) and deploys automatically to GitHub Pages via GitHub Actions.

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | React + TypeScript | Component model, type safety with rich item data |
| Bundler/Dev Server | Vite | Fast HMR, native JSON imports, static build output |
| Styling | Tailwind CSS v4 | Utility-first, no config file needed (Vite plugin) |
| Linting | oxlint | Fast Rust-based linter from Oxc project |
| Formatting | oxc-format | Fast Rust-based formatter from Oxc project |
| Package Manager | pnpm | Fast, disk-efficient |
| Deployment | GitHub Actions → GitHub Pages | Auto-deploy on push to main |

## Project Structure

```
EldenRingBuildRandomizer/
├── data/                          # (existing) JSON item data
├── scripts/                       # (existing) data pipeline scripts
├── docs/                          # (existing) specs and plans
├── src/
│   ├── App.tsx                    # Root component (placeholder)
│   ├── main.tsx                   # Entry point (renders App into DOM)
│   └── index.css                  # Tailwind CSS import
├── index.html                     # Vite entry HTML
├── package.json                   # Dependencies + scripts
├── pnpm-lock.yaml                 # Lock file
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite config (base path for GH Pages)
├── .github/
│   └── workflows/
│       └── deploy.yml             # Build + deploy workflow
└── .gitignore                     # node_modules, dist, etc.
```

## Vite Configuration

- `base`: `/EldenRingBuildRandomizer/` (GitHub Pages serves at this subpath)
- `plugins`: `@vitejs/plugin-react`, `@tailwindcss/vite`
- JSON data from `data/` imported directly — Vite handles JSON imports natively

## Tailwind CSS v4 Setup

Tailwind v4 uses a CSS-first configuration approach. No `tailwind.config.js` needed.

`src/index.css`:
```css
@import "tailwindcss";
```

Integrated via the `@tailwindcss/vite` plugin in `vite.config.ts`.

## Package Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Local dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check then build for production |
| `preview` | `vite preview` | Serve production build locally |
| `lint` | `oxlint ./src` | Run oxlint on source files |
| `format` | `oxc-format ./src` | Format source files |

## GitHub Actions Workflow

**Trigger:** Push to `main` branch

**Steps:**
1. Checkout code
2. Set up Node.js (LTS)
3. Set up pnpm
4. Install dependencies (`pnpm install`)
5. Build (`pnpm build`)
6. Upload `dist/` as Pages artifact
7. Deploy to GitHub Pages

**Uses:**
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `pnpm/action-setup@v4`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`

**Required manual step:** In the GitHub repo settings, set Pages source to "GitHub Actions" (one-time configuration).

## Minimal UI

The initial `App.tsx` renders a single page with:
- A heading: "Elden Ring Build Randomizer"
- A brief subtitle or placeholder text

This is intentionally minimal — just enough to confirm the pipeline works end-to-end (local dev → build → deploy → accessible at GitHub Pages URL).

## What's Deliberately Excluded

- **Router** — single page for now, add when multiple views are needed
- **Testing framework** — add when there's logic to test
- **Component library** — just Tailwind utilities on plain elements
- **Prettier** — using oxc-format instead
- **ESLint** — using oxlint instead
