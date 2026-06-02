# Enriched Community Builds

Community builds currently only display weapon names. The Fextralife source data has full equipment loadouts (armor, shields, talismans, spells, stats), but the slim data pipeline strips everything except `weapons`. This design enriches community builds to show full interactive equipment slots matching the generated build view.

## Data Model Changes

### CommunityBuild Type (`src/types/community.ts`)

Add optional fields to `CommunityBuild`:

```typescript
export interface CommunityBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
  // New fields
  shield?: string | null;
  armor?: string[];          // [head, body, arms, legs]
  talismans?: string[];
  skills?: string[];         // weapon skills / ashes of war names
  spells?: string[];         // sorceries and incantations
  secondaryStats?: string[];
}
```

All new fields are optional so existing code and builds without full data degrade gracefully to the current weapon-only view.

### Slim Data Pipeline (`scripts/generate-slim-community-builds.ts`)

This script reads `data/enriched-community-builds.json` and currently strips all fields except `id`, `name`, `weapons`, `primaryStats`, `tags`, `playstyle`, `strategy`, and `sourceUrl`. Update the `EnrichedBuild` interface and the `.map()` call to pass through the new fields:

- `shield` — string or null, pass through as-is
- `armor` — array of 4 strings, pass through as-is
- `talismans` — array of talisman name strings, pass through as-is
- `skills` — array of weapon skill / ash of war name strings, pass through as-is
- `spells` — array of spell name strings, pass through as-is
- `secondaryStats` — array of stat name strings, pass through as-is

Emit these only when present (omit undefined/null/empty arrays to keep the JSON compact).

### Source Data Fix

Rename the "Magma Blade" build to "Magma Spitter" in `data/enriched-community-builds.json` (update both `id` and `name` fields).

## Runtime Name Resolution

### `resolveCommunityBuild()` Utility

A new function (in a new file or added to an existing lib file) that takes a `CommunityBuild` and resolves item name strings to data array entries for rendering interactive slots.

#### Resolution Strategy

Each community build field maps to one or more app data arrays:

| Build Field | Data Arrays Searched | Notes |
|---|---|---|
| `weapons` | `weapons`, `staves`, `seals` | Enriched data puts catalysts in weapons array. Check weapons first, then staves, then seals. |
| `shield` | `shields` | Direct name match. |
| `armor` | `armorHead`, `armorBody`, `armorArms`, `armorLegs` | Positional: index 0 searches head, 1 searches body, 2 searches arms, 3 searches legs. |
| `talismans` | `talismans` | Cap at 4 for slot grid (extras are alternates). |
| `spells` | `sorceries`, `incantations` | Search sorceries first, then incantations. |
| `skills` | `ashesOfWar` | Many won't resolve (weapon skills like "Magma Shower" aren't Ash of War items). Unresolved items are skipped. |

All matching is case-insensitive string comparison on the `name` field.

#### Return Type

```typescript
interface ResolvedItem {
  name: string;
  index: number;
  category: ItemCategory;  // "weapon" | "shield" | "staff" | "seal" | "armor" | "talisman" | "spell" | "ash"
}

interface ResolvedCommunityBuild {
  armament: ResolvedItem[];      // weapons only (no catalysts)
  staves: ResolvedItem[];
  seals: ResolvedItem[];
  shield: ResolvedItem | null;
  armor: ResolvedItem[];         // up to 4, positional
  talismans: ResolvedItem[];     // capped at 4
  ashesOfWar: ResolvedItem[];    // resolved skills
  sorceries: ResolvedItem[];
  incantations: ResolvedItem[];
}
```

Items that don't resolve against any data array are silently omitted from the resolved output. They remain visible in the strategy text.

## CommunityBuildView Redesign (`src/pages/generate-build.tsx`)

Replace the current sparse view with full equipment slots. Layout from top to bottom:

1. **Build Identity** — build name via `BuildIdentity` component (unchanged)
2. **Playstyle & Strategy card** — existing card showing `playstyle` and `strategy` text (unchanged)
3. **Armament section** — resolved weapons in 2-column grid using `ItemSlot` with `variant="standard"`
4. **Shield section** — conditional, rendered only if `shield` resolves
5. **Staves section** — conditional, rendered only if any weapons resolved as staves
6. **Seals section** — conditional, rendered only if any weapons resolved as seals
7. **Armor section** — 4 armor slots (head, body, arms, legs) in 2-column grid using `ItemSlot` with `variant="standard"` and slot labels
8. **Talismans section** — 4-column grid using `ItemSlot` with `variant="talisman"`, capped at 4
9. **Ashes of War section** — auto-fill responsive grid using `ItemSlot` with `variant="compact"`, only resolved skills
10. **Sorceries & Incantations section** — auto-fill responsive grid using `ItemSlot` with `variant="compact"`
11. **Primary Stats + Secondary Stats** — stat badges in existing style, extended with secondary stats below primary
12. **Fextralife link** — existing link at bottom

### Interactivity

Every equipment slot is clickable and triggers `onSelectItem(name, category)`, which opens `ItemDetailModal` with full item details and Guided Hand navigation. This reuses the existing modal and callback infrastructure in `GenerateBuildPage` — no changes needed to the parent component.

### Conditional Rendering

Each section follows the same conditional pattern as `GeneratedBuildView`: if a resolved array is empty or a field is missing, the section is not rendered. A community build with only weapons populated renders identically to the current view.

## Community Matcher Impact

The community matcher (`src/lib/community-matcher.ts`) currently matches on `weapons`, `tags`, and `primaryStats`. The new fields (`shield`, `armor`, `talismans`, `spells`) are not used for matching in this change. Expanding the matcher to score on these additional fields is a potential follow-up but is out of scope.

## Files Changed

| File | Change |
|---|---|
| `data/enriched-community-builds.json` | Rename "Magma Blade" build to "Magma Spitter" |
| `src/types/community.ts` | Add optional fields to `CommunityBuild` interface |
| `scripts/generate-slim-community-builds.ts` | Pass through new fields from enriched data |
| `src/data/community-builds.json` | Regenerated by script with new fields |
| `src/lib/resolve-community-build.ts` | New file: `resolveCommunityBuild()` utility |
| `src/pages/generate-build.tsx` | Redesign `CommunityBuildView` with full equipment slots |
