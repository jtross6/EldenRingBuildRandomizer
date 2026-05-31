# Item Data Pipeline Design

## Goal

Build a local item database for an Elden Ring build randomizer by combining two open-source data sources:

- **Base game**: ERDB-generated JSON from [elden-ring-compass](https://github.com/EthanShoeDev/elden-ring-compass) (377 weapons, full stats parsed from game files)
- **DLC (Shadow of the Erdtree)**: Item names and categories from [shadow-otet-tracker](https://github.com/cranberriez/shadow-otet-tracker) (~102 weapons, ~42 armor, ~42 spells, ~39 talismans, ~25 ashes of war), with FextraLife wiki URLs for manual stat entry

## Item Categories In Scope

Core build items only:

- Weapons (armaments)
- Armor (helm, chest, gauntlets, legs)
- Talismans
- Ashes of War
- Sorceries and Incantations (spells)
- Sacred Seals and Staves (included in armaments)
- Shields (included in armaments)

Out of scope: spirit ashes, crystal tears, starting classes, consumables, crafting materials, keys, bolstering materials.

## Data Detail Level

Full stats per item:

- Name, category/type
- Stat requirements (Str, Dex, Int, Fai, Arc)
- Attack values (Phy, Mag, Fire, Lightning, Holy, Crit)
- Scaling grades
- Weight
- Description
- For armor: damage negation and resistances
- For spells: FP cost, slot count, requirements

## Directory Structure

```
data/
  base-game/              # Raw ERDB JSONs, no transformation
    armaments.json         # Weapons, shields, staves, seals (~377 items)
    armor.json             # All armor pieces
    spells.json            # Sorceries + incantations
    talismans.json         # Talismans
    ashes-of-war.json      # Ashes of war
  dlc/                     # Generated templates + manual entries
    weapons.json           # ~102 DLC weapons
    armor.json             # ~42 DLC armor pieces
    spells.json            # ~42 DLC spells
    talismans.json         # ~39 DLC talismans
    ashes-of-war.json      # ~25 DLC ashes of war
scripts/
  fetch-base-data.sh       # Downloads ERDB JSONs from elden-ring-compass GitHub
  generate-dlc-templates.py # Builds DLC templates from shadow-otet-tracker
```

## Step 1: Base Game Data Fetch

`scripts/fetch-base-data.sh` downloads five JSON files from elden-ring-compass via raw GitHub URLs:

| Source file | Destination |
|---|---|
| `src/assets/erdb/json/armaments.json` | `data/base-game/armaments.json` |
| `src/assets/erdb/json/armor.json` | `data/base-game/armor.json` |
| `src/assets/erdb/json/spells.json` | `data/base-game/spells.json` |
| `src/assets/erdb/json/talismans.json` | `data/base-game/talismans.json` |
| `src/assets/erdb/json/ashes-of-war.json` | `data/base-game/ashes-of-war.json` |

No transformation applied. Files committed to repo as-is.

## Step 2: DLC Template Generation

`scripts/generate-dlc-templates.py` fetches shadow-otet-tracker data files and generates template JSON entries for each DLC item.

### Input mapping

| Shadow tracker file | Output file | Filter |
|---|---|---|
| `src/data/weapons.json` | `data/dlc/weapons.json` | All entries |
| `src/data/armor.json` | `data/dlc/armor.json` | All entries |
| `src/data/spells.json` | `data/dlc/spells.json` | All entries |
| `src/data/talismans.json` | `data/dlc/talismans.json` | All entries |
| `src/data/ashes_of_war.json` | `data/dlc/ashes-of-war.json` | All entries |

### Template format (weapons example)

```json
{
  "Milady": {
    "name": "Milady",
    "category": "Light Greatsword",
    "fextralife_url": "https://eldenring.wiki.fextralife.com/Milady",
    "weight": null,
    "requirements": { "Str": null, "Dex": null, "Int": null, "Fai": null, "Arc": null },
    "attack": { "Phy": null, "Mag": null, "Fire": null, "Ligt": null, "Holy": null, "Crit": null },
    "scaling": { "Str": null, "Dex": null, "Int": null, "Fai": null, "Arc": null },
    "description": null
  }
}
```

### Template format (armor example)

```json
{
  "Gravebird Helm": {
    "name": "Gravebird Helm",
    "category": "Helm",
    "fextralife_url": "https://eldenring.wiki.fextralife.com/Gravebird+Helm",
    "weight": null,
    "dmg_negation": { "Phy": null, "Strike": null, "Slash": null, "Pierce": null, "Mag": null, "Fire": null, "Ligt": null, "Holy": null },
    "resistance": { "Immunity": null, "Robustness": null, "Focus": null, "Vitality": null, "Poise": null },
    "description": null
  }
}
```

### Template format (spells example)

```json
{
  "Swift Shard": {
    "name": "Swift Shard",
    "category": "Sorcery",
    "fextralife_url": "https://eldenring.wiki.fextralife.com/Swift+Shard",
    "fp_cost": null,
    "slots": null,
    "requirements": { "Int": null, "Fai": null, "Arc": null },
    "description": null
  }
}
```

### Re-runnability

The script preserves manually entered values. On re-run, it merges: new items from shadow-tracker are added with null stats, existing items with non-null stats are left untouched.

## Step 3: Manual DLC Data Entry

After templates are generated, the workflow is:

1. Open a DLC JSON file (e.g., `data/dlc/weapons.json`)
2. For each item with null stats, click the `fextralife_url`
3. Fill in the stat values from the wiki page
4. Save and commit

## Data Sources

| Source | URL | What we use | Data quality |
|---|---|---|---|
| elden-ring-compass (ERDB) | https://github.com/EthanShoeDev/elden-ring-compass | Base game item stats | High (parsed from game files) |
| shadow-otet-tracker | https://github.com/cranberriez/shadow-otet-tracker | DLC item names, categories, wiki URLs | Names/categories only |
| FextraLife wiki | https://eldenring.wiki.fextralife.com/ | DLC item stats (manual entry) | High (community maintained) |
