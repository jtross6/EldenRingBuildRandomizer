# Guided Hand Modal Shortcut

Add a button to item detail modals that navigates directly to the Guided Hand picks page with the clicked item as the sole seed, generating builds instantly.

## Scope

- Button appears in `ItemDetailModal` on both Chaos Forge (`/random`) and Guided Hand result (`/generate/build`) pages
- Hidden for `armor` items (the generator does not support armor as a seed item)

## Data Flow

1. User clicks an item slot, modal opens (existing behavior)
2. Modal renders a "Guided Hand" button at the bottom for non-armor categories
3. On click:
   - Map `ItemCategory` + `itemName` to a `SeedItem` (look up index in the appropriate data array, convert category to `ItemType`)
   - Write `{ seedItems: [seedItem], creativity: 50, seed: <random> }` to `sessionStorage` under key `erbr-generator-state`
   - Navigate to `/generate/picks`
4. Picks page reads sessionStorage and generates builds as usual

## Category to ItemType Mapping

| ItemCategory | ItemType   | Data array lookup                                     |
| ------------ | ---------- | ----------------------------------------------------- |
| `weapon`     | `weapon`   | `weapons`                                             |
| `shield`     | `shield`   | `shields`                                             |
| `staff`      | `staff`    | `staves`                                              |
| `seal`       | `seal`     | `seals`                                               |
| `talisman`   | `talisman` | `talismans`                                           |
| `ash`        | `ashOfWar` | `ashesOfWar`                                          |
| `spell`      | `spell`    | `sorceries` + `incantations` (combined index)         |
| `armor`      | —          | not supported                                         |

## Changes

### `item-detail-modal.tsx`

- Add optional `onGuidedHand?: () => void` prop to `ItemDetailModalProps`
- Render a full-width secondary button at the bottom of the modal content (inside `AnimatedHeight`) when `onGuidedHand` is provided
- Button style: border + text (secondary), not gold gradient, to avoid competing with item details

### `build-viewer.tsx` and `generate-build.tsx`

- Add a helper that converts `ItemCategory` + `itemName` to a `SeedItem` by looking up the name in the corresponding data array
- On button click: write sessionStorage state and navigate to `/generate/picks`
- Pass the handler as `onGuidedHand` to `ItemDetailModal` for non-armor items only
