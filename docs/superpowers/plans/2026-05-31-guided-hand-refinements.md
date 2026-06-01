# Guided Hand Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Guided Hand build generator with intelligent weapon slot filling (loadout profiles), visible stat scaling info, and creative procedural build names.

**Architecture:** A new loadout profile selector determines weapon configuration before slot filling. The generator output gains a `loadoutProfile` field that drives both the UI display and informs the namer. The build namer is rewritten with vocabulary pools and template patterns. A new stat profile display component renders scaling bars.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4

---

## File Structure

### Engine
- `src/lib/loadout-profiles.ts` — **create** profile selection logic and types
- `src/lib/build-generator.ts` — **modify** to use loadout profiles instead of fixed 3+3
- `src/lib/build-namer.ts` — **rewrite** with template pools and vocabulary system

### Types
- `src/types/generator.ts` — **modify** to add `LoadoutProfile` type and `loadoutProfile` field to `GeneratedBuild`

### UI
- `src/components/generator/stat-profile-display.tsx` — **create** stat bars component
- `src/pages/generate.tsx` — **modify** to render stat profile display

---

### Task 1: Loadout Profile Types and Selection Logic

**Files:**
- Create: `src/lib/loadout-profiles.ts`
- Modify: `src/types/generator.ts`

- [ ] **Step 1: Add LoadoutProfile type to generator.ts**

Add to `src/types/generator.ts` before the `GeneratedBuild` interface:

```typescript
export type LoadoutProfile =
  | "Pure Caster"
  | "Spellblade"
  | "Sword & Board"
  | "Two-hander"
  | "Powerstance"
  | "Ranged"
  | "Dual Wield";
```

Add `loadoutProfile` to the `GeneratedBuild` interface:

```typescript
export interface GeneratedBuild {
  build: Build;
  armorClass: ArmorClass;
  statProfile: StatProfile;
  buildName: string;
  loadoutProfile: LoadoutProfile;
}
```

- [ ] **Step 2: Create the loadout profile selector**

Create `src/lib/loadout-profiles.ts`:

```typescript
import type { LoadoutProfile, SeedItem, StatProfile } from "../types/generator";
import { weapons } from "../data";

const TWO_HANDER_CATEGORIES = new Set([
  "Colossal Sword",
  "Colossal Weapon",
  "Great Hammer",
  "Greataxe",
]);

const POWERSTANCE_CATEGORIES = new Set([
  "Dagger",
  "Curved Sword",
  "Katana",
  "Fist",
  "Twinblade",
  "Thrusting Sword",
]);

const RANGED_CATEGORIES = new Set(["Bow", "Light Bow", "Crossbow", "Greatbow", "Ballista"]);

export function selectLoadoutProfile(
  seedItems: SeedItem[],
  profile: StatProfile,
): LoadoutProfile {
  const seedWeapons = seedItems.filter((s) => s.type === "weapon");
  const seedCategories = seedWeapons.map((s) => weapons[s.index].category);

  // 1. Two weapons of same category → Powerstance
  if (seedWeapons.length >= 2) {
    const catCounts = new Map<string, number>();
    for (const cat of seedCategories) {
      catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
    }
    for (const count of catCounts.values()) {
      if (count >= 2) return "Powerstance";
    }
  }

  // 2. Ranged weapon category
  if (seedCategories.some((cat) => RANGED_CATEGORIES.has(cat))) {
    return "Ranged";
  }

  // 3. Colossal/heavy weapon → Two-hander
  if (seedWeapons.length > 0) {
    const primaryWeapon = weapons[seedWeapons[0].index];
    if (TWO_HANDER_CATEGORIES.has(primaryWeapon.category) || primaryWeapon.weight > 12) {
      return "Two-hander";
    }
  }

  // 4. Pure caster (high INT/FTH, no weapon/shield seeds)
  const hasWeaponOrShieldSeed = seedItems.some(
    (s) => s.type === "weapon" || s.type === "shield",
  );
  const intOrFth = Math.max(profile.intelligence ?? 0, profile.faith ?? 0);
  if (intOrFth > 0.6 && !hasWeaponOrShieldSeed) {
    return "Pure Caster";
  }

  // 5. Powerstance-friendly categories (single weapon seed, no shield/catalyst)
  if (seedWeapons.length === 1) {
    const cat = seedCategories[0];
    const hasShieldOrCatalyst = seedItems.some(
      (s) => s.type === "shield" || s.type === "catalyst",
    );
    if (POWERSTANCE_CATEGORIES.has(cat) && !hasShieldOrCatalyst) {
      return "Powerstance";
    }
  }

  // 6. Spellblade (has caster stats)
  if (intOrFth > 0.15) {
    return "Spellblade";
  }

  // 7. Sword & Board (no caster stats)
  const casterTotal = (profile.intelligence ?? 0) + (profile.faith ?? 0);
  if (casterTotal < 0.15) {
    return "Sword & Board";
  }

  // 8. Fallback
  return "Dual Wield";
}
```

- [ ] **Step 3: Verify type check**

Run: `pnpm build`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/loadout-profiles.ts src/types/generator.ts
git commit -m "feat: add loadout profile types and selection logic"
```

---

### Task 2: Rewrite Build Generator to Use Loadout Profiles

**Files:**
- Modify: `src/lib/build-generator.ts`

- [ ] **Step 1: Replace the weapon filling logic in generateBuild**

Rewrite `src/lib/build-generator.ts`. The `pickFromPool`, `getBuildDamageTypes`, `getWeaponCategories`, and `determineArmorClass` functions stay unchanged. Replace the `generateBuild` function body:

```typescript
import type { Build } from "../types/build";
import type {
  GeneratorInput,
  GeneratedBuild,
  ArmorClass,
  SeedItem,
  LoadoutProfile,
} from "../types/generator";
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { createRng, type SeededRng } from "./seeded-rng";
import { extractStatProfile } from "./stat-profile";
import {
  scoreWeapons,
  scoreShields,
  scoreCatalysts,
  scoreTalismans,
  scoreAshes,
  scoreSpells,
  type ScoredCandidate,
} from "./candidate-scorer";
import { generateBuildName } from "./build-namer";
import { selectLoadoutProfile } from "./loadout-profiles";

function pickFromPool<T>(
  scored: ScoredCandidate<T>[],
  creativity: number,
  rng: SeededRng,
  count: number,
  exclude: Set<number>,
): { item: T; index: number }[] {
  const eligible = scored.filter((c) => !exclude.has(c.index));
  if (eligible.length === 0) return [];

  const eligiblePercent = (10 + creativity * 0.9) / 100;
  const poolSize = Math.max(1, Math.ceil(eligible.length * eligiblePercent));
  const pool = eligible.slice(0, poolSize);

  const picks: { item: T; index: number }[] = [];
  const pickedIndices = new Set<number>();

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const available = pool.filter((c) => !pickedIndices.has(c.index));
    if (available.length === 0) break;

    const weights = available.map((c) => Math.max(c.score, 0.01));
    const picked = rng.weightedPick(available, weights);
    picks.push({ item: picked.item, index: picked.index });
    pickedIndices.add(picked.index);
  }

  return picks;
}

function getBuildDamageTypes(seedItems: SeedItem[]): string[] {
  const types = new Set<string>();
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      const weapon = weapons[seed.index];
      if (weapon?.damageTypes) {
        for (const t of weapon.damageTypes) types.add(t);
      }
    }
  }
  return [...types];
}

function getWeaponCategories(seedItems: SeedItem[], selectedWeaponIndices: number[]): string[] {
  const categories = new Set<string>();
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      categories.add(weapons[seed.index].category);
    }
  }
  for (const idx of selectedWeaponIndices) {
    categories.add(weapons[idx].category);
  }
  return [...categories];
}

function determineArmorClass(
  profile: Record<string, number>,
  avgWeaponWeight: number,
): ArmorClass {
  const casterStats = (profile.intelligence ?? 0) + (profile.faith ?? 0) + (profile.arcane ?? 0);
  if (casterStats > 0.6 && avgWeaponWeight < 8) return "light";
  if ((profile.strength ?? 0) > 0.25 || avgWeaponWeight > 12) return "heavy";
  return "medium";
}

function fillWeaponsByProfile(
  loadoutProfile: LoadoutProfile,
  seedItems: SeedItem[],
  profile: Record<string, number>,
  creativity: number,
  rng: SeededRng,
  damageTypes: string[],
): { weaponsRight: number[]; weaponsLeft: number[]; catalystIdx: number; shieldIdx: number } {
  const seedWeapons = seedItems.filter((s) => s.type === "weapon");
  const scoredWeapons = scoreWeapons(weapons, profile, seedItems, damageTypes);
  const excludeWeapons = new Set(seedWeapons.map((s) => s.index));
  const seedCatalystIndices = new Set(
    seedItems.filter((s) => s.type === "catalyst").map((s) => s.index),
  );
  const seedShieldIndices = new Set(
    seedItems.filter((s) => s.type === "shield").map((s) => s.index),
  );

  let weaponsRight: number[] = [];
  let weaponsLeft: number[] = [];
  let catalystIdx = -1;
  let shieldIdx = -1;

  switch (loadoutProfile) {
    case "Pure Caster": {
      const scoredCats = scoreCatalysts(catalysts, profile, seedItems);
      const picks = pickFromPool(scoredCats, creativity, rng, 2, seedCatalystIndices);
      if (picks.length > 0) catalystIdx = picks[0].index;
      if (picks.length > 1) {
        // Second catalyst as "right hand" main casting tool — store in weaponsRight as a signal
        // but we'll use catalystIdx for display
      }
      // Catalysts go to catalyst slot; weaponsRight/Left stay empty for pure casters
      break;
    }

    case "Spellblade": {
      // Right hand: seed weapon or pick one
      if (seedWeapons.length > 0) {
        weaponsRight = [seedWeapons[0].index];
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) weaponsRight = [pick[0].index];
      }
      // Left hand: catalyst
      const hasSeedCatalyst = seedItems.some((s) => s.type === "catalyst");
      if (hasSeedCatalyst) {
        catalystIdx = seedItems.find((s) => s.type === "catalyst")!.index;
      } else {
        const scoredCats = scoreCatalysts(catalysts, profile, seedItems);
        const pick = pickFromPool(scoredCats, creativity, rng, 1, seedCatalystIndices);
        if (pick.length > 0) catalystIdx = pick[0].index;
      }
      break;
    }

    case "Sword & Board": {
      // Right hand: 1-2 weapons
      if (seedWeapons.length > 0) {
        weaponsRight = seedWeapons.slice(0, 2).map((s) => s.index);
      } else {
        const picks = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        weaponsRight = picks.map((p) => p.index);
      }
      // Left hand: shield
      const hasSeedShield = seedItems.some((s) => s.type === "shield");
      if (hasSeedShield) {
        shieldIdx = seedItems.find((s) => s.type === "shield")!.index;
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIdx = pick[0].index;
      }
      break;
    }

    case "Two-hander": {
      // Right hand: single weapon
      if (seedWeapons.length > 0) {
        weaponsRight = [seedWeapons[0].index];
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) weaponsRight = [pick[0].index];
      }
      // Left hand: empty
      break;
    }

    case "Powerstance": {
      // Right hand: seed weapon
      const primaryIdx = seedWeapons.length > 0 ? seedWeapons[0].index : null;
      if (primaryIdx != null) {
        weaponsRight = [primaryIdx];
        excludeWeapons.add(primaryIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight = [pick[0].index];
          excludeWeapons.add(pick[0].index);
        }
      }
      // Left hand: same category weapon
      if (seedWeapons.length >= 2) {
        weaponsLeft = [seedWeapons[1].index];
      } else {
        const category = weaponsRight.length > 0 ? weapons[weaponsRight[0]].category : "";
        const sameCatCandidates = scoredWeapons.filter(
          (c) => c.item.category === category,
        );
        const pick = pickFromPool(
          sameCatCandidates,
          creativity,
          rng,
          1,
          excludeWeapons,
        );
        if (pick.length > 0) weaponsLeft = [pick[0].index];
      }
      break;
    }

    case "Ranged": {
      // Right hand: the bow/crossbow
      if (seedWeapons.length > 0) {
        weaponsRight = [seedWeapons[0].index];
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) weaponsRight = [pick[0].index];
      }
      // Left hand: a melee backup
      const meleeOnly = scoredWeapons.filter(
        (c) =>
          !["Bow", "Light Bow", "Crossbow", "Greatbow", "Ballista"].includes(c.item.category),
      );
      const pick = pickFromPool(meleeOnly, creativity, rng, 1, excludeWeapons);
      if (pick.length > 0) weaponsLeft = [pick[0].index];
      break;
    }

    case "Dual Wield": {
      // Right hand: seed or pick
      if (seedWeapons.length > 0) {
        weaponsRight = [seedWeapons[0].index];
        excludeWeapons.add(seedWeapons[0].index);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight = [pick[0].index];
          excludeWeapons.add(pick[0].index);
        }
      }
      // Left hand: different weapon
      if (seedWeapons.length >= 2) {
        weaponsLeft = [seedWeapons[1].index];
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) weaponsLeft = [pick[0].index];
      }
      break;
    }
  }

  return { weaponsRight, weaponsLeft, catalystIdx, shieldIdx };
}

export function generateBuild(input: GeneratorInput): GeneratedBuild {
  const { seedItems, creativity, seed } = input;
  const rng = createRng(seed);
  const profile = extractStatProfile(seedItems);
  const damageTypes = getBuildDamageTypes(seedItems);
  const loadoutProfile = selectLoadoutProfile(seedItems, profile);

  const { weaponsRight, weaponsLeft, catalystIdx, shieldIdx } = fillWeaponsByProfile(
    loadoutProfile,
    seedItems,
    profile,
    creativity,
    rng,
    damageTypes,
  );

  const seedTalismanIndices = new Set(
    seedItems.filter((s) => s.type === "talisman").map((s) => s.index),
  );
  const seedAshIndices = new Set(
    seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index),
  );

  // Talismans (4)
  const scoredTalismans = scoreTalismans(talismans, seedItems);
  const talismanSeeds = seedItems.filter((s) => s.type === "talisman").map((s) => s.index);
  const neededTalismans = 4 - talismanSeeds.length;
  const additionalTalismans = pickFromPool(
    scoredTalismans,
    creativity,
    rng,
    neededTalismans,
    seedTalismanIndices,
  );
  const talismanIndices = [...talismanSeeds, ...additionalTalismans.map((t) => t.index)];

  // Ashes of War (up to 2 — matching weapon count)
  const allWeaponCategories = getWeaponCategories(seedItems, [...weaponsRight, ...weaponsLeft]);
  const scoredAshes = scoreAshes(ashesOfWar, profile, seedItems, allWeaponCategories);
  const ashSeeds = seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index);
  const ashCount = Math.max(1, weaponsRight.length + weaponsLeft.length);
  const neededAshes = Math.min(ashCount, 3) - ashSeeds.length;
  const additionalAshes = pickFromPool(
    scoredAshes,
    creativity,
    rng,
    Math.max(0, neededAshes),
    seedAshIndices,
  );
  const ashIndices = [...ashSeeds, ...additionalAshes.map((a) => a.index)];

  // Spells
  const hasInt = (profile.intelligence ?? 0) >= 0.1;
  const hasFth = (profile.faith ?? 0) >= 0.1;

  let sorceryIndices: number[] = [];
  let incantationIndices: number[] = [];

  if (hasInt) {
    const scoredSorceries = scoreSpells(sorceries, profile, seedItems);
    const spellSeeds = seedItems
      .filter((s) => s.type === "spell")
      .map((s) => s.index)
      .filter((idx) => idx < sorceries.length);
    const needed = 4 - spellSeeds.length;
    const picks = pickFromPool(scoredSorceries, creativity, rng, needed, new Set(spellSeeds));
    sorceryIndices = [...spellSeeds, ...picks.map((p) => p.index)];
  }

  if (hasFth) {
    const scoredIncantations = scoreSpells(incantations, profile, seedItems);
    const spellSeeds = seedItems
      .filter((s) => s.type === "spell")
      .map((s) => s.index)
      .filter((idx) => idx >= sorceries.length)
      .map((idx) => idx - sorceries.length);
    const needed = 4 - spellSeeds.length;
    const picks = pickFromPool(scoredIncantations, creativity, rng, needed, new Set(spellSeeds));
    incantationIndices = [...spellSeeds, ...picks.map((p) => p.index)];
  }

  // Armor class
  const allWeapons = [...weaponsRight, ...weaponsLeft];
  const avgWeight =
    allWeapons.length > 0
      ? allWeapons.reduce((sum, idx) => sum + (weapons[idx]?.weight ?? 0), 0) / allWeapons.length
      : 0;
  const armorClass = determineArmorClass(profile, avgWeight);

  const buildName = generateBuildName(seedItems, profile, damageTypes, rng);

  const build: Build = {
    buildName,
    weaponsRight,
    weaponsLeft,
    helm: -1,
    chest: -1,
    gauntlets: -1,
    legs: -1,
    shield: shieldIdx >= 0 ? shieldIdx : 0,
    catalyst: catalystIdx >= 0 ? catalystIdx : 0,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };

  return {
    build,
    armorClass,
    statProfile: profile,
    buildName: buildName ?? "Tarnished",
    loadoutProfile,
  };
}
```

Note: The `generateBuildName` signature changes (gains `damageTypes` and `rng` params) — this is implemented in Task 3.

- [ ] **Step 2: Verify integration**

```bash
npx tsx -e "
import { generateBuild } from './src/lib/build-generator.ts';
import { weapons } from './src/data/index.ts';
const moonveilIdx = weapons.findIndex(w => w.name === 'Moonveil');
const result = generateBuild({
  seedItems: [{ name: 'Moonveil', type: 'weapon', index: moonveilIdx }],
  creativity: 50,
  seed: 42
});
console.log('Profile:', result.loadoutProfile);
console.log('Right:', result.build.weaponsRight.map(i => weapons[i]?.name));
console.log('Left:', result.build.weaponsLeft.map(i => weapons[i]?.name));
// Moonveil is Katana → should be Powerstance
"
```

Expected: `loadoutProfile: "Powerstance"`, 1 weapon right (Moonveil), 1 katana left.

- [ ] **Step 3: Test other profiles**

```bash
npx tsx -e "
import { generateBuild } from './src/lib/build-generator.ts';
import { weapons } from './src/data/index.ts';

// Two-hander test (Colossal Sword)
const ruinIdx = weapons.findIndex(w => w.name === 'Ruins Greatsword');
const r1 = generateBuild({ seedItems: [{ name: 'Ruins Greatsword', type: 'weapon', index: ruinIdx }], creativity: 50, seed: 42 });
console.log('Ruins GS:', r1.loadoutProfile, '| Right:', r1.build.weaponsRight.length, '| Left:', r1.build.weaponsLeft.length);

// Ranged test
const bowIdx = weapons.findIndex(w => w.name === 'Albinauric Bow');
const r2 = generateBuild({ seedItems: [{ name: 'Albinauric Bow', type: 'weapon', index: bowIdx }], creativity: 50, seed: 42 });
console.log('Bow:', r2.loadoutProfile, '| Right:', r2.build.weaponsRight.length, '| Left:', r2.build.weaponsLeft.length);
"
```

Expected: Ruins Greatsword → "Two-hander" with 1 right, 0 left. Bow → "Ranged" with 1 right, 1 left.

- [ ] **Step 4: Commit**

```bash
git add src/lib/build-generator.ts
git commit -m "feat: rewrite build generator to use loadout profiles for weapon slots"
```

---

### Task 3: Creative Build Namer

**Files:**
- Rewrite: `src/lib/build-namer.ts`

- [ ] **Step 1: Rewrite build-namer.ts with vocabulary pools and templates**

Replace `src/lib/build-namer.ts` entirely:

```typescript
import type { SeedItem, StatProfile } from "../types/generator";
import type { SeededRng } from "./seeded-rng";
import { weapons } from "../data";

const DAMAGE_ADJECTIVES: Record<string, string[]> = {
  physical: ["Savage", "Iron", "Steel", "Stone", "Brutal", "Heavy"],
  magic: ["Arcane", "Glint", "Moon", "Crystal", "Astral", "Mystic"],
  fire: ["Blazing", "Flame", "Inferno", "Ember", "Scorching", "Molten"],
  lightning: ["Storm", "Thunder", "Voltaic", "Crackling", "Tempest"],
  holy: ["Sacred", "Golden", "Divine", "Radiant", "Hallowed", "Celestial"],
  bleed: ["Crimson", "Blood", "Sanguine", "Scarlet", "Vermillion"],
  frost: ["Frozen", "Rime", "Glacial", "Frostbitten", "Winter"],
  poison: ["Venomous", "Toxic", "Blight", "Serpent", "Noxious"],
};

const CATEGORY_ROLES: Record<string, string[]> = {
  Dagger: ["Shadow", "Whisper", "Sting", "Needle"],
  "Thrusting Sword": ["Shadow", "Whisper", "Sting", "Needle"],
  "Heavy Thrusting Sword": ["Shadow", "Piercer", "Sting", "Impaler"],
  "Straight Sword": ["Blade", "Knight", "Crusader", "Sentinel"],
  Greatsword: ["Blade", "Knight", "Crusader", "Sentinel"],
  "Light Greatsword": ["Blade", "Knight", "Crusader", "Sentinel"],
  "Colossal Sword": ["Colossus", "Titan", "Juggernaut", "Destroyer"],
  "Colossal Weapon": ["Colossus", "Titan", "Juggernaut", "Destroyer"],
  "Curved Sword": ["Dancer", "Ronin", "Slasher", "Duelist"],
  Katana: ["Dancer", "Ronin", "Slasher", "Duelist"],
  "Great Katana": ["Dancer", "Ronin", "Slasher", "Duelist"],
  Hammer: ["Breaker", "Crusher", "Smiter", "Hammer"],
  "Great Hammer": ["Breaker", "Crusher", "Smiter", "Hammer"],
  Flail: ["Breaker", "Crusher", "Smiter", "Scourge"],
  Axe: ["Cleaver", "Executioner", "Berserker", "Ravager"],
  Greataxe: ["Cleaver", "Executioner", "Berserker", "Ravager"],
  Spear: ["Lancer", "Dragoon", "Impaler", "Warden"],
  "Great Spear": ["Lancer", "Dragoon", "Impaler", "Warden"],
  Halberd: ["Lancer", "Dragoon", "Impaler", "Warden"],
  Fist: ["Brawler", "Fang", "Claw", "Striker"],
  Claw: ["Brawler", "Fang", "Claw", "Striker"],
  "Hand-to-Hand Art": ["Brawler", "Fang", "Monk", "Striker"],
  Whip: ["Reaper", "Scourge", "Harvester", "Lash"],
  Reaper: ["Reaper", "Scourge", "Harvester", "Shade"],
  Twinblade: ["Dancer", "Windcutter", "Cyclone", "Tempest"],
  Bow: ["Archer", "Marksman", "Sniper", "Ranger"],
  "Light Bow": ["Archer", "Marksman", "Sniper", "Ranger"],
  Crossbow: ["Archer", "Marksman", "Sniper", "Ranger"],
  Greatbow: ["Archer", "Marksman", "Sniper", "Ranger"],
  "Glintstone Staff": ["Sage", "Sorcerer", "Magus", "Scholar"],
  "Sacred Seal": ["Prophet", "Apostle", "Herald", "Cleric"],
  Torch: ["Bearer", "Flame", "Warden", "Sentinel"],
  "Backhand Blade": ["Shadow", "Dancer", "Whisper", "Striker"],
  "Perfume Bottle": ["Alchemist", "Apothecary", "Brewer", "Mist"],
  "Throwing Blade": ["Shadow", "Striker", "Needle", "Whisper"],
  "Beast Claw": ["Brawler", "Fang", "Claw", "Striker"],
};

const ARCHETYPE_NAMES: Record<string, string[]> = {
  Spellblade: ["Spellblade", "Mageknight", "Arcane Warrior", "Mystic Blade"],
  Battlemage: ["Battlemage", "War Mage", "Arcane Berserker", "Spell Breaker"],
  Paladin: ["Paladin", "Crusader", "Holy Knight", "Faith Guardian"],
  Assassin: ["Assassin", "Nightblade", "Shadow Dancer", "Phantom"],
  "Blood Mage": ["Blood Mage", "Hemorrhage Lord", "Scarlet Ritualist", "Crimson Priest"],
  Sorcerer: ["Sorcerer", "Archmage", "Star Caller", "Glintstone Adept"],
  Prophet: ["Prophet", "Oracle", "Zealot", "Flame Priest"],
  Warrior: ["Warrior", "Warlord", "Berserker", "Champion"],
  Ronin: ["Ronin", "Bladedancer", "Swift Blade", "Wind Slicer"],
  Quality: ["Champion", "Vanguard", "Arms Master", "Versatile"],
  Tarnished: ["Tarnished", "Wanderer", "Vagabond", "Adventurer"],
};

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "a",
  "an",
  "in",
  "on",
  "at",
  "to",
  "for",
  "is",
  "it",
]);

const GENERIC_WEAPON_WORDS = new Set([
  "sword",
  "blade",
  "greatsword",
  "katana",
  "dagger",
  "axe",
  "hammer",
  "spear",
  "bow",
  "staff",
  "seal",
  "shield",
  "halberd",
  "flail",
  "crossbow",
  "whip",
  "fist",
  "claw",
  "twinblade",
  "scythe",
]);

function extractItemFlavor(itemName: string): string | null {
  const words = itemName.split(/\s+/);
  const flavorWords: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase().replace(/['']/g, "");
    if (STOP_WORDS.has(lower)) continue;
    if (GENERIC_WEAPON_WORDS.has(lower)) continue;
    if (lower.endsWith("'s")) continue;
    flavorWords.push(word);
    if (flavorWords.length >= 2) break;
  }

  if (flavorWords.length === 0) return null;
  return flavorWords.join(" ");
}

function getArchetype(profile: StatProfile): string {
  const p = profile;
  if ((p.intelligence ?? 0) >= 0.25 && (p.dexterity ?? 0) >= 0.2) return "Spellblade";
  if ((p.intelligence ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2) return "Battlemage";
  if ((p.faith ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2) return "Paladin";
  if ((p.dexterity ?? 0) >= 0.25 && (p.arcane ?? 0) >= 0.2) return "Assassin";
  if ((p.arcane ?? 0) >= 0.4) return "Blood Mage";
  if ((p.intelligence ?? 0) >= 0.4) return "Sorcerer";
  if ((p.faith ?? 0) >= 0.4) return "Prophet";
  if ((p.strength ?? 0) >= 0.4) return "Warrior";
  if ((p.dexterity ?? 0) >= 0.4) return "Ronin";
  if ((p.strength ?? 0) >= 0.2 && (p.dexterity ?? 0) >= 0.2) return "Quality";
  return "Tarnished";
}

function pickFrom(pool: string[], rng: SeededRng): string {
  return pool[rng.randomInt(pool.length)];
}

export function generateBuildName(
  seedItems: SeedItem[],
  profile: StatProfile,
  damageTypes: string[],
  rng: SeededRng,
): string {
  const archetype = getArchetype(profile);

  // Determine damage flavor
  const primaryDamage = damageTypes.find((d) => d !== "physical") ?? damageTypes[0] ?? "physical";
  // Check status effects for bleed/frost/poison
  let effectType: string | null = null;
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      const w = weapons[seed.index];
      if (w?.statusEffects) {
        if (w.statusEffects.bleed) effectType = "bleed";
        else if (w.statusEffects.frostbite) effectType = "frost";
        else if (w.statusEffects.poison) effectType = "poison";
      }
    }
  }
  const flavorKey = effectType ?? primaryDamage;
  const adjectives = DAMAGE_ADJECTIVES[flavorKey] ?? DAMAGE_ADJECTIVES.physical;

  // Determine role from weapon category
  const primarySeed = seedItems.find((s) => s.type === "weapon");
  const category = primarySeed ? weapons[primarySeed.index]?.category : null;
  const roles = category ? (CATEGORY_ROLES[category] ?? CATEGORY_ROLES["Straight Sword"]) : CATEGORY_ROLES["Straight Sword"];

  // Extract item flavor
  const itemFlavor = primarySeed ? extractItemFlavor(primarySeed.name) : null;

  // Archetype name pool
  const archetypeNames = ARCHETYPE_NAMES[archetype] ?? ARCHETYPE_NAMES.Tarnished;

  // Pick template (5 patterns)
  const templateIdx = rng.randomInt(5);

  switch (templateIdx) {
    case 0:
      // "{Adjective} {Role}" — "Blazing Crusader"
      return `${pickFrom(adjectives, rng)} ${pickFrom(roles, rng)}`;
    case 1:
      // "{Adjective} {Archetype}" — "Crimson Assassin"
      return `${pickFrom(adjectives, rng)} ${pickFrom(archetypeNames, rng)}`;
    case 2:
      // "{ItemFlavor} {Role}" — "Moonlight Sentinel"
      if (itemFlavor) return `${itemFlavor} ${pickFrom(roles, rng)}`;
      return `${pickFrom(adjectives, rng)} ${pickFrom(roles, rng)}`;
    case 3:
      // "{Role} of {Element}" — "Knight of Frost"
      return `${pickFrom(roles, rng)} of ${pickFrom(adjectives, rng).replace(/ing$/, "")}`;
    case 4: {
      // "{Adjective}{Role}" compound — "Stormblade", "Bloodfang"
      const adj = pickFrom(adjectives, rng).toLowerCase();
      const role = pickFrom(roles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjectives, rng)} ${pickFrom(archetypeNames, rng)}`;
  }
}
```

- [ ] **Step 2: Verify names are creative**

```bash
npx tsx -e "
import { generateBuild } from './src/lib/build-generator.ts';
import { weapons } from './src/data/index.ts';

const items = ['Moonveil', 'Ruins Greatsword', 'Rivers of Blood', 'Meteoric Ore Blade', 'Coded Sword'];
for (const name of items) {
  const idx = weapons.findIndex(w => w.name === name);
  if (idx < 0) { console.log(name, '- not found'); continue; }
  const names = [];
  for (let seed = 0; seed < 5; seed++) {
    const r = generateBuild({ seedItems: [{ name, type: 'weapon', index: idx }], creativity: 50, seed });
    names.push(r.buildName);
  }
  console.log(name + ':', names.join(' | '));
}
"
```

Expected: Variety of creative names, not just "Item Archetype" every time.

- [ ] **Step 3: Type check**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/build-namer.ts
git commit -m "feat: rewrite build namer with vocabulary pools and template patterns"
```

---

### Task 4: Stat Profile Display Component

**Files:**
- Create: `src/components/generator/stat-profile-display.tsx`

- [ ] **Step 1: Create the stat profile display component**

Create `src/components/generator/stat-profile-display.tsx`:

```tsx
import type { ArmorClass, LoadoutProfile, StatProfile } from "../../types/generator";

const STAT_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  intelligence: "INT",
  faith: "FTH",
  arcane: "ARC",
};

const ARMOR_LABELS: Record<ArmorClass, string> = {
  light: "Light Armor",
  medium: "Medium Armor",
  heavy: "Heavy Armor",
};

interface StatProfileDisplayProps {
  statProfile: StatProfile;
  armorClass: ArmorClass;
  loadoutProfile: LoadoutProfile;
}

export function StatProfileDisplay({
  statProfile,
  armorClass,
  loadoutProfile,
}: StatProfileDisplayProps) {
  const entries = Object.entries(statProfile)
    .filter(([, value]) => value > 0.1)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
      <div className="space-y-1.5">
        {entries.map(([stat, value]) => (
          <div key={stat} className="flex items-center gap-3">
            <span className="w-8 text-right font-display text-[10px] font-semibold uppercase tracking-wider text-text-dim">
              {STAT_LABELS[stat] ?? stat.slice(0, 3).toUpperCase()}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                style={{ width: `${Math.round(value * 100)}%` }}
              />
            </div>
            <span className="w-8 text-left font-display text-[10px] text-text-secondary">
              {Math.round(value * 100)}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 border-t border-border-dark pt-2 text-center font-display text-[10px] uppercase tracking-[2px] text-text-dim">
        {ARMOR_LABELS[armorClass]} · {loadoutProfile} Loadout
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/generator/stat-profile-display.tsx
git commit -m "feat: add stat profile display component with scaling bars"
```

---

### Task 5: Integrate Stat Profile Display into Generate Page

**Files:**
- Modify: `src/pages/generate.tsx`

- [ ] **Step 1: Import and render the stat profile display**

In `src/pages/generate.tsx`, add the import:

```typescript
import { StatProfileDisplay } from "../components/generator/stat-profile-display";
```

Then in the JSX, right after `<BuildIdentity buildName={result.buildName} />` and before the Armament section, add:

```tsx
<StatProfileDisplay
  statProfile={result.statProfile}
  armorClass={result.armorClass}
  loadoutProfile={result.loadoutProfile}
/>
```

- [ ] **Step 2: Verify type check and run dev server**

Run: `pnpm build`

Then `pnpm dev` — visit `/generate`, search Moonveil, generate. Verify stat bars appear between the name and equipment.

- [ ] **Step 3: Format and commit**

```bash
pnpm format
git add src/pages/generate.tsx
git commit -m "feat: render stat profile display in generate page"
```

---

### Task 6: End-to-End Verification

**Files:** None (testing only)

- [ ] **Step 1: Run full pipeline and build**

Run: `pnpm generate-data && pnpm build`

Expected: All passes.

- [ ] **Step 2: Lint and format**

Run: `pnpm lint && pnpm format:check`

If format fails, run `pnpm format` and commit.

- [ ] **Step 3: Manual testing**

Run: `pnpm dev`

Test in browser:
1. `/generate` → search "Moonveil" → Generate → Expect: **Powerstance** profile, 1 right katana, 1 left katana, creative name, stat bars showing INT/DEX
2. Search "Ruins Greatsword" → Generate → Expect: **Two-hander**, 1 weapon right, empty left
3. Search "Albinauric Bow" → Generate → Expect: **Ranged**, bow right, melee backup left
4. Search "Glintstone Pebble" (spell) → Generate → Expect: **Pure Caster**, catalysts only
5. Search "Claymore" → Generate → Expect: **Spellblade** or **Sword & Board** depending on scaling
6. Re-roll multiple times → Expect varied creative names
7. Adjust creativity slider → Re-roll → Expect different builds at 0 vs 100

- [ ] **Step 4: Commit if fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```

Only if fixes are needed.
