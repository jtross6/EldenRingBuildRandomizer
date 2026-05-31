# Item Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local item database for an Elden Ring build randomizer by fetching base game data from ERDB and generating DLC templates for manual stat entry.

**Architecture:** Two scripts — a bash script to download 5 ERDB JSON files from the elden-ring-compass GitHub repo, and a Python script to fetch DLC item lists from shadow-otet-tracker and generate template JSONs with stat fields pre-set to `null`. Data lives in `data/base-game/` (raw ERDB) and `data/dlc/` (templates for manual completion).

**Tech Stack:** Bash (curl), Python 3.11+ (stdlib only: json, urllib)

---

### Task 1: Create directory structure and fetch base game data

**Files:**
- Create: `data/base-game/` (directory)
- Create: `data/dlc/` (directory)
- Create: `scripts/fetch-base-data.sh`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p data/base-game data/dlc scripts
```

- [ ] **Step 2: Write the fetch script**

Create `scripts/fetch-base-data.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://raw.githubusercontent.com/EthanShoeDev/elden-ring-compass/main/src/assets/erdb/json"
OUT_DIR="data/base-game"

mkdir -p "$OUT_DIR"

files=(
    "armaments.json"
    "armor.json"
    "spells.json"
    "talismans.json"
    "ashes-of-war.json"
)

for file in "${files[@]}"; do
    echo "Fetching $file..."
    curl -sL "$BASE_URL/$file" -o "$OUT_DIR/$file"
    count=$(python3 -c "import json; print(len(json.load(open('$OUT_DIR/$file'))))")
    echo "  -> $OUT_DIR/$file ($count items)"
done

echo "Done. All base game data fetched."
```

- [ ] **Step 3: Make the script executable and run it**

```bash
chmod +x scripts/fetch-base-data.sh
./scripts/fetch-base-data.sh
```

Expected output:
```
Fetching armaments.json...
  -> data/base-game/armaments.json (377 items)
Fetching armor.json...
  -> data/base-game/armor.json (578 items)
Fetching spells.json...
  -> data/base-game/spells.json (101 items)
Fetching talismans.json...
  -> data/base-game/talismans.json (116 items)
Fetching ashes-of-war.json...
  -> data/base-game/ashes-of-war.json (91 items)
Done. All base game data fetched.
```

- [ ] **Step 4: Verify the data landed correctly**

```bash
python3 -c "
import json, os
for f in sorted(os.listdir('data/base-game')):
    path = os.path.join('data/base-game', f)
    d = json.load(open(path))
    first_key = list(d.keys())[0]
    entry = d[first_key]
    print(f'{f}: {len(d)} items, first entry: \"{first_key}\" with keys {list(entry.keys())[:5]}...')
"
```

Expected: 5 files, all valid JSON, each with hundreds of items keyed by item name.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-base-data.sh data/base-game/
git commit -m "feat: add base game data fetch script and ERDB data

Downloads armaments, armor, spells, talismans, and ashes of war
from elden-ring-compass (ERDB-sourced, parsed from game files)."
```

---

### Task 2: Write the DLC template generation script

**Files:**
- Create: `scripts/generate-dlc-templates.py`

- [ ] **Step 1: Write the DLC template generator**

Create `scripts/generate-dlc-templates.py`:

```python
#!/usr/bin/env python3
"""Generate DLC item template JSONs from shadow-otet-tracker data.

Fetches DLC item lists from the shadow-otet-tracker GitHub repo and creates
template JSON files with stat fields set to null for manual entry.

Re-runnable: existing entries with non-null stats are preserved.
"""

import json
import os
import urllib.request
from pathlib import Path

TRACKER_BASE = (
    "https://raw.githubusercontent.com/cranberriez/shadow-otet-tracker"
    "/main/src/data"
)
OUT_DIR = Path("data/dlc")


def fetch_json(filename: str) -> list[dict]:
    url = f"{TRACKER_BASE}/{filename}"
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read())


def load_existing(path: Path) -> dict:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {}


def write_json(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def weapon_template(item: dict) -> dict:
    return {
        "name": item["name"],
        "category": item["sub_category"],
        "fextralife_url": item["url"],
        "weight": None,
        "requirements": {
            "Str": None, "Dex": None, "Int": None, "Fai": None, "Arc": None,
        },
        "attack": {
            "Phy": None, "Mag": None, "Fire": None,
            "Ligt": None, "Holy": None, "Crit": None,
        },
        "scaling": {
            "Str": None, "Dex": None, "Int": None, "Fai": None, "Arc": None,
        },
        "description": None,
    }


def armor_piece_template(piece: dict, set_name: str) -> dict:
    name = piece["piece_name"]
    if "Helm" in name or "Hood" in name or "Crown" in name or "Mask" in name:
        slot = "Head"
    elif "Gauntlet" in name or "Glove" in name or "Bracers" in name or "Manchettes" in name or "Wraps" in name:
        slot = "Arms"
    elif "Greaves" in name or "Trousers" in name or "Leg" in name or "Boots" in name or "Skirt" in name:
        slot = "Legs"
    else:
        slot = "Body"
    return {
        "name": name,
        "set": set_name,
        "category": slot,
        "fextralife_url": piece["url"],
        "weight": None,
        "absorptions": {
            "physical": None, "strike": None, "slash": None, "pierce": None,
            "magic": None, "fire": None, "lightning": None, "holy": None,
        },
        "resistances": {
            "immunity": None, "robustness": None,
            "focus": None, "vitality": None, "poise": None,
        },
        "description": None,
    }


def spell_template(item: dict) -> dict:
    return {
        "name": item["name"],
        "category": item.get("sub_category", "Unknown"),
        "fextralife_url": item["url"],
        "fp_cost": None,
        "slots": None,
        "requirements": {"Int": None, "Fai": None, "Arc": None},
        "description": None,
    }


def talisman_template(item: dict) -> dict:
    return {
        "name": item["name"],
        "fextralife_url": item["url"],
        "weight": None,
        "effects": None,
        "description": None,
    }


def ash_of_war_template(item: dict) -> dict:
    return {
        "name": item["name"],
        "fextralife_url": item["url"],
        "skill": None,
        "affinity": None,
        "description": None,
    }


def merge_templates(existing: dict, new_items: dict) -> dict:
    merged = dict(existing)
    for key, template in new_items.items():
        if key not in merged:
            merged[key] = template
    return merged


def generate_weapons() -> None:
    print("Generating DLC weapons...")
    items = fetch_json("weapons.json")
    existing = load_existing(OUT_DIR / "weapons.json")
    new_items = {}
    for item in items:
        name = item["name"]
        new_items[name] = weapon_template(item)
    merged = merge_templates(existing, new_items)
    write_json(OUT_DIR / "weapons.json", merged)
    print(f"  -> {len(merged)} weapons ({len(merged) - len(existing)} new)")


def generate_armor() -> None:
    print("Generating DLC armor...")
    items = fetch_json("armor.json")
    existing = load_existing(OUT_DIR / "armor.json")
    new_items = {}
    for armor_set in items:
        set_name = armor_set["name"]
        for piece in armor_set.get("pieces", []):
            name = piece["piece_name"]
            new_items[name] = armor_piece_template(piece, set_name)
    merged = merge_templates(existing, new_items)
    write_json(OUT_DIR / "armor.json", merged)
    print(f"  -> {len(merged)} armor pieces ({len(merged) - len(existing)} new)")


def generate_spells() -> None:
    print("Generating DLC spells...")
    items = fetch_json("spells.json")
    existing = load_existing(OUT_DIR / "spells.json")
    new_items = {}
    for item in items:
        name = item["name"]
        new_items[name] = spell_template(item)
    merged = merge_templates(existing, new_items)
    write_json(OUT_DIR / "spells.json", merged)
    print(f"  -> {len(merged)} spells ({len(merged) - len(existing)} new)")


def generate_talismans() -> None:
    print("Generating DLC talismans...")
    items = fetch_json("talismans.json")
    existing = load_existing(OUT_DIR / "talismans.json")
    new_items = {}
    for item in items:
        name = item["name"]
        new_items[name] = talisman_template(item)
    merged = merge_templates(existing, new_items)
    write_json(OUT_DIR / "talismans.json", merged)
    print(f"  -> {len(merged)} talismans ({len(merged) - len(existing)} new)")


def generate_ashes_of_war() -> None:
    print("Generating DLC ashes of war...")
    items = fetch_json("ashes_of_war.json")
    existing = load_existing(OUT_DIR / "ashes-of-war.json")
    new_items = {}
    for item in items:
        name = item["name"]
        new_items[name] = ash_of_war_template(item)
    merged = merge_templates(existing, new_items)
    write_json(OUT_DIR / "ashes-of-war.json", merged)
    print(f"  -> {len(merged)} ashes of war ({len(merged) - len(existing)} new)")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_weapons()
    generate_armor()
    generate_spells()
    generate_talismans()
    generate_ashes_of_war()
    print("\nDone. Fill in null values using the fextralife_url links.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/generate-dlc-templates.py
```

- [ ] **Step 3: Commit the script (before running, so we can track the generated output separately)**

```bash
git add scripts/generate-dlc-templates.py
git commit -m "feat: add DLC template generation script

Fetches DLC item lists from shadow-otet-tracker and generates
template JSONs with null stat fields and FextraLife wiki URLs
for manual data entry. Re-runnable without overwriting filled entries."
```

---

### Task 3: Run the DLC template generator and verify output

**Files:**
- Create: `data/dlc/weapons.json`
- Create: `data/dlc/armor.json`
- Create: `data/dlc/spells.json`
- Create: `data/dlc/talismans.json`
- Create: `data/dlc/ashes-of-war.json`

- [ ] **Step 1: Run the generator**

```bash
python3 scripts/generate-dlc-templates.py
```

Expected output:
```
Generating DLC weapons...
  -> 102 weapons (102 new)
Generating DLC armor...
  -> ~168 armor pieces (~168 new)
Generating DLC spells...
  -> 42 spells (42 new)
Generating DLC talismans...
  -> 39 talismans (39 new)
Generating DLC ashes of war...
  -> 25 ashes of war (25 new)

Done. Fill in null values using the fextralife_url links.
```

Note: armor count will be higher than 42 because the tracker stores 42 armor *sets*, each with multiple pieces (helm, chest, gauntlets, greaves).

- [ ] **Step 2: Verify a weapon template looks correct**

```bash
python3 -c "
import json
d = json.load(open('data/dlc/weapons.json'))
print(json.dumps(d['Milady'], indent=2))
"
```

Expected:
```json
{
  "name": "Milady",
  "category": "Light Greatswords",
  "fextralife_url": "https://eldenring.wiki.fextralife.com/Milady",
  "weight": null,
  "requirements": { "Str": null, "Dex": null, "Int": null, "Fai": null, "Arc": null },
  "attack": { "Phy": null, "Mag": null, "Fire": null, "Ligt": null, "Holy": null, "Crit": null },
  "scaling": { "Str": null, "Dex": null, "Int": null, "Fai": null, "Arc": null },
  "description": null
}
```

- [ ] **Step 3: Verify an armor template looks correct**

```bash
python3 -c "
import json
d = json.load(open('data/dlc/armor.json'))
print(json.dumps(d['Black Knight Helm'], indent=2))
"
```

Expected:
```json
{
  "name": "Black Knight Helm",
  "set": "Black Knight Set",
  "category": "Head",
  "fextralife_url": "https://eldenring.wiki.fextralife.com/Black+Knight+Helm",
  "weight": null,
  "absorptions": { "physical": null, "strike": null, "slash": null, "pierce": null, "magic": null, "fire": null, "lightning": null, "holy": null },
  "resistances": { "immunity": null, "robustness": null, "focus": null, "vitality": null, "poise": null },
  "description": null
}
```

- [ ] **Step 4: Verify a spell template looks correct**

```bash
python3 -c "
import json
d = json.load(open('data/dlc/spells.json'))
first = list(d.values())[0]
print(json.dumps(first, indent=2))
"
```

Expected: a spell entry with `name`, `category` (Incantation or Sorcery), `fextralife_url`, and null `fp_cost`, `slots`, `requirements`, `description`.

- [ ] **Step 5: Verify re-runnability preserves filled entries**

```bash
python3 -c "
import json
d = json.load(open('data/dlc/weapons.json'))
d['Milady']['weight'] = 4.5
d['Milady']['requirements']['Str'] = 11
with open('data/dlc/weapons.json', 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
"

python3 scripts/generate-dlc-templates.py

python3 -c "
import json
d = json.load(open('data/dlc/weapons.json'))
m = d['Milady']
assert m['weight'] == 4.5, f'weight was overwritten: {m[\"weight\"]}'
assert m['requirements']['Str'] == 11, f'Str was overwritten: {m[\"requirements\"][\"Str\"]}'
print('Re-run preserved filled values.')
"
```

Expected: `Re-run preserved filled values.`

- [ ] **Step 6: Reset the test data and commit the generated templates**

```bash
python3 scripts/generate-dlc-templates.py

git add data/dlc/
git commit -m "feat: add generated DLC item templates

102 weapons, ~168 armor pieces, 42 spells, 39 talismans,
25 ashes of war with null stat fields and FextraLife wiki URLs
ready for manual data entry."
```

---

### Task 4: Print a summary of what's ready and what needs manual entry

- [ ] **Step 1: Print a data summary**

```bash
python3 -c "
import json, os

print('=== BASE GAME (complete) ===')
for f in sorted(os.listdir('data/base-game')):
    d = json.load(open(f'data/base-game/{f}'))
    print(f'  {f}: {len(d)} items')

print()
print('=== DLC (templates - needs stat entry) ===')
for f in sorted(os.listdir('data/dlc')):
    d = json.load(open(f'data/dlc/{f}'))
    total = len(d)
    filled = 0
    for item in d.values():
        has_nulls = False
        for v in item.values():
            if v is None:
                has_nulls = True
                break
            if isinstance(v, dict) and any(sv is None for sv in v.values()):
                has_nulls = True
                break
        if not has_nulls:
            filled += 1
    print(f'  {f}: {total} items ({filled}/{total} complete)')

print()
print('To fill DLC stats, open each data/dlc/*.json file and use the')
print('fextralife_url field to look up stats on the wiki.')
"
```

This prints a summary of all data files showing what's complete and what still needs manual entry.
