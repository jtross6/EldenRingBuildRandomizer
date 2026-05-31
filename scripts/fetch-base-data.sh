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
