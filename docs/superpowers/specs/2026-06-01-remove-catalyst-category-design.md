# Remove Catalyst Category — Split into Staves, Seals, and Separate Shields

## Problem

"Catalyst" is a project-invented umbrella term grouping Glintstone Staffs and Sacred Seals. It doesn't match in-game terminology and adds an unnecessary abstraction. Additionally, shields, staves, and seals are currently mandatory single slots in every build, even when irrelevant (e.g., a pure melee build always gets a catalyst).

## Goal

Replace the single `catalyst` field with separate `staves` and `seals` optional arrays. Make `shields` an optional array as well. Each category renders only when present in the build. Remove all traces of the "catalyst" concept from the codebase.

## Approach

Full split (Approach A): separate data files, separate types, separate codec fields. Clean break with no vestigial catalyst abstraction.

## Design

### 1. Data Pipeline

Write a one-time script `scripts/split-catalysts.ts` that:

1. Reads `src/data/catalysts.json`, splits by `category`:
   - `"Glintstone Staff"` items -> `src/data/staves.json`
   - `"Sacred Seal"` items -> `src/data/seals.json`
2. Reads `src/data/catalyst-details.json`, splits the same way:
   - -> `src/data/staff-details.json`
   - -> `src/data/seal-details.json`
3. Deletes `catalysts.json` and `catalyst-details.json`

Run once, commit results, script can be deleted after.

### 2. Types

**`src/types/items.ts`:**
- Remove `Catalyst` interface
- Add `Staff` interface (name, category, weight, scaling, requirements, damageTypes, statusEffects)
- Add `Seal` interface (same shape)

**`src/types/build.ts`:**
- Remove `shield: number` and `catalyst: number`
- Add `shields?: number[]`, `staves?: number[]`, `seals?: number[]`

**`src/types/generator.ts`:**
- `ItemType` union: replace `"catalyst"` with `"staff" | "seal"`

### 3. Build Codec

- Bump `CODEC_VERSION` from 1 to 2
- Replace the two fixed `writeIndex`/`readUint16` calls for shield/catalyst with three `writeArray`/`readArray` calls for shields, staves, seals
- Empty arrays encode as a single `0x00` length byte (minimal overhead)
- Old v1 URLs fail version check and fall through to a new random build (existing behavior)

### 4. Randomizer

**`src/lib/randomizer.ts`:**
- Instead of always picking one shield and one catalyst, each category gets a random chance:
  - ~40% chance to include a shield (picks 1)
  - ~25% chance to include a staff (picks 1)
  - ~25% chance to include a seal (picks 1)
- When not picked, field is omitted or empty array

### 5. Build Generator (Guiding Hand)

**`src/lib/candidate-scorer.ts`:**
- `scoreCatalysts` splits into `scoreStaves` and `scoreSeals`

**`src/lib/build-generator.ts`:**
- `seedCatalystIndices` splits into `seedStaffIndices` and `seedSealIndices`
- `fillWeaponsByProfile` return type changes:
  - `shieldIdx: number` -> `shieldIndices: number[]`
  - `catalystIdx: number` -> `staffIndices: number[]` and `sealIndices: number[]`
- Loadout profiles pick staff when build has intelligence, seal when it has faith, both for hybrid casters
- Profiles that currently pick a catalyst ("Pure Caster", "Spellblade", "Shield Caster") updated to pick staff/seal based on stat profile

**`src/lib/fate/fate-build-generator.ts`:**
- Catalyst pool splits into staff/seal pools based on fate constraints

**Other lib files:**
- `stat-profile.ts`: `"catalyst"` case splits into `"staff"` and `"seal"`
- `community-matcher.ts`: same treatment
- `loadout-profiles.ts`: `s.type === "catalyst"` checks split into staff/seal

### 6. UI / Rendering

**`src/pages/build-viewer.tsx`:**
- Remove "Shield & Catalyst" section
- Add three conditional sections that render only when the array is non-empty:
  - "Shields" (if `build.shields?.length > 0`)
  - "Staves" (if `build.staves?.length > 0`)
  - "Seals" (if `build.seals?.length > 0`)
- Each uses `ItemSlot` with `variant="standard"` in a grid

**`src/pages/generate-build.tsx`:**
- Same treatment in `GeneratedBuildView` — the single catalyst conditional splits into three conditional sections

**`src/components/generator/item-search.tsx`:**
- Catalyst search pool splits into staves and seals as separate entries with their own type labels

**`src/components/equipment/item-detail-modal.tsx`:**
- `"seal": "Catalyst"` mapping splits into `"seal": "Seal"` and `"staff": "Staff"`

**`src/components/icons/item-icons.tsx`:**
- Add `"staff"` to `ItemCategory` type alongside existing `"seal"`

**`src/data/index.ts`:**
- Replace `catalysts` import with `staves` and `seals` imports

### 7. Codec Compatibility

Old v1 build URLs will fail the version check and generate a fresh random build. No migration path — acceptable for this project.

## Files Affected

- `scripts/split-catalysts.ts` (new, one-time)
- `src/data/catalysts.json` (deleted)
- `src/data/catalyst-details.json` (deleted)
- `src/data/staves.json` (new)
- `src/data/seals.json` (new)
- `src/data/staff-details.json` (new)
- `src/data/seal-details.json` (new)
- `src/data/index.ts`
- `src/types/items.ts`
- `src/types/build.ts`
- `src/types/generator.ts`
- `src/lib/build-codec.ts`
- `src/lib/randomizer.ts`
- `src/lib/build-generator.ts`
- `src/lib/candidate-scorer.ts`
- `src/lib/stat-profile.ts`
- `src/lib/community-matcher.ts`
- `src/lib/loadout-profiles.ts`
- `src/lib/fate/fate-build-generator.ts`
- `src/pages/build-viewer.tsx`
- `src/pages/generate-build.tsx`
- `src/components/generator/item-search.tsx`
- `src/components/equipment/item-detail-modal.tsx`
- `src/components/icons/item-icons.tsx` (if ItemCategory is defined here)
