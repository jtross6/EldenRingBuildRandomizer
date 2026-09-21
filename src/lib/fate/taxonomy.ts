import type {
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  WeaponSubGroup,
  MagicSchool,
  MagicLevel,
  ArmorClass,
  StatusEffect,
} from "../../types/fate";

export const WEAPON_FAMILY_CATEGORIES: Record<WeaponFamily, string[]> = {
  "light-blades": [
    "Dagger",
    "Curved Sword",
    "Katana",
    "Thrusting Sword",
    "Heavy Thrusting Sword",
    "Backhand Blade",
    "Throwing Blade",
  ],
  "heavy-blades": [
    "Straight Sword",
    "Greatsword",
    "Light Greatsword",
    "Curved Greatsword",
    "Great Katana",
  ],
  colossal: ["Colossal Sword", "Colossal Weapon"],
  "axes-hammers": ["Axe", "Greataxe", "Hammer", "Great Hammer", "Flail"],
  polearms: ["Spear", "Great Spear", "Halberd", "Reaper"],
  "agile-exotic": [
    "Twinblade",
    "Whip",
    "Fist",
    "Claw",
    "Hand-to-Hand Art",
    "Beast Claw",
    "Torch",
    "Perfume Bottle",
  ],
  ranged: ["Bow", "Light Bow", "Greatbow", "Crossbow", "Ballista"],
};

export const SUB_GROUP_CATEGORIES: Record<WeaponSubGroup, string[]> = {
  daggers: ["Dagger"],
  "curved-swords": ["Curved Sword"],
  katanas: ["Katana"],
  "thrusting-swords": ["Thrusting Sword", "Heavy Thrusting Sword"],
  "backhand-blades": ["Backhand Blade"],
  "throwing-blades": ["Throwing Blade"],
  "straight-swords": ["Straight Sword"],
  greatswords: ["Greatsword", "Light Greatsword", "Curved Greatsword"],
  "great-katanas": ["Great Katana"],
  "colossal-swords": ["Colossal Sword"],
  "colossal-weapons": ["Colossal Weapon"],
  axes: ["Axe", "Greataxe"],
  hammers: ["Hammer", "Great Hammer", "Flail"],
  spears: ["Spear", "Great Spear"],
  halberds: ["Halberd"],
  reapers: ["Reaper"],
  twinblades: ["Twinblade"],
  whips: ["Whip"],
  "fist-weapons": ["Fist", "Claw", "Hand-to-Hand Art", "Beast Claw"],
  torches: ["Torch"],
  "perfume-bottles": ["Perfume Bottle"],
  bows: ["Bow", "Light Bow", "Greatbow"],
  crossbows: ["Crossbow", "Ballista"],
};

export const FAMILY_SUB_GROUPS: Record<WeaponFamily, WeaponSubGroup[]> = {
  "light-blades": [
    "daggers",
    "curved-swords",
    "katanas",
    "thrusting-swords",
    "backhand-blades",
    "throwing-blades",
  ],
  "heavy-blades": ["straight-swords", "greatswords", "great-katanas"],
  colossal: ["colossal-swords", "colossal-weapons"],
  "axes-hammers": ["axes", "hammers"],
  polearms: ["spears", "halberds", "reapers"],
  "agile-exotic": ["twinblades", "whips", "fist-weapons", "torches", "perfume-bottles"],
  ranged: ["bows", "crossbows"],
};

// Relative odds of a sub-group being drawn within its family. Everything sits at
// the default; entries here exist only to pull an outlier off its uniform share.
// Torches are a handful of low-scaling utility items that make for a dud build,
// so they are damped to roughly 1-in-500 cards rather than 1-in-29.
export const DEFAULT_SUB_GROUP_WEIGHT = 20;

export const SUB_GROUP_WEIGHTS: Partial<Record<WeaponSubGroup, number>> = {
  torches: 1,
};

export function subGroupWeight(subGroup: WeaponSubGroup): number {
  return SUB_GROUP_WEIGHTS[subGroup] ?? DEFAULT_SUB_GROUP_WEIGHT;
}

export const SUB_GROUP_LABELS: Record<WeaponSubGroup, string> = {
  daggers: "Daggers",
  "curved-swords": "Curved Swords",
  katanas: "Katanas",
  "thrusting-swords": "Thrusting Swords",
  "backhand-blades": "Backhand Blades",
  "throwing-blades": "Throwing Blades",
  "straight-swords": "Straight Swords",
  greatswords: "Greatswords",
  "great-katanas": "Great Katanas",
  "colossal-swords": "Colossal Swords",
  "colossal-weapons": "Colossal Weapons",
  axes: "Axes",
  hammers: "Hammers",
  spears: "Spears",
  halberds: "Halberds",
  reapers: "Reapers",
  twinblades: "Twinblades",
  whips: "Whips",
  "fist-weapons": "Fist Weapons",
  torches: "Torches",
  "perfume-bottles": "Perfume Bottles",
  bows: "Bows",
  crossbows: "Crossbows",
};

export const SUB_GROUP_LABELS_SINGULAR: Record<WeaponSubGroup, string> = {
  daggers: "Dagger",
  "curved-swords": "Curved Sword",
  katanas: "Katana",
  "thrusting-swords": "Thrusting Sword",
  "backhand-blades": "Backhand Blade",
  "throwing-blades": "Throwing Blade",
  "straight-swords": "Straight Sword",
  greatswords: "Greatsword",
  "great-katanas": "Great Katana",
  "colossal-swords": "Colossal Sword",
  "colossal-weapons": "Colossal Weapon",
  axes: "Axe",
  hammers: "Hammer",
  spears: "Spear",
  halberds: "Halberd",
  reapers: "Reaper",
  twinblades: "Twinblade",
  whips: "Whip",
  "fist-weapons": "Fist Weapon",
  torches: "Torch",
  "perfume-bottles": "Perfume Bottle",
  bows: "Bow",
  crossbows: "Crossbow",
};

export const FAMILY_LABELS: Record<WeaponFamily, string> = {
  "light-blades": "Light Blades",
  "heavy-blades": "Heavy Blades",
  colossal: "Colossal",
  "axes-hammers": "Axes & Hammers",
  polearms: "Polearms",
  "agile-exotic": "Agile / Exotic",
  ranged: "Ranged",
};

export const SORCERY_SCHOOLS: MagicSchool[] = [
  "glintstone",
  "moon-frost",
  "gravity",
  "night",
  "aberrant",
  "death",
];

export const INCANTATION_SCHOOLS: MagicSchool[] = [
  "golden-order",
  "blackflame",
  "dragon",
  "lightning",
  "bestial",
  "fire",
  "blood",
  "frenzied-flame",
  "rot",
];

export const SCHOOL_LABELS: Record<MagicSchool, string> = {
  glintstone: "Glintstone",
  "moon-frost": "Moon / Frost",
  gravity: "Gravity",
  night: "Night",
  aberrant: "Aberrant",
  "golden-order": "Golden Order",
  blackflame: "Blackflame",
  dragon: "Dragon Communion",
  lightning: "Lightning",
  bestial: "Bestial",
  fire: "Fire",
  blood: "Blood",
  "frenzied-flame": "Frenzied Flame",
  death: "Death",
  rot: "Rot & Poison",
};

export const STATUS_LABELS: Record<StatusEffect, string> = {
  bleed: "Bleed",
  frost: "Frost",
  poison: "Poison",
  "scarlet-rot": "Scarlet Rot",
  madness: "Madness",
  sleep: "Sleep",
};

// Each casting spread pairs a weapon stat with a casting stat. FTH+ARC is the
// exception: Dragon Communion and Blood require both, so it is the whole focus.
// Without it neither school has a spread that can cast it at all.
export const IDENTITY_STATS: Record<CombatIdentity, string[][]> = {
  warrior: [["STR"], ["DEX"], ["STR", "DEX"]],
  spellcaster: [["INT"], ["FTH"], ["INT", "FTH"], ["FTH", "ARC"]],
  spellblade: [
    ["DEX", "INT"],
    ["STR", "INT"],
    ["DEX", "FTH"],
    ["STR", "FTH"],
    ["FTH", "ARC"],
  ],
  skirmisher: [["DEX", "ARC"], ["ARC"], ["DEX"], ["ARC", "FTH"]],
};

export const ALL_IDENTITIES: CombatIdentity[] = [
  "warrior",
  "spellcaster",
  "spellblade",
  "skirmisher",
];
export const ALL_STANCES: WeaponStance[] = [
  "two-hand",
  "dual-wield",
  "sword-board",
  "ranged",
  "double-shield",
];
export const ALL_FAMILIES: WeaponFamily[] = [
  "light-blades",
  "heavy-blades",
  "colossal",
  "axes-hammers",
  "polearms",
  "agile-exotic",
  "ranged",
];
// Order is load-bearing: the fate codec stores a school as its index here + 1.
// New schools MUST be appended, never inserted, or existing build codes decode wrong.
export const ALL_SCHOOLS: MagicSchool[] = [
  "glintstone",
  "moon-frost",
  "gravity",
  "night",
  "aberrant",
  "golden-order",
  "blackflame",
  "dragon",
  "lightning",
  "bestial",
  "fire",
  "blood",
  "frenzied-flame",
  "death",
  "rot",
];
export const ALL_STATUS_EFFECTS: StatusEffect[] = [
  "bleed",
  "frost",
  "poison",
  "scarlet-rot",
  "madness",
  "sleep",
];

export function isSorcerySchool(school: MagicSchool): boolean {
  return (SORCERY_SCHOOLS as string[]).includes(school);
}

export function identityAllowsMagic(identity: CombatIdentity): boolean {
  return identity !== "warrior";
}

export function getValidFamilies(stance: WeaponStance | undefined): WeaponFamily[] {
  if (stance === "double-shield") return [];
  if (stance === "ranged") return ["ranged"];
  return ALL_FAMILIES.filter((f) => f !== "ranged" || stance === undefined);
}

export function getValidStances(family: WeaponFamily | null | undefined): WeaponStance[] {
  if (family === "ranged") return ["ranged"];
  if (family === "colossal") return ["two-hand", "sword-board"];
  if (family) return ALL_STANCES.filter((s) => s !== "double-shield");
  return ALL_STANCES;
}

export function getValidSchools(
  magic: MagicLevel | undefined,
  identity: CombatIdentity | undefined,
): MagicSchool[] {
  if (magic === "none") return [];
  if (identity === "warrior") return [];
  return ALL_SCHOOLS;
}

export function deriveArmorClass(
  identity: CombatIdentity,
  family: WeaponFamily | null,
): ArmorClass {
  if (family === null) return "heavy";
  if (identity === "spellcaster" && family !== "colossal") return "light";
  if (family === "colossal" || family === "axes-hammers") return "heavy";
  if (identity === "warrior" && (family === "heavy-blades" || family === "polearms"))
    return "heavy";
  if (identity === "skirmisher" || family === "light-blades") return "light";
  return "medium";
}

export function deriveIdentity(
  magic: MagicLevel | undefined,
  school: MagicSchool | undefined,
): CombatIdentity[] {
  if (magic === "none") return ["warrior", "skirmisher"];
  if (magic === "primary") return ["spellcaster", "spellblade"];
  if (school === "blood" || school === "dragon") return ["skirmisher", "spellblade"];
  return ALL_IDENTITIES;
}
