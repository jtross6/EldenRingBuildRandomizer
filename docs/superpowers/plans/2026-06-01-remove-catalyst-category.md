# Remove Catalyst Category Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "catalyst" abstraction and replace it with separate staves, seals, and shields as optional arrays in the build type.

**Architecture:** Split the single `catalysts.json` data file into `staves.json` and `seals.json`. Change the `Build` type from mandatory single-index fields (`shield: number`, `catalyst: number`) to optional arrays (`shields?: number[]`, `staves?: number[]`, `seals?: number[]`). Bump the codec version. Update all generators and UI to work with the new structure.

**Tech Stack:** TypeScript, React, Vite, tsx (for scripts)

---

### Task 1: Split catalyst data files

**Files:**
- Create: `scripts/split-catalysts.ts`
- Create: `src/data/staves.json`
- Create: `src/data/seals.json`
- Create: `src/data/staff-details.json`
- Create: `src/data/seal-details.json`
- Delete: `src/data/catalysts.json`
- Delete: `src/data/catalyst-details.json`

- [ ] **Step 1: Write the split script**

```ts
// scripts/split-catalysts.ts
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";

const dataDir = resolve(import.meta.dirname, "../src/data");

interface CatalystEntry {
  name: string;
  category: string;
  weight: number;
  [key: string]: unknown;
}

// Split catalysts.json
const catalysts: CatalystEntry[] = JSON.parse(
  readFileSync(resolve(dataDir, "catalysts.json"), "utf-8"),
);
const staves = catalysts.filter((c) => c.category === "Glintstone Staff");
const seals = catalysts.filter((c) => c.category === "Sacred Seal");

writeFileSync(resolve(dataDir, "staves.json"), JSON.stringify(staves, null, 2) + "\n");
writeFileSync(resolve(dataDir, "seals.json"), JSON.stringify(seals, null, 2) + "\n");
unlinkSync(resolve(dataDir, "catalysts.json"));

// Split catalyst-details.json
const details: Record<string, unknown> = JSON.parse(
  readFileSync(resolve(dataDir, "catalyst-details.json"), "utf-8"),
);
const staffNames = new Set(staves.map((s) => s.name));

const staffDetails: Record<string, unknown> = {};
const sealDetails: Record<string, unknown> = {};
for (const [name, detail] of Object.entries(details)) {
  if (staffNames.has(name)) {
    staffDetails[name] = detail;
  } else {
    sealDetails[name] = detail;
  }
}

writeFileSync(resolve(dataDir, "staff-details.json"), JSON.stringify(staffDetails, null, 2) + "\n");
writeFileSync(resolve(dataDir, "seal-details.json"), JSON.stringify(sealDetails, null, 2) + "\n");
unlinkSync(resolve(dataDir, "catalyst-details.json"));

console.log(`Staves: ${staves.length}, Seals: ${seals.length}`);
console.log(`Staff details: ${Object.keys(staffDetails).length}, Seal details: ${Object.keys(sealDetails).length}`);
```

- [ ] **Step 2: Run the script**

Run: `npx tsx scripts/split-catalysts.ts`
Expected output:
```
Staves: 20, Seals: 12
Staff details: 20, Seal details: 12
```

Verify: `ls src/data/staves.json src/data/seals.json src/data/staff-details.json src/data/seal-details.json`
Verify: `! test -f src/data/catalysts.json && ! test -f src/data/catalyst-details.json && echo "old files deleted"`

- [ ] **Step 3: Delete the split script**

Run: `rm scripts/split-catalysts.ts`

- [ ] **Step 4: Commit**

```bash
git add src/data/staves.json src/data/seals.json src/data/staff-details.json src/data/seal-details.json
git rm src/data/catalysts.json src/data/catalyst-details.json
git commit -m "data: split catalysts into staves and seals"
```

---

### Task 2: Update types

**Files:**
- Modify: `src/types/items.ts`
- Modify: `src/types/build.ts`
- Modify: `src/types/generator.ts`

- [ ] **Step 1: Update items.ts**

Remove the `Catalyst` interface (lines 25-33) and replace with `Staff` and `Seal`:

```ts
export interface Staff {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
}

export interface Seal {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
}
```

- [ ] **Step 2: Update build.ts**

Replace `shield: number` and `catalyst: number` with optional arrays:

```ts
export interface Build {
  buildName?: string;
  buildImage?: string;
  weaponsRight: number[];
  weaponsLeft: number[];
  helm: number;
  chest: number;
  gauntlets: number;
  legs: number;
  shields?: number[];
  staves?: number[];
  seals?: number[];
  talismans: number[];
  ashesOfWar: number[];
  sorceries: number[];
  incantations: number[];
}
```

- [ ] **Step 3: Update generator.ts**

Change `ItemType` union — replace `"catalyst"` with `"staff" | "seal"`:

```ts
export type ItemType = "weapon" | "shield" | "staff" | "seal" | "spell" | "ashOfWar" | "talisman";
```

- [ ] **Step 4: Commit**

```bash
git add src/types/items.ts src/types/build.ts src/types/generator.ts
git commit -m "types: replace catalyst with staff/seal, make shields optional arrays"
```

---

### Task 3: Update data index

**Files:**
- Modify: `src/data/index.ts`

- [ ] **Step 1: Replace catalysts import with staves and seals**

In `src/data/index.ts`, replace:
```ts
import type {
  ArmorPiece,
  AshOfWar,
  Catalyst,
  Shield,
  Spell,
  Talisman,
  Weapon,
} from "../types/items";
```
with:
```ts
import type {
  ArmorPiece,
  AshOfWar,
  Staff,
  Seal,
  Shield,
  Spell,
  Talisman,
  Weapon,
} from "../types/items";
```

Replace:
```ts
import catalystsData from "./catalysts.json";
```
with:
```ts
import stavesData from "./staves.json";
import sealsData from "./seals.json";
```

Replace:
```ts
export const catalysts = catalystsData as unknown as Catalyst[];
```
with:
```ts
export const staves = stavesData as unknown as Staff[];
export const seals = sealsData as unknown as Seal[];
```

- [ ] **Step 2: Commit**

```bash
git add src/data/index.ts
git commit -m "data: replace catalysts export with staves and seals"
```

---

### Task 4: Update build codec

**Files:**
- Modify: `src/lib/build-codec.ts`

- [ ] **Step 1: Update the encoder**

Change `CODEC_VERSION` from `1` to `2`.

In `encodeBuild`, replace these two lines:
```ts
  writeIndex(build.shield);
  writeIndex(build.catalyst);
```
with:
```ts
  writeArray(build.shields ?? []);
  writeArray(build.staves ?? []);
  writeArray(build.seals ?? []);
```

- [ ] **Step 2: Update the decoder**

In `decodeBuild`, replace these two lines:
```ts
    const shield = readUint16();
    const catalyst = readUint16();
```
with:
```ts
    const shields = readArray();
    const staves = readArray();
    const seals = readArray();
```

And in the return object, replace:
```ts
      shield,
      catalyst,
```
with:
```ts
      shields: shields.length > 0 ? shields : undefined,
      staves: staves.length > 0 ? staves : undefined,
      seals: seals.length > 0 ? seals : undefined,
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/build-codec.ts
git commit -m "codec: bump to v2, encode shields/staves/seals as arrays"
```

---

### Task 5: Update randomizer

**Files:**
- Modify: `src/lib/randomizer.ts`

- [ ] **Step 1: Update generateRandomBuild**

Replace the entire `src/lib/randomizer.ts` with:

```ts
import type { Build } from "../types/build";
import {
  weapons,
  shields,
  staves,
  seals,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";

function randomIndex(poolSize: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % poolSize;
}

function randomIndices(poolSize: number, count: number): number[] {
  const picked = new Set<number>();
  while (picked.size < Math.min(count, poolSize)) {
    picked.add(randomIndex(poolSize));
  }
  return [...picked];
}

function randomChance(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0xffffffff;
}

export function generateRandomBuild(): Build {
  return {
    weaponsRight: randomIndices(weapons.length, 3),
    weaponsLeft: randomIndices(weapons.length, 3),
    helm: randomIndex(armorHead.length),
    chest: randomIndex(armorBody.length),
    gauntlets: randomIndex(armorArms.length),
    legs: randomIndex(armorLegs.length),
    shields: randomChance() < 0.4 ? [randomIndex(shields.length)] : undefined,
    staves: randomChance() < 0.25 ? [randomIndex(staves.length)] : undefined,
    seals: randomChance() < 0.25 ? [randomIndex(seals.length)] : undefined,
    talismans: randomIndices(talismans.length, 4),
    ashesOfWar: randomIndices(ashesOfWar.length, 3),
    sorceries: randomIndices(sorceries.length, 4),
    incantations: randomIndices(incantations.length, 4),
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/lib/randomizer.ts`
(This may fail due to downstream type errors not yet fixed — that's fine. Just ensure no errors within this file.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/randomizer.ts
git commit -m "randomizer: shields/staves/seals are optional with random chance"
```

---

### Task 6: Update candidate scorer

**Files:**
- Modify: `src/lib/candidate-scorer.ts`

- [ ] **Step 1: Replace scoreCatalysts with scoreStaves and scoreSeals**

In the imports, replace:
```ts
import type { Weapon, Shield, Catalyst, Spell, AshOfWar, Talisman } from "../types/items";
```
with:
```ts
import type { Weapon, Shield, Staff, Seal, Spell, AshOfWar, Talisman } from "../types/items";
```

Remove the `scoreCatalysts` function (lines 201-224) and replace with two functions:

```ts
export function scoreStaves(
  candidates: Staff[],
  profile: StatProfile,
  seedItems: SeedItem[],
): ScoredCandidate<Staff>[] {
  const scored: ScoredCandidate<Staff>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((staff, index) => {
    const coScore = getCoOccurrenceScore(staff.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { staff, index, coScore };
  });

  for (const { staff, index, coScore } of rawScores) {
    const scalingVec = staff.scaling ? normalizeVector(staff.scaling) : {};
    const statScore = dotProduct(scalingVec, profile);
    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;
    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: staff, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreSeals(
  candidates: Seal[],
  profile: StatProfile,
  seedItems: SeedItem[],
): ScoredCandidate<Seal>[] {
  const scored: ScoredCandidate<Seal>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((seal, index) => {
    const coScore = getCoOccurrenceScore(seal.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { seal, index, coScore };
  });

  for (const { seal, index, coScore } of rawScores) {
    const scalingVec = seal.scaling ? normalizeVector(seal.scaling) : {};
    const statScore = dotProduct(scalingVec, profile);
    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;
    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: seal, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/candidate-scorer.ts
git commit -m "scorer: replace scoreCatalysts with scoreStaves and scoreSeals"
```

---

### Task 7: Update stat-profile.ts

**Files:**
- Modify: `src/lib/stat-profile.ts`

- [ ] **Step 1: Replace catalysts import and usage**

Replace the import:
```ts
import { weapons, shields, catalysts, sorceries, incantations, ashesOfWar } from "../data";
```
with:
```ts
import { weapons, shields, staves, seals, sorceries, incantations, ashesOfWar } from "../data";
```

Replace the `getWeaponScaling` function (lines 20-28):
```ts
function getWeaponScaling(name: string): Record<string, number> | undefined {
  const w = weapons.find((w) => w.name === name);
  if (w?.scaling) return w.scaling;
  const s = shields.find((s) => s.name === name);
  if (s?.scaling) return s.scaling;
  const st = staves.find((st) => st.name === name);
  if (st?.scaling) return st.scaling;
  const se = seals.find((se) => se.name === name);
  if (se?.scaling) return se.scaling;
  return undefined;
}
```

In the switch statement inside `extractStatProfile`, replace:
```ts
      case "weapon":
      case "shield":
      case "catalyst":
```
with:
```ts
      case "weapon":
      case "shield":
      case "staff":
      case "seal":
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stat-profile.ts
git commit -m "stat-profile: replace catalyst with staff/seal lookups"
```

---

### Task 8: Update community-matcher.ts

**Files:**
- Modify: `src/lib/community-matcher.ts`

- [ ] **Step 1: Replace catalysts import and usage**

Replace the import:
```ts
import { weapons, catalysts } from "../data";
```
with:
```ts
import { weapons, staves, seals } from "../data";
```

Replace the `"catalyst"` case in `seedItemTags` (lines 18-22):
```ts
    } else if (seed.type === "catalyst") {
      const c = catalysts[seed.index];
      if (c) tags.add(c.category.toLowerCase());
      tags.add("caster");
      tags.add(seed.name.toLowerCase());
```
with:
```ts
    } else if (seed.type === "staff") {
      const st = staves[seed.index];
      if (st) tags.add(st.category.toLowerCase());
      tags.add("caster");
      tags.add(seed.name.toLowerCase());
    } else if (seed.type === "seal") {
      const se = seals[seed.index];
      if (se) tags.add(se.category.toLowerCase());
      tags.add("caster");
      tags.add(seed.name.toLowerCase());
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/community-matcher.ts
git commit -m "community-matcher: replace catalyst with staff/seal"
```

---

### Task 9: Update loadout-profiles.ts

**Files:**
- Modify: `src/lib/loadout-profiles.ts`

- [ ] **Step 1: Update the catalyst type check**

Replace line 62:
```ts
    const hasShieldOrCatalyst = seedItems.some((s) => s.type === "shield" || s.type === "catalyst");
```
with:
```ts
    const hasShieldOrCatalyst = seedItems.some(
      (s) => s.type === "shield" || s.type === "staff" || s.type === "seal",
    );
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/loadout-profiles.ts
git commit -m "loadout-profiles: replace catalyst type check with staff/seal"
```

---

### Task 10: Update build-generator.ts

**Files:**
- Modify: `src/lib/build-generator.ts`

- [ ] **Step 1: Update imports**

Replace:
```ts
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
```
with:
```ts
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
```

Replace:
```ts
import {
  scoreWeapons,
  scoreShields,
  scoreCatalysts,
  scoreTalismans,
  scoreAshes,
  scoreSpells,
  type ScoredCandidate,
} from "./candidate-scorer";
```
with:
```ts
import {
  scoreWeapons,
  scoreShields,
  scoreStaves,
  scoreSeals,
  scoreTalismans,
  scoreAshes,
  scoreSpells,
  type ScoredCandidate,
} from "./candidate-scorer";
```

- [ ] **Step 2: Update fillWeaponsByProfile signature and return type**

Change the function signature. Replace:
```ts
  seedCatalystIndices: Set<number>,
): {
  weaponsRight: number[];
  weaponsLeft: number[];
  shieldIdx: number;
  catalystIdx: number;
}
```
with:
```ts
  seedStaffIndices: Set<number>,
  seedSealIndices: Set<number>,
): {
  weaponsRight: number[];
  weaponsLeft: number[];
  shieldIndices: number[];
  staffIndices: number[];
  sealIndices: number[];
}
```

Replace the local variable initializations:
```ts
  let shieldIdx = -1;
  let catalystIdx = -1;
```
with:
```ts
  const shieldIndices: number[] = [];
  const staffIndices: number[] = [];
  const sealIndices: number[] = [];
```

- [ ] **Step 3: Update "Pure Caster" case**

Replace the "Pure Caster" case (lines 126-136):
```ts
    case "Pure Caster": {
      const hasSeedStaff = seedItems.some((s) => s.type === "staff");
      const hasSeedSeal = seedItems.some((s) => s.type === "seal");
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (hasSeedStaff) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (hasSeedSeal) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
      break;
    }
```

- [ ] **Step 4: Update "Spellblade" case**

Replace the catalyst-picking portion of "Spellblade" (lines 151-158). After the weapon picking, replace:
```ts
      const hasSeedCatalyst = seedItems.some((s) => s.type === "catalyst");
      if (hasSeedCatalyst) {
        catalystIdx = seedItems.find((s) => s.type === "catalyst")!.index;
      } else {
        const scoredCatalysts = scoreCatalysts(catalysts, profile, seedItems);
        const pick = pickFromPool(scoredCatalysts, creativity, rng, 1, seedCatalystIndices);
        if (pick.length > 0) catalystIdx = pick[0].index;
      }
```
with:
```ts
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (seedItems.some((s) => s.type === "seal")) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
```

- [ ] **Step 5: Update "Sword & Board" case**

Replace the shield-picking portion (lines 188-195):
```ts
      const hasSeedShield = seedItems.some((s) => s.type === "shield");
      if (hasSeedShield) {
        shieldIdx = seedItems.find((s) => s.type === "shield")!.index;
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIdx = pick[0].index;
      }
```
with:
```ts
      const hasSeedShield = seedItems.some((s) => s.type === "shield");
      if (hasSeedShield) {
        shieldIndices.push(seedItems.find((s) => s.type === "shield")!.index);
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIndices.push(pick[0].index);
      }
```

- [ ] **Step 6: Update "Shield Caster" case**

Replace the entire "Shield Caster" case (lines 199-229) with:

```ts
    case "Shield Caster": {
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      // Shield
      const hasSeedShieldSC = seedItems.some((s) => s.type === "shield");
      if (hasSeedShieldSC) {
        shieldIndices.push(seedItems.find((s) => s.type === "shield")!.index);
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIndices.push(pick[0].index);
      }
      // Staff/Seal (for casting)
      const hasIntSC = (profile.intelligence ?? 0) >= 0.1;
      const hasFthSC = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasIntSC) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (seedItems.some((s) => s.type === "seal")) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFthSC) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
      break;
    }
```

- [ ] **Step 7: Update the return statement and remaining cases**

Update the return statement at the end of `fillWeaponsByProfile`:
```ts
  return { weaponsRight, weaponsLeft, shieldIndices, staffIndices, sealIndices };
```

- [ ] **Step 8: Update generateBuild function**

Replace:
```ts
  const seedCatalystIndices = new Set(
    seedItems.filter((s) => s.type === "catalyst").map((s) => s.index),
  );
```
with:
```ts
  const seedStaffIndices = new Set(
    seedItems.filter((s) => s.type === "staff").map((s) => s.index),
  );
  const seedSealIndices = new Set(
    seedItems.filter((s) => s.type === "seal").map((s) => s.index),
  );
```

Replace the `fillWeaponsByProfile` call:
```ts
  const { weaponsRight, weaponsLeft, shieldIdx, catalystIdx } = fillWeaponsByProfile(
    loadoutProfile,
    seedItems,
    scoredWeapons,
    profile,
    creativity,
    rng,
    seedWeaponIndices,
    seedShieldIndices,
    seedCatalystIndices,
  );
```
with:
```ts
  const { weaponsRight, weaponsLeft, shieldIndices, staffIndices, sealIndices } =
    fillWeaponsByProfile(
      loadoutProfile,
      seedItems,
      scoredWeapons,
      profile,
      creativity,
      rng,
      seedWeaponIndices,
      seedShieldIndices,
      seedStaffIndices,
      seedSealIndices,
    );
```

Replace the build object fields:
```ts
    shield: shieldIdx >= 0 ? shieldIdx : 0,
    catalyst: catalystIdx >= 0 ? catalystIdx : 0,
```
with:
```ts
    shields: shieldIndices.length > 0 ? shieldIndices : undefined,
    staves: staffIndices.length > 0 ? staffIndices : undefined,
    seals: sealIndices.length > 0 ? sealIndices : undefined,
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/build-generator.ts
git commit -m "build-generator: replace catalyst with staff/seal arrays"
```

---

### Task 11: Update fate build generator

**Files:**
- Modify: `src/lib/fate/fate-build-generator.ts`

- [ ] **Step 1: Update imports**

Replace:
```ts
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
  spellTags,
} from "../../data";
```
with:
```ts
import {
  weapons,
  shields,
  staves,
  seals,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
  spellTags,
} from "../../data";
```

- [ ] **Step 2: Update the local variables and catalyst pool logic**

Replace:
```ts
  let catalystIdx = -1;
```
with:
```ts
  const staffIndices: number[] = [];
  const sealIndices: number[] = [];
```

Replace the catalyst pool block (lines 119-131):
```ts
  if (identityAllowsMagic(card.identity) && card.school) {
    const isSorc = card.school ? isSorcerySchool(card.school) : false;
    const catalystPool = catalysts
      .map((c, i) => ({ c, i }))
      .filter(({ c }) =>
        isSorc ? c.category === "Glintstone Staff" : c.category === "Sacred Seal",
      )
      .map(({ i }) => i);
    if (catalystPool.length > 0) {
      const shuffled = rng.shuffle(catalystPool);
      catalystIdx = shuffled[0];
    }
  }
```
with:
```ts
  if (identityAllowsMagic(card.identity) && card.school) {
    const isSorc = card.school ? isSorcerySchool(card.school) : false;
    if (isSorc) {
      const pool = staves.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        staffIndices.push(shuffled[0]);
      }
    } else {
      const pool = seals.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        sealIndices.push(shuffled[0]);
      }
    }
  }
```

- [ ] **Step 3: Update the shieldIdx variable and return object**

Replace:
```ts
  let shieldIdx = -1;
```
with:
```ts
  const shieldIndices: number[] = [];
```

In the `"sword-board"` stance case, replace:
```ts
        const shieldPick = pickRandom(shields, rng, 1);
        if (shieldPick.length > 0) shieldIdx = shieldPick[0];
```
with:
```ts
        const shieldPick = pickRandom(shields, rng, 1);
        if (shieldPick.length > 0) shieldIndices.push(shieldPick[0]);
```

Replace the return object fields:
```ts
    shield: shieldIdx >= 0 ? shieldIdx : 0,
    catalyst: catalystIdx >= 0 ? catalystIdx : 0,
```
with:
```ts
    shields: shieldIndices.length > 0 ? shieldIndices : undefined,
    staves: staffIndices.length > 0 ? staffIndices : undefined,
    seals: sealIndices.length > 0 ? sealIndices : undefined,
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/fate/fate-build-generator.ts
git commit -m "fate-generator: replace catalyst with staff/seal arrays"
```

---

### Task 12: Update item-icons.tsx (add "staff" category)

**Files:**
- Modify: `src/components/icons/item-icons.tsx`

- [ ] **Step 1: Add "staff" to ItemCategory and maps**

Update the `ItemCategory` type:
```ts
export type ItemCategory = "weapon" | "armor" | "shield" | "seal" | "staff" | "talisman" | "ash" | "spell";
```

Add a `StaffIcon` component (can reuse the seal icon pattern with a different design):
```tsx
export function StaffIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 2v16" />
      <circle cx={12} cy={4} r={2} />
      <path d="M8 20h8" />
      <path d="M9 18l3-2 3 2" />
    </svg>
  );
}
```

Add `staff` to `ICON_MAP`:
```ts
  staff: StaffIcon,
```

Add `staff` to `CAT_CLASS_MAP`:
```ts
  staff: "cat-seal",
```

(Staves share the same visual gradient class as seals — both are casting tools.)

- [ ] **Step 2: Commit**

```bash
git add src/components/icons/item-icons.tsx
git commit -m "icons: add staff category to ItemCategory and icon maps"
```

---

### Task 13: Update use-item-details.ts

**Files:**
- Modify: `src/hooks/use-item-details.ts`

- [ ] **Step 1: Add "staff" case to getDetailPromise**

The existing `"seal"` case loads `catalyst-details.json`. Replace it and add a `"staff"` case:

Replace:
```ts
      case "seal":
        cache[key] = import("../data/catalyst-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
```
with:
```ts
      case "seal":
        cache[key] = import("../data/seal-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "staff":
        cache[key] = import("../data/staff-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
```

Update `prefetchItemDetails` to also prefetch `"staff"`:
```ts
export function prefetchItemDetails(): void {
  getDetailPromise("weapon");
  getDetailPromise("shield");
  getDetailPromise("seal");
  getDetailPromise("staff");
  getDetailPromise("armor");
  getDetailPromise("talisman");
  getDetailPromise("spell");
  getDetailPromise("ash");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-item-details.ts
git commit -m "use-item-details: load separate staff/seal detail files"
```

---

### Task 14: Update item-detail-modal.tsx

**Files:**
- Modify: `src/components/equipment/item-detail-modal.tsx`

- [ ] **Step 1: Update CATEGORY_LABELS**

Replace:
```ts
const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "Weapon",
  armor: "Armor",
  shield: "Shield",
  seal: "Catalyst",
  talisman: "Talisman",
  ash: "Ash of War",
  spell: "Spell",
};
```
with:
```ts
const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "Weapon",
  armor: "Armor",
  shield: "Shield",
  seal: "Seal",
  staff: "Staff",
  talisman: "Talisman",
  ash: "Ash of War",
  spell: "Spell",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/equipment/item-detail-modal.tsx
git commit -m "item-detail-modal: add staff category label, rename seal"
```

---

### Task 15: Update item-search.tsx

**Files:**
- Modify: `src/components/generator/item-search.tsx`

- [ ] **Step 1: Replace catalysts import and search pool**

Replace the import:
```ts
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../../data";
```
with:
```ts
import {
  weapons,
  shields,
  staves,
  seals,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../../data";
```

Replace the catalysts entry in `ALL_ITEMS` (lines 33-38):
```ts
  ...catalysts.map((c, i) => ({
    name: c.name,
    type: "catalyst" as const,
    index: i,
    category: c.category,
  })),
```
with:
```ts
  ...staves.map((s, i) => ({
    name: s.name,
    type: "staff" as const,
    index: i,
    category: s.category,
  })),
  ...seals.map((s, i) => ({
    name: s.name,
    type: "seal" as const,
    index: i,
    category: s.category,
  })),
```

- [ ] **Step 2: Update TYPE_LABELS and TYPE_CATEGORY_CLASS**

Replace:
```ts
const TYPE_LABELS: Record<ItemType, string> = {
  weapon: "Weapon",
  shield: "Shield",
  catalyst: "Catalyst",
  spell: "Spell",
  ashOfWar: "Ash of War",
  talisman: "Talisman",
};

const TYPE_CATEGORY_CLASS: Record<ItemType, string> = {
  weapon: "cat-weapon",
  shield: "cat-shield",
  catalyst: "cat-seal",
  spell: "cat-spell",
  ashOfWar: "cat-ash",
  talisman: "cat-talisman",
};
```
with:
```ts
const TYPE_LABELS: Record<ItemType, string> = {
  weapon: "Weapon",
  shield: "Shield",
  staff: "Staff",
  seal: "Seal",
  spell: "Spell",
  ashOfWar: "Ash of War",
  talisman: "Talisman",
};

const TYPE_CATEGORY_CLASS: Record<ItemType, string> = {
  weapon: "cat-weapon",
  shield: "cat-shield",
  staff: "cat-seal",
  seal: "cat-seal",
  spell: "cat-spell",
  ashOfWar: "cat-ash",
  talisman: "cat-talisman",
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/generator/item-search.tsx
git commit -m "item-search: replace catalyst with staff/seal entries"
```

---

### Task 16: Update build-viewer.tsx

**Files:**
- Modify: `src/pages/build-viewer.tsx`

- [ ] **Step 1: Update imports**

Replace:
```ts
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
```
with:
```ts
import {
  weapons,
  shields,
  staves,
  seals,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
```

- [ ] **Step 2: Update data lookups**

Remove:
```ts
  const shieldName = shields[build.shield]?.name ?? "Unknown";
  const catalystName = catalysts[build.catalyst]?.name ?? "Unknown";
```

(These will be derived inline in the JSX.)

- [ ] **Step 3: Replace the "Shield & Catalyst" section**

Replace the entire `<div className="md:grid md:grid-cols-2 ...">` block containing the "Shield & Catalyst" section (lines 145-182) with three conditional sections:

```tsx
        {(build.shields?.length ?? 0) > 0 && (
          <EquipmentSection title="Shields">
            <div className="grid gap-2">
              {build.shields!.map((idx, i) => {
                const name = shields[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`shield-${i}`}
                    itemName={name}
                    slotLabel="Shield"
                    slotId={`shield-${i}`}
                    category="shield"
                    variant="standard"
                    onClick={() => selectItem(name, "shield")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}

        {(build.staves?.length ?? 0) > 0 && (
          <EquipmentSection title="Staves">
            <div className="grid gap-2">
              {build.staves!.map((idx, i) => {
                const name = staves[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`staff-${i}`}
                    itemName={name}
                    slotLabel="Staff"
                    slotId={`staff-${i}`}
                    category="staff"
                    variant="standard"
                    onClick={() => selectItem(name, "staff")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}

        {(build.seals?.length ?? 0) > 0 && (
          <EquipmentSection title="Seals">
            <div className="grid gap-2">
              {build.seals!.map((idx, i) => {
                const name = seals[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`seal-${i}`}
                    itemName={name}
                    slotLabel="Seal"
                    slotId={`seal-${i}`}
                    category="seal"
                    variant="standard"
                    onClick={() => selectItem(name, "seal")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/build-viewer.tsx
git commit -m "build-viewer: render shields/staves/seals as conditional sections"
```

---

### Task 17: Update generate-build.tsx

**Files:**
- Modify: `src/pages/generate-build.tsx`

- [ ] **Step 1: Update imports**

Replace:
```ts
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
```
with:
```ts
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
```

- [ ] **Step 2: Replace Shield & Catalyst conditional sections in GeneratedBuildView**

Replace the block (lines 106-131):
```tsx
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
        {build.shield >= 0 && (
          <EquipmentSection title="Shield">
            <ItemSlot
              itemName={shields[build.shield]?.name ?? "None"}
              slotLabel="Shield"
              slotId="gen-shield"
              category="shield"
              variant="standard"
              onClick={() => onSelectItem(shields[build.shield]?.name ?? "None", "shield")}
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
              onClick={() => onSelectItem(catalysts[build.catalyst]?.name ?? "None", "seal")}
            />
          </EquipmentSection>
        )}
      </div>
```
with:
```tsx
      {(build.shields?.length ?? 0) > 0 && (
        <EquipmentSection title="Shields">
          <div className="grid gap-2">
            {build.shields!.map((idx, i) => {
              const name = shields[idx]?.name ?? "Unknown";
              return (
                <ItemSlot
                  key={`gen-shield-${i}`}
                  itemName={name}
                  slotLabel="Shield"
                  slotId={`gen-shield-${i}`}
                  category="shield"
                  variant="standard"
                  onClick={() => onSelectItem(name, "shield")}
                />
              );
            })}
          </div>
        </EquipmentSection>
      )}

      {(build.staves?.length ?? 0) > 0 && (
        <EquipmentSection title="Staves">
          <div className="grid gap-2">
            {build.staves!.map((idx, i) => {
              const name = staves[idx]?.name ?? "Unknown";
              return (
                <ItemSlot
                  key={`gen-staff-${i}`}
                  itemName={name}
                  slotLabel="Staff"
                  slotId={`gen-staff-${i}`}
                  category="staff"
                  variant="standard"
                  onClick={() => onSelectItem(name, "staff")}
                />
              );
            })}
          </div>
        </EquipmentSection>
      )}

      {(build.seals?.length ?? 0) > 0 && (
        <EquipmentSection title="Seals">
          <div className="grid gap-2">
            {build.seals!.map((idx, i) => {
              const name = seals[idx]?.name ?? "Unknown";
              return (
                <ItemSlot
                  key={`gen-seal-${i}`}
                  itemName={name}
                  slotLabel="Seal"
                  slotId={`gen-seal-${i}`}
                  category="seal"
                  variant="standard"
                  onClick={() => onSelectItem(name, "seal")}
                />
              );
            })}
          </div>
        </EquipmentSection>
      )}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/generate-build.tsx
git commit -m "generate-build: render shields/staves/seals as conditional sections"
```

---

### Task 18: Verify build and manual test

- [ ] **Step 1: Run type check**

Run: `pnpm build`
Expected: No TypeScript errors, successful build.

- [ ] **Step 2: Run linter**

Run: `pnpm lint`
Expected: No linting errors (or only pre-existing ones).

- [ ] **Step 3: Start dev server and verify**

Run: `pnpm dev`

Test in browser:
1. Load the main `/random` page — verify builds sometimes show Shields, Staves, and/or Seals sections, and sometimes omit them
2. Click Randomize several times — confirm the three optional categories appear and disappear correctly
3. Click on a staff item — confirm the detail modal opens with "Staff" label and correct details
4. Click on a seal item — confirm the detail modal opens with "Seal" label
5. Click Share, paste the URL — confirm the build round-trips correctly through the codec
6. Navigate to `/generate` — verify the Guiding Hand flow works, and generated builds render shields/staves/seals conditionally
7. Navigate to `/fate` — verify fate-generated builds render correctly

- [ ] **Step 4: Run format check**

Run: `pnpm format`
Then: `pnpm format:check`
Expected: All files formatted correctly.

- [ ] **Step 5: Final commit if formatting changed anything**

```bash
git add -A
git commit -m "style: apply oxfmt formatting"
```
