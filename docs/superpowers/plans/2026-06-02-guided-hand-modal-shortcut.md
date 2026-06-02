# Guided Hand Modal Shortcut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a button to item detail modals that navigates directly to `/generate/picks` with the clicked item as the sole seed, generating Guided Hand builds instantly.

**Architecture:** A new shared helper (`src/lib/guided-hand-nav.ts`) handles the `ItemCategory` to `SeedItem` conversion and sessionStorage write. The modal gets an optional `onGuidedHand` callback prop. Both consumer pages (`build-viewer.tsx`, `generate-build.tsx`) wire the helper to the modal for non-armor items.

**Tech Stack:** React, TanStack Router, TypeScript, Tailwind CSS v4

---

### Task 1: Create the `guidedHandNav` helper

**Files:**
- Create: `src/lib/guided-hand-nav.ts`

This helper converts an `ItemCategory` + `itemName` pair into a `SeedItem`, writes the generator state to sessionStorage, and returns true on success (false if the item couldn't be found in the data arrays). The consumer pages call this, then navigate.

- [ ] **Step 1: Create `src/lib/guided-hand-nav.ts`**

```ts
import type { ItemCategory } from "../components/icons/item-icons";
import type { ItemType, SeedItem } from "../types/generator";
import {
  weapons,
  shields,
  staves,
  seals,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";

const STORAGE_KEY = "erbr-generator-state";

const CATEGORY_TO_TYPE: Partial<Record<ItemCategory, ItemType>> = {
  weapon: "weapon",
  shield: "shield",
  staff: "staff",
  seal: "seal",
  talisman: "talisman",
  ash: "ashOfWar",
  spell: "spell",
};

interface NamedItem {
  name: string;
}

const CATEGORY_DATA: Partial<Record<ItemCategory, NamedItem[]>> = {
  weapon: weapons,
  shield: shields,
  staff: staves,
  seal: seals,
  talisman: talismans,
  ash: ashesOfWar,
};

function findSpellIndex(itemName: string): number {
  const sorcIdx = sorceries.findIndex((s) => s.name === itemName);
  if (sorcIdx !== -1) return sorcIdx;
  const incIdx = incantations.findIndex((s) => s.name === itemName);
  if (incIdx !== -1) return incIdx + sorceries.length;
  return -1;
}

export function seedGuidedHand(itemName: string, category: ItemCategory): boolean {
  const itemType = CATEGORY_TO_TYPE[category];
  if (!itemType) return false;

  let index: number;
  if (category === "spell") {
    index = findSpellIndex(itemName);
  } else {
    const arr = CATEGORY_DATA[category];
    if (!arr) return false;
    index = arr.findIndex((item) => item.name === itemName);
  }

  if (index === -1) return false;

  const seedItem: SeedItem = { name: itemName, type: itemType, index };
  const state = {
    seedItems: [seedItem],
    creativity: 50,
    seed: (Math.random() * 0xffffffff) >>> 0,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return false;
  }

  return true;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/guided-hand-nav.ts
git commit -m "feat: add guidedHandNav helper for item-to-seed conversion"
```

---

### Task 2: Add `onGuidedHand` prop and button to `ItemDetailModal`

**Files:**
- Modify: `src/components/equipment/item-detail-modal.tsx`

Add an optional `onGuidedHand` callback to the modal's props. When provided, render a secondary-styled button at the bottom of the modal content area (inside the `AnimatedHeight` wrapper, after `DetailContent`).

- [ ] **Step 1: Add `onGuidedHand` to `ItemDetailModalProps`**

In `src/components/equipment/item-detail-modal.tsx`, change the interface at line 15-19 from:

```ts
interface ItemDetailModalProps {
  itemName: string;
  category: ItemCategory;
  onClose: () => void;
}
```

to:

```ts
interface ItemDetailModalProps {
  itemName: string;
  category: ItemCategory;
  onClose: () => void;
  onGuidedHand?: () => void;
}
```

- [ ] **Step 2: Destructure the new prop in `ItemDetailModal`**

At line 379, change:

```tsx
export function ItemDetailModal({ itemName, category, onClose }: ItemDetailModalProps) {
```

to:

```tsx
export function ItemDetailModal({ itemName, category, onClose, onGuidedHand }: ItemDetailModalProps) {
```

- [ ] **Step 3: Add the Guided Hand button inside `AnimatedHeight`**

Replace the `<AnimatedHeight>` block (lines 429-433):

```tsx
          <AnimatedHeight>
            <Suspense fallback={<DetailSkeleton />}>
              <DetailContent itemName={itemName} category={category} />
            </Suspense>
          </AnimatedHeight>
```

with:

```tsx
          <AnimatedHeight>
            <Suspense fallback={<DetailSkeleton />}>
              <DetailContent itemName={itemName} category={category} />
            </Suspense>
            {onGuidedHand && (
              <div className="border-t border-gold/10 px-5 py-4">
                <button
                  type="button"
                  onClick={onGuidedHand}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold-dim/40 bg-gold/5 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-wider text-gold-dim transition-colors hover:border-gold-dim hover:bg-gold/10 hover:text-gold-light"
                >
                  Guided Hand Builds
                </button>
              </div>
            )}
          </AnimatedHeight>
```

- [ ] **Step 4: Verify the file compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/equipment/item-detail-modal.tsx
git commit -m "feat: add optional Guided Hand button to item detail modal"
```

---

### Task 3: Wire up the button in `build-viewer.tsx` (Chaos Forge)

**Files:**
- Modify: `src/pages/build-viewer.tsx`

Import `seedGuidedHand`, create a handler that calls it and navigates to `/generate/picks`, and pass `onGuidedHand` to the modal for non-armor items.

- [ ] **Step 1: Add import for `seedGuidedHand`**

In `src/pages/build-viewer.tsx`, add after the existing imports (after line 28):

```ts
import { seedGuidedHand } from "../lib/guided-hand-nav";
```

- [ ] **Step 2: Add the handler function and pass the prop**

Inside `BuildViewerPage`, after the `selectItem` function (after line 82), add:

```ts
  function handleGuidedHand(name: string, category: ItemCategory) {
    if (seedGuidedHand(name, category)) {
      navigate({ to: "/generate/picks" });
    }
  }
```

Then update the `ItemDetailModal` usage at lines 289-295. Change:

```tsx
      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
        />
      )}
```

to:

```tsx
      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
          onGuidedHand={
            selectedItem.category !== "armor"
              ? () => handleGuidedHand(selectedItem.name, selectedItem.category)
              : undefined
          }
        />
      )}
```

- [ ] **Step 3: Verify the file compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/build-viewer.tsx
git commit -m "feat: wire Guided Hand shortcut into Chaos Forge item modals"
```

---

### Task 4: Wire up the button in `generate-build.tsx` (Guided Hand result)

**Files:**
- Modify: `src/pages/generate-build.tsx`

Same pattern as Task 3 but in the Guided Hand result page. The `navigate` call is inside `GenerateBuildPage`, and the modal is rendered there.

- [ ] **Step 1: Add import for `seedGuidedHand`**

In `src/pages/generate-build.tsx`, add after the existing imports (after line 24):

```ts
import { seedGuidedHand } from "../lib/guided-hand-nav";
```

- [ ] **Step 2: Add the handler and pass the prop**

Inside `GenerateBuildPage`, after the `handleSelectItem` function (after line 331), add:

```ts
  function handleGuidedHand(name: string, category: ItemCategory) {
    if (seedGuidedHand(name, category)) {
      navigate({ to: "/generate/picks" });
    }
  }
```

Then update the `ItemDetailModal` usage at lines 351-357. Change:

```tsx
      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
        />
      )}
```

to:

```tsx
      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
          onGuidedHand={
            selectedItem.category !== "armor"
              ? () => handleGuidedHand(selectedItem.name, selectedItem.category)
              : undefined
          }
        />
      )}
```

- [ ] **Step 3: Verify the file compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/generate-build.tsx
git commit -m "feat: wire Guided Hand shortcut into Guided Hand result item modals"
```

---

### Task 5: Manual verification

**Files:** (none — read-only testing)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Test on Chaos Forge (`/random`)**

1. Navigate to `/random` in the browser
2. Click a **weapon** — modal should show the "Guided Hand Builds" button at the bottom
3. Click the button — should navigate to `/generate/picks` and display generated builds with that weapon as the seed
4. Go back to `/random`, click an **armor** piece — modal should **not** show the button
5. Repeat for a talisman, an ash of war, a spell — all should show the button and work

- [ ] **Step 3: Test on Guided Hand result (`/generate/build`)**

1. Navigate to `/generate`, add a seed item, generate, pick a build
2. On the build detail page, click an item — modal should show the "Guided Hand Builds" button
3. Click it — should navigate to `/generate/picks` with the new item as the sole seed

- [ ] **Step 4: Verify type-check and lint pass**

Run: `pnpm build`
Expected: Clean build with no errors

Run: `pnpm lint`
Expected: No lint errors

- [ ] **Step 5: Final commit (if any lint/format fixes needed)**

```bash
pnpm format
git add -A
git commit -m "chore: format"
```
