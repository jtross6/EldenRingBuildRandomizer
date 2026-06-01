# Item Detail Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated item detail modal that opens when clicking any item on the build viewer or generate-build page, showing full stats and lore via React's `<ViewTransition>` shared element transitions.

**Architecture:** Expand the data pipeline to generate detail JSON files (keyed by item name) alongside existing slim data. These are code-split by Vite and prefetched on page mount via dynamic `import()`. A `<ViewTransition>` component on each ItemSlot image and the modal header image creates a shared element morph on open/close. The modal uses `<dialog>` for accessibility.

**Tech Stack:** React 19.3.0-canary (ViewTransition), Vite (code splitting), Tailwind CSS v4, `<dialog>` element

---

### Task 1: Switch to React Canary

**Files:**
- Modify: `package.json`
- Create: `src/types/react-view-transition.d.ts`

- [ ] **Step 1: Install React canary and update types**

```bash
pnpm add react@19.3.0-canary-fef12a01-20260413 react-dom@19.3.0-canary-fef12a01-20260413
```

> If this exact version is unavailable, run `npm view react versions --json | grep canary` and pick the latest.

- [ ] **Step 2: Add ViewTransition type declarations**

The `@types/react` stable package doesn't include `ViewTransition` types yet. Create a declaration file.

Create `src/types/react-view-transition.d.ts`:

```ts
import type { ReactNode, ReactElement } from "react";

declare module "react" {
  interface ViewTransitionProps {
    name?: string;
    children: ReactNode;
    enter?: string;
    exit?: string;
    update?: string;
    share?: string;
    default?: string;
  }

  function ViewTransition(props: ViewTransitionProps): ReactElement;
}
```

- [ ] **Step 3: Verify build still works**

```bash
pnpm build
```

Expected: Clean build with no type errors. If `@base-ui/react` or `@tanstack/react-router` have peer dependency warnings, they can be ignored — canary is forward-compatible.

- [ ] **Step 4: Verify dev server starts**

```bash
pnpm dev
```

Navigate to the app in a browser. Verify everything renders correctly — no regressions from the version change.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/types/react-view-transition.d.ts
git commit -m "chore: switch to React canary for ViewTransition support"
```

---

### Task 2: Create TypeScript Interfaces for Detail Data

**Files:**
- Create: `src/types/item-details.ts`

- [ ] **Step 1: Create the detail type definitions**

Create `src/types/item-details.ts`:

```ts
export interface ArmamentDetail {
  description: string[];
  rarity?: string;
  attackAttributes?: string[];
  damage?: Record<string, number>;
  scaling?: Record<string, number>;
  guard?: Record<string, number>;
  statusEffects?: Record<string, number>;
  requirements?: Record<string, number>;
  weight: number;
  upgradeMaterial?: string;
  isBuffable?: boolean;
  defaultSkillId?: number;
}

export interface ArmorDetail {
  description: string[];
  rarity?: string;
  absorptions?: Record<string, number>;
  resistances?: Record<string, number>;
  weight: number;
}

export interface TalismanDetail {
  description: string[];
  summary?: string;
  rarity?: string;
  effects?: { attribute: string; value: number; model: string; type: string }[];
  conflicts?: string[];
  weight: number;
}

export interface SpellDetail {
  description: string[];
  summary?: string;
  fpCost: number;
  spCost?: number;
  slotsUsed: number;
  isHorsebackCastable?: boolean;
  isWeaponBuff?: boolean;
  requirements?: Record<string, number>;
}

export interface AshDetail {
  description?: string[];
  armamentCategories?: string[];
  defaultAffinity?: string;
  possibleAffinities?: string[];
}

export type ItemDetails =
  | ArmamentDetail
  | ArmorDetail
  | TalismanDetail
  | SpellDetail
  | AshDetail;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/item-details.ts
git commit -m "feat: add TypeScript interfaces for item detail data"
```

---

### Task 3: Expand Data Pipeline

**Files:**
- Modify: `scripts/generate-slim-data.ts`

This task adds detail file generation to the existing script. All new code goes **after** the existing slim data generation (after the `console.log("\nDone!")` line), reusing the already-loaded source data variables (`baseArmaments`, `dlcWeapons`, `baseArmor`, `dlcArmor`, `baseTalismans`, `dlcTalismans`, `baseSpells`, `dlcSpells`, `baseAshes`, `dlcAshes`).

- [ ] **Step 1: Add helper functions and armament detail generation**

Add the following after the existing `console.log("\nDone!")` line (replace that line):

```ts
// ============================================================
// Detail data generation (for item detail modal)
// ============================================================

function writeDetailOut(filename: string, data: Record<string, unknown>) {
  const count = Object.keys(data).length;
  writeFileSync(join(OUT, filename), JSON.stringify(data, null, 2) + "\n");
  console.log(`  ${filename}: ${count} items`);
}

function normalizeDescription(desc: unknown): string[] {
  if (Array.isArray(desc)) return desc as string[];
  if (typeof desc === "string") return [desc];
  return [];
}

function nonEmpty<T>(obj: T | undefined | null): T | undefined {
  if (obj == null) return undefined;
  if (typeof obj === "object" && Object.keys(obj as object).length === 0) return undefined;
  return obj;
}

console.log("\nGenerating detail data...");

// --- Armament details (weapons, shields, catalysts) ---
console.log("Processing armament details...");

interface ArmamentDetailEntry {
  description: string[];
  rarity?: string;
  attackAttributes?: string[];
  damage?: Record<string, number>;
  scaling?: Record<string, number>;
  guard?: Record<string, number>;
  statusEffects?: Record<string, number>;
  requirements?: Record<string, number>;
  weight: number;
  upgradeMaterial?: string;
  isBuffable?: boolean;
  defaultSkillId?: number;
}

const weaponDetails: Record<string, ArmamentDetailEntry> = {};
const shieldDetails: Record<string, ArmamentDetailEntry> = {};
const catalystDetails: Record<string, ArmamentDetailEntry> = {};

for (const item of Object.values(baseArmaments)) {
  const cat = item.category as string;
  const affinity = (item.affinity as Record<string, Record<string, unknown>>)?.Standard;

  const damageObj = affinity?.damage as Record<string, number> | undefined;
  const damage = damageObj
    ? Object.fromEntries(Object.entries(damageObj).filter(([k, v]) => v > 0 && k !== "stamina"))
    : undefined;

  const guardObj = affinity?.guard as Record<string, number> | undefined;
  const statusObj = affinity?.status_effects as Record<string, number> | undefined;
  const statusEffects = statusObj
    ? Object.fromEntries(Object.entries(statusObj).filter(([, v]) => v > 0))
    : undefined;

  const entry: ArmamentDetailEntry = {
    description: normalizeDescription(item.description),
    rarity: (item.rarity as string) || undefined,
    attackAttributes: (item.attack_attributes as string[])?.length
      ? (item.attack_attributes as string[])
      : undefined,
    damage: nonEmpty(damage),
    scaling: nonEmpty(affinity?.scaling as Record<string, number>),
    guard: nonEmpty(guardObj),
    statusEffects: nonEmpty(statusEffects),
    requirements: nonEmpty(item.requirements as Record<string, number>),
    weight: item.weight as number,
    upgradeMaterial: (item.upgrade_material as string) || undefined,
    isBuffable: (item.is_buffable as boolean) || undefined,
    defaultSkillId: (item.default_skill_id as number) || undefined,
  };

  const name = item.name as string;
  if (SHIELD_CATEGORIES.has(cat)) shieldDetails[name] = entry;
  else if (CATALYST_CATEGORIES.has(cat)) catalystDetails[name] = entry;
  else weaponDetails[name] = entry;
}

const DLC_DAMAGE_VAL_MAP: Record<string, string> = {
  Phy: "physical",
  Mag: "magic",
  Fire: "fire",
  Ligt: "lightning",
  Holy: "holy",
};

for (const item of Object.values(dlcWeapons)) {
  const rawCat = item.category as string;
  const cat = normalizeCategory(rawCat);

  const rawAttack = item.attack as Record<string, number | null> | undefined;
  const damage = rawAttack
    ? Object.fromEntries(
        Object.entries(rawAttack)
          .map(([k, v]) => [DLC_DAMAGE_VAL_MAP[k], v])
          .filter(([k, v]) => k && v && (v as number) > 0),
      )
    : undefined;

  const entry: ArmamentDetailEntry = {
    description: normalizeDescription(item.description),
    damage: nonEmpty(damage) as Record<string, number> | undefined,
    scaling: normalizeDlcScaling(item.scaling as Record<string, string | null> | undefined),
    requirements: normalizeDlcRequirements(
      item.requirements as Record<string, number | null> | undefined,
    ),
    weight: (item.weight as number) ?? 0,
  };

  const name = item.name as string;
  if (SHIELD_CATEGORIES.has(cat)) shieldDetails[name] = entry;
  else if (CATALYST_CATEGORIES.has(cat)) catalystDetails[name] = entry;
  else weaponDetails[name] = entry;
}

writeDetailOut("weapon-details.json", weaponDetails);
writeDetailOut("shield-details.json", shieldDetails);
writeDetailOut("catalyst-details.json", catalystDetails);
```

- [ ] **Step 2: Add armor detail generation**

Append after the armament detail block:

```ts
// --- Armor details ---
console.log("Processing armor details...");

interface ArmorDetailEntry {
  description: string[];
  rarity?: string;
  absorptions?: Record<string, number>;
  resistances?: Record<string, number>;
  weight: number;
}

const armorDetails: Record<string, ArmorDetailEntry> = {};

for (const item of Object.values(baseArmor)) {
  armorDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    rarity: (item.rarity as string) || undefined,
    absorptions: nonEmpty(item.absorptions as Record<string, number>),
    resistances: nonEmpty(item.resistances as Record<string, number>),
    weight: item.weight as number,
  };
}

for (const item of Object.values(dlcArmor)) {
  armorDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    absorptions: nonEmpty(item.absorptions as Record<string, number>),
    resistances: nonEmpty(item.resistances as Record<string, number>),
    weight: (item.weight as number) ?? 0,
  };
}

writeDetailOut("armor-details.json", armorDetails);
```

- [ ] **Step 3: Add talisman detail generation**

```ts
// --- Talisman details ---
console.log("Processing talisman details...");

interface TalismanDetailEntry {
  description: string[];
  summary?: string;
  rarity?: string;
  effects?: { attribute: string; value: number; model: string; type: string }[];
  conflicts?: string[];
  weight: number;
}

const talismanDetails: Record<string, TalismanDetailEntry> = {};

for (const item of Object.values(baseTalismans)) {
  const rawEffects = item.effects as
    | { attribute: string; value: number; model: string; type: string }[]
    | undefined;

  talismanDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    summary: (item.summary as string) || undefined,
    rarity: (item.rarity as string) || undefined,
    effects: rawEffects && rawEffects.length > 0 ? rawEffects : undefined,
    conflicts: (item.conflicts as string[])?.length
      ? (item.conflicts as string[])
      : undefined,
    weight: item.weight as number,
  };
}

for (const item of Object.values(dlcTalismans)) {
  talismanDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    summary: (item.effects as string) || undefined,
    weight: (item.weight as number) ?? 0,
  };
}

writeDetailOut("talisman-details.json", talismanDetails);
```

- [ ] **Step 4: Add spell detail generation**

```ts
// --- Spell details ---
console.log("Processing spell details...");

interface SpellDetailEntry {
  description: string[];
  summary?: string;
  fpCost: number;
  spCost?: number;
  slotsUsed: number;
  isHorsebackCastable?: boolean;
  isWeaponBuff?: boolean;
  requirements?: Record<string, number>;
}

const spellDetails: Record<string, SpellDetailEntry> = {};

for (const item of Object.values(baseSpells)) {
  const rawReqs = item.requirements as Record<string, number> | undefined;
  const requirements = rawReqs
    ? Object.fromEntries(Object.entries(rawReqs).filter(([, v]) => v > 0))
    : undefined;

  spellDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    summary: (item.summary as string) || undefined,
    fpCost: (item.fp_cost as number) ?? 0,
    spCost: (item.sp_cost as number) || undefined,
    slotsUsed: (item.slots_used as number) ?? 1,
    isHorsebackCastable: (item.is_horseback_castable as boolean) || undefined,
    isWeaponBuff: (item.is_weapon_buff as boolean) || undefined,
    requirements: nonEmpty(requirements),
  };
}

for (const item of Object.values(dlcSpells)) {
  const rawReqs = item.requirements as Record<string, number | null> | undefined;
  const requirements = rawReqs
    ? Object.fromEntries(
        Object.entries(rawReqs)
          .map(([k, v]) => [DLC_STAT_KEY_MAP[k] ?? k.toLowerCase(), v])
          .filter(([, v]) => v != null && (v as number) > 0),
      )
    : undefined;

  spellDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    fpCost: (item.fp_cost as number) ?? 0,
    slotsUsed: (item.slots as number) ?? 1,
    requirements: nonEmpty(requirements) as Record<string, number> | undefined,
  };
}

writeDetailOut("spell-details.json", spellDetails);
```

- [ ] **Step 5: Add ash of war detail generation**

```ts
// --- Ash of War details ---
console.log("Processing ash of war details...");

interface AshDetailEntry {
  description?: string[];
  armamentCategories?: string[];
  defaultAffinity?: string;
  possibleAffinities?: string[];
}

const ashDetails: Record<string, AshDetailEntry> = {};

for (const item of Object.values(baseAshes)) {
  const cats = item.armament_categories as string[] | undefined;
  ashDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    armamentCategories: cats && cats.length > 0 ? cats : undefined,
    defaultAffinity: (item.default_affinity as string) || undefined,
    possibleAffinities:
      (item.possible_affinities as string[])?.length > 0
        ? (item.possible_affinities as string[])
        : undefined,
  };
}

for (const item of Object.values(dlcAshes)) {
  ashDetails[item.name as string] = {
    description: normalizeDescription(item.description),
    defaultAffinity: (item.affinity as string) || undefined,
  };
}

writeDetailOut("ash-details.json", ashDetails);

console.log("\nDone!");
```

- [ ] **Step 6: Run the generate script and verify output**

```bash
pnpm generate-data
```

Expected output includes lines like:
```
Generating detail data...
Processing armament details...
  weapon-details.json: ~280 items
  shield-details.json: ~70 items
  catalyst-details.json: ~30 items
Processing armor details...
  armor-details.json: ~700 items
...
```

Verify a few entries:
```bash
node -e "const d=require('./src/data/weapon-details.json'); console.log(JSON.stringify(d['Black Knife'], null, 2))"
```

Expected: description array, rarity "Legendary", damage with physical and holy, scaling with strength/dexterity/faith, requirements, weight 2.0.

- [ ] **Step 7: Commit**

```bash
git add scripts/generate-slim-data.ts src/data/weapon-details.json src/data/shield-details.json src/data/catalyst-details.json src/data/armor-details.json src/data/talisman-details.json src/data/spell-details.json src/data/ash-details.json
git commit -m "feat: generate detail JSON files for item modal"
```

---

### Task 4: Add View Transition CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add view transition and shimmer animations**

Add the following at the end of `src/index.css`, after the existing animation classes:

```css
/* View transition animations for item detail modal */
::view-transition-old(.modal-fade-in) {
  animation: none;
}

::view-transition-new(.modal-fade-in) {
  animation: fade-in 0.25s ease;
}

::view-transition-old(.modal-fade-out) {
  animation: fade-in 0.2s ease reverse;
}

::view-transition-new(.modal-fade-out) {
  animation: none;
}

::view-transition-old(.modal-content-in) {
  animation: none;
}

::view-transition-new(.modal-content-in) {
  animation: fade-in 0.3s ease 0.1s backwards;
}

::view-transition-old(.modal-content-out) {
  animation: fade-in 0.15s ease reverse;
}

::view-transition-new(.modal-content-out) {
  animation: none;
}

@media (prefers-reduced-motion) {
  ::view-transition-old(.modal-fade-in),
  ::view-transition-new(.modal-fade-in),
  ::view-transition-old(.modal-fade-out),
  ::view-transition-new(.modal-fade-out),
  ::view-transition-old(.modal-content-in),
  ::view-transition-new(.modal-content-in),
  ::view-transition-old(.modal-content-out),
  ::view-transition-new(.modal-content-out) {
    animation: none;
  }
}

/* Shimmer skeleton for loading state */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-card) 25%,
    var(--color-bg-card-hover) 50%,
    var(--color-bg-card) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add view transition and shimmer CSS for item modal"
```

---

### Task 5: Create useItemDetails Hook

**Files:**
- Create: `src/hooks/use-item-details.ts`

- [ ] **Step 1: Create the hook**

This hook follows the same pattern as the existing `useImageMap` hook (`src/hooks/use-image-map.ts`): a module-level promise with `use()` for Suspense integration.

Create `src/hooks/use-item-details.ts`:

```ts
import { use } from "react";
import type { ItemCategory } from "../components/icons/item-icons";
import type {
  ArmamentDetail,
  ArmorDetail,
  TalismanDetail,
  SpellDetail,
  AshDetail,
  ItemDetails,
} from "../types/item-details";

type DetailMap = Record<string, ItemDetails>;

const cache: Partial<Record<string, Promise<DetailMap>>> = {};

function getDetailPromise(category: ItemCategory): Promise<DetailMap> {
  const key = category;
  if (!cache[key]) {
    switch (category) {
      case "weapon":
        cache[key] = import("../data/weapon-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "shield":
        cache[key] = import("../data/shield-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "seal":
        cache[key] = import("../data/catalyst-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "armor":
        cache[key] = import("../data/armor-details.json").then(
          (m) => m.default as unknown as Record<string, ArmorDetail>,
        );
        break;
      case "talisman":
        cache[key] = import("../data/talisman-details.json").then(
          (m) => m.default as unknown as Record<string, TalismanDetail>,
        );
        break;
      case "spell":
        cache[key] = import("../data/spell-details.json").then(
          (m) => m.default as unknown as Record<string, SpellDetail>,
        );
        break;
      case "ash":
        cache[key] = import("../data/ash-details.json").then(
          (m) => m.default as unknown as Record<string, AshDetail>,
        );
        break;
    }
  }
  return cache[key]!;
}

export function prefetchItemDetails(): void {
  getDetailPromise("weapon");
  getDetailPromise("shield");
  getDetailPromise("seal");
  getDetailPromise("armor");
  getDetailPromise("talisman");
  getDetailPromise("spell");
  getDetailPromise("ash");
}

export function useItemDetails(
  itemName: string,
  category: ItemCategory,
): ItemDetails | undefined {
  const map = use(getDetailPromise(category));
  return map[itemName];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-item-details.ts
git commit -m "feat: add useItemDetails hook with prefetch support"
```

---

### Task 6: Update ItemSlot Component

**Files:**
- Modify: `src/components/equipment/item-slot.tsx`

- [ ] **Step 1: Add new props and ViewTransition wrapper**

Replace the entire contents of `src/components/equipment/item-slot.tsx` with:

```tsx
import { useState, Suspense, ViewTransition } from "react";
import { CategoryIcon, getCategoryClass, type ItemCategory } from "../icons/item-icons";
import { useImageMap } from "../../hooks/use-image-map";

interface ItemSlotProps {
  itemName: string;
  slotLabel?: string;
  slotId: string;
  category: ItemCategory;
  variant: "standard" | "compact" | "talisman";
  onClick?: () => void;
  isActive?: boolean;
}

function ItemImage({
  itemName,
  category,
  size,
}: {
  itemName: string;
  category: ItemCategory;
  size: number;
}) {
  const imageMap = useImageMap();
  const entry = imageMap[itemName];
  const [failed, setFailed] = useState(false);

  if (!entry || failed) {
    return (
      <div
        className={`${getCategoryClass(category)} flex shrink-0 items-center justify-center rounded-sm`}
        style={{ width: size, height: size }}
      >
        <CategoryIcon category={category} className="size-3/5 opacity-50" />
      </div>
    );
  }

  return (
    <div
      className={`${getCategoryClass(category)} relative shrink-0 overflow-hidden rounded-sm`}
      style={{ width: size, height: size }}
    >
      <img
        src={entry.image_url}
        alt={itemName}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </div>
  );
}

function FallbackIcon({ category, size }: { category: ItemCategory; size: number }) {
  return (
    <div
      className={`${getCategoryClass(category)} flex shrink-0 items-center justify-center rounded-sm`}
      style={{ width: size, height: size }}
    >
      <CategoryIcon category={category} className="size-3/5 opacity-50" />
    </div>
  );
}

function SlotImage({
  itemName,
  category,
  size,
  slotId,
  isActive,
}: {
  itemName: string;
  category: ItemCategory;
  size: number;
  slotId: string;
  isActive: boolean;
}) {
  const image = (
    <Suspense fallback={<FallbackIcon category={category} size={size} />}>
      <ItemImage itemName={itemName} category={category} size={size} />
    </Suspense>
  );

  if (isActive) return image;

  return <ViewTransition name={`item-${slotId}`}>{image}</ViewTransition>;
}

export function ItemSlot({
  itemName,
  slotLabel,
  slotId,
  category,
  variant,
  onClick,
  isActive,
}: ItemSlotProps) {
  const interactive = !!onClick;
  const interactiveClasses = interactive ? "cursor-pointer active:scale-[0.98]" : "";

  function handleKeyDown(e: React.KeyboardEvent) {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  }

  const a11yProps = interactive
    ? ({
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
      } as const)
    : {};

  if (variant === "talisman") {
    return (
      <div
        className={`flex flex-col items-center gap-1.5 rounded-lg border border-border-dark bg-bg-card p-3 pb-2.5 text-center transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses}`}
        style={{ visibility: isActive ? "hidden" : undefined }}
        {...a11yProps}
      >
        <SlotImage
          itemName={itemName}
          category={category}
          size={40}
          slotId={slotId}
          isActive={!!isActive}
        />
        <span className="break-words font-display text-[10px] font-semibold leading-tight text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-border-dark bg-bg-card px-2.5 py-2 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses}`}
        style={{ visibility: isActive ? "hidden" : undefined }}
        {...a11yProps}
      >
        <SlotImage
          itemName={itemName}
          category={category}
          size={32}
          slotId={slotId}
          isActive={!!isActive}
        />
        <span className="min-w-0 flex-1 truncate font-display text-[11px] font-semibold text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-3 overflow-hidden rounded-lg border border-border-dark bg-bg-card px-3 py-2.5 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses}`}
      style={{ visibility: isActive ? "hidden" : undefined }}
      {...a11yProps}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-gold-dim opacity-0 transition-opacity group-hover:opacity-100" />
      <SlotImage
        itemName={itemName}
        category={category}
        size={44}
        slotId={slotId}
        isActive={!!isActive}
      />
      <div className="min-w-0 flex-1">
        {slotLabel && (
          <div className="text-[10px] uppercase tracking-wider text-text-dim">{slotLabel}</div>
        )}
        <div className="truncate font-display text-[13px] font-semibold text-text-primary">
          {itemName}
        </div>
      </div>
    </div>
  );
}
```

Key changes from the original:
- New props: `slotId` (required), `onClick` (optional), `isActive` (optional)
- `SlotImage` wrapper: renders `<ViewTransition name={...}>` around the image when NOT active. When active (modal is open for this slot), renders the image without ViewTransition to avoid name collision.
- `visibility: hidden` when active — keeps layout space but hides visually while modal is open.
- Interactive a11y: `role="button"`, `tabIndex={0}`, keyboard handler for Enter/Space.
- `cursor-pointer` and `active:scale-[0.98]` when `onClick` is provided.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: Type errors on `build-viewer.tsx` and `generate-build.tsx` because `slotId` is now required. This is expected — those files are updated in Tasks 8 and 9.

- [ ] **Step 3: Commit**

```bash
git add src/components/equipment/item-slot.tsx
git commit -m "feat: add ViewTransition, click handling, and a11y to ItemSlot"
```

---

### Task 7: Create ItemDetailModal Component

**Files:**
- Create: `src/components/equipment/item-detail-modal.tsx`

- [ ] **Step 1: Create the modal component**

Create `src/components/equipment/item-detail-modal.tsx`:

```tsx
import { useEffect, useRef, Suspense, ViewTransition } from "react";
import { createPortal } from "react-dom";
import type { ItemCategory } from "../icons/item-icons";
import { getCategoryClass, CategoryIcon } from "../icons/item-icons";
import { useImageMap } from "../../hooks/use-image-map";
import { useItemDetails } from "../../hooks/use-item-details";
import type {
  ArmamentDetail,
  ArmorDetail,
  TalismanDetail,
  SpellDetail,
  AshDetail,
} from "../../types/item-details";

interface ItemDetailModalProps {
  itemName: string;
  category: ItemCategory;
  slotId: string;
  onClose: () => void;
}

function scalingGrade(value: number): string {
  if (value >= 1.5) return "S";
  if (value >= 1.0) return "A";
  if (value >= 0.75) return "B";
  if (value >= 0.5) return "C";
  if (value >= 0.25) return "D";
  return "E";
}

const STAT_ABBR: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  intelligence: "INT",
  faith: "FTH",
  arcane: "ARC",
};

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-gold/5 py-1 text-[12px]">
      <span className="text-text-secondary">{label}</span>
      <span className="tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

function StatsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <div className="mb-2 text-[10px] uppercase tracking-[2px] text-text-dim">{label}</div>
      {children}
    </div>
  );
}

function ArmamentStats({ detail }: { detail: ArmamentDetail }) {
  return (
    <>
      {detail.damage && Object.keys(detail.damage).length > 0 && (
        <StatsSection label="Attack Power">
          {Object.entries(detail.damage).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.scaling && Object.keys(detail.scaling).length > 0 && (
        <StatsSection label="Scaling">
          {Object.entries(detail.scaling).map(([stat, val]) => (
            <StatRow
              key={stat}
              label={stat}
              value={`${scalingGrade(val)} (${val.toFixed(2)})`}
            />
          ))}
        </StatsSection>
      )}

      {detail.guard && Object.keys(detail.guard).length > 0 && (
        <StatsSection label="Guard">
          {Object.entries(detail.guard).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.statusEffects && Object.keys(detail.statusEffects).length > 0 && (
        <StatsSection label="Status Effects">
          {Object.entries(detail.statusEffects).map(([effect, val]) => (
            <StatRow key={effect} label={effect} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.attackAttributes && detail.attackAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {detail.attackAttributes.map((attr) => (
            <span
              key={attr}
              className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
            >
              {attr}
            </span>
          ))}
          {detail.upgradeMaterial && (
            <span className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
              {detail.upgradeMaterial}
            </span>
          )}
          {detail.isBuffable && (
            <span className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
              Buffable
            </span>
          )}
        </div>
      )}
    </>
  );
}

function ArmorStats({ detail }: { detail: ArmorDetail }) {
  return (
    <>
      {detail.absorptions && Object.keys(detail.absorptions).length > 0 && (
        <StatsSection label="Damage Negation">
          {Object.entries(detail.absorptions).map(([type, val]) => (
            <StatRow key={type} label={type} value={val.toFixed(1)} />
          ))}
        </StatsSection>
      )}

      {detail.resistances && Object.keys(detail.resistances).length > 0 && (
        <StatsSection label="Resistance">
          {Object.entries(detail.resistances).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}
    </>
  );
}

function TalismanStats({ detail }: { detail: TalismanDetail }) {
  return (
    <>
      {detail.effects && detail.effects.length > 0 && (
        <StatsSection label="Effects">
          {detail.effects.map((effect, i) => (
            <StatRow
              key={i}
              label={effect.attribute}
              value={
                effect.model === "multiplicative"
                  ? `${((effect.value - 1) * 100).toFixed(0)}%`
                  : `${effect.value > 0 ? "+" : ""}${effect.value}`
              }
            />
          ))}
        </StatsSection>
      )}

      {detail.conflicts && detail.conflicts.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Conflicts With
          </div>
          <div className="text-[11px] text-text-secondary">
            {detail.conflicts.join(", ")}
          </div>
        </div>
      )}
    </>
  );
}

function SpellStats({ detail }: { detail: SpellDetail }) {
  return (
    <StatsSection label="Spell Info">
      <StatRow label="FP Cost" value={detail.fpCost} />
      {detail.spCost != null && <StatRow label="Stamina Cost" value={detail.spCost} />}
      <StatRow label="Slots Used" value={detail.slotsUsed} />
      {detail.isHorsebackCastable && <StatRow label="Horseback" value="Yes" />}
      {detail.isWeaponBuff && <StatRow label="Weapon Buff" value="Yes" />}
    </StatsSection>
  );
}

function AshStats({ detail }: { detail: AshDetail }) {
  return (
    <>
      {detail.defaultAffinity && (
        <StatsSection label="Affinity">
          <StatRow label="Default" value={detail.defaultAffinity} />
        </StatsSection>
      )}

      {detail.possibleAffinities && detail.possibleAffinities.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Possible Affinities
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.possibleAffinities.map((aff) => (
              <span
                key={aff}
                className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
              >
                {aff}
              </span>
            ))}
          </div>
        </div>
      )}

      {detail.armamentCategories && detail.armamentCategories.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Compatible Weapons
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.armamentCategories.map((cat) => (
              <span
                key={cat}
                className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function isArmamentCategory(cat: ItemCategory): boolean {
  return cat === "weapon" || cat === "shield" || cat === "seal";
}

function DetailContent({
  itemName,
  category,
}: {
  itemName: string;
  category: ItemCategory;
}) {
  const detail = useItemDetails(itemName, category);

  if (!detail) {
    return (
      <div className="px-5 py-4 text-center text-[12px] text-text-dim">
        No detail data available
      </div>
    );
  }

  const description =
    "description" in detail && detail.description
      ? (detail.description as string[])
      : undefined;

  const requirements =
    "requirements" in detail
      ? (detail.requirements as Record<string, number> | undefined)
      : undefined;

  const weight = "weight" in detail ? (detail.weight as number) : undefined;

  const rarity = "rarity" in detail ? (detail.rarity as string | undefined) : undefined;

  const summary = "summary" in detail ? (detail.summary as string | undefined) : undefined;

  return (
    <ViewTransition enter="modal-content-in" exit="modal-content-out" default="none">
      <div>
        {rarity && (
          <div className="px-5 pt-3">
            <span className="text-[10px] uppercase tracking-[2px] text-gold-dim">{rarity}</span>
          </div>
        )}

        {summary && (
          <div className="px-5 pt-2 text-[12px] text-text-secondary">{summary}</div>
        )}

        {description && description.length > 0 && (
          <div className="border-b border-gold/10 px-5 py-4">
            <p className="text-[12px] leading-relaxed text-text-secondary italic">
              {description.filter((l) => l.length > 0).join(" ")}
            </p>
          </div>
        )}

        {isArmamentCategory(category) && (
          <ArmamentStats detail={detail as ArmamentDetail} />
        )}
        {category === "armor" && <ArmorStats detail={detail as ArmorDetail} />}
        {category === "talisman" && <TalismanStats detail={detail as TalismanDetail} />}
        {category === "spell" && <SpellStats detail={detail as SpellDetail} />}
        {category === "ash" && <AshStats detail={detail as AshDetail} />}

        {requirements && Object.keys(requirements).length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-gold/10 px-5 py-3">
            {Object.entries(requirements).map(([stat, val]) => (
              <span
                key={stat}
                className="rounded-md border border-gold/15 bg-gold/5 px-2.5 py-1 text-[11px] font-semibold text-gold-dim"
              >
                {STAT_ABBR[stat] ?? stat} {val}
              </span>
            ))}
            {weight != null && (
              <span className="rounded-md border border-gold/15 bg-gold/5 px-2.5 py-1 text-[11px] font-semibold text-gold-dim">
                Wt. {weight}
              </span>
            )}
          </div>
        )}
      </div>
    </ViewTransition>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      <div className="h-3 w-20 animate-shimmer rounded" />
      <div className="h-16 animate-shimmer rounded" />
      <div className="h-3 w-32 animate-shimmer rounded" />
      <div className="space-y-1.5">
        <div className="h-3 animate-shimmer rounded" />
        <div className="h-3 animate-shimmer rounded" />
        <div className="h-3 w-3/4 animate-shimmer rounded" />
      </div>
    </div>
  );
}

function ModalHeaderImage({
  itemName,
  category,
}: {
  itemName: string;
  category: ItemCategory;
}) {
  const imageMap = useImageMap();
  const entry = imageMap[itemName];

  if (!entry) {
    return (
      <div
        className={`${getCategoryClass(category)} flex size-[72px] shrink-0 items-center justify-center rounded-lg`}
      >
        <CategoryIcon category={category} className="size-3/5 opacity-50" />
      </div>
    );
  }

  return (
    <div
      className={`${getCategoryClass(category)} relative size-[72px] shrink-0 overflow-hidden rounded-lg`}
    >
      <img
        src={entry.image_url}
        alt={itemName}
        className="size-full object-contain"
      />
    </div>
  );
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "Weapon",
  armor: "Armor",
  shield: "Shield",
  seal: "Catalyst",
  talisman: "Talisman",
  ash: "Ash of War",
  spell: "Spell",
};

export function ItemDetailModal({
  itemName,
  category,
  slotId,
  onClose,
}: ItemDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[85vh] w-[min(420px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-gold/15 bg-bg-dark p-0 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop:bg-black/60 backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      <ViewTransition enter="modal-fade-in" exit="modal-fade-out" default="none">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-gold/15 bg-bg-card text-[14px] text-text-dim transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            &times;
          </button>

          <div className="flex items-center gap-4 border-b border-gold/10 p-5">
            <ViewTransition name={`item-${slotId}`}>
              <ModalHeaderImage itemName={itemName} category={category} />
            </ViewTransition>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16px] font-bold leading-tight text-text-primary">
                {itemName}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[2px] text-text-dim">
                {CATEGORY_LABELS[category]}
              </div>
            </div>
          </div>

          <Suspense fallback={<DetailSkeleton />}>
            <DetailContent itemName={itemName} category={category} />
          </Suspense>
        </div>
      </ViewTransition>
    </dialog>,
    document.body,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/equipment/item-detail-modal.tsx
git commit -m "feat: create ItemDetailModal component with stat renderers"
```

---

### Task 8: Wire Up Build Viewer Page

**Files:**
- Modify: `src/pages/build-viewer.tsx`

- [ ] **Step 1: Add state, prefetch, and modal rendering**

Replace the entire contents of `src/pages/build-viewer.tsx` with:

```tsx
import { useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import { randomRoute } from "../router";
import { decodeBuild, encodeBuild } from "../lib/build-codec";
import { generateRandomBuild } from "../lib/randomizer";
import {
  weapons,
  shields,
  catalysts,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { BuildIdentity } from "../components/equipment/build-identity";
import { EquipmentSection } from "../components/equipment/equipment-section";
import { ItemSlot } from "../components/equipment/item-slot";
import { ItemDetailModal } from "../components/equipment/item-detail-modal";
import { ActionBar } from "../components/action-bar";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import { prefetchItemDetails } from "../hooks/use-item-details";
import type { ItemCategory } from "../components/icons/item-icons";

interface SelectedItem {
  name: string;
  category: ItemCategory;
  slotId: string;
}

export function BuildViewerPage() {
  const { build: encodedBuild } = randomRoute.useSearch();
  const navigate = useNavigate();
  const toast = useToast();
  const initialRedirectDone = useRef(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  useEffect(() => {
    prefetchItemDetails();
  }, []);

  const build = useMemo(() => {
    if (encodedBuild) {
      const decoded = decodeBuild(encodedBuild);
      if (decoded) return decoded;
    }
    return generateRandomBuild();
  }, [encodedBuild]);

  useEffect(() => {
    if (!encodedBuild && !initialRedirectDone.current) {
      initialRedirectDone.current = true;
      const encoded = encodeBuild(build);
      navigate({ to: "/random", search: { build: encoded }, replace: true });
    }
  }, [encodedBuild, build, navigate]);

  function handleRandomize() {
    const newBuild = generateRandomBuild();
    const encoded = encodeBuild(newBuild);
    navigate({ to: "/random", search: { build: encoded } });
  }

  async function handleShare() {
    try {
      const encoded = encodeBuild(build);
      const url = new URL(window.location.href);
      url.searchParams.set("build", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  function selectItem(name: string, category: ItemCategory, slotId: string) {
    startTransition(() => setSelectedItem({ name, category, slotId }));
  }

  function closeModal() {
    startTransition(() => setSelectedItem(null));
  }

  const weaponSlotsR = build.weaponsRight.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Right Hand ${i + 1}`,
    slotId: `right-${i}`,
  }));
  const weaponSlotsL = build.weaponsLeft.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Left Hand ${i + 1}`,
    slotId: `left-${i}`,
  }));

  const armorPieces = [
    { name: armorHead[build.helm]?.name ?? "Unknown", label: "Helm", slotId: "helm" },
    { name: armorBody[build.chest]?.name ?? "Unknown", label: "Chest Armor", slotId: "chest" },
    { name: armorArms[build.gauntlets]?.name ?? "Unknown", label: "Gauntlets", slotId: "gauntlets" },
    { name: armorLegs[build.legs]?.name ?? "Unknown", label: "Leg Armor", slotId: "legs" },
  ];

  const shieldName = shields[build.shield]?.name ?? "Unknown";
  const catalystName = catalysts[build.catalyst]?.name ?? "Unknown";

  const talismanNames = build.talismans.map((idx) => talismans[idx]?.name ?? "Unknown");
  const ashNames = build.ashesOfWar.map((idx) => ashesOfWar[idx]?.name ?? "Unknown");
  const sorceryNames = build.sorceries.map((idx) => sorceries[idx]?.name ?? "Unknown");
  const incantNames = build.incantations.map((idx) => incantations[idx]?.name ?? "Unknown");

  return (
    <>
      <div className="animate-fade-in">
        <BuildIdentity buildName={build.buildName} buildImage={build.buildImage} />

        <EquipmentSection title="Armament">
          <div className="grid grid-cols-2 gap-2">
            {weaponSlotsR.map((w) => (
              <ItemSlot
                key={w.slotId}
                itemName={w.name}
                slotLabel={w.label}
                slotId={w.slotId}
                category="weapon"
                variant="standard"
                onClick={() => selectItem(w.name, "weapon", w.slotId)}
                isActive={selectedItem?.slotId === w.slotId}
              />
            ))}
            {weaponSlotsL.map((w) => (
              <ItemSlot
                key={w.slotId}
                itemName={w.name}
                slotLabel={w.label}
                slotId={w.slotId}
                category="weapon"
                variant="standard"
                onClick={() => selectItem(w.name, "weapon", w.slotId)}
                isActive={selectedItem?.slotId === w.slotId}
              />
            ))}
          </div>
        </EquipmentSection>

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
          <EquipmentSection title="Armor">
            <div className="grid grid-cols-2 gap-2">
              {armorPieces.map((a) => (
                <ItemSlot
                  key={a.slotId}
                  itemName={a.name}
                  slotLabel={a.label}
                  slotId={a.slotId}
                  category="armor"
                  variant="standard"
                  onClick={() => selectItem(a.name, "armor", a.slotId)}
                  isActive={selectedItem?.slotId === a.slotId}
                />
              ))}
            </div>
          </EquipmentSection>

          <EquipmentSection title="Shield & Catalyst">
            <div className="grid gap-2">
              <ItemSlot
                itemName={shieldName}
                slotLabel="Shield"
                slotId="shield"
                category="shield"
                variant="standard"
                onClick={() => selectItem(shieldName, "shield", "shield")}
                isActive={selectedItem?.slotId === "shield"}
              />
              <ItemSlot
                itemName={catalystName}
                slotLabel="Seal / Staff"
                slotId="catalyst"
                category="seal"
                variant="standard"
                onClick={() => selectItem(catalystName, "seal", "catalyst")}
                isActive={selectedItem?.slotId === "catalyst"}
              />
            </div>
          </EquipmentSection>
        </div>

        <EquipmentSection title="Talismans">
          <div className="grid grid-cols-4 gap-2">
            {talismanNames.map((name, i) => (
              <ItemSlot
                key={`talisman-${i}`}
                itemName={name}
                slotId={`talisman-${i}`}
                category="talisman"
                variant="talisman"
                onClick={() => selectItem(name, "talisman", `talisman-${i}`)}
                isActive={selectedItem?.slotId === `talisman-${i}`}
              />
            ))}
          </div>
        </EquipmentSection>

        <EquipmentSection title="Ashes of War">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {ashNames.map((name, i) => (
              <ItemSlot
                key={`ash-${i}`}
                itemName={name}
                slotId={`ash-${i}`}
                category="ash"
                variant="compact"
                onClick={() => selectItem(name, "ash", `ash-${i}`)}
                isActive={selectedItem?.slotId === `ash-${i}`}
              />
            ))}
          </div>
        </EquipmentSection>

        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {sorceryNames.map((name, i) => (
              <ItemSlot
                key={`sorc-${i}`}
                itemName={name}
                slotId={`sorc-${i}`}
                category="spell"
                variant="compact"
                onClick={() => selectItem(name, "spell", `sorc-${i}`)}
                isActive={selectedItem?.slotId === `sorc-${i}`}
              />
            ))}
            {incantNames.map((name, i) => (
              <ItemSlot
                key={`incant-${i}`}
                itemName={name}
                slotId={`incant-${i}`}
                category="spell"
                variant="compact"
                onClick={() => selectItem(name, "spell", `incant-${i}`)}
                isActive={selectedItem?.slotId === `incant-${i}`}
              />
            ))}
          </div>
        </EquipmentSection>
      </div>

      <ActionBar onRandomize={handleRandomize} onShare={handleShare} />
      <Toast message={toast.message} />

      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          slotId={selectedItem.slotId}
          onClose={closeModal}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
pnpm build
```

Expected: May still have errors in `generate-build.tsx` (Task 9). The build-viewer page should compile cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/build-viewer.tsx
git commit -m "feat: wire item detail modal into build viewer page"
```

---

### Task 9: Wire Up Generate Build Page

**Files:**
- Modify: `src/pages/generate-build.tsx`

- [ ] **Step 1: Add state, prefetch, and modal to the page**

Replace the entire contents of `src/pages/generate-build.tsx` with:

```tsx
import { useState, startTransition, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { BuildPick, GeneratedPick, CommunityPick } from "../types/picks";
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { BuildIdentity } from "../components/equipment/build-identity";
import { EquipmentSection } from "../components/equipment/equipment-section";
import { ItemSlot } from "../components/equipment/item-slot";
import { ItemDetailModal } from "../components/equipment/item-detail-modal";
import { StatProfileDisplay } from "../components/generator/stat-profile-display";
import { ArmorClassBadge } from "../components/generator/armor-class-badge";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import { encodeBuild } from "../lib/build-codec";
import { prefetchItemDetails } from "../hooks/use-item-details";
import type { ItemCategory } from "../components/icons/item-icons";

const PICK_KEY = "erbr-selected-pick";

interface SelectedItem {
  name: string;
  category: ItemCategory;
  slotId: string;
}

function loadPick(): BuildPick | null {
  try {
    const raw = sessionStorage.getItem(PICK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuildPick;
  } catch {
    return null;
  }
}

function GeneratedBuildView({
  pick,
  selectedItem,
  onSelectItem,
}: {
  pick: GeneratedPick;
  selectedItem: SelectedItem | null;
  onSelectItem: (name: string, category: ItemCategory, slotId: string) => void;
}) {
  const { generated } = pick;
  const build = generated.build;
  const toast = useToast();

  async function handleShare() {
    try {
      const encoded = encodeBuild(build);
      const url = new URL(window.location.origin + import.meta.env.BASE_URL);
      url.searchParams.set("build", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  return (
    <>
      <BuildIdentity buildName={generated.buildName} />

      <StatProfileDisplay
        statProfile={generated.statProfile}
        armorClass={generated.armorClass}
        loadoutProfile={generated.loadoutProfile}
      />

      <EquipmentSection title="Armament">
        <div className="grid grid-cols-2 gap-2">
          {build.weaponsRight.map((idx, i) => (
            <ItemSlot
              key={`r${i}`}
              itemName={weapons[idx]?.name ?? "Unknown"}
              slotLabel={`Right Hand ${i + 1}`}
              slotId={`gen-right-${i}`}
              category="weapon"
              variant="standard"
              onClick={() =>
                onSelectItem(weapons[idx]?.name ?? "Unknown", "weapon", `gen-right-${i}`)
              }
              isActive={selectedItem?.slotId === `gen-right-${i}`}
            />
          ))}
          {build.weaponsLeft.map((idx, i) => (
            <ItemSlot
              key={`l${i}`}
              itemName={weapons[idx]?.name ?? "Unknown"}
              slotLabel={`Left Hand ${i + 1}`}
              slotId={`gen-left-${i}`}
              category="weapon"
              variant="standard"
              onClick={() =>
                onSelectItem(weapons[idx]?.name ?? "Unknown", "weapon", `gen-left-${i}`)
              }
              isActive={selectedItem?.slotId === `gen-left-${i}`}
            />
          ))}
        </div>
      </EquipmentSection>

      <EquipmentSection title="Armor">
        <ArmorClassBadge armorClass={generated.armorClass} />
      </EquipmentSection>

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
        {build.shield >= 0 && (
          <EquipmentSection title="Shield">
            <ItemSlot
              itemName={shields[build.shield]?.name ?? "None"}
              slotLabel="Shield"
              slotId="gen-shield"
              category="shield"
              variant="standard"
              onClick={() =>
                onSelectItem(shields[build.shield]?.name ?? "None", "shield", "gen-shield")
              }
              isActive={selectedItem?.slotId === "gen-shield"}
            />
          </EquipmentSection>
        )}
        {build.catalyst >= 0 && (
          <EquipmentSection title="Catalyst">
            <ItemSlot
              itemName={catalysts[build.catalyst]?.name ?? "None"}
              slotLabel="Seal / Staff"
              slotId="gen-catalyst"
              category="seal"
              variant="standard"
              onClick={() =>
                onSelectItem(
                  catalysts[build.catalyst]?.name ?? "None",
                  "seal",
                  "gen-catalyst",
                )
              }
              isActive={selectedItem?.slotId === "gen-catalyst"}
            />
          </EquipmentSection>
        )}
      </div>

      <EquipmentSection title="Talismans">
        <div className="grid grid-cols-4 gap-2">
          {build.talismans.map((idx, i) => (
            <ItemSlot
              key={`tal-${i}`}
              itemName={talismans[idx]?.name ?? "Unknown"}
              slotId={`gen-talisman-${i}`}
              category="talisman"
              variant="talisman"
              onClick={() =>
                onSelectItem(
                  talismans[idx]?.name ?? "Unknown",
                  "talisman",
                  `gen-talisman-${i}`,
                )
              }
              isActive={selectedItem?.slotId === `gen-talisman-${i}`}
            />
          ))}
        </div>
      </EquipmentSection>

      <EquipmentSection title="Ashes of War">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {build.ashesOfWar.map((idx, i) => (
            <ItemSlot
              key={`ash-${i}`}
              itemName={ashesOfWar[idx]?.name ?? "Unknown"}
              slotId={`gen-ash-${i}`}
              category="ash"
              variant="compact"
              onClick={() =>
                onSelectItem(ashesOfWar[idx]?.name ?? "Unknown", "ash", `gen-ash-${i}`)
              }
              isActive={selectedItem?.slotId === `gen-ash-${i}`}
            />
          ))}
        </div>
      </EquipmentSection>

      {(build.sorceries.length > 0 || build.incantations.length > 0) && (
        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {build.sorceries.map((idx, i) => (
              <ItemSlot
                key={`sorc-${i}`}
                itemName={sorceries[idx]?.name ?? "Unknown"}
                slotId={`gen-sorc-${i}`}
                category="spell"
                variant="compact"
                onClick={() =>
                  onSelectItem(sorceries[idx]?.name ?? "Unknown", "spell", `gen-sorc-${i}`)
                }
                isActive={selectedItem?.slotId === `gen-sorc-${i}`}
              />
            ))}
            {build.incantations.map((idx, i) => (
              <ItemSlot
                key={`inc-${i}`}
                itemName={incantations[idx]?.name ?? "Unknown"}
                slotId={`gen-incant-${i}`}
                category="spell"
                variant="compact"
                onClick={() =>
                  onSelectItem(
                    incantations[idx]?.name ?? "Unknown",
                    "spell",
                    `gen-incant-${i}`,
                  )
                }
                isActive={selectedItem?.slotId === `gen-incant-${i}`}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[600px] gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0"
          >
            &#128279; Share
          </button>
        </div>
      </div>

      <Toast message={toast.message} />
    </>
  );
}

function CommunityBuildView({
  pick,
  selectedItem,
  onSelectItem,
}: {
  pick: CommunityPick;
  selectedItem: SelectedItem | null;
  onSelectItem: (name: string, category: ItemCategory, slotId: string) => void;
}) {
  const { build } = pick;

  return (
    <>
      <BuildIdentity buildName={build.name} />

      <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
        <p className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
          {build.playstyle}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">{build.strategy}</p>
      </div>

      <EquipmentSection title="Weapons">
        <div className="grid grid-cols-2 gap-2">
          {build.weapons.map((w, i) => (
            <ItemSlot
              key={w}
              itemName={w}
              slotId={`comm-weapon-${i}`}
              category="weapon"
              variant="standard"
              onClick={() => onSelectItem(w, "weapon", `comm-weapon-${i}`)}
              isActive={selectedItem?.slotId === `comm-weapon-${i}`}
            />
          ))}
        </div>
      </EquipmentSection>

      {build.primaryStats.length > 0 && (
        <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
          <div className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
            Primary Stats
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {build.primaryStats.map((stat) => (
              <span
                key={stat}
                className="rounded bg-bg-surface px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 text-center">
        <a
          href={build.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim transition-colors hover:text-gold-light"
        >
          View full guide on Fextralife &#8599;
        </a>
      </div>
    </>
  );
}

export function GenerateBuildPage() {
  const navigate = useNavigate();
  const pick = loadPick();
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  useEffect(() => {
    prefetchItemDetails();
  }, []);

  if (!pick) {
    navigate({ to: "/generate" });
    return null;
  }

  function handleSelectItem(name: string, category: ItemCategory, slotId: string) {
    startTransition(() => setSelectedItem({ name, category, slotId }));
  }

  function handleCloseModal() {
    startTransition(() => setSelectedItem(null));
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/generate/picks" })}
          className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light"
        >
          &#8592; Back to picks
        </button>
      </div>

      {pick.kind === "generated" ? (
        <GeneratedBuildView
          pick={pick}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />
      ) : (
        <CommunityBuildView
          pick={pick}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />
      )}

      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          slotId={selectedItem.slotId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify full build compiles**

```bash
pnpm build
```

Expected: Clean build, no type errors.

- [ ] **Step 3: Run the formatter**

```bash
pnpm format
```

- [ ] **Step 4: Run the linter**

```bash
pnpm lint
```

Fix any issues flagged.

- [ ] **Step 5: Commit**

```bash
git add src/pages/generate-build.tsx
git commit -m "feat: wire item detail modal into generate-build page"
```

---

### Task 10: Manual Verification

No test framework is configured. Verify the feature manually.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test on build viewer page**

1. Navigate to the app root (should redirect to `/random?build=...`)
2. Click a weapon card — verify the modal opens with the image morphing from the card position
3. Verify the modal shows: item name, category, rarity, lore description, attack power stats, scaling with letter grades, requirements badges
4. Press Escape — verify modal closes with reverse animation
5. Click a different item (armor) — verify armor-specific stats show (absorptions, resistances)
6. Click the X button — verify close works
7. Click the backdrop — verify close works
8. Click a talisman — verify talisman stats (effects, conflicts)
9. Click a spell — verify spell stats (FP cost, slots)
10. Click an ash of war — verify ash stats (affinities, compatible weapons)

- [ ] **Step 3: Test on generate-build page**

1. Navigate to `/generate`, add seed items, generate picks, select a pick
2. On the build detail page, click items — verify modal opens with same behavior
3. If a community build is available, verify clicking weapons in the community view works

- [ ] **Step 4: Test edge cases**

1. Click an item rapidly multiple times — verify no crashes or duplicate modals
2. Open modal, then navigate away (back button) — verify clean state
3. Verify keyboard: Tab to an item, press Enter — modal should open. Press Escape — should close.
4. Check browser console for any errors or warnings

- [ ] **Step 5: Test reduced motion**

In browser devtools, enable "Prefers reduced motion" emulation. Open a modal — verify it appears/disappears instantly with no animation.

- [ ] **Step 6: Verify build for production**

```bash
pnpm build
```

Expected: Clean build. Check that the detail JSON files appear as separate chunks in the build output (code splitting is working).
