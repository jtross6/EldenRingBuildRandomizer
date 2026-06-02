# Weapon Sub-Groups & Fate Codec Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two Path of Fate bugs — builds not matching the playstyle card's weapon promise, and names changing on back-navigation — by introducing weapon sub-groups and a dual-RNG architecture.

**Architecture:** Weapon families are split into fine-grained sub-groups (23 total). The playstyle generator uses two independent RNGs: a structural RNG for URL-encoded fields and a derived RNG for display fields (name, flavor, stats, sub-groups). The codec reconstructs derived fields using the same derived RNG, eliminating state drift. The build generator filters weapons by sub-group instead of family.

**Tech Stack:** TypeScript, React, Vite, TanStack Router

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/fate.ts` | Modify | Add `WeaponSubGroup` type, add `subGroups` to `PlaystyleCard` |
| `src/lib/fate/taxonomy.ts` | Modify | Add `SUB_GROUP_CATEGORIES`, `FAMILY_SUB_GROUPS`, `SUB_GROUP_LABELS` |
| `src/lib/fate/fate-namer.ts` | Modify | Re-key `FAMILY_ROLES` to sub-groups, change 3rd param from `WeaponFamily` to `WeaponSubGroup` |
| `src/lib/fate/playstyle-generator.ts` | Modify | Dual RNG, sub-group selection with powerstance weighting, export `deriveDynamicFields` |
| `src/lib/fate/fate-codec.ts` | Modify | Use `deriveDynamicFields` instead of manual RNG replay |
| `src/lib/fate/fate-build-generator.ts` | Modify | Replace `filterWeaponsByFamily` with sub-group-aware filtering |
| `src/components/fate/playstyle-card.tsx` | Modify | Update `getCombatValue`, `getTacticalSummary`, `FAMILY_NOUNS` to use sub-group labels |

---

### Task 1: Add WeaponSubGroup type and update PlaystyleCard

**Files:**
- Modify: `src/types/fate.ts`

- [ ] **Step 1: Add WeaponSubGroup type and subGroups field**

In `src/types/fate.ts`, add the `WeaponSubGroup` type after `WeaponFamily` and add `subGroups` to `PlaystyleCard`:

```typescript
export type WeaponSubGroup =
  | "daggers"
  | "curved-swords"
  | "katanas"
  | "thrusting-swords"
  | "backhand-blades"
  | "throwing-blades"
  | "straight-swords"
  | "greatswords"
  | "great-katanas"
  | "colossal-swords"
  | "colossal-weapons"
  | "axes"
  | "hammers"
  | "spears"
  | "halberds"
  | "reapers"
  | "twinblades"
  | "whips"
  | "fist-weapons"
  | "torches"
  | "perfume-bottles"
  | "bows"
  | "crossbows";
```

Add `subGroups: WeaponSubGroup[];` to `PlaystyleCard` between `family` and `school`:

```typescript
export interface PlaystyleCard {
  identity: CombatIdentity;
  stance: WeaponStance;
  family: WeaponFamily;
  subGroups: WeaponSubGroup[];
  school: MagicSchool | null;
  statusEffect: StatusEffect | null;
  armorClass: ArmorClass;
  primaryStats: string[];
  name: string;
  flavor: string;
  seed: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/fate.ts
git commit -m "feat: add WeaponSubGroup type and subGroups field to PlaystyleCard"
```

---

### Task 2: Add sub-group taxonomy data

**Files:**
- Modify: `src/lib/fate/taxonomy.ts`

- [ ] **Step 1: Add sub-group mappings**

Add three new exports after the existing `WEAPON_FAMILY_CATEGORIES` block in `src/lib/fate/taxonomy.ts`. Add the `WeaponSubGroup` import to the existing import from `../../types/fate`.

```typescript
import type {
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  WeaponSubGroup,
  MagicSchool,
  MagicLevel,
  ArmorClass,
  StatusEffect,
} from "../../types/fate";
```

Add these after line 42 (after `WEAPON_FAMILY_CATEGORIES`):

```typescript
export const SUB_GROUP_CATEGORIES: Record<WeaponSubGroup, string[]> = {
  daggers: ["Dagger"],
  "curved-swords": ["Curved Sword"],
  katanas: ["Katana"],
  "thrusting-swords": ["Thrusting Sword", "Heavy Thrusting Sword"],
  "backhand-blades": ["Backhand Blade"],
  "throwing-blades": ["Throwing Blade"],
  "straight-swords": ["Straight Sword"],
  greatswords: ["Greatsword", "Light Greatsword", "Curved Greatsword"],
  "great-katanas": ["Great Katana"],
  "colossal-swords": ["Colossal Sword"],
  "colossal-weapons": ["Colossal Weapon"],
  axes: ["Axe", "Greataxe"],
  hammers: ["Hammer", "Great Hammer", "Flail"],
  spears: ["Spear", "Great Spear"],
  halberds: ["Halberd"],
  reapers: ["Reaper"],
  twinblades: ["Twinblade"],
  whips: ["Whip"],
  "fist-weapons": ["Fist", "Claw", "Hand-to-Hand Art", "Beast Claw"],
  torches: ["Torch"],
  "perfume-bottles": ["Perfume Bottle"],
  bows: ["Bow", "Light Bow", "Greatbow"],
  crossbows: ["Crossbow", "Ballista"],
};

export const FAMILY_SUB_GROUPS: Record<WeaponFamily, WeaponSubGroup[]> = {
  "light-blades": [
    "daggers",
    "curved-swords",
    "katanas",
    "thrusting-swords",
    "backhand-blades",
    "throwing-blades",
  ],
  "heavy-blades": ["straight-swords", "greatswords", "great-katanas"],
  colossal: ["colossal-swords", "colossal-weapons"],
  "axes-hammers": ["axes", "hammers"],
  polearms: ["spears", "halberds", "reapers"],
  "agile-exotic": ["twinblades", "whips", "fist-weapons", "torches", "perfume-bottles"],
  ranged: ["bows", "crossbows"],
};

export const SUB_GROUP_LABELS: Record<WeaponSubGroup, string> = {
  daggers: "Daggers",
  "curved-swords": "Curved Swords",
  katanas: "Katanas",
  "thrusting-swords": "Thrusting Swords",
  "backhand-blades": "Backhand Blades",
  "throwing-blades": "Throwing Blades",
  "straight-swords": "Straight Swords",
  greatswords: "Greatswords",
  "great-katanas": "Great Katanas",
  "colossal-swords": "Colossal Swords",
  "colossal-weapons": "Colossal Weapons",
  axes: "Axes",
  hammers: "Hammers",
  spears: "Spears",
  halberds: "Halberds",
  reapers: "Reapers",
  twinblades: "Twinblades",
  whips: "Whips",
  "fist-weapons": "Fist Weapons",
  torches: "Torches",
  "perfume-bottles": "Perfume Bottles",
  bows: "Bows",
  crossbows: "Crossbows",
};
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm build`
Expected: Type errors in files that use `PlaystyleCard` but don't yet provide `subGroups`. That's expected — later tasks fix those. Verify that `taxonomy.ts` itself has no errors by checking the output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/taxonomy.ts
git commit -m "feat: add weapon sub-group taxonomy data"
```

---

### Task 3: Update fate namer for sub-groups

**Files:**
- Modify: `src/lib/fate/fate-namer.ts`

- [ ] **Step 1: Change import and re-key FAMILY_ROLES to SUB_GROUP_ROLES**

Replace the entire content of the imports and the `FAMILY_ROLES` constant. Change the import from `WeaponFamily` to `WeaponSubGroup`:

```typescript
import type {
  CombatIdentity,
  WeaponStance,
  WeaponSubGroup,
  MagicSchool,
  StatusEffect,
} from "../../types/fate";
import type { SeededRng } from "../seeded-rng";
```

Replace `FAMILY_ROLES` (lines 35-43) with `SUB_GROUP_ROLES`:

```typescript
const SUB_GROUP_ROLES: Record<string, string[]> = {
  daggers: ["Shadow", "Whisper", "Stiletto", "Viper"],
  "curved-swords": ["Dancer", "Dervish", "Crescent", "Duelist"],
  katanas: ["Ronin", "Kensei", "Blade", "Wanderer"],
  "thrusting-swords": ["Duelist", "Fencer", "Rapier", "Piercer"],
  "backhand-blades": ["Reaver", "Ripper", "Slasher", "Unseen"],
  "throwing-blades": ["Flicker", "Thorn", "Needle", "Dart"],
  "straight-swords": ["Knight", "Sentinel", "Crusader", "Sword"],
  greatswords: ["Greatsword", "Claymore", "Bastion", "Vanquisher"],
  "great-katanas": ["Shogun", "Warden", "Odachi", "Cleaver"],
  "colossal-swords": ["Titan", "Destroyer", "Monolith", "Colossus"],
  "colossal-weapons": ["Juggernaut", "Devastator", "Earthshaker", "Colossus"],
  axes: ["Cleaver", "Executioner", "Hewer", "Chopper"],
  hammers: ["Breaker", "Crusher", "Smiter", "Hammer"],
  spears: ["Lancer", "Dragoon", "Impaler", "Pikeman"],
  halberds: ["Warden", "Sentinel", "Halberdier", "Vanguard"],
  reapers: ["Harvester", "Deathbringer", "Scythe", "Reaper"],
  twinblades: ["Cyclone", "Windcutter", "Tempest", "Dervish"],
  whips: ["Lasher", "Scourge", "Flayer", "Serpent"],
  "fist-weapons": ["Brawler", "Pugilist", "Striker", "Fist"],
  torches: ["Firebrand", "Torchbearer", "Lightbringer", "Ember"],
  "perfume-bottles": ["Alchemist", "Perfumer", "Apothecary", "Mist"],
  bows: ["Marksman", "Archer", "Longshot", "Ranger"],
  crossbows: ["Sniper", "Arbalist", "Bolter", "Sharpshooter"],
};
```

- [ ] **Step 2: Update generateFateName signature**

Change the 3rd parameter from `family: WeaponFamily` to `subGroup: WeaponSubGroup` and update the body to use `SUB_GROUP_ROLES` instead of `FAMILY_ROLES`:

```typescript
export function generateFateName(
  identity: CombatIdentity,
  _stance: WeaponStance,
  subGroup: WeaponSubGroup,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
): string {
  const adjPool = school
    ? SCHOOL_ADJECTIVES[school]
    : statusEffect
      ? (STATUS_ADJECTIVES[statusEffect] ?? ["Savage", "Iron", "Steel", "Brutal"])
      : ["Savage", "Iron", "Steel", "Brutal", "Stone", "Heavy"];

  const subGroupRoles = SUB_GROUP_ROLES[subGroup] ?? SUB_GROUP_ROLES["straight-swords"];
  const identityRoles = IDENTITY_ROLES[identity] ?? IDENTITY_ROLES.warrior;

  const templateIdx = rng.randomInt(4);
  switch (templateIdx) {
    case 0:
      return `${pickFrom(adjPool, rng)} ${pickFrom(subGroupRoles, rng)}`;
    case 1:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
    case 2:
      return `${pickFrom(subGroupRoles, rng)} of ${pickFrom(adjPool, rng).replace(/ing$/, "")}`;
    case 3: {
      const adj = pickFrom(adjPool, rng).toLowerCase();
      const role = pickFrom(subGroupRoles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-namer.ts
git commit -m "feat: re-key fate namer roles to weapon sub-groups"
```

---

### Task 4: Dual RNG and deriveDynamicFields in playstyle generator

**Files:**
- Modify: `src/lib/fate/playstyle-generator.ts`

This is the core change. The generator splits into structural RNG + derived RNG, and the derived-field logic is exported for the codec to reuse.

- [ ] **Step 1: Add imports for new types and taxonomy**

Update the imports at the top of `src/lib/fate/playstyle-generator.ts`:

```typescript
import type {
  PlaystyleCard,
  PlaystyleConstraint,
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  WeaponSubGroup,
  MagicSchool,
  MagicLevel,
  StatusEffect,
  ArmorClass,
} from "../../types/fate";
import { createRng, type SeededRng } from "../seeded-rng";
import {
  ALL_STANCES,
  ALL_STATUS_EFFECTS,
  IDENTITY_STATS,
  FAMILY_SUB_GROUPS,
  deriveArmorClass,
  deriveIdentity,
  getValidFamilies,
  getValidStances,
  getValidSchools,
  identityAllowsMagic,
} from "./taxonomy";
import { generateFateName } from "./fate-namer";
import { generateFlavorText } from "./flavor-text";
```

- [ ] **Step 2: Add the derived RNG constant and pickSubGroups helper**

Add after the existing `pick` function (after line 29):

```typescript
const DERIVED_SEED_XOR = 0x44455249;

function pickSubGroups(
  family: WeaponFamily,
  stance: WeaponStance,
  rng: SeededRng,
): WeaponSubGroup[] {
  const pool = FAMILY_SUB_GROUPS[family];

  if (stance !== "dual-wield" || pool.length < 2) {
    return [pool[rng.randomInt(pool.length)]];
  }

  const powerstance = rng.next() < 0.6;
  if (powerstance) {
    const sg = pool[rng.randomInt(pool.length)];
    return [sg, sg];
  }

  const first = rng.randomInt(pool.length);
  let second = rng.randomInt(pool.length - 1);
  if (second >= first) second++;
  return [pool[first], pool[second]];
}
```

- [ ] **Step 3: Add the exported deriveDynamicFields function**

Add after `pickSubGroups`:

```typescript
export function deriveDynamicFields(
  identity: CombatIdentity,
  stance: WeaponStance,
  family: WeaponFamily,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  seed: number,
): { primaryStats: string[]; subGroups: WeaponSubGroup[]; name: string; flavor: string } {
  const rng = createRng(seed ^ DERIVED_SEED_XOR);

  const statOptions = IDENTITY_STATS[identity];
  const primaryStats = statOptions[rng.randomInt(statOptions.length)];
  const subGroups = pickSubGroups(family, stance, rng);
  const name = generateFateName(identity, stance, subGroups[0], school, statusEffect, rng);
  const flavor = generateFlavorText(identity, stance, family, school, statusEffect, rng);

  return { primaryStats, subGroups, name, flavor };
}
```

- [ ] **Step 4: Update generatePlaystyle to use deriveDynamicFields**

Replace lines 88-106 (steps 7-8 and the return statement) of `generatePlaystyle` with:

```typescript
  const { primaryStats, subGroups, name, flavor } = deriveDynamicFields(
    identity,
    stance,
    family,
    school,
    statusEffect,
    seed,
  );

  return {
    identity,
    stance,
    family,
    subGroups,
    school,
    statusEffect,
    armorClass,
    primaryStats,
    name,
    flavor,
    seed,
  };
```

Remove the now-unused direct imports of `generateFateName` and `generateFlavorText` from the top of the file — they're still called inside `deriveDynamicFields`, which uses them directly. Actually, `deriveDynamicFields` calls them so they're still needed as imports. Keep them.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fate/playstyle-generator.ts
git commit -m "feat: dual RNG architecture with shared deriveDynamicFields"
```

---

### Task 5: Fix fate codec to use deriveDynamicFields

**Files:**
- Modify: `src/lib/fate/fate-codec.ts`

- [ ] **Step 1: Replace manual RNG replay with deriveDynamicFields**

Update imports — remove `IDENTITY_STATS`, `generateFateName`, `generateFlavorText`, `createRng`. Add `deriveDynamicFields`:

```typescript
import type { PlaystyleCard } from "../../types/fate";
import {
  ALL_IDENTITIES,
  ALL_STANCES,
  ALL_FAMILIES,
  ALL_SCHOOLS,
  ALL_STATUS_EFFECTS,
} from "./taxonomy";
import { deriveDynamicFields } from "./playstyle-generator";
```

Replace the derived-field logic in `decodeFate` (lines 89-97, from `const rng = createRng(seed);` through the `flavor` line) with:

```typescript
    const { primaryStats, subGroups, name, flavor } = deriveDynamicFields(
      identity,
      stance,
      family,
      school,
      statusEffect,
      seed,
    );
```

Update the return object (lines 99-110) to include `subGroups`:

```typescript
    return {
      identity,
      stance,
      family,
      subGroups,
      school,
      statusEffect,
      armorClass,
      primaryStats,
      name,
      flavor,
      seed,
    };
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm build`
Expected: Should pass for all fate lib files. Remaining errors may be in `playstyle-card.tsx` or `fate-build-generator.ts` (fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-codec.ts
git commit -m "fix: codec uses deriveDynamicFields for stable name/flavor across navigation"
```

---

### Task 6: Update build generator to use sub-groups

**Files:**
- Modify: `src/lib/fate/fate-build-generator.ts`

- [ ] **Step 1: Replace filterWeaponsByFamily with sub-group filtering**

Update the imports — replace `WEAPON_FAMILY_CATEGORIES` with `SUB_GROUP_CATEGORIES`, and add `WeaponSubGroup` to the type import:

```typescript
import type { Build } from "../../types/build";
import type { PlaystyleCard, WeaponSubGroup } from "../../types/fate";
```

```typescript
import { SUB_GROUP_CATEGORIES, isSorcerySchool, identityAllowsMagic } from "./taxonomy";
```

Replace the `filterWeaponsByFamily` function (lines 40-46) with `filterWeaponsBySubGroup`:

```typescript
function filterWeaponsBySubGroup(subGroup: WeaponSubGroup): number[] {
  const validCategories = new Set(SUB_GROUP_CATEGORIES[subGroup]);
  return weapons
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => validCategories.has(w.category))
    .map(({ i }) => i);
}
```

- [ ] **Step 2: Update weapon selection in generateBuildFromFate**

Replace the weapon selection block (lines 69-119, from `const candidateWeapons` through the closing `}` of the `if` block) with sub-group-aware logic:

```typescript
  const weaponsRight: number[] = [];
  const weaponsLeft: number[] = [];
  const shieldIndices: number[] = [];
  const staffIndices: number[] = [];
  const sealIndices: number[] = [];
  const exclude = new Set<number>();

  switch (card.stance) {
    case "two-hand": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      break;
    }
    case "dual-wield": {
      const rightCandidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (rightCandidates.length > 0) {
        const shuffled = rng.shuffle(rightCandidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      if (card.subGroups[0] === card.subGroups[1]) {
        const remaining = filterWeaponsBySubGroup(card.subGroups[1]).filter(
          (i) => !exclude.has(i),
        );
        if (remaining.length > 0) {
          const shuffled = rng.shuffle(remaining);
          weaponsLeft.push(shuffled[0]);
          exclude.add(shuffled[0]);
        }
      } else {
        const leftCandidates = filterWeaponsBySubGroup(card.subGroups[1]);
        if (leftCandidates.length > 0) {
          const shuffled = rng.shuffle(leftCandidates);
          weaponsLeft.push(shuffled[0]);
          exclude.add(shuffled[0]);
        }
      }
      break;
    }
    case "sword-board": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      const shieldPick = pickRandom(shields, rng, 1);
      if (shieldPick.length > 0) shieldIndices.push(shieldPick[0]);
      break;
    }
    case "ranged": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      const meleeWeapons = weapons
        .map((w, i) => ({ w, i }))
        .filter(
          ({ w }) =>
            !["Bow", "Light Bow", "Greatbow", "Crossbow", "Ballista"].includes(w.category),
        )
        .map(({ i }) => i);
      if (meleeWeapons.length > 0) {
        const meleePick = rng.shuffle(meleeWeapons);
        weaponsLeft.push(meleePick[0]);
      }
      break;
    }
  }
```

Remove the old variable declarations that are now inside the switch (the `const candidateWeapons`, `const exclude`, and the weapon/shield/staff/seal arrays that were declared before the old `if` block — move them before the switch as shown above).

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-build-generator.ts
git commit -m "fix: build generator filters weapons by sub-group instead of family"
```

---

### Task 7: Update playstyle card UI for sub-groups

**Files:**
- Modify: `src/components/fate/playstyle-card.tsx`

- [ ] **Step 1: Update imports**

Add `SUB_GROUP_LABELS` to the taxonomy import:

```typescript
import { SUB_GROUP_LABELS, SCHOOL_LABELS, isSorcerySchool } from "../../lib/fate/taxonomy";
```

Remove `FAMILY_LABELS` from the import (no longer used here).

- [ ] **Step 2: Update getCombatValue to use sub-group labels**

Replace the `getCombatValue` function (lines 35-41) with:

```typescript
function getCombatValue(card: PlaystyleCard): string {
  if (card.stance === "ranged") return "Ranged";
  const primary = SUB_GROUP_LABELS[card.subGroups[0]];
  if (card.stance === "sword-board") return `${primary} + Shield`;
  if (card.stance === "two-hand") return `Two-hand ${primary}`;
  if (card.subGroups[0] === card.subGroups[1]) return `Powerstance ${primary}`;
  const secondary = SUB_GROUP_LABELS[card.subGroups[1]];
  return `Dual-wield ${primary} & ${secondary}`;
}
```

- [ ] **Step 3: Replace FAMILY_NOUNS with sub-group-aware getTacticalSummary**

Remove `FAMILY_NOUNS` (lines 48-56). Keep `MAGIC_ROLES` (lines 58-62) in place. Replace `getTacticalSummary` (lines 64-90). The new code to insert where `FAMILY_NOUNS` was:

```typescript
function getWeaponNoun(card: PlaystyleCard): string {
  if (card.stance === "dual-wield" && card.subGroups[0] !== card.subGroups[1]) {
    return `${SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase()} and ${SUB_GROUP_LABELS[card.subGroups[1]].toLowerCase()}`;
  }
  return SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase();
}

function getTacticalSummary(card: PlaystyleCard): string {
  const noun = getWeaponNoun(card);
  let weaponPart: string;
  switch (card.stance) {
    case "two-hand":
      weaponPart = `Grip ${noun} with both hands for extra damage and stagger`;
      break;
    case "dual-wield":
      weaponPart = card.subGroups[0] === card.subGroups[1]
        ? `Powerstance ${noun} for relentless aggression`
        : `Dual-wield ${noun} for relentless aggression`;
      break;
    case "sword-board":
      weaponPart = `Pair ${noun} with a shield for staying power`;
      break;
    case "ranged":
      weaponPart = `Strike from range, close to melee only when cornered`;
      break;
  }

  if (card.school && card.identity !== "warrior") {
    const schoolName = SCHOOL_LABELS[card.school];
    const spellType = isSorcerySchool(card.school) ? "sorceries" : "incantations";
    const role = MAGIC_ROLES[card.identity] ?? "add utility at range";
    return `${weaponPart}. ${schoolName} ${spellType} ${role}.`;
  }

  return `${weaponPart}.`;
}
```

- [ ] **Step 4: Verify full build passes**

Run: `pnpm build`
Expected: Clean build with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/fate/playstyle-card.tsx
git commit -m "feat: playstyle card displays weapon sub-group labels"
```

---

### Task 8: Lint, format, and verify

**Files:** All modified files

- [ ] **Step 1: Run linter**

Run: `pnpm lint`
Expected: No errors. Fix any that appear.

- [ ] **Step 2: Run formatter**

Run: `pnpm format`
Expected: Formatting applied. Check `git diff` for any changes.

- [ ] **Step 3: Run full build**

Run: `pnpm build`
Expected: Clean build, zero errors.

- [ ] **Step 4: Commit formatting if needed**

```bash
git add -A
git commit -m "style: apply formatting"
```

- [ ] **Step 5: Manual verification in browser**

Run: `pnpm dev`

Verify the following in the browser:

1. **Path of Fate generates with sub-groups:** Go to `/fate`, click "Reveal My Fate". The Weapons stat pill should show specific sub-group names (e.g., "Dual-wield Axes & Hammers", "Powerstance Katanas", "Two-hand Greatswords").

2. **Dual-wield builds match the card:** When a dual-wield card with two different sub-groups appears (e.g., "Dual-wield Axes & Hammers"), click "Generate Build". Verify the build contains one weapon from each sub-group.

3. **Powerstance builds:** Generate several fate cards until you see a "Powerstance [X]" card. Click "Generate Build" and verify both weapons are from the same sub-group.

4. **Name stability on back-navigation:** Generate a fate card, note the name. Click "Generate Build" to navigate to the build page. Hit browser back. Verify the name is unchanged.

5. **Shared fate links:** Generate a fate card, click "Share This Fate", paste the URL in a new tab. Verify the name, flavor, stats, and sub-groups all match the original.
