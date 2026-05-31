# App Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a React + Vite + TypeScript app with Tailwind CSS v4, oxlint, oxfmt, pnpm, and auto-deploy to GitHub Pages via GitHub Actions.

**Architecture:** Static single-page app built by Vite, deployed as plain HTML/JS/CSS to GitHub Pages. Existing `data/` and `scripts/` directories remain untouched. Source code lives in `src/`.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, oxlint, oxfmt, pnpm, GitHub Actions

---

### Task 1: Initialize pnpm and install dependencies

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Install pnpm globally**

```bash
npm install -g pnpm
```

Expected: pnpm is available on PATH.

- [ ] **Step 2: Initialize package.json**

```bash
pnpm init
```

- [ ] **Step 3: Edit package.json with project metadata**

Set `"name"` to `"elden-ring-build-randomizer"`, `"private": true`, and remove the `"main"` field. Update to:

```json
{
  "name": "elden-ring-build-randomizer",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "oxlint ./src",
    "format": "oxfmt ./src",
    "format:check": "oxfmt --check ./src"
  }
}
```

- [ ] **Step 4: Install runtime dependencies**

```bash
pnpm add react react-dom
```

- [ ] **Step 5: Install dev dependencies**

```bash
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite oxlint oxfmt
```

- [ ] **Step 6: Verify install succeeded**

```bash
pnpm ls
```

Expected: All packages listed without errors.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml .tool-versions
git commit -m "feat: initialize pnpm with React, Vite, Tailwind, oxlint, oxfmt"
```

---

### Task 2: Configure TypeScript

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: Create tsconfig.json (project references root)**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 2: Create tsconfig.app.json (app source config)**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create tsconfig.node.json (Vite config file)**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json tsconfig.app.json tsconfig.node.json
git commit -m "feat: add TypeScript configuration"
```

---

### Task 3: Configure Vite with Tailwind

**Files:**
- Create: `vite.config.ts`
- Create: `src/index.css`

- [ ] **Step 1: Create vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/EldenRingBuildRandomizer/",
});
```

- [ ] **Step 2: Create src/index.css with Tailwind import**

```css
@import "tailwindcss";
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts src/index.css
git commit -m "feat: configure Vite with React and Tailwind CSS v4"
```

---

### Task 4: Create entry point and placeholder UI

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create index.html (Vite entry)**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elden Ring Build Randomizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 3: Create src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Create src/App.tsx**

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-amber-500">
        Elden Ring Build Randomizer
      </h1>
    </div>
  );
}

export default App;
```

- [ ] **Step 5: Run the dev server to verify everything works**

```bash
pnpm dev
```

Expected: Vite dev server starts, browser shows dark page with amber "Elden Ring Build Randomizer" heading. Tailwind classes are applied correctly.

- [ ] **Step 6: Run type check and build**

```bash
pnpm build
```

Expected: No TypeScript errors. `dist/` folder is created with built assets.

- [ ] **Step 7: Commit**

```bash
git add index.html src/main.tsx src/App.tsx src/vite-env.d.ts
git commit -m "feat: add entry point and placeholder UI"
```

---

### Task 5: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules
dist
*.local
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

### Task 6: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "lts/*"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ github.event.deployment.payload.web_url || '' }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for Pages deployment"
```

---

### Task 7: Verify lint and format scripts work

**Files:** (no new files)

- [ ] **Step 1: Run oxlint**

```bash
pnpm lint
```

Expected: Runs without errors on `src/` files. May show zero warnings or minor suggestions.

- [ ] **Step 2: Run oxfmt**

```bash
pnpm format
```

Expected: Formats files in `src/`. If files were already formatted correctly, no changes.

- [ ] **Step 3: Run format check**

```bash
pnpm format:check
```

Expected: Exits 0 (all files formatted).

- [ ] **Step 4: If oxfmt reformatted any files, commit**

```bash
git add -A src/
git commit -m "style: apply oxfmt formatting"
```

---

### Task 8: Final verification

**Files:** (no new files)

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf dist node_modules
pnpm install
pnpm build
```

Expected: Installs cleanly, builds without errors.

- [ ] **Step 2: Preview production build**

```bash
pnpm preview
```

Expected: Opens at `http://localhost:4173/EldenRingBuildRandomizer/` and shows the placeholder page correctly.

- [ ] **Step 3: Verify dev server still works**

```bash
pnpm dev
```

Expected: HMR works — editing `App.tsx` text reflects immediately in browser.

---

## Post-Implementation Note

After pushing to `main`, enable GitHub Pages in repo settings:
1. Go to repo → Settings → Pages
2. Under "Build and deployment", set Source to **GitHub Actions**
3. The next push to `main` will trigger the workflow and deploy

The site will be available at: `https://<username>.github.io/EldenRingBuildRandomizer/`
