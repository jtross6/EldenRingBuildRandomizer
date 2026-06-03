# Double Shield Stance & Weighted Stance Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `"double-shield"` weapon stance to Path of Fate and rebalance stance selection with weighted randomization.

**Architecture:** New stance type flows through the full playstyle pipeline — types, taxonomy, generator, naming, flavor, codec, and UI. Family becomes nullable (`WeaponFamily | null`) to represent "no weapon family" when stance is `double-shield`. The existing `SeededRng.weightedPick` is used for weighted stance selection.

**Tech Stack:** TypeScript, React, Vite, Tailwind CSS v4

---

### Task 1: Type changes

**Files:**
- Modify: `src/types/fate.ts:3` (WeaponStance)
- Modify: `src/types/fate.ts:63` (PlaystyleCard.family)

- [ ] **Step 1: Add `"double-shield"` to `WeaponStance`**

```typescript
export type WeaponStance = "two-hand" | "dual-wield" | "sword-board" | "ranged" | "double-shield";
```

- [ ] **Step 2: Make `PlaystyleCard.family` nullable**

```typescript
export interface PlaystyleCard {
  identity: CombatIdentity;
  stance: WeaponStance;
  family: WeaponFamily | null;
  subGroups: WeaponSubGroup[];
  school: MagicSchool | null;
  statusEffect: StatusEffect | null;
  armorClass: ArmorClass;
  primaryStats: string[];
  name: string;
  flavor: string;
  flavorIdentity: string;
  seed: number;
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm exec tsc --noEmit 2>&1 | head -40`

Expected: Type errors in downstream files (taxonomy, generator, codec, etc.) that reference `family` as non-nullable. This is correct — we fix them in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/types/fate.ts
git commit -m "feat: add double-shield stance type and nullable family"
```

---

### Task 2: Taxonomy updates

**Files:**
- Modify: `src/lib/fate/taxonomy.ts:212` (ALL_STANCES)
- Modify: `src/lib/fate/taxonomy.ts:240-248` (getValidFamilies, getValidStances)
- Modify: `src/lib/fate/taxonomy.ts:260-267` (deriveArmorClass)

- [ ] **Step 1: Append `"double-shield"` to `ALL_STANCES`**

```typescript
export const ALL_STANCES: WeaponStance[] = ["two-hand", "dual-wield", "sword-board", "ranged", "double-shield"];
```

- [ ] **Step 2: Update `getValidFamilies` to return empty array for `double-shield`**

```typescript
export function getValidFamilies(stance: WeaponStance | undefined): WeaponFamily[] {
  if (stance === "double-shield") return [];
  if (stance === "ranged") return ["ranged"];
  return ALL_FAMILIES.filter((f) => f !== "ranged" || stance === undefined);
}
```

- [ ] **Step 3: Update `getValidStances` to exclude `double-shield` when a family is set**

```typescript
export function getValidStances(family: WeaponFamily | null | undefined): WeaponStance[] {
  if (family === "ranged") return ["ranged"];
  if (family === "colossal") return ["two-hand", "sword-board"];
  if (family) return ALL_STANCES.filter((s) => s !== "double-shield");
  return ALL_STANCES;
}
```

When family is `null` or `undefined` (no constraint), all stances including `double-shield` are valid. When a specific family is set, `double-shield` is excluded since it doesn't use weapon families.

- [ ] **Step 4: Update `deriveArmorClass` to handle null family**

```typescript
export function deriveArmorClass(identity: CombatIdentity, family: WeaponFamily | null): ArmorClass {
  if (family === null) return "heavy";
  if (identity === "spellcaster" && family !== "colossal") return "light";
  if (family === "colossal" || family === "axes-hammers") return "heavy";
  if (identity === "warrior" && (family === "heavy-blades" || family === "polearms"))
    return "heavy";
  if (identity === "skirmisher" || family === "light-blades") return "light";
  return "medium";
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/fate/taxonomy.ts
git commit -m "feat: taxonomy support for double-shield stance"
```

---

### Task 3: Naming — shield-specific roles

**Files:**
- Modify: `src/lib/fate/fate-namer.ts:35-59` (SUB_GROUP_ROLES)
- Modify: `src/lib/fate/fate-namer.ts:72-105` (generateFateName)

- [ ] **Step 1: Add `SHIELD_ROLES` constant after `SUB_GROUP_ROLES`**

Add this after line 59 (after the closing `};` of `SUB_GROUP_ROLES`):

```typescript
const SHIELD_ROLES: string[] = [
  "Bulwark",
  "Fortress",
  "Rampart",
  "Bastion",
  "Shield Wall",
  "Ironclad",
  "Phalanx",
  "Aegis",
];
```

- [ ] **Step 2: Update `generateFateName` to accept nullable subGroup and use stance**

Change the `_stance` parameter to `stance` and make `subGroup` nullable:

```typescript
export function generateFateName(
  identity: CombatIdentity,
  stance: WeaponStance,
  subGroup: WeaponSubGroup | null,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
): string {
  const adjPool = school
    ? SCHOOL_ADJECTIVES[school]
    : statusEffect
      ? (STATUS_ADJECTIVES[statusEffect] ?? ["Savage", "Iron", "Steel", "Brutal"])
      : ["Savage", "Iron", "Steel", "Brutal", "Stone", "Heavy"];

  const subGroupRoles = stance === "double-shield"
    ? SHIELD_ROLES
    : (SUB_GROUP_ROLES[subGroup!] ?? SUB_GROUP_ROLES["straight-swords"]);
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

Note: `subGroup!` non-null assertion is safe because when `stance !== "double-shield"`, subGroup is always non-null (guaranteed by the generator). The `stance === "double-shield"` check short-circuits before the assertion is reached.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-namer.ts
git commit -m "feat: shield-specific name generation for double-shield stance"
```

---

### Task 4: Flavor identity — double-shield rules

**Files:**
- Modify: `src/lib/fate/flavor-identity.ts:17` (FLAVOR_RULES)
- Modify: `src/lib/fate/flavor-identity.ts:178-192` (resolveFlavorIdentity)

- [ ] **Step 1: Add double-shield flavor rules at the top of `FLAVOR_RULES`**

Insert these entries right after the opening `[` of `FLAVOR_RULES` (line 17), before the existing rules:

```typescript
  // --- Double shield stance ---
  { stance: "double-shield", identity: "warrior", title: "Bulwark" },
  { stance: "double-shield", identity: "spellblade", title: "Aegis" },
  { stance: "double-shield", school: "golden-order", title: "Bastion of Light" },
  { stance: "double-shield", title: "Fortress" },
```

These go first so they match before any sub-group or identity fallback rules.

- [ ] **Step 2: Update `resolveFlavorIdentity` to accept nullable subGroup**

```typescript
export function resolveFlavorIdentity(
  subGroup: WeaponSubGroup | null,
  stance: WeaponStance,
  identity: CombatIdentity,
  school: MagicSchool | null,
): string {
  for (const rule of FLAVOR_RULES) {
    if (rule.subGroup !== undefined && subGroup === null) continue;
    if (subGroup !== null && !matches(subGroup, rule.subGroup)) continue;
    if (!matches(stance, rule.stance)) continue;
    if (!matches(identity, rule.identity)) continue;
    if (rule.school !== undefined && (school === null || !matches(school, rule.school))) continue;
    return rule.title;
  }
  return "Tarnished";
}
```

The key change: when `subGroup` is `null`, skip any rule that requires a specific sub-group. This prevents double-shield builds from accidentally matching sub-group-specific rules.

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/flavor-identity.ts
git commit -m "feat: flavor identity rules for double-shield stance"
```

---

### Task 5: Flavor text — shield fragments

**Files:**
- Modify: `src/lib/fate/flavor-text.ts:77-120` (WEAPON_FRAGMENTS)
- Modify: `src/lib/fate/flavor-text.ts:187-216` (generateFlavorText)

- [ ] **Step 1: Add `SHIELD_FRAGMENTS` constant after `WEAPON_FRAGMENTS`**

Insert after line 120 (after the closing `};` of `WEAPON_FRAGMENTS`):

```typescript
const SHIELD_FRAGMENTS: string[] = [
  "Two shields — offense is for the reckless.",
  "Why dodge when you can simply deny?",
  "An impenetrable wall of steel and faith.",
  "Let them strike. Let them tire. Then walk through them.",
];
```

- [ ] **Step 2: Update `generateFlavorText` to handle nullable family and subGroup**

```typescript
export function generateFlavorText(
  identity: CombatIdentity,
  _stance: WeaponStance,
  family: WeaponFamily | null,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
  primarySubGroup: WeaponSubGroup | null,
): string {
  const noun = primarySubGroup ? SUB_GROUP_NOUNS[primarySubGroup] : "shield";
  const statusPool = statusEffect ? STATUS_OPENERS[statusEffect] : undefined;
  let opener: string;
  if (statusPool && rng.next() < 0.4) {
    opener = resolveNoun(pickFrom(statusPool, rng), noun);
  } else {
    opener = resolveNoun(pickFrom(OPENERS[identity], rng), noun);
  }
  const weaponFrag = family
    ? resolveNoun(pickFrom(WEAPON_FRAGMENTS[family], rng), noun)
    : pickFrom(SHIELD_FRAGMENTS, rng);

  if (school) {
    const magicFrag = pickFrom(MAGIC_FRAGMENTS[school], rng);
    return `${opener} ${weaponFrag} ${magicFrag}`;
  }

  const useCloser = rng.next() < 0.4;
  if (useCloser) {
    return `${opener} ${weaponFrag} ${pickFrom(CLOSERS, rng)}`;
  }
  return `${opener} ${weaponFrag}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/flavor-text.ts
git commit -m "feat: shield-specific flavor text for double-shield stance"
```

---

### Task 6: Playstyle generator — weighted stances and null-family handling

**Files:**
- Modify: `src/lib/fate/playstyle-generator.ts:72-104` (deriveDynamicFields)
- Modify: `src/lib/fate/playstyle-generator.ts:106-173` (generatePlaystyle)

- [ ] **Step 1: Add `STANCE_WEIGHTS` constant**

Add after the `DERIVED_SEED_XOR` constant (line 47):

```typescript
const STANCE_WEIGHTS: Record<WeaponStance, number> = {
  "two-hand": 30,
  "dual-wield": 30,
  "sword-board": 30,
  ranged: 8,
  "double-shield": 1,
};
```

Add `WeaponStance` to the imports from `../../types/fate` if not already present (it is already imported on line 5).

- [ ] **Step 2: Update `deriveDynamicFields` signature and null-family handling**

```typescript
export function deriveDynamicFields(
  identity: CombatIdentity,
  stance: WeaponStance,
  family: WeaponFamily | null,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  seed: number,
): {
  primaryStats: string[];
  subGroups: WeaponSubGroup[];
  name: string;
  flavor: string;
  flavorIdentity: string;
} {
  const rng = createRng(seed ^ DERIVED_SEED_XOR);

  const statOptions = IDENTITY_STATS[identity];
  const primaryStats = statOptions[rng.randomInt(statOptions.length)];
  const subGroups = family ? pickSubGroups(family, stance, rng) : [];
  const primarySubGroup: WeaponSubGroup | null = subGroups.length > 0 ? subGroups[0] : null;
  const name = generateFateName(identity, stance, primarySubGroup, school, statusEffect, rng);
  const flavor = generateFlavorText(
    identity,
    stance,
    family,
    school,
    statusEffect,
    rng,
    primarySubGroup,
  );
  const flavorIdentity = resolveFlavorIdentity(primarySubGroup, stance, identity, school);

  return { primaryStats, subGroups, name, flavor, flavorIdentity };
}
```

- [ ] **Step 3: Update `generatePlaystyle` with weighted stance selection and null-family path**

```typescript
export function generatePlaystyle(constraints: PlaystyleConstraint, seed: number): PlaystyleCard {
  const rng = createRng(seed);

  // 1. Resolve combat identity
  const validIdentities = deriveIdentity(constraints.magic, constraints.school);
  const identity: CombatIdentity = pick(validIdentities, rng);

  // 2. Resolve weapon stance (weighted)
  let stance: WeaponStance;
  if (constraints.stance) {
    stance = constraints.stance;
  } else {
    const validStances = getValidStances(constraints.family);
    const weights = validStances.map((s) => STANCE_WEIGHTS[s]);
    stance = rng.weightedPick(validStances, weights);
  }

  // 3. Resolve weapon family (null for double-shield)
  let family: WeaponFamily | null = null;
  if (stance !== "double-shield") {
    const validFamiliesFromStance = getValidFamilies(stance);
    const familyPool = constraints.family ? [constraints.family] : validFamiliesFromStance;
    family = pick(familyPool, rng);
  }

  // 4. Resolve magic level and school
  const magicLevel = resolveMagicLevel(constraints.magic, identity, rng);
  let school: MagicSchool | null = null;
  if (magicLevel !== "none" && identityAllowsMagic(identity)) {
    if (constraints.school) {
      school = constraints.school;
    } else {
      const validSchools = getValidSchools(constraints.magic, identity);
      if (validSchools.length > 0) {
        school = pick(validSchools, rng);
      }
    }
  }

  // 5. Resolve status effect
  let statusEffect: StatusEffect | null = null;
  if (constraints.statusEffect) {
    statusEffect = constraints.statusEffect;
  } else if (identity === "skirmisher" || rng.next() < 0.3) {
    statusEffect = pick(ALL_STATUS_EFFECTS, rng);
  }

  // 6. Resolve armor class
  const armorClass: ArmorClass = constraints.armorClass ?? deriveArmorClass(identity, family);

  const { primaryStats, subGroups, name, flavor, flavorIdentity } = deriveDynamicFields(
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
    flavorIdentity,
    seed,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/fate/playstyle-generator.ts
git commit -m "feat: weighted stance selection and null-family support in generator"
```

---

### Task 7: Build generator — double-shield case and ash of war fix

**Files:**
- Modify: `src/lib/fate/fate-build-generator.ts:74-138` (stance switch)
- Modify: `src/lib/fate/fate-build-generator.ts:175-196` (ash of war logic)

- [ ] **Step 1: Add `double-shield` case in the stance switch block**

Add this case before the closing `}` of the switch statement (before line 138):

```typescript
    case "double-shield": {
      const shieldPicks = pickRandom(shields, rng, 2);
      if (shieldPicks.length > 0) rightHand.push({ type: "shield", index: shieldPicks[0] });
      if (shieldPicks.length > 1) leftHand.push({ type: "shield", index: shieldPicks[1] });
      break;
    }
```

- [ ] **Step 2: Update ash of war logic to support shields**

Replace lines 175-196 (the ash of war block) with:

```typescript
  const ashIndices: number[] = [];
  const equippedArmaments = [...rightHand, ...leftHand].filter(
    (ref) => ref.type === "weapon" || ref.type === "shield",
  );
  const targetAffinities = card.primaryStats.flatMap((s) => AFFINITY_BY_STAT[s] ?? []);
  for (const ref of equippedArmaments) {
    const item = ref.type === "weapon" ? weapons[ref.index] : shields[ref.index];
    if (!item?.allowAshOfWar) continue;
    const matchingAshes = ashesOfWar
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => {
        if (targetAffinities.length === 0) return true;
        return a.defaultAffinity ? targetAffinities.includes(a.defaultAffinity) : false;
      })
      .map(({ i }) => i);
    if (matchingAshes.length > 0) {
      const shuffled = rng.shuffle(matchingAshes);
      const picked = shuffled[0];
      if (!ashIndices.includes(picked)) ashIndices.push(picked);
    }
    if (ashIndices.length >= 2) break;
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-build-generator.ts
git commit -m "feat: double-shield build generation and ash of war shield support"
```

---

### Task 8: Codec — null-family encoding/decoding

**Files:**
- Modify: `src/lib/fate/fate-codec.ts:38` (encodeFate)
- Modify: `src/lib/fate/fate-codec.ts:66-84` (decodeFate)

- [ ] **Step 1: Update `encodeFate` to handle null family**

Replace line 38:
```typescript
  bytes.push(ALL_FAMILIES.indexOf(card.family));
```

With:
```typescript
  bytes.push(card.family !== null ? ALL_FAMILIES.indexOf(card.family) : 0xff);
```

- [ ] **Step 2: Update `decodeFate` to handle `0xFF` family sentinel**

Replace the family decoding and validation (lines 66-84):

```typescript
    const familyByte = bytes[offset++];
    const family = familyByte === 0xff ? null : (ALL_FAMILIES[familyByte] ?? undefined);
```

And update the validation line from:
```typescript
    if (!identity || !stance || !family || !armorClass) return null;
```

To:
```typescript
    if (!identity || !stance || family === undefined || !armorClass) return null;
```

This allows `null` (valid for double-shield) but rejects `undefined` (invalid index).

- [ ] **Step 3: Commit**

```bash
git add src/lib/fate/fate-codec.ts
git commit -m "feat: codec support for null family in double-shield stance"
```

---

### Task 9: Constraints drawer UI

**Files:**
- Modify: `src/components/fate/constraints-drawer.tsx:86-91` (STANCE_LABELS)
- Modify: `src/components/fate/constraints-drawer.tsx:121-129` (handleStanceChange)
- Modify: `src/components/fate/constraints-drawer.tsx:183-189` (family chip group)

- [ ] **Step 1: Add `double-shield` to `STANCE_LABELS`**

```typescript
const STANCE_LABELS: Record<WeaponStance, string> = {
  "two-hand": "Two-hand",
  "dual-wield": "Dual Wield",
  "sword-board": "Sword & Board",
  ranged: "Ranged",
  "double-shield": "Double Shield",
};
```

- [ ] **Step 2: Update `handleStanceChange` to clear family for double-shield**

```typescript
  function handleStanceChange(stance: WeaponStance | undefined) {
    const next = { ...constraints, stance };
    if (stance === "ranged") {
      next.family = "ranged";
    } else if (stance === "double-shield") {
      delete next.family;
    } else if (constraints.stance === "ranged" && constraints.family === "ranged") {
      delete next.family;
    }
    onChange(next);
  }
```

- [ ] **Step 3: Conditionally render weapon family chip group**

Wrap the family ChipGroup in a conditional so it hides when there are no valid families:

```tsx
          {validFamilies.length > 0 && (
            <>
              <div className="my-4 border-t border-border-dark" />

              <ChipGroup<WeaponFamily>
                label="Weapon Family"
                options={validFamilies.filter((f): f is WeaponFamily => ALL_FAMILIES.includes(f))}
                selected={constraints.family}
                labels={FAMILY_LABELS}
                onSelect={(family) => onChange({ ...constraints, family })}
              />
            </>
          )}
```

Also remove the existing standalone divider line (`<div className="my-4 border-t border-border-dark" />`) that was between the stance and family chip groups, since the divider is now included inside the conditional block.

- [ ] **Step 4: Commit**

```bash
git add src/components/fate/constraints-drawer.tsx
git commit -m "feat: constraints drawer support for double-shield stance"
```

---

### Task 10: Playstyle card display

**Files:**
- Modify: `src/components/fate/playstyle-card.tsx:33-42` (getCombatValue)
- Modify: `src/components/fate/playstyle-card.tsx:49-57` (getWeaponNoun)
- Modify: `src/components/fate/playstyle-card.tsx:65-94` (getTacticalSummary)

- [ ] **Step 1: Add double-shield case to `getCombatValue`**

Add after the `"ranged"` check (line 34):

```typescript
function getCombatValue(card: PlaystyleCard): string {
  if (card.stance === "ranged") return "Ranged";
  if (card.stance === "double-shield") return "Double Shield";
  if (card.stance === "sword-board")
    return `${SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]]} + Shield`;
  if (card.stance === "two-hand") return `Two-hand ${SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]]}`;
  const primary = SUB_GROUP_LABELS[card.subGroups[0]];
  if (card.subGroups[0] === card.subGroups[1]) return `Powerstance ${primary}`;
  const secondary = SUB_GROUP_LABELS[card.subGroups[1]];
  return `Dual-wield ${primary} & ${secondary}`;
}
```

- [ ] **Step 2: Add double-shield case to `getWeaponNoun`**

Add at the start of the function:

```typescript
function getWeaponNoun(card: PlaystyleCard): string {
  if (card.stance === "double-shield") return "shields";
  if (card.stance === "dual-wield" && card.subGroups[0] !== card.subGroups[1]) {
    return `${SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase()} and ${SUB_GROUP_LABELS[card.subGroups[1]].toLowerCase()}`;
  }
  if (card.stance === "two-hand" || card.stance === "sword-board") {
    return SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]].toLowerCase();
  }
  return SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase();
}
```

- [ ] **Step 3: Add double-shield case to `getTacticalSummary`**

Add the case in the switch statement:

```typescript
function getTacticalSummary(card: PlaystyleCard): string {
  const noun = getWeaponNoun(card);
  let weaponPart: string;
  switch (card.stance) {
    case "two-hand":
      weaponPart = `Grip your ${noun} with both hands for extra damage and stagger`;
      break;
    case "dual-wield":
      weaponPart =
        card.subGroups[0] === card.subGroups[1]
          ? `Powerstance ${noun} for relentless aggression`
          : `Dual-wield ${noun} for relentless aggression`;
      break;
    case "sword-board":
      weaponPart = `Pair your ${noun} with a shield for staying power`;
      break;
    case "ranged":
      weaponPart = `Strike from range, close to melee only when cornered`;
      break;
    case "double-shield":
      weaponPart = `Carry a shield in each hand — let them break against you`;
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

- [ ] **Step 4: Commit**

```bash
git add src/components/fate/playstyle-card.tsx
git commit -m "feat: playstyle card display for double-shield stance"
```

---

### Task 11: Build and verify

**Files:** None (verification only)

- [ ] **Step 1: Run type-check**

Run: `pnpm exec tsc --noEmit`

Expected: No type errors.

- [ ] **Step 2: Run linter**

Run: `pnpm lint`

Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 3: Run build**

Run: `pnpm build`

Expected: Successful build with no errors.

- [ ] **Step 4: Smoke test in browser**

Run: `pnpm dev`

Then open the Path of Fate page and:
1. Roll several times to verify normal stances still work.
2. Open the Constraints drawer, select "Double Shield" stance, and roll. Verify:
   - The playstyle card shows "Double Shield" in the Weapons pill.
   - The tactical summary reads "Carry a shield in each hand — let them break against you."
   - The flavor identity shows one of: Bulwark, Aegis, Bastion of Light, Fortress.
   - The generated build has shields in both hand slots (not weapons).
3. Verify that selecting a Weapon Family hides the "Double Shield" chip.
4. Verify that selecting "Double Shield" hides the Weapon Family section.
5. Share a double-shield build URL and reload — verify it decodes correctly.
