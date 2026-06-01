# Synergy-Based Build Generator

A heuristic build generator that takes one or more seed items and produces a coherent, synergy-aware equipment loadout. Uses item stat data as the primary signal and community build co-occurrence data to fill gaps where structured metadata is insufficient (especially talismans). Fully client-side, deterministic via seeded RNG, with a configurable creativity slider.

## Goals

- Given seed items (weapons, spells, ashes of war, talismans), generate a build that makes mechanical sense
- Strength weapons should pair with strength-scaling ashes, physical talismans, and buff incantations — not intelligence sorceries
- Armor is recommended as a weight class (light/medium/heavy), not specific pieces
- A creativity slider (0-100) controls how tightly the generator sticks to optimal synergy vs. allowing variety
- Builds are reproducible via a numeric seed
- The result is viewable in a build display that reuses existing UI components

## Data Layer

### Enriched Slim Data

Expand `scripts/generate-slim-data.ts` to include heuristic-relevant fields from the raw source data. The existing slim fields (name, category, weight, fpCost, slotsUsed) are preserved; new fields are added alongside them.

**Weapons / Shields / Catalysts** gain:
- `scaling`: `Record<string, number>` — stat scaling coefficients from `affinity.Standard.scaling` (e.g., `{strength: 0.12, dexterity: 0.5, intelligence: 0.6}`)
- `requirements`: `Record<string, number>` — minimum stat requirements (e.g., `{strength: 12, dexterity: 18, intelligence: 23}`)
- `damageTypes`: `string[]` — from `affinity.Standard.damage` keys with nonzero values (e.g., `["physical", "magic"]`)
- `statusEffects`: `Record<string, number>` — from `affinity.Standard.status_effects` (e.g., `{bleed: 50}`)
- `allowAshOfWar`: `boolean`
- `defaultSkillId`: `number`

DLC weapons have a different raw format (letter grades for scaling, string stat keys). The generate script normalizes these to match the base-game numeric format. Letter grades map to approximate numeric values: S=1.5, A=1.0, B=0.75, C=0.5, D=0.25, E=0.1.

**Spells** gain:
- `requirements`: `Record<string, number>` — e.g., `{faith: 47}` or `{intelligence: 19, arcane: 15}`

**Ashes of War** gain:
- `armamentCategories`: `string[]` — weapon categories this ash can be applied to
- `defaultAffinity`: `string` — e.g., `"Heavy"`, `"Keen"`, `"Sacred"`
- `possibleAffinities`: `string[]`

**Talismans** remain unchanged in slim data. They have no structured effect metadata in the raw source — only text descriptions. Their selection relies on the co-occurrence index.

### Community Builds

The 104 builds extracted from the Fextralife wiki are stored in `data/fextralife-all-builds.json` (already captured). A processing script (`scripts/process-community-builds.ts`) transforms this raw extract into `data/community-builds.json` with normalized structure:

```typescript
interface CommunityBuild {
  id: string;              // e.g., "duelswordduelist"
  name: string;            // e.g., "Duel Sword Duelist"
  class: string;           // starting class recommendation
  primaryStats: string[];  // e.g., ["dexterity", "vigor"]
  secondaryStats: string[];
  weapons: string[];       // all weapon names (main + off-hand + alternates)
  shield: string | null;
  armor: string[];         // specific armor piece names
  talismans: string[];     // primary + alternate talismans
  skills: string[];        // ash of war skill names
  spells: string[];        // sorceries + incantations
}
```

Field normalization rules:
- `Weapon`, `Main Weapon`, `Off-Hand Weapon`, `Alternate Weapon`, `Optional Off-Hand Weapon`, `Optional Off-Hand` all merge into `weapons[]`
- `Talismans`, `Alternate Talismans`, `Talismans:`, `Alternate Talismans:` merge into `talismans[]`
- `Spells`, `Support Spells`, `Main Spells`, `Other Spells`, `Primary Spells`, `Alternate Spells` merge into `spells[]`
- `Skills`, `Alternate Skill`, `Alternate Skills` merge into `skills[]`
- `Primary Stats`, `Secondary Stats` (and their colon-typo variants) normalize stat names to lowercase
- `N/A`, `n/a`, `None`, `none` values map to null/empty
- Item names come from the `items` array (wiki link text) when available, falling back to the `value` text

### Co-occurrence Index

Generated at build time by `scripts/generate-co-occurrence.ts`, output to `src/data/co-occurrence.json`.

Structure: a map from item name to a map of co-occurring item names and their frequency counts.

```json
{
  "Shard of Alexander": {
    "Moonveil": 3,
    "Rivers of Blood": 2,
    "Golden Vow": 5,
    ...
  }
}
```

Only items that appear in at least 2 community builds are indexed. Items are keyed by their exact name as it appears in the slim data arrays.

Name matching between community builds and slim data uses case-insensitive comparison with fallback to fuzzy matching (longest common substring) for wiki typos.

## Heuristic Engine

### Module: `src/lib/build-generator.ts`

### Input

```typescript
interface GeneratorInput {
  seedItems: SeedItem[];  // 1+ items the user selected
  creativity: number;     // 0-100
  seed: number;           // RNG seed for determinism
}

interface SeedItem {
  name: string;
  type: 'weapon' | 'shield' | 'catalyst' | 'spell' | 'ashOfWar' | 'talisman';
}
```

### Step 1: Stat Profile Extraction

Compute a weighted stat map from the seed items by combining their scaling values (weapons/catalysts/shields) and requirements (spells/ashes).

For weapons/catalysts/shields: use `scaling` values directly.
For spells: use `requirements` as proxies for scaling (a spell requiring 47 faith implies faith investment).
For ashes of war: use `defaultAffinity` to infer stat focus (Heavy -> strength, Keen -> dexterity, Sacred -> faith, Magic/Cold -> intelligence, Blood/Occult -> arcane, Fire/Flame Art -> faith+strength, Quality -> strength+dexterity).
For talismans: contribute no stat signal (no structured data).

Sum all stat values, then normalize so they sum to 1.0. This produces the build's stat profile, e.g.:
```
{ strength: 0.05, dexterity: 0.35, intelligence: 0.0, faith: 0.0, arcane: 0.60 }
```

### Step 2: Candidate Scoring

For each unfilled equipment slot, score every candidate item:

**Stat affinity score (weight: 0.6):**
Dot product of the item's normalized scaling/requirements vector with the build's stat profile. Higher = better match. Items with zero overlap score 0.

**Co-occurrence score (weight: 0.3):**
For each seed item, look up the candidate in the co-occurrence index. Sum the frequency counts. Normalize against the max co-occurrence score in this candidate pool.

**Damage/effect synergy score (weight: 0.1):**
Bonus for matching damage types (fire weapon + fire spell), matching status effects (bleed weapon + bleed ash), or complementary roles (seal in off-hand when build has incantations).

### Step 3: Creativity-Gated Selection

Sort candidates by total weighted score descending. The creativity value determines the eligible pool:

- `eligiblePercent = 10 + (creativity * 0.9)` — ranges from 10% (creativity=0) to 100% (creativity=100)
- Take the top `eligiblePercent` of candidates
- Use the seeded RNG to pick from this pool, weighted by score (higher-scored items are still more likely even at high creativity)

### Step 4: Slot Filling Order

1. Additional weapons (right hand / left hand) — informed by whether seed items suggest dual-wielding, staff+weapon, seal+weapon, or shield+weapon
2. Catalyst — if stat profile has intelligence or faith above a threshold (0.15), include one; otherwise skip
3. Shield — if build has no off-hand weapon/catalyst and stat profile suggests endurance, include one; otherwise skip
4. Talismans (4) — heavily reliant on co-occurrence since talismans lack stat metadata
5. Ashes of War (up to 3) — filtered by `armamentCategories` matching the build's weapon categories, then scored by affinity match
6. Spells (sorceries if INT, incantations if FTH, both if hybrid) — filtered by stat requirements the build can meet, up to ~4 spell slots
7. Armor class — determined last (see below)

### Step 5: Armor Class Determination

Rather than picking specific armor pieces, determine a weight class recommendation:

Look at the build's stat profile for endurance signals:
- If the build is primarily a caster (INT/FTH/ARC dominant, > 0.6 combined) and weapons are light (< 8 weight) -> **Light**
- If the build has significant strength (> 0.25) or uses heavy weapons (> 12 weight) -> **Heavy**
- Otherwise -> **Medium**

Community build data can supplement this: if most community builds with similar stat profiles use heavy armor, weight toward heavy.

### Step 6: Output

```typescript
interface GeneratedBuild {
  build: Build;            // compatible with existing Build type / codec
  armorClass: 'light' | 'medium' | 'heavy';
  statProfile: Record<string, number>;
  buildName: string;       // auto-generated, e.g., "Moonveil Spellblade"
}
```

The `Build` object's armor indices (helm, chest, gauntlets, legs) are set to sentinel values (e.g., -1) to indicate "use armor class recommendation" rather than specific pieces. The generate page's build display handles this sentinel by displaying the armor class label instead of individual armor slots.

The `buildName` is auto-generated by combining the primary seed item's name with an archetype descriptor derived from the stat profile. Archetype labels: "Spellblade" (INT+DEX), "Paladin" (FTH+STR), "Assassin" (DEX+ARC), "Sorcerer" (INT dominant), "Prophet" (FTH dominant), "Warrior" (STR dominant), "Ronin" (DEX dominant), "Blood Mage" (ARC dominant), "Battlemage" (INT+STR), "Quality" (STR+DEX balanced). Example: seed item "Moonveil" + profile {dex: 0.35, int: 0.42} -> "Moonveil Spellblade".

### Seeded RNG

Use a simple, fast PRNG like mulberry32 or xoshiro128. The seed is a 32-bit integer. Each selection step advances the RNG state, so the same seed + same inputs always produces the same build.

## UI: `/generate` Route

### Page Layout

A new page at `/generate` route, styled identically to the existing build viewer (dark/gold palette, Cinzel headings, category gradients).

**Input Section (top):**
- **Item search** — autocomplete text input that searches across all item arrays (weapons, shields, catalysts, talismans, ashes of war, sorceries, incantations). Selected items appear as removable chips/tags below the input. Category icon on each chip.
- **Creativity slider** — horizontal range input (0-100) with label. Styled with gold accent. Adjustable at any time; changing it and re-rolling produces a different build.
- **Seed display** — small text showing the current numeric seed. Click to edit for reproducibility. Auto-generates a random seed on page load and on each re-roll.
- **"Generate" / "Re-roll" button** — generates a new build. On first use with fresh inputs, labeled "Generate". After first result, labeled "Re-roll" (generates new seed, same inputs + creativity).

**Build Display Section (bottom):**
- Reuses `BuildIdentity`, `EquipmentSection`, `ItemSlot` components from the existing build viewer
- Armor section shows weight class badge (e.g., "Medium Armor") styled as a single card rather than 4 individual armor piece slots
- A "Share" button encodes the generated build via the existing codec into a `?build=` URL pointing to the main viewer route, so shared builds are viewable without the generator

### Visual Styling

Matches the existing Elden Ring theme exactly:
- Dark background (`bg-bg-base`), gold accents (`text-gold-light`, `border-gold-dim`)
- Cinzel font for headings, Inter for body
- Category-specific gradient backgrounds on item chips (`cat-weapon`, `cat-armor`, etc.)
- Input fields use dark card background with gold border on focus
- Slider track in muted gold, thumb in bright gold
- Smooth fade-in animation on build result (reuse `animate-fade-in`)
- Fixed bottom action bar consistent with existing page

### Routing

Add `/generate` as a new route in `src/router.ts` via TanStack Router. No search params needed — state is local. Add navigation between `/` and `/generate` (e.g., a nav link or button in the layout/action bar).

## Data Pipeline Summary

Build-time scripts (run via `pnpm generate-data` or separate commands):

1. `scripts/generate-slim-data.ts` — **modified** to emit enriched slim JSON with scaling, requirements, damage types, etc.
2. `scripts/process-community-builds.ts` — **new**, transforms `data/fextralife-all-builds.json` into `data/community-builds.json`
3. `scripts/generate-co-occurrence.ts` — **new**, reads `data/community-builds.json` + slim data, outputs `src/data/co-occurrence.json`

The community builds raw extract (`data/fextralife-all-builds.json`) is checked into the repo as source data alongside `data/base-game/` and `data/dlc/`.

## Scope Boundaries

**In scope:**
- Enriched slim data generation
- Community build normalization and co-occurrence indexing
- Heuristic build generator engine
- New `/generate` page with inputs and build display
- Armor weight class recommendation
- Seeded RNG for reproducibility
- Share button producing viewer-compatible URLs

**Out of scope (future work):**
- LLM-powered generation via OpenRouter proxy
- Community build weights (rating/popularity — all builds are weighted equally)
- Stat allocation recommendations (specific level/stat spread)
- Crystal Tears and Great Runes (not in current Build type)
- User accounts or saved builds
