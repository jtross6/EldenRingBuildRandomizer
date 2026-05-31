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
