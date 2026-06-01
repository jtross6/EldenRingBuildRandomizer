# Guided Hand Refinements

Three improvements to the build generator: smarter weapon slot filling via loadout profiles, visible stat scaling info, and creative procedural build names.

## 1. Loadout Profiles

Replace the current "always fill 3 right + 3 left" weapon logic with a loadout profile system that determines how many weapons go where based on the build's character.

### Profiles

| Profile | Right Hand | Left Hand | Selection Trigger |
|---------|-----------|-----------|-------------------|
| **Pure Caster** | 1 Staff or Seal | 1 different Staff or Seal | INT or FTH > 0.6 in stat profile AND all seed items are spells/catalysts (no weapon/shield seeds) |
| **Spellblade** | 1 melee weapon | 1 Seal or Staff | INT or FTH > 0.15 AND at least 1 melee weapon in build |
| **Sword & Board** | 1-2 melee weapons | Shield | No caster stats (INT+FTH < 0.15) AND no ranged/colossal weapons |
| **Two-hander** | 1 weapon | (empty) | Seed weapon is Colossal Sword, Colossal Weapon, Great Hammer, Greataxe, or weight > 12 |
| **Powerstance** | 1 weapon of category X | 1 weapon of same category X | Two weapons of same category seeded, OR seed weapon category is Dagger, Curved Sword, Katana, Fist, Twinblade, Thrusting Sword |
| **Ranged** | 1 Bow/Crossbow/Light Bow | 1 melee backup | Seed weapon category is Bow, Light Bow, Crossbow, Greatbow, or Ballista |
| **Dual Wield** | 1 weapon | 1 different weapon | Fallback for quality/hybrid builds that don't match above |

### Profile Selection Logic

Evaluated in priority order (first match wins):
1. If seed contains two weapons of the same category → **Powerstance**
2. If seed weapon category is Bow/Light Bow/Crossbow/Greatbow/Ballista → **Ranged**
3. If seed weapon is Colossal Sword/Colossal Weapon/Great Hammer/Greataxe OR weapon weight > 12 → **Two-hander**
4. If INT or FTH > 0.6 and all seed items are spells/catalysts (no weapon/shield seeds) → **Pure Caster**
5. If seed weapon category is Dagger/Curved Sword/Katana/Fist/Twinblade/Thrusting Sword AND no shield/catalyst seeded → **Powerstance**
6. If INT or FTH > 0.15 → **Spellblade**
7. If no caster stats → **Sword & Board**
8. Otherwise → **Dual Wield**

### Powerstance Weapon Selection

When powerstancing, the second weapon is picked from the same category as the seed weapon. Score candidates from that category only, then pick via the standard creativity-gated selection. The second weapon should be different from the first (no duplicates).

### Build Output Changes

The `Build` type's `weaponsRight` and `weaponsLeft` arrays become variable length (0-2 items each instead of always 3). The UI already maps over these arrays, so shorter arrays naturally show fewer slots.

For Two-hander, `weaponsLeft` is empty (`[]`). For Pure Caster, `weaponsRight` might just be the catalyst index (treated as the "main hand" casting tool). The `catalyst` and `shield` fields on the Build remain for backwards compatibility with the viewer — they're set to -1 when unused.

## 2. Stat Profile Display

Show the build's stat scaling breakdown below the build name in the generate page UI.

### Display Rules

- Show stats with > 10% weight in the profile
- Render as horizontal bars with percentage labels
- Sort descending by weight
- Use gold-colored bar fill
- Below the bars, show a one-line summary: `"{Armor Class} · {Loadout Profile} Loadout"`

### Data Changes

The `GeneratedBuild` output type already includes `statProfile: Record<string, number>` and `armorClass`. Add a new field:
- `loadoutProfile: string` — the name of the selected loadout profile (e.g., "Spellblade", "Powerstance", "Two-hander")

### UI Component

New component `src/components/generator/stat-profile-display.tsx` that takes the stat profile, armor class, and loadout profile name, and renders the bars + summary line. Placed between `BuildIdentity` and the equipment sections.

Stat labels displayed as: STR, DEX, INT, FTH, ARC (abbreviated, uppercase, matching game conventions).

## 3. Creative Build Names

Replace the formulaic `"Item Name + Archetype"` namer with a template pool system that generates evocative names.

### Name Generation Strategy

The namer uses three inputs to produce a name:
1. **Damage type** of the seed weapon(s) → flavor vocabulary
2. **Weapon category** → role vocabulary  
3. **Archetype** (from stat profile) → class vocabulary

### Flavor Vocabulary

Damage type maps to adjective pools:

| Damage Type | Adjectives |
|-------------|-----------|
| physical | Savage, Iron, Steel, Stone, Brutal, Heavy |
| magic | Arcane, Glint, Moon, Crystal, Astral, Mystic |
| fire | Blazing, Flame, Inferno, Ember, Scorching, Molten |
| lightning | Storm, Thunder, Voltaic, Crackling, Tempest |
| holy | Sacred, Golden, Divine, Radiant, Hallowed, Celestial |
| bleed (status) | Crimson, Blood, Sanguine, Scarlet, Hemorrhage |
| frost (status) | Frozen, Rime, Glacial, Frostbitten, Winter |
| poison (status) | Venomous, Toxic, Blight, Serpent, Noxious |

### Role Vocabulary

Weapon category maps to role words:

| Category Group | Roles |
|---------------|-------|
| Dagger, Thrusting Sword | Shadow, Whisper, Sting, Needle |
| Straight Sword, Greatsword | Blade, Knight, Crusader, Sentinel |
| Colossal Sword, Colossal Weapon | Colossus, Titan, Juggernaut, Destroyer |
| Curved Sword, Katana | Dancer, Ronin, Slasher, Duelist |
| Hammer, Great Hammer, Flail | Breaker, Crusher, Smiter, Hammer |
| Axe, Greataxe | Cleaver, Executioner, Berserker, Ravager |
| Spear, Great Spear, Halberd | Lancer, Dragoon, Impaler, Warden |
| Fist, Claw | Brawler, Fang, Claw, Striker |
| Whip, Reaper | Reaper, Scourge, Harvester |
| Bow, Light Bow, Crossbow | Archer, Marksman, Sniper, Ranger |
| Twinblade | Dancer, Windcutter, Cyclone |
| Glintstone Staff | Sage, Sorcerer, Magus, Scholar |
| Sacred Seal | Prophet, Apostle, Herald, Cleric |

### Name Templates

The namer picks from template patterns, filled with vocabulary:

1. `"{Adjective} {Role}"` — "Blazing Crusader", "Arcane Dancer"
2. `"{Adjective} {Archetype}"` — "Crimson Assassin", "Frozen Warrior"
3. `"{ItemFlavor} {Role}"` — "Moonlight Sentinel", "Meteoric Colossus"
4. `"{Role} of {Element}"` — "Knight of Frost", "Dancer of Blood"
5. `"{Adjective}{Role}"` (compound) — "Stormblade", "Nightclaw", "Bloodfang"

`ItemFlavor` is derived from the seed item's name — extract evocative words (e.g., "Meteoric Ore Blade" → "Meteoric", "Dark Moon Greatsword" → "Moonlight" or "Dark Moon", "Rivers of Blood" → "Blood River" or "Crimson").

### Item Flavor Extraction

Parse the seed item name for usable flavor words:
- Split on spaces, take adjective-like words (first 1-2 words, excluding generic terms like "of", "the", "and")
- Map known item name patterns to shorter flavor forms (e.g., "Dark Moon Greatsword" → "Darkmoon", "Rivers of Blood" → "Bloodriver")
- If extraction produces nothing usable, fall back to damage-type adjective

### Selection

The seeded RNG picks: template pattern first, then fills each slot from the relevant vocabulary pool. Same seed always produces the same name. Multiple templates ensure variety across re-rolls.

### Community Name Matching (Bonus)

If the generated build's stat profile + weapon category closely matches a community build, there's a chance (weighted by co-occurrence score) to use that community build's name directly. E.g., if someone seeds Moonveil + Uchigatana and the result looks like the "Moonveil Shinobi" build, just use that name.

## Scope

**In scope:**
- Loadout profile system replacing fixed 3+3 weapon slots
- Stat profile display component with bars
- Loadout profile name in GeneratedBuild output
- Creative name generator with template pools
- Variable-length weapon arrays in build output

**Out of scope:**
- Changes to the Chaos Forge randomizer (still fully random)
- Changes to the build codec or sharing (existing builds with 3+3 still decode fine)
- Stat allocation recommendations
