# Unified Armament Slots Design

## Summary

Merge all armament types (weapons, shields, staves, seals) into a unified 3 Right Hand + 3 Left Hand slot model, matching the in-game equipment screen. Eliminates the separate Shields, Staves, and Seals UI sections in favor of a single "Armaments" section with Right Hand and Left Hand sub-groups.

Applies to all build types: Chaos Forge, Guiding Hand, and Community Builds.

## Data Layer

### Data Files (No Change)

The four data files remain separate: `weapons.json`, `shields.json`, `staves.json`, `seals.json`. The generate script (`scripts/generate-slim-data.ts`) is unchanged.

### Armaments Module (`src/lib/armaments.ts`)

New module providing a unified interface over the four data arrays:

- **`ArmamentType`** — `'weapon' | 'shield' | 'staff' | 'seal'`
- **`ArmamentRef`** — `{ type: ArmamentType, index: number }`
- **Lookup function** — takes an `ArmamentRef`, returns the item data from the correct array
- **Pool accessors** — iterate/filter across all four arrays (used by generator and Guiding Hand)

### Build Type Change

```
// Before
weaponsRight: number[]
weaponsLeft: number[]
shields?: number[]
staves?: number[]
seals?: number[]

// After
rightHand: ArmamentRef[]   // 0-3 items (empty slots omitted)
leftHand: ArmamentRef[]    // 0-3 items (empty slots omitted)
```

## Build Codec

New codec version. Existing URLs break cleanly (decode error redirects to a fresh random build).

### Hand Slot Encoding

Each slot uses 10 bits:
- **2 bits** — type tag (0 = weapon, 1 = shield, 2 = staff, 3 = seal)
- **8 bits** — index into the corresponding data array (max 256 items per category)

Layout: 3 right-hand slots + 3 left-hand slots = 60 bits for armaments.

In the codec, all 6 slots are always written. Empty slots use index 255 as a sentinel value and are excluded when decoding to the Build type (which uses variable-length arrays).

Remaining fields (armor, talismans, ashes, spells) encode as today.

## Build Generator

Profile-based logic adapts to the 3+3 model. Instead of filling separate arrays per armament type, the generator fills `rightHand[3]` and `leftHand[3]` directly.

### Profile Influence on Type Mix

- **Melee profiles** — mostly weapons, maybe a shield in a left hand slot
- **Caster profiles** — staff and/or seal in one or two slots, weapons in the rest
- **Hybrid profiles** — mix of weapons with a catalyst or shield
- **Faith/Int-specific** — bias toward seals or staves respectively

Slots can be empty. The profile determines how many of the 6 slots are filled (e.g., a focused melee build might use 2 right + 1 left).

## UI Changes

### Build Viewer (Chaos Forge & Community Builds)

The separate Weapons, Shields, Staves, Seals sections collapse into one **"Armaments"** section:

- **Right Hand** — 3 slots, vertical stack
- **Left Hand** — 3 slots, vertical stack

Each slot uses the `ItemSlot` standard variant. The item's category drives the icon and CSS class (`cat-weapon`, `cat-shield`, `cat-seal`, etc.).

Empty slots render as dimmed/empty placeholders rather than being hidden, so the 3+3 structure is always visible.

### Guiding Hand

The separate Weapons, Shields, Staves, Seals navigation categories merge into a single **"Armaments"** category. Within it, the user browses all four item pools and selects items to assign to hand slots.

## Community Builds

Community build source data shifts from separate `weapons`, `shields`, `staves`, `seals` fields to `rightHand` and `leftHand` arrays. Each entry specifies the item name and armament type.

The `resolveCommunityBuild` utility resolves each entry's name against the correct data array based on its type tag.

The community build viewer uses the same unified Armaments section as Chaos Forge.

## Breaking Changes

- All existing `?build=` URLs are invalidated. Old codec versions are not decoded.
- Community build data format changes.
