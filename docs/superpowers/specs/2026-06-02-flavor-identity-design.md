# Flavor Identity for Path of Fate Builds

Replace the generic combat identity subtitle ("Warrior", "Spellcaster", etc.) with a curated, loadout-specific archetype title like "Samurai", "Paladin", or "Bonecrusher".

## Architecture

New file `src/lib/fate/flavor-identity.ts` containing:

1. A flat rule list ordered most-specific first
2. A `resolveFlavorIdentity()` lookup function that returns the first matching rule's title

### Rule Shape

```typescript
interface FlavorRule {
  subGroup?: WeaponSubGroup | WeaponSubGroup[];
  stance?: WeaponStance | WeaponStance[];
  school?: MagicSchool | MagicSchool[];
  identity?: CombatIdentity | CombatIdentity[];
  title: string;
}
```

- `undefined` fields match any value
- Array fields match if the build's value is in the array
- First matching rule wins; order matters

### Integration

- Add `flavorIdentity: string` field to `PlaystyleCard` in `src/types/fate.ts`
- Compute in `deriveDynamicFields()` in `playstyle-generator.ts` (deterministic, no RNG consumed)
- Call `resolveFlavorIdentity()` after `pickSubGroups()` so sub-group is available
- Display in `playstyle-card.tsx` in place of `IDENTITY_LABELS[card.identity]`
- Add to build codec if `flavorIdentity` needs to survive URL sharing; however, since it's deterministic from the other fields, it can be re-derived on decode (no codec change needed)

### Rule Priority Order

Rules are evaluated top-to-bottom. The list is organized in this order:

1. **Specific weapon combos** (sub-group + stance + school) - e.g., straight-swords + sword-board + golden-order = Paladin
2. **Sub-group + identity** combos - e.g., katanas + warrior = Samurai
3. **Sub-group + school** combos - e.g., katanas + night = Shinobi
4. **Sub-group + stance** combos - e.g., curved-swords + dual-wield = Dervish
5. **Spellcaster + school** overrides (no sub-group constraint) - e.g., spellcaster + glintstone = Astrologer
6. **Sub-group fallbacks** (match any build with that sub-group) - e.g., katanas = Ronin
7. **Identity fallbacks** (ultimate safety net) - Warrior, Sorcerer, Spellblade, Skirmisher

## Flavor Identity Rules

### Japanese Weapons

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| katanas | two-hand / dual-wield | warrior | - | Samurai |
| katanas | - | skirmisher | - | Shinobi |
| katanas | - | - | night | Shinobi |
| katanas | - | - | blood | Blood Ronin |
| katanas | - | spellblade | - | Kensei |
| katanas | - | - | - | Ronin |
| great-katanas | - | warrior | - | Shogun |
| great-katanas | - | skirmisher | - | Ronin |
| great-katanas | - | spellblade | - | Sword Saint |
| great-katanas | - | - | - | Shogun |

### Light Blades

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| daggers | - | skirmisher | - | Assassin |
| daggers | - | - | night | Shadow |
| daggers | - | - | blood | Blood Thorn |
| daggers | - | spellblade | - | Nightblade |
| daggers | - | - | - | Rogue |
| backhand-blades | - | skirmisher | - | Assassin |
| backhand-blades | - | - | - | Reaver |
| throwing-blades | - | - | - | Trickster |
| curved-swords | dual-wield | - | - | Dervish |
| curved-swords | - | skirmisher | - | Corsair |
| curved-swords | - | - | - | Dancer |
| thrusting-swords | sword-board | - | - | Fencer |
| thrusting-swords | - | spellblade | - | Spellsword |
| thrusting-swords | - | - | - | Duelist |

### Heavy Blades

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| straight-swords | sword-board | - | golden-order | Paladin |
| straight-swords | sword-board | - | fire | Crusader |
| straight-swords | sword-board | - | lightning | Templar |
| straight-swords | sword-board | warrior | - | Knight |
| straight-swords | - | spellblade | - | Spellsword |
| straight-swords | - | - | - | Swordsman |
| greatswords | two-hand | warrior | - | Greatknight |
| greatswords | - | spellblade | - | Dark Knight |
| greatswords | dual-wield | - | - | Berserker |
| greatswords | sword-board | - | - | Sentinel |
| greatswords | - | - | - | Greatknight |

### Colossal

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| colossal-swords | - | spellblade | - | Abyssal Knight |
| colossal-swords | - | - | - | Titan |
| colossal-weapons | - | - | - | Juggernaut |

### Blunt Weapons

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| hammers | sword-board | - | golden-order | Templar |
| hammers | sword-board | - | fire | Inquisitor |
| hammers | sword-board | warrior | - | Bulwark |
| hammers | - | spellblade | golden-order | Cleric |
| hammers | - | - | - | Bonecrusher |
| axes | dual-wield | - | - | Berserker |
| axes | - | skirmisher | - | Marauder |
| axes | sword-board | - | - | Warlord |
| axes | - | - | - | Executioner |

### Polearms

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| spears | sword-board | - | - | Legionnaire |
| spears | - | skirmisher | - | Dragoon |
| spears | - | - | - | Lancer |
| halberds | sword-board | - | - | Warden |
| halberds | - | - | - | Vanguard |
| reapers | - | - | blackflame | Godskin |
| reapers | - | skirmisher | - | Deathbringer |
| reapers | - | - | - | Harvester |

### Exotic

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| twinblades | dual-wield | - | - | Tempest |
| twinblades | - | spellblade | - | Spell Dancer |
| twinblades | - | - | - | Windcutter |
| whips | - | - | golden-order | Penitent |
| whips | - | skirmisher | - | Scourge |
| whips | - | - | - | Flagellant |
| fist-weapons | - | - | golden-order / bestial | Monk |
| fist-weapons | - | spellblade | - | Monk |
| fist-weapons | dual-wield | warrior | - | Brawler |
| fist-weapons | - | - | - | Pugilist |
| torches | - | - | - | Firebrand |
| perfume-bottles | - | - | - | Alchemist |

### Ranged

| Sub-group | Stance | Identity | School | Title |
|-----------|--------|----------|--------|-------|
| bows | - | skirmisher | - | Scout |
| bows | - | spellblade | - | Arcane Archer |
| bows | - | - | - | Archer |
| crossbows | - | skirmisher | - | Sharpshooter |
| crossbows | - | - | - | Arbalist |

### Spellcaster School Overrides

When identity is `spellcaster`, the magic school defines the archetype regardless of weapon. These rules sit between weapon-specific combos and sub-group fallbacks in priority.

| School | Title |
|--------|-------|
| glintstone | Astrologer |
| moon-frost | Cryomancer |
| gravity | Stargazer |
| night | Nightseer |
| aberrant | Heretic |
| golden-order | Oracle |
| blackflame | Godskin Apostle |
| dragon | Dragon Priest |
| lightning | Stormcaller |
| bestial | Beast Shaman |
| fire | Prophet |
| blood | Hemomancer |
| frenzied-flame | Madman |

### Identity Fallbacks

Ultimate safety net if no other rule matches:

| Identity | Title |
|----------|-------|
| warrior | Warrior |
| spellcaster | Sorcerer |
| spellblade | Spellblade |
| skirmisher | Skirmisher |

## Files Changed

| File | Change |
|------|--------|
| `src/lib/fate/flavor-identity.ts` | New file: rule list + `resolveFlavorIdentity()` |
| `src/types/fate.ts` | Add `flavorIdentity: string` to `PlaystyleCard` |
| `src/lib/fate/playstyle-generator.ts` | Call `resolveFlavorIdentity()` in `deriveDynamicFields()` |
| `src/components/fate/playstyle-card.tsx` | Display `card.flavorIdentity` instead of `IDENTITY_LABELS[card.identity]` |
