#!/usr/bin/env python3
"""Populate DLC item templates with stats from the Kaggle dataset.

Reads CSV files from the Kaggle 'Ultimate Elden Ring with Shadow of the
Erdtree DLC' dataset and fills in null fields in data/dlc/*.json.

Usage:
    python3 scripts/populate-dlc-from-kaggle.py <path-to-kaggle-eldenringScrap-dir>

Example:
    python3 scripts/populate-dlc-from-kaggle.py /tmp/kaggle-elden-ring/eldenringScrap
"""

import ast
import csv
import json
import sys
from pathlib import Path


DLC_DIR = Path("data/dlc")


def normalize_name(name: str) -> str:
    return (
        name.lower()
        .replace("ash of war: ", "")
        .replace("ash of war ", "")
        .replace(" variant", "")
        .replace(" (incantation)", "")
        .replace("'s", "s")
        .replace("'s", "s")
        .strip()
    )


def fuzzy_match(name: str, candidates: dict[str, dict]) -> dict | None:
    if name in candidates:
        return candidates[name]
    norm = normalize_name(name)
    for k, v in candidates.items():
        if normalize_name(k) == norm:
            return v
    # Handle pluralization differences (Beasts vs Beast, Aspects vs Aspect)
    for k, v in candidates.items():
        nk = normalize_name(k)
        if nk.rstrip("s") == norm.rstrip("s"):
            return v
    # Handle typos: Vanashing vs Vanishing, Sting vs String
    for k, v in candidates.items():
        nk = normalize_name(k)
        if len(nk) > 5 and len(norm) > 5:
            # Allow up to 2 character differences for similar-length strings
            shorter, longer = (norm, nk) if len(norm) <= len(nk) else (nk, norm)
            if len(longer) - len(shorter) <= 3 and sum(a != b for a, b in zip(shorter, longer)) <= 2:
                return v
    # Handle partial matches where our name is a substring of Kaggle's
    # e.g., "Immunizing Horn Charm" matching "Immunizing Horn Charm +2 Variant"
    for k, v in candidates.items():
        nk = normalize_name(k)
        if norm in nk or nk in norm:
            return v
    # Compare with words individually to handle pluralization within words
    norm_words = set(norm.split())
    for k, v in candidates.items():
        nk = normalize_name(k)
        nk_words = set(nk.split())
        # If all but one word matches, and the differing word is close
        shared = norm_words & nk_words
        diff_ours = norm_words - nk_words
        diff_theirs = nk_words - nk_words
        if len(shared) >= len(norm_words) - 1 and len(diff_ours) <= 1:
            return v
    return None


def parse_dict_field(raw: str) -> dict:
    if not raw or raw.strip() in ("", "{}"):
        return {}
    return ast.literal_eval(raw)


def parse_num(val: str) -> float | int | None:
    val = val.strip()
    if val in ("-", "", "None"):
        return None
    try:
        f = float(val)
        return int(f) if f == int(f) else f
    except ValueError:
        return None


def parse_scaling(val: str) -> str | None:
    val = val.strip()
    if val in ("-", "", "None"):
        return None
    return val


def load_json(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def save_json(path: Path, data: dict) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def populate_weapons(kaggle_dir: Path) -> int:
    templates = load_json(DLC_DIR / "weapons.json")

    weapons_by_name = {}
    for csv_file in ["weapons.csv", "shields.csv"]:
        with open(kaggle_dir / csv_file) as f:
            for row in csv.DictReader(f):
                if row.get("dlc", "").strip() == "1":
                    weapons_by_name[row["name"]] = row

    upgrades_by_name = {}
    for csv_file in ["weapons_upgrades.csv", "shields_upgrades.csv"]:
        name_col = "weapon name" if "weapon" in csv_file else "shield name"
        with open(kaggle_dir / csv_file) as f:
            for row in csv.DictReader(f):
                if row.get("upgrade", "").strip() == "Standard":
                    upgrades_by_name[row[name_col]] = row

    filled = 0
    for name, template in templates.items():
        weapon = fuzzy_match(name, weapons_by_name)
        if not weapon:
            continue

        reqs = parse_dict_field(weapon.get("requirements", "{}"))
        template["weight"] = parse_num(weapon.get("weight", ""))
        template["description"] = weapon.get("description", "").strip() or None
        template["requirements"] = {
            "Str": reqs.get("Str"),
            "Dex": reqs.get("Dex"),
            "Int": reqs.get("Int"),
            "Fai": reqs.get("Fai"),
            "Arc": reqs.get("Arc"),
        }

        upgrade = upgrades_by_name.get(name)
        if upgrade:
            atk = parse_dict_field(upgrade.get("attack power", "{}"))
            template["attack"] = {
                "Phy": parse_num(atk.get("Phy", "-")),
                "Mag": parse_num(atk.get("Mag", "-")),
                "Fire": parse_num(atk.get("Fir", "-")),
                "Ligt": parse_num(atk.get("Lit", "-")),
                "Holy": parse_num(atk.get("Hol", "-")),
                "Crit": parse_num(atk.get("Cri", "-")),
            }

            scl = parse_dict_field(upgrade.get("stat scaling", "{}"))
            template["scaling"] = {
                "Str": parse_scaling(scl.get("Str", "-")),
                "Dex": parse_scaling(scl.get("Dex", "-")),
                "Int": parse_scaling(scl.get("Int", "-")),
                "Fai": parse_scaling(scl.get("Fai", "-")),
                "Arc": parse_scaling(scl.get("Arc", "-")),
            }

        filled += 1

    save_json(DLC_DIR / "weapons.json", templates)
    return filled


def populate_armor(kaggle_dir: Path) -> int:
    templates = load_json(DLC_DIR / "armor.json")

    armor_by_name = {}
    with open(kaggle_dir / "armors.csv") as f:
        for row in csv.DictReader(f):
            if row.get("dlc", "").strip() == "1":
                armor_by_name[row["name"]] = row

    filled = 0
    for name, template in templates.items():
        armor = fuzzy_match(name, armor_by_name)
        if not armor:
            continue

        template["weight"] = parse_num(armor.get("weight", ""))
        template["description"] = armor.get("description", "").strip() or None

        dn_list = parse_dict_field(armor.get("damage negation", "[]"))
        if dn_list and isinstance(dn_list, list):
            dn = dn_list[0]
            template["absorptions"] = {
                "physical": parse_num(dn.get("Phy", "-")),
                "strike": parse_num(dn.get("VS Str.", "-")),
                "slash": parse_num(dn.get("VS Sla.", "-")),
                "pierce": parse_num(dn.get("VS Pie.", "-")),
                "magic": parse_num(dn.get("Mag", "-")),
                "fire": parse_num(dn.get("Fir", "-")),
                "lightning": parse_num(dn.get("Lit", "-")),
                "holy": parse_num(dn.get("Hol", "-")),
            }

        res_list = parse_dict_field(armor.get("resistance", "[]"))
        if res_list and isinstance(res_list, list):
            res = res_list[0]
            template["resistances"] = {
                "immunity": parse_num(res.get("Imm.", "-")),
                "robustness": parse_num(res.get("Rob.", "-")),
                "focus": parse_num(res.get("Foc.", "-")),
                "vitality": parse_num(res.get("Vit.", "-")),
                "poise": parse_num(res.get("Poi.", "-")),
            }

        filled += 1

    save_json(DLC_DIR / "armor.json", templates)
    return filled


def populate_spells(kaggle_dir: Path) -> int:
    templates = load_json(DLC_DIR / "spells.json")

    spells_by_name = {}
    for csv_file in ["incantations.csv", "sorceries.csv"]:
        with open(kaggle_dir / csv_file) as f:
            for row in csv.DictReader(f):
                if row.get("dlc", "").strip() == "1":
                    spells_by_name[row["name"]] = row

    filled = 0
    for name, template in templates.items():
        spell = fuzzy_match(name, spells_by_name)
        if not spell:
            continue

        template["fp_cost"] = parse_num(spell.get("FP", ""))
        template["slots"] = parse_num(spell.get("slot", ""))
        template["description"] = spell.get("description", "").strip() or None
        template["requirements"] = {
            "Int": parse_num(spell.get("INT", "")),
            "Fai": parse_num(spell.get("FAI", "")),
            "Arc": parse_num(spell.get("ARC", "")),
        }

        filled += 1

    save_json(DLC_DIR / "spells.json", templates)
    return filled


def populate_talismans(kaggle_dir: Path) -> int:
    templates = load_json(DLC_DIR / "talismans.json")

    talismans_by_name = {}
    with open(kaggle_dir / "talismans.csv") as f:
        for row in csv.DictReader(f):
            if row.get("dlc", "").strip() == "1":
                talismans_by_name[row["name"]] = row

    filled = 0
    for name, template in templates.items():
        talisman = fuzzy_match(name, talismans_by_name)
        if not talisman:
            continue

        template["weight"] = parse_num(talisman.get("weight", ""))
        template["effects"] = talisman.get("effect", "").strip() or None
        template["description"] = talisman.get("description", "").strip() or None

        filled += 1

    save_json(DLC_DIR / "talismans.json", templates)
    return filled


def populate_ashes_of_war(kaggle_dir: Path) -> int:
    templates = load_json(DLC_DIR / "ashes-of-war.json")

    ashes_by_name = {}
    with open(kaggle_dir / "ashesOfWar.csv") as f:
        for row in csv.DictReader(f):
            if row.get("dlc", "").strip() == "1":
                ashes_by_name[row["name"]] = row

    filled = 0
    for name, template in templates.items():
        ash = fuzzy_match(name, ashes_by_name)
        if not ash:
            continue

        template["skill"] = ash.get("skill", "").strip() or None
        template["affinity"] = ash.get("affinity", "").strip() or None
        template["description"] = ash.get("description", "").strip() or None

        filled += 1

    save_json(DLC_DIR / "ashes-of-war.json", templates)
    return filled


def main() -> None:
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <path-to-kaggle-eldenringScrap-dir>")
        sys.exit(1)

    kaggle_dir = Path(sys.argv[1])
    if not kaggle_dir.is_dir():
        print(f"Error: {kaggle_dir} is not a directory")
        sys.exit(1)

    print("Populating DLC templates from Kaggle dataset...")
    w = populate_weapons(kaggle_dir)
    print(f"  Weapons: {w} items populated")
    a = populate_armor(kaggle_dir)
    print(f"  Armor: {a} items populated")
    s = populate_spells(kaggle_dir)
    print(f"  Spells: {s} items populated")
    t = populate_talismans(kaggle_dir)
    print(f"  Talismans: {t} items populated")
    aow = populate_ashes_of_war(kaggle_dir)
    print(f"  Ashes of War: {aow} items populated")
    print(f"\nDone. {w + a + s + t + aow} total items populated.")


if __name__ == "__main__":
    main()
