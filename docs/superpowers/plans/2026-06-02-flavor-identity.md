# Flavor Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic "Warrior"/"Spellcaster" subtitles on Path of Fate builds with curated archetype titles like "Samurai", "Paladin", "Bonecrusher" based on the build's loadout.

**Architecture:** A flat rule list in a new `flavor-identity.ts` file, evaluated top-to-bottom (first match wins). Rules specify optional match criteria (sub-group, stance, identity, school); `undefined` means "match any". The resolved title is stored as `flavorIdentity` on `PlaystyleCard` and displayed in place of the old identity label. No codec change needed — the title is deterministic from existing fields.

**Tech Stack:** TypeScript, React

---

### Task 1: Create the flavor identity module

**Files:**
- Create: `src/lib/fate/flavor-identity.ts`

- [ ] **Step 1: Create `src/lib/fate/flavor-identity.ts` with the rule list and resolver**

```typescript
import type {
  CombatIdentity,
  WeaponStance,
  WeaponSubGroup,
  MagicSchool,
} from "../../types/fate";

interface FlavorRule {
  subGroup?: WeaponSubGroup | WeaponSubGroup[];
  stance?: WeaponStance | WeaponStance[];
  identity?: CombatIdentity | CombatIdentity[];
  school?: MagicSchool | MagicSchool[];
  title: string;
}

function matches<T>(value: T, criterion: T | T[] | undefined): boolean {
  if (criterion === undefined) return true;
  if (Array.isArray(criterion)) return criterion.includes(value);
  return value === criterion;
}

const FLAVOR_RULES: FlavorRule[] = [
  // --- Specific weapon combos (sub-group + stance + school/identity) ---

  // Straight swords + sword-board + school
  { subGroup: "straight-swords", stance: "sword-board", school: "golden-order", title: "Paladin" },
  { subGroup: "straight-swords", stance: "sword-board", school: "fire", title: "Crusader" },
  { subGroup: "straight-swords", stance: "sword-board", school: "lightning", title: "Templar" },
  { subGroup: "straight-swords", stance: "sword-board", identity: "warrior", title: "Knight" },

  // Greatswords + stance + identity
  { subGroup: "greatswords", stance: "two-hand", identity: "warrior", title: "Greatknight" },

  // Hammers + sword-board + school
  { subGroup: "hammers", stance: "sword-board", school: "golden-order", title: "Templar" },
  { subGroup: "hammers", stance: "sword-board", school: "fire", title: "Inquisitor" },
  { subGroup: "hammers", stance: "sword-board", identity: "warrior", title: "Bulwark" },

  // Hammers + spellblade + school
  { subGroup: "hammers", identity: "spellblade", school: "golden-order", title: "Cleric" },

  // Fist + dual-wield + warrior
  { subGroup: "fist-weapons", stance: "dual-wield", identity: "warrior", title: "Brawler" },

  // --- Sub-group + stance combos ---

  // Katanas + stance + identity
  { subGroup: "katanas", stance: ["two-hand", "dual-wield"], identity: "warrior", title: "Samurai" },

  // Curved swords
  { subGroup: "curved-swords", stance: "dual-wield", title: "Dervish" },

  // Thrusting swords
  { subGroup: "thrusting-swords", stance: "sword-board", title: "Fencer" },

  // Greatswords + stance
  { subGroup: "greatswords", stance: "dual-wield", title: "Berserker" },
  { subGroup: "greatswords", stance: "sword-board", title: "Sentinel" },

  // Axes + stance
  { subGroup: "axes", stance: "dual-wield", title: "Berserker" },
  { subGroup: "axes", stance: "sword-board", title: "Warlord" },

  // Spears + stance
  { subGroup: "spears", stance: "sword-board", title: "Legionnaire" },

  // Halberds + stance
  { subGroup: "halberds", stance: "sword-board", title: "Warden" },

  // Twinblades + stance
  { subGroup: "twinblades", stance: "dual-wield", title: "Tempest" },

  // --- Sub-group + identity combos ---

  { subGroup: "katanas", identity: "skirmisher", title: "Shinobi" },
  { subGroup: "katanas", identity: "spellblade", title: "Kensei" },

  { subGroup: "great-katanas", identity: "warrior", title: "Shogun" },
  { subGroup: "great-katanas", identity: "skirmisher", title: "Ronin" },
  { subGroup: "great-katanas", identity: "spellblade", title: "Sword Saint" },

  { subGroup: "daggers", identity: "skirmisher", title: "Assassin" },
  { subGroup: "daggers", identity: "spellblade", title: "Nightblade" },

  { subGroup: "backhand-blades", identity: "skirmisher", title: "Assassin" },

  { subGroup: "curved-swords", identity: "skirmisher", title: "Corsair" },

  { subGroup: "thrusting-swords", identity: "spellblade", title: "Spellsword" },

  { subGroup: "straight-swords", identity: "spellblade", title: "Spellsword" },

  { subGroup: "greatswords", identity: "spellblade", title: "Dark Knight" },

  { subGroup: "colossal-swords", identity: "spellblade", title: "Abyssal Knight" },

  { subGroup: "axes", identity: "skirmisher", title: "Marauder" },

  { subGroup: "spears", identity: "skirmisher", title: "Dragoon" },

  { subGroup: "reapers", identity: "skirmisher", title: "Deathbringer" },

  { subGroup: "twinblades", identity: "spellblade", title: "Spell Dancer" },

  { subGroup: "whips", identity: "skirmisher", title: "Scourge" },

  { subGroup: "fist-weapons", identity: "spellblade", title: "Monk" },

  { subGroup: "bows", identity: "skirmisher", title: "Scout" },
  { subGroup: "bows", identity: "spellblade", title: "Arcane Archer" },

  { subGroup: "crossbows", identity: "skirmisher", title: "Sharpshooter" },

  // --- Sub-group + school combos ---

  { subGroup: "katanas", school: "night", title: "Shinobi" },
  { subGroup: "katanas", school: "blood", title: "Blood Ronin" },

  { subGroup: "daggers", school: "night", title: "Shadow" },
  { subGroup: "daggers", school: "blood", title: "Blood Thorn" },

  { subGroup: "reapers", school: "blackflame", title: "Godskin" },

  { subGroup: "whips", school: "golden-order", title: "Penitent" },

  { subGroup: "fist-weapons", school: ["golden-order", "bestial"], title: "Monk" },

  // --- Spellcaster + school overrides (no sub-group constraint) ---

  { identity: "spellcaster", school: "glintstone", title: "Astrologer" },
  { identity: "spellcaster", school: "moon-frost", title: "Cryomancer" },
  { identity: "spellcaster", school: "gravity", title: "Stargazer" },
  { identity: "spellcaster", school: "night", title: "Nightseer" },
  { identity: "spellcaster", school: "aberrant", title: "Heretic" },
  { identity: "spellcaster", school: "golden-order", title: "Oracle" },
  { identity: "spellcaster", school: "blackflame", title: "Godskin Apostle" },
  { identity: "spellcaster", school: "dragon", title: "Dragon Priest" },
  { identity: "spellcaster", school: "lightning", title: "Stormcaller" },
  { identity: "spellcaster", school: "bestial", title: "Beast Shaman" },
  { identity: "spellcaster", school: "fire", title: "Prophet" },
  { identity: "spellcaster", school: "blood", title: "Hemomancer" },
  { identity: "spellcaster", school: "frenzied-flame", title: "Madman" },

  // --- Sub-group fallbacks ---

  { subGroup: "katanas", title: "Ronin" },
  { subGroup: "great-katanas", title: "Shogun" },
  { subGroup: "daggers", title: "Rogue" },
  { subGroup: "backhand-blades", title: "Reaver" },
  { subGroup: "throwing-blades", title: "Trickster" },
  { subGroup: "curved-swords", title: "Dancer" },
  { subGroup: "thrusting-swords", title: "Duelist" },
  { subGroup: "straight-swords", title: "Swordsman" },
  { subGroup: "greatswords", title: "Greatknight" },
  { subGroup: "colossal-swords", title: "Titan" },
  { subGroup: "colossal-weapons", title: "Juggernaut" },
  { subGroup: "axes", title: "Executioner" },
  { subGroup: "hammers", title: "Bonecrusher" },
  { subGroup: "spears", title: "Lancer" },
  { subGroup: "halberds", title: "Vanguard" },
  { subGroup: "reapers", title: "Harvester" },
  { subGroup: "twinblades", title: "Windcutter" },
  { subGroup: "whips", title: "Flagellant" },
  { subGroup: "fist-weapons", title: "Pugilist" },
  { subGroup: "torches", title: "Firebrand" },
  { subGroup: "perfume-bottles", title: "Alchemist" },
  { subGroup: "bows", title: "Archer" },
  { subGroup: "crossbows", title: "Arbalist" },

  // --- Identity fallbacks (ultimate safety net) ---

  { identity: "warrior", title: "Warrior" },
  { identity: "spellcaster", title: "Sorcerer" },
  { identity: "spellblade", title: "Spellblade" },
  { identity: "skirmisher", title: "Skirmisher" },
];

export function resolveFlavorIdentity(
  subGroup: WeaponSubGroup,
  stance: WeaponStance,
  identity: CombatIdentity,
  school: MagicSchool | null,
): string {
  for (const rule of FLAVOR_RULES) {
    if (!matches(subGroup, rule.subGroup)) continue;
    if (!matches(stance, rule.stance)) continue;
    if (!matches(identity, rule.identity)) continue;
    if (rule.school !== undefined && (school === null || !matches(school, rule.school))) continue;
    return rule.title;
  }
  return "Tarnished";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/fate/flavor-identity.ts
git commit -m "feat: add flavor identity rule engine with ~75 curated archetype titles"
```

---

### Task 2: Wire flavor identity into the type, generator, and UI

**Files:**
- Modify: `src/types/fate.ts:60-72` — add `flavorIdentity` field to `PlaystyleCard`
- Modify: `src/lib/fate/playstyle-generator.ts:27,71-96,142-163` — import + call `resolveFlavorIdentity`, add to return
- Modify: `src/components/fate/playstyle-card.tsx:23-28,186` — remove `IDENTITY_LABELS`, use `card.flavorIdentity`

- [ ] **Step 1: Add `flavorIdentity` to `PlaystyleCard` in `src/types/fate.ts`**

Add `flavorIdentity: string;` after the `flavor: string;` line in the `PlaystyleCard` interface:

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
  flavorIdentity: string;
  seed: number;
}
```

- [ ] **Step 2: Call `resolveFlavorIdentity` in `deriveDynamicFields` in `src/lib/fate/playstyle-generator.ts`**

Add the import at line 27:

```typescript
import { resolveFlavorIdentity } from "./flavor-identity";
```

Update `deriveDynamicFields` return type and body. After the existing `flavor` computation (line 85-93), add:

```typescript
  const flavorIdentity = resolveFlavorIdentity(subGroups[0], stance, identity, school);
```

Update the return type to include `flavorIdentity: string` and the return object to include `flavorIdentity`.

Updated function signature and return:

```typescript
export function deriveDynamicFields(
  identity: CombatIdentity,
  stance: WeaponStance,
  family: WeaponFamily,
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
  const subGroups = pickSubGroups(family, stance, rng);
  const name = generateFateName(identity, stance, subGroups[0], school, statusEffect, rng);
  const flavor = generateFlavorText(
    identity,
    stance,
    family,
    school,
    statusEffect,
    rng,
    subGroups[0],
  );
  const flavorIdentity = resolveFlavorIdentity(subGroups[0], stance, identity, school);

  return { primaryStats, subGroups, name, flavor, flavorIdentity };
}
```

In `generatePlaystyle`, destructure the new field and add to the return object:

```typescript
  const { primaryStats, subGroups, name, flavor, flavorIdentity } = deriveDynamicFields(
    // ... existing args
  );

  return {
    // ... existing fields
    flavorIdentity,
    seed,
  };
```

- [ ] **Step 3: Display `card.flavorIdentity` in `src/components/fate/playstyle-card.tsx`**

Remove the `IDENTITY_LABELS` constant (lines 23-28) since it's no longer used.

Change line 186 from:

```typescript
  const subtitle = IDENTITY_LABELS[card.identity];
```

to:

```typescript
  const subtitle = card.flavorIdentity;
```

- [ ] **Step 4: Build and format**

```bash
pnpm build
pnpm format
```

Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/fate.ts src/lib/fate/playstyle-generator.ts src/components/fate/playstyle-card.tsx
git commit -m "feat: wire flavor identity into generator and display"
```

---

### Task 3: Verify in browser

**Files:** None (manual verification)

- [ ] **Step 1: Start dev server and verify**

```bash
pnpm dev
```

Navigate to the Path of Fate page. Test these combinations by constraining:

1. **Two-hand + Axes & Hammers + Magic: None** → Subtitle should show "Bonecrusher" or "Executioner" (not "Warrior")
2. **Sword & Board + Axes & Hammers + Magic: None** → "Bulwark" or "Warlord"
3. **Two-hand + Light Blades + Magic: None** → Should show sub-group-specific titles like "Samurai", "Duelist", "Dancer", etc.
4. **Any + Any + Magic: Primary** → For spellcaster identity, should show school-specific titles like "Astrologer", "Prophet", etc.
5. **Sword & Board + Heavy Blades + Golden Order** → Should show "Paladin"
6. **Unconstrained rolls** → Roll 5-10 times, verify subtitles are always thematic and never show the old generic labels

- [ ] **Step 2: Take a screenshot showing a flavor identity**

Save to `.playwright/flavor-identity/` for reference.
