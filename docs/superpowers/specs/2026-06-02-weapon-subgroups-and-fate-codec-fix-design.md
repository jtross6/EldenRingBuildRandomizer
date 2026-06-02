# Weapon Sub-Groups & Fate Codec Fix

## Problem

Two bugs in the Path of Fate feature:

1. **Build doesn't match playstyle card weapons.** The card says "Dual-wield Axes & Hammers" but the generated build can contain two axes and no hammer. The build generator pools all categories in a family and picks randomly without guaranteeing variety.

2. **Name changes on back-navigation.** The fate codec's `decodeFate` creates fresh RNGs for name/flavor/primaryStats, but the original generator uses a single RNG advanced through ~8 prior picks. The RNG state diverges, producing different names from the same seed.

## Design

### Data Model

A new `WeaponSubGroup` type is added as a union of ~23 string literals representing fine-grained weapon groupings within each family.

**Sub-group definitions:**

| Family | Sub-Group | Weapon Categories |
|---|---|---|
| light-blades | daggers | Dagger |
| light-blades | curved-swords | Curved Sword |
| light-blades | katanas | Katana |
| light-blades | thrusting-swords | Thrusting Sword, Heavy Thrusting Sword |
| light-blades | backhand-blades | Backhand Blade |
| light-blades | throwing-blades | Throwing Blade |
| heavy-blades | straight-swords | Straight Sword |
| heavy-blades | greatswords | Greatsword, Light Greatsword, Curved Greatsword |
| heavy-blades | great-katanas | Great Katana |
| colossal | colossal-swords | Colossal Sword |
| colossal | colossal-weapons | Colossal Weapon |
| axes-hammers | axes | Axe, Greataxe |
| axes-hammers | hammers | Hammer, Great Hammer, Flail |
| polearms | spears | Spear, Great Spear |
| polearms | halberds | Halberd |
| polearms | reapers | Reaper |
| agile-exotic | twinblades | Twinblade |
| agile-exotic | whips | Whip |
| agile-exotic | fist-weapons | Fist, Claw, Hand-to-Hand Art, Beast Claw |
| agile-exotic | torches | Torch |
| agile-exotic | perfume-bottles | Perfume Bottle |
| ranged | bows | Bow, Light Bow, Greatbow |
| ranged | crossbows | Crossbow, Ballista |

New taxonomy mappings:
- `SUB_GROUP_CATEGORIES: Record<WeaponSubGroup, string[]>` - sub-group to weapon categories
- `FAMILY_SUB_GROUPS: Record<WeaponFamily, WeaponSubGroup[]>` - family to its sub-groups
- `SUB_GROUP_LABELS: Record<WeaponSubGroup, string>` - display names

`PlaystyleCard` gains a new field: `subGroups: WeaponSubGroup[]` (1 entry for single-weapon stances, 2 for dual-wield).

### Playstyle Generation — Dual RNG Design

The generator uses two independent RNGs seeded from the same base seed:

- **Structural RNG** (`createRng(seed)`) — picks identity, stance, family, magic level, school, status effect, armor class. These are the fields encoded in the URL.
- **Derived RNG** (`createRng(seed ^ DERIVED_CONSTANT)`) — picks primaryStats, subGroups, name, flavor. These are display/derived fields reconstructed from the seed.

This separation is the key to the codec fix: since derived fields use their own RNG, the codec can reproduce them without replaying the structural generation path.

**Sub-group selection** (on the derived RNG, after primaryStats):
- **Single-weapon stances** (two-hand, sword-board, ranged): pick 1 sub-group from the family's sub-group list.
- **Dual-wield**: derived RNG rolls a float to decide powerstance vs mixed (60% powerstance, 40% mixed).
  - **Powerstance**: pick 1 sub-group, use it for both slots -> `subGroups: [sg, sg]`
  - **Mixed**: pick 2 different sub-groups -> `subGroups: [sg1, sg2]`

### Codec Fix (Bug 2)

`decodeFate` decodes structural fields from bytes (identity, stance, family, school, statusEffect, armorClass, seed), then creates the derived RNG (`createRng(seed ^ DERIVED_CONSTANT)`) and calls the same sequence of derived-field functions:

1. `pick(IDENTITY_STATS[identity], derivedRng)` -> primaryStats
2. Sub-group selection (same logic as generator) -> subGroups
3. `generateFateName(identity, stance, subGroups[0], school, statusEffect, derivedRng)` -> name
4. `generateFlavorText(identity, stance, family, school, statusEffect, derivedRng)` -> flavor

Since the derived RNG is seeded identically and the calls are in the same order with the same inputs (structural fields from the URL), the output is deterministic. No codec version bump needed.

This design is also robust to future changes: adding new structural fields or changing constraint logic won't affect derived field stability.

### Build Generator (Bug 1 Fix)

`filterWeaponsByFamily` is replaced with sub-group-aware filtering:

- **Single-weapon stances**: filter weapons by `SUB_GROUP_CATEGORIES[card.subGroups[0]]`
- **Dual-wield with same sub-group**: filter by that sub-group, pick 2 weapons
- **Dual-wield with different sub-groups**: pick 1 weapon from `SUB_GROUP_CATEGORIES[card.subGroups[0]]` for right hand, 1 from `SUB_GROUP_CATEGORIES[card.subGroups[1]]` for left hand

### UI Updates

**Playstyle card component** (`playstyle-card.tsx`):
- `getCombatValue` uses sub-group labels:
  - Same sub-group dual-wield: "Powerstance Katanas"
  - Mixed dual-wield: "Dual-wield Axes & Hammers"
  - Two-hand: "Two-hand Greatswords"
  - Sword-board: "Spears + Shield"
- `getTacticalSummary` and `FAMILY_NOUNS` update to use sub-group labels

**Fate namer** (`fate-namer.ts`):
- `FAMILY_ROLES` re-keyed from families to sub-groups so generated names reflect the specific weapon type (e.g., `"axes" -> ["Cleaver", "Executioner"]` vs `"hammers" -> ["Breaker", "Crusher"]`)
- `generateFateName` takes the card's primary sub-group instead of family

**Flavor text** (`flavor-text.ts`):
- `WEAPON_FRAGMENTS` stays keyed by family. The fragments are poetic and generic enough to work at the family level. Specificity comes from the tactical summary and stat pills.

**Constraints drawer**: No changes. Constraints operate at the family level. Sub-groups are a generation-time detail.

## Files Changed

- `src/types/fate.ts` - add `WeaponSubGroup` type, add `subGroups` field to `PlaystyleCard`
- `src/lib/fate/taxonomy.ts` - add `SUB_GROUP_CATEGORIES`, `FAMILY_SUB_GROUPS`, `SUB_GROUP_LABELS`
- `src/lib/fate/playstyle-generator.ts` - dual RNG design, sub-group selection with powerstance weighting, extract shared derived-field function
- `src/lib/fate/fate-codec.ts` - replace manual RNG replay with derived RNG + shared derived-field function
- `src/lib/fate/fate-build-generator.ts` - filter by sub-groups instead of family
- `src/lib/fate/fate-namer.ts` - re-key `FAMILY_ROLES` to sub-groups
- `src/components/fate/playstyle-card.tsx` - update `getCombatValue`, `getTacticalSummary`, `FAMILY_NOUNS`
