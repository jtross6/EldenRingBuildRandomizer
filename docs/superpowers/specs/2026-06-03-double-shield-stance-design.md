# Double Shield Stance & Weighted Stance Selection

## Summary

Add a `"double-shield"` weapon stance to the Path of Fate system that places a shield in each hand. Simultaneously rebalance stance selection from uniform random to weighted random to prevent ranged builds from dominating output and to keep double-shield appropriately rare.

## Type Changes

### `src/types/fate.ts`

- `WeaponStance` gains `"double-shield"`.
- `PlaystyleCard.family` becomes `WeaponFamily | null` (null when stance is `"double-shield"`).
- `PlaystyleCard.subGroups` is `[]` (empty array) when stance is `"double-shield"`.
- `PlaystyleConstraint.stance` already accepts `WeaponStance | undefined` — no change needed.

## Taxonomy & Constraint Logic

### `src/lib/fate/taxonomy.ts`

- Append `"double-shield"` to `ALL_STANCES` (index 4).
- `getValidStances(family)`: when family is `null` or `undefined`, include `"double-shield"`. When a specific family is set, exclude `"double-shield"`.
- `getValidFamilies(stance)`: when stance is `"double-shield"`, return `[]` (empty array).
- `deriveArmorClass(identity, family)`: when family is `null`, default to `"heavy"`. User can still override via the armor class constraint.

## Weighted Stance Selection

### `src/lib/fate/playstyle-generator.ts`

Replace uniform `pick(stancePool, rng)` with a `weightedPick` utility.

Default weights (no constraints):

| Stance | Weight | Effective % |
|--------|--------|-------------|
| `two-hand` | 30 | ~30.3% |
| `dual-wield` | 30 | ~30.3% |
| `sword-board` | 30 | ~30.3% |
| `ranged` | 8 | ~8.1% |
| `double-shield` | 1 | ~1.0% |

When a stance constraint is set, the constraint overrides and the user gets exactly that stance.

When a family constraint is set, `"double-shield"` is excluded from the pool and weights are recalculated among the remaining valid stances (preserving relative proportions). Same logic applies to `"ranged"` exclusion when a non-ranged family is constrained.

The `weightedPick` utility takes an array of `{ value: T, weight: number }` pairs and a `SeededRng`, sums weights, picks a random point in the total, and returns the corresponding value.

## Playstyle Generator

### `src/lib/fate/playstyle-generator.ts`

When stance resolves to `"double-shield"`:

- Skip family resolution — set `family` to `null`.
- Skip sub-group resolution — `subGroups` is `[]`.
- Magic/school resolution proceeds normally (any identity is allowed).
- Status effect, armor class, and identity resolve through existing paths.

### `src/lib/fate/playstyle-generator.ts` — `deriveDynamicFields`

When family is `null`:

- `subGroups` is `[]` (skip `pickSubGroups`).
- Name generation uses shield-specific role pools (see Naming section).
- Flavor text uses shield-specific fragments (see Naming section).

## Build Generator

### `src/lib/fate/fate-build-generator.ts`

New `"double-shield"` case in the stance switch block:

- Pick two distinct shields from the shield pool (79 shields). First goes to `rightHand` as `{ type: "shield", index }`, second goes to `leftHand` as `{ type: "shield", index }`.
- No weapon is placed in either hand.
- Ash of war logic needs a minor adjustment: the current code filters equipped items to `ref.type === "weapon"` and indexes into the `weapons` array. For double-shield builds, expand the filter to also include `ref.type === "shield"` and use `lookupArmament` (or index into the `shields` array) to check `allowAshOfWar` on shield refs. Many shields have `allowAshOfWar: true` in the data, so this will produce ashes naturally.
- Catalyst placement (staff/seal for magic users) goes to `leftHand` as a third slot, same as other stances.

## Naming & Flavor

### Shield-specific name pools — `src/lib/fate/fate-namer.ts`

New role pool for shield stance (used in place of `SUB_GROUP_ROLES` when stance is `"double-shield"`):

```
"Bulwark", "Fortress", "Rampart", "Bastion", "Shield Wall", "Ironclad", "Phalanx", "Aegis"
```

When stance is `"double-shield"`, `generateFateName` uses this pool instead of sub-group roles. Identity roles are used unchanged.

### Flavor identity — `src/lib/fate/flavor-identity.ts`

New `FLAVOR_RULES` entries keyed on stance:

- `{ stance: "double-shield", identity: "warrior", title: "Bulwark" }`
- `{ stance: "double-shield", identity: "spellblade", title: "Aegis" }`
- `{ stance: "double-shield", school: "golden-order", title: "Bastion of Light" }`
- `{ stance: "double-shield", title: "Fortress" }` (fallback)

### Flavor text — `src/lib/fate/flavor-text.ts`

New shield-specific weapon fragments (used when family is `null`):

- "Two shields — offense is for the reckless."
- "Why dodge when you can simply deny?"
- "An impenetrable wall of steel and faith."
- "Let them strike. Let them tire. Then walk through them."

The noun resolves to `"shield"` instead of pulling from `SUB_GROUP_NOUNS`.

## Codec

### `src/lib/fate/fate-codec.ts`

No version bump. Changes:

- `ALL_STANCES` already updated at index 4 — existing encoded fates (indices 0-3) decode identically.
- Family byte: when family is `null`, store `0xFF` as sentinel. On decode, check for `0xFF` before indexing into `ALL_FAMILIES` and set family to `null`.
- Relax the decoder validation: `!family` check must allow `null` when stance is `"double-shield"`.

## Constraints Drawer

### `src/components/fate/constraints-drawer.tsx`

- `"double-shield"` appears in the Weapon Stance chip group with label **"Double Shield"**.
- When `"double-shield"` is selected, the Weapon Family chip group is hidden (no valid families).
- When a family constraint is set, `"double-shield"` is excluded from the stance options (via `getValidStances`).

## Playstyle Card Display

### `src/components/fate/playstyle-card.tsx`

- `getCombatValue(card)`: new case for `"double-shield"` returns `"Double Shield"`.
- `getTacticalSummary(card)`: new case returns `"Carry a shield in each hand — let them break against you"`.

## Files Changed

1. `src/types/fate.ts` — type updates
2. `src/lib/fate/taxonomy.ts` — new stance, constraint logic, armor class derivation
3. `src/lib/fate/playstyle-generator.ts` — weighted stance selection, null-family handling
4. `src/lib/fate/fate-build-generator.ts` — double-shield build case
5. `src/lib/fate/fate-namer.ts` — shield name pools
6. `src/lib/fate/flavor-identity.ts` — shield flavor rules
7. `src/lib/fate/flavor-text.ts` — shield fragments and noun
8. `src/lib/fate/fate-codec.ts` — null-family encoding/decoding
9. `src/components/fate/constraints-drawer.tsx` — UI for new stance
10. `src/components/fate/playstyle-card.tsx` — display for new stance
