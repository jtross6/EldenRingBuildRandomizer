# Elden Ring Build Randomizer

A build randomizer for Elden Ring that generates complete equipment loadouts from every weapon, armor set, talisman, spell, and ash of war in the base game and Shadow of the Erdtree DLC.

**[Try it live](https://jordan-ross.github.io/EldenRingBuildRandomizer/)**

## Modes

### Chaos Forge

Fully randomized builds with no guardrails. Every item in the game is in the pool and the Erdtree decides your fate.

### Path of Fate

Generates a randomized playstyle identity (archetype, weapon preferences, casting affinity) and builds a loadout around it. You can pin the parts you like and reroll the rest until the playstyle feels right, then generate the full build.

### Guided Hand

Pick your starter weapons and the build shapes itself around them. A synergy-aware generator selects complementary armor, talismans, spells, and ashes of war. When your selections closely match a community build from Fextralife, it surfaces as a suggestion.

## Features

- **Shareable URLs** - Every build is encoded into the URL as a compact binary format. No backend, no accounts. Copy the link and send it to a friend.
- **Full DLC coverage** - All Shadow of the Erdtree weapons, armor, spells, and ashes of war are included.
- **Seed-based generation** - Builds are generated from numeric seeds, so you can reproduce or share exact results.
- **Flavor identity** - Each build gets a curated archetype title and flavor text that reflects its playstyle.
- **Item images** - Equipment slots display item artwork from the game.

<details>
<summary><strong>Development</strong></summary>

### Prerequisites

- Node.js 24.x
- pnpm

### Setup

```sh
pnpm install
pnpm dev
```

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm lint` | Lint with oxlint |
| `pnpm format` | Format with oxfmt |
| `pnpm generate-data` | Regenerate slim data files from source JSON |

### Data Pipeline

Source data in `data/` contains full item attributes for the base game and DLC. The `generate-data` script strips these down to only the fields the app needs and writes them to `src/data/*.json`, which are the files imported at runtime.

</details>
