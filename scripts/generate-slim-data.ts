import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const BASE_GAME = join(ROOT, "data", "base-game");
const DLC = join(ROOT, "data", "dlc");
const OUT = join(ROOT, "src", "data");

mkdirSync(OUT, { recursive: true });

function readJson(path: string): Record<string, Record<string, unknown>> {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeOut(filename: string, data: unknown[]) {
  writeFileSync(join(OUT, filename), JSON.stringify(data, null, 2) + "\n");
  console.log(`  ${filename}: ${data.length} items`);
}

// DLC category -> base game category normalization
const CATEGORY_MAP: Record<string, string> = {
  Axes: "Axe",
  "Backhand Blades": "Backhand Blade",
  "Beast Claws": "Beast Claw",
  Ballistas: "Ballista",
  Bows: "Bow",
  "Colossal Swords": "Colossal Sword",
  "Colossal Weapons": "Colossal Weapon",
  Crossbows: "Crossbow",
  "Curved Greatswords": "Curved Greatsword",
  "Curved Swords": "Curved Sword",
  Daggers: "Dagger",
  Fists: "Fist",
  Flails: "Flail",
  "Glinstone Staffs": "Glintstone Staff",
  "Great Hammers": "Great Hammer",
  "Great Katanas": "Great Katana",
  "Great Spears": "Great Spear",
  Greataxes: "Greataxe",
  Greatbows: "Greatbow",
  Greatshields: "Greatshield",
  Greatswords: "Greatsword",
  Halberds: "Halberd",
  Hammers: "Hammer",
  "Hand-to-Hand Arts": "Hand-to-Hand Art",
  "Heavy Thrusting Swords": "Heavy Thrusting Sword",
  Katanas: "Katana",
  "Light Bows": "Light Bow",
  "Light Greatswords": "Light Greatsword",
  "Perfume Bottles": "Perfume Bottle",
  Reapers: "Reaper",
  "Sacred Seals": "Sacred Seal",
  "Small Shields": "Small Shield",
  Spears: "Spear",
  "Straight Swords": "Straight Sword",
  "Throwing Blades": "Throwing Blade",
  "Thrusting Swords": "Thrusting Sword",
  Torches: "Torch",
  Twinblades: "Twinblade",
  Whips: "Whip",
  Incantations: "Incantation",
  Sorceries: "Sorcery",
};

const SHIELD_CATEGORIES = new Set([
  "Small Shield",
  "Medium Shield",
  "Greatshield",
  "Thrusting Shield",
]);

const CATALYST_CATEGORIES = new Set(["Glintstone Staff", "Sacred Seal"]);

function normalizeCategory(cat: string): string {
  return CATEGORY_MAP[cat] ?? cat;
}

// --- Armaments (base game) + Weapons (DLC) ---
console.log("Processing armaments...");

interface SlimWeapon {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
  allowAshOfWar?: boolean;
  defaultSkillId?: number;
}

const weapons: SlimWeapon[] = [];
const shields: SlimWeapon[] = [];
const catalysts: SlimWeapon[] = [];

const baseArmaments = readJson(join(BASE_GAME, "armaments.json"));
for (const item of Object.values(baseArmaments)) {
  const cat = item.category as string;
  const affinity = (item.affinity as Record<string, Record<string, unknown>>)?.Standard;

  const scaling = affinity?.scaling as Record<string, number> | undefined;
  const requirements = item.requirements as Record<string, number> | undefined;

  const damageObj = affinity?.damage as Record<string, number> | undefined;
  const damageTypes = damageObj
    ? Object.entries(damageObj)
        .filter(([k, v]) => v > 0 && k !== "stamina")
        .map(([k]) => k)
    : undefined;

  const statusObj = affinity?.status_effects as Record<string, number> | undefined;
  const statusEffects = statusObj
    ? Object.fromEntries(Object.entries(statusObj).filter(([, v]) => v > 0))
    : undefined;

  const entry: SlimWeapon = {
    name: item.name as string,
    category: cat,
    weight: item.weight as number,
    scaling: scaling && Object.keys(scaling).length > 0 ? scaling : undefined,
    requirements: requirements && Object.keys(requirements).length > 0 ? requirements : undefined,
    damageTypes: damageTypes && damageTypes.length > 0 ? damageTypes : undefined,
    statusEffects: statusEffects && Object.keys(statusEffects).length > 0 ? statusEffects : undefined,
    allowAshOfWar: (item.allow_ash_of_war as boolean) || undefined,
    defaultSkillId: (item.default_skill_id as number) || undefined,
  };
  if (SHIELD_CATEGORIES.has(cat)) shields.push(entry);
  else if (CATALYST_CATEGORIES.has(cat)) catalysts.push(entry);
  else weapons.push(entry);
}

const GRADE_TO_NUMBER: Record<string, number> = {
  S: 1.5,
  A: 1.0,
  B: 0.75,
  C: 0.5,
  D: 0.25,
  E: 0.1,
};

const DLC_STAT_KEY_MAP: Record<string, string> = {
  Str: "strength",
  Dex: "dexterity",
  Int: "intelligence",
  Fai: "faith",
  Arc: "arcane",
};

function normalizeDlcScaling(
  raw: Record<string, string | null> | undefined,
): Record<string, number> | undefined {
  if (!raw) return undefined;
  const result: Record<string, number> = {};
  for (const [key, grade] of Object.entries(raw)) {
    const stat = DLC_STAT_KEY_MAP[key];
    if (stat && grade && GRADE_TO_NUMBER[grade] != null) {
      result[stat] = GRADE_TO_NUMBER[grade];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeDlcRequirements(
  raw: Record<string, number | null> | undefined,
): Record<string, number> | undefined {
  if (!raw) return undefined;
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    const stat = DLC_STAT_KEY_MAP[key];
    if (stat && val && val > 0) {
      result[stat] = val;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeDlcDamageTypes(
  raw: Record<string, number | null> | undefined,
): string[] | undefined {
  if (!raw) return undefined;
  const DLC_DAMAGE_KEY_MAP: Record<string, string> = {
    Phy: "physical",
    Mag: "magic",
    Fire: "fire",
    Ligt: "lightning",
    Holy: "holy",
  };
  const types: string[] = [];
  for (const [key, val] of Object.entries(raw)) {
    const mapped = DLC_DAMAGE_KEY_MAP[key];
    if (mapped && val && val > 0) {
      types.push(mapped);
    }
  }
  return types.length > 0 ? types : undefined;
}

const dlcWeapons = readJson(join(DLC, "weapons.json"));
for (const item of Object.values(dlcWeapons)) {
  const rawCat = item.category as string;
  const cat = normalizeCategory(rawCat);
  const entry: SlimWeapon = {
    name: item.name as string,
    category: cat,
    weight: (item.weight as number) ?? 0,
    scaling: normalizeDlcScaling(item.scaling as Record<string, string | null> | undefined),
    requirements: normalizeDlcRequirements(
      item.requirements as Record<string, number | null> | undefined,
    ),
    damageTypes: normalizeDlcDamageTypes(item.attack as Record<string, number | null> | undefined),
    statusEffects: undefined,
    allowAshOfWar: undefined,
    defaultSkillId: undefined,
  };
  if (SHIELD_CATEGORIES.has(cat)) shields.push(entry);
  else if (CATALYST_CATEGORIES.has(cat)) catalysts.push(entry);
  else weapons.push(entry);
}

weapons.sort((a, b) => a.name.localeCompare(b.name));
shields.sort((a, b) => a.name.localeCompare(b.name));
catalysts.sort((a, b) => a.name.localeCompare(b.name));

writeOut("weapons.json", weapons);
writeOut("shields.json", shields);
writeOut("catalysts.json", catalysts);

// --- Armor ---
console.log("Processing armor...");

interface SlimArmor {
  name: string;
  weight: number;
}

const armorBySlot: Record<string, SlimArmor[]> = {
  head: [],
  body: [],
  arms: [],
  legs: [],
};

const ARMOR_CAT_MAP: Record<string, string> = {
  Head: "head",
  Body: "body",
  Arms: "arms",
  Legs: "legs",
};

const baseArmor = readJson(join(BASE_GAME, "armor.json"));
for (const item of Object.values(baseArmor)) {
  const slot = ARMOR_CAT_MAP[item.category as string];
  if (slot) {
    armorBySlot[slot].push({
      name: item.name as string,
      weight: item.weight as number,
    });
  }
}

const dlcArmor = readJson(join(DLC, "armor.json"));
for (const item of Object.values(dlcArmor)) {
  const slot = ARMOR_CAT_MAP[item.category as string];
  if (slot) {
    armorBySlot[slot].push({
      name: item.name as string,
      weight: (item.weight as number) ?? 0,
    });
  }
}

for (const [slot, items] of Object.entries(armorBySlot)) {
  items.sort((a, b) => a.name.localeCompare(b.name));
  writeOut(`armor-${slot}.json`, items);
}

// --- Spells ---
console.log("Processing spells...");

interface SlimSpell {
  name: string;
  fpCost: number;
  slotsUsed: number;
}

const sorceries: SlimSpell[] = [];
const incantations: SlimSpell[] = [];

const baseSpells = readJson(join(BASE_GAME, "spells.json"));
for (const item of Object.values(baseSpells)) {
  const entry: SlimSpell = {
    name: item.name as string,
    fpCost: (item.fp_cost as number) ?? 0,
    slotsUsed: (item.slots_used as number) ?? 1,
  };
  if ((item.category as string) === "Sorcery") sorceries.push(entry);
  else incantations.push(entry);
}

const dlcSpells = readJson(join(DLC, "spells.json"));
for (const item of Object.values(dlcSpells)) {
  const cat = normalizeCategory(item.category as string);
  const entry: SlimSpell = {
    name: item.name as string,
    fpCost: (item.fp_cost as number) ?? 0,
    slotsUsed: (item.slots as number) ?? 1,
  };
  if (cat === "Sorcery") sorceries.push(entry);
  else incantations.push(entry);
}

sorceries.sort((a, b) => a.name.localeCompare(b.name));
incantations.sort((a, b) => a.name.localeCompare(b.name));

writeOut("sorceries.json", sorceries);
writeOut("incantations.json", incantations);

// --- Talismans ---
console.log("Processing talismans...");

interface SlimTalisman {
  name: string;
  weight: number;
}

const talismans: SlimTalisman[] = [];

const baseTalismans = readJson(join(BASE_GAME, "talismans.json"));
for (const item of Object.values(baseTalismans)) {
  talismans.push({
    name: item.name as string,
    weight: item.weight as number,
  });
}

const dlcTalismans = readJson(join(DLC, "talismans.json"));
for (const item of Object.values(dlcTalismans)) {
  talismans.push({
    name: item.name as string,
    weight: (item.weight as number) ?? 0,
  });
}

talismans.sort((a, b) => a.name.localeCompare(b.name));
writeOut("talismans.json", talismans);

// --- Ashes of War ---
console.log("Processing ashes of war...");

interface SlimAsh {
  name: string;
}

const ashes: SlimAsh[] = [];

const baseAshes = readJson(join(BASE_GAME, "ashes-of-war.json"));
for (const item of Object.values(baseAshes)) {
  ashes.push({ name: item.name as string });
}

const dlcAshes = readJson(join(DLC, "ashes-of-war.json"));
for (const item of Object.values(dlcAshes)) {
  ashes.push({ name: item.name as string });
}

ashes.sort((a, b) => a.name.localeCompare(b.name));
writeOut("ashes-of-war.json", ashes);

console.log("\nDone!");
