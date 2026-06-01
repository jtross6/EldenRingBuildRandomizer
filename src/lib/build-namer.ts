import type { SeedItem, StatProfile } from "../types/generator";
import type { SeededRng } from "./seeded-rng";
import { weapons } from "../data";

const DAMAGE_ADJECTIVES: Record<string, string[]> = {
  physical: ["Savage", "Iron", "Steel", "Stone", "Brutal", "Heavy"],
  magic: ["Arcane", "Glint", "Moon", "Crystal", "Astral", "Mystic"],
  fire: ["Blazing", "Flame", "Inferno", "Ember", "Scorching", "Molten"],
  lightning: ["Storm", "Thunder", "Voltaic", "Crackling", "Tempest"],
  holy: ["Sacred", "Golden", "Divine", "Radiant", "Hallowed", "Celestial"],
  bleed: ["Crimson", "Blood", "Sanguine", "Scarlet", "Vermillion"],
  frost: ["Frozen", "Rime", "Glacial", "Frostbitten", "Winter"],
  poison: ["Venomous", "Toxic", "Blight", "Serpent", "Noxious"],
};

const CATEGORY_ROLES: Record<string, string[]> = {
  Dagger: ["Shadow", "Whisper", "Sting", "Needle"],
  "Thrusting Sword": ["Shadow", "Whisper", "Sting", "Needle"],
  "Heavy Thrusting Sword": ["Shadow", "Piercer", "Sting", "Impaler"],
  "Straight Sword": ["Blade", "Knight", "Crusader", "Sentinel"],
  Greatsword: ["Blade", "Knight", "Crusader", "Sentinel"],
  "Light Greatsword": ["Blade", "Knight", "Crusader", "Sentinel"],
  "Colossal Sword": ["Colossus", "Titan", "Juggernaut", "Destroyer"],
  "Colossal Weapon": ["Colossus", "Titan", "Juggernaut", "Destroyer"],
  "Curved Sword": ["Dancer", "Ronin", "Slasher", "Duelist"],
  Katana: ["Dancer", "Ronin", "Slasher", "Duelist"],
  "Great Katana": ["Dancer", "Ronin", "Slasher", "Duelist"],
  Hammer: ["Breaker", "Crusher", "Smiter", "Hammer"],
  "Great Hammer": ["Breaker", "Crusher", "Smiter", "Hammer"],
  Flail: ["Breaker", "Crusher", "Smiter", "Scourge"],
  Axe: ["Cleaver", "Executioner", "Berserker", "Ravager"],
  Greataxe: ["Cleaver", "Executioner", "Berserker", "Ravager"],
  Spear: ["Lancer", "Dragoon", "Impaler", "Warden"],
  "Great Spear": ["Lancer", "Dragoon", "Impaler", "Warden"],
  Halberd: ["Lancer", "Dragoon", "Impaler", "Warden"],
  Fist: ["Brawler", "Fang", "Claw", "Striker"],
  Claw: ["Brawler", "Fang", "Claw", "Striker"],
  "Hand-to-Hand Art": ["Brawler", "Fang", "Monk", "Striker"],
  Whip: ["Reaper", "Scourge", "Harvester", "Lash"],
  Reaper: ["Reaper", "Scourge", "Harvester", "Shade"],
  Twinblade: ["Dancer", "Windcutter", "Cyclone", "Tempest"],
  Bow: ["Archer", "Marksman", "Sniper", "Ranger"],
  "Light Bow": ["Archer", "Marksman", "Sniper", "Ranger"],
  Crossbow: ["Archer", "Marksman", "Sniper", "Ranger"],
  Greatbow: ["Archer", "Marksman", "Sniper", "Ranger"],
  "Glintstone Staff": ["Sage", "Sorcerer", "Magus", "Scholar"],
  "Sacred Seal": ["Prophet", "Apostle", "Herald", "Cleric"],
  Torch: ["Bearer", "Flame", "Warden", "Sentinel"],
  "Backhand Blade": ["Shadow", "Dancer", "Whisper", "Striker"],
  "Perfume Bottle": ["Alchemist", "Apothecary", "Brewer", "Mist"],
  "Throwing Blade": ["Shadow", "Striker", "Needle", "Whisper"],
  "Beast Claw": ["Brawler", "Fang", "Claw", "Striker"],
};

const ARCHETYPE_NAMES: Record<string, string[]> = {
  Spellblade: ["Spellblade", "Mageknight", "Arcane Warrior", "Mystic Blade"],
  Battlemage: ["Battlemage", "War Mage", "Arcane Berserker", "Spell Breaker"],
  Paladin: ["Paladin", "Crusader", "Holy Knight", "Faith Guardian"],
  Assassin: ["Assassin", "Nightblade", "Shadow Dancer", "Phantom"],
  "Blood Mage": ["Blood Mage", "Hemorrhage Lord", "Scarlet Ritualist", "Crimson Priest"],
  Sorcerer: ["Sorcerer", "Archmage", "Star Caller", "Glintstone Adept"],
  Prophet: ["Prophet", "Oracle", "Zealot", "Flame Priest"],
  Warrior: ["Warrior", "Warlord", "Berserker", "Champion"],
  Ronin: ["Ronin", "Bladedancer", "Swift Blade", "Wind Slicer"],
  Quality: ["Champion", "Vanguard", "Arms Master", "Versatile"],
  Tarnished: ["Tarnished", "Wanderer", "Vagabond", "Adventurer"],
};

const STOP_WORDS = new Set([
  "of",
  "the",
  "and",
  "a",
  "an",
  "in",
  "on",
  "at",
  "to",
  "for",
  "is",
  "it",
]);

const GENERIC_WEAPON_WORDS = new Set([
  "sword",
  "blade",
  "greatsword",
  "katana",
  "dagger",
  "axe",
  "hammer",
  "spear",
  "bow",
  "staff",
  "seal",
  "shield",
  "halberd",
  "flail",
  "crossbow",
  "whip",
  "fist",
  "claw",
  "twinblade",
  "scythe",
]);

function extractItemFlavor(itemName: string): string | null {
  const words = itemName.split(/\s+/);
  const flavorWords: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase().replace(/['']/g, "");
    if (STOP_WORDS.has(lower)) continue;
    if (GENERIC_WEAPON_WORDS.has(lower)) continue;
    if (lower.endsWith("'s")) continue;
    flavorWords.push(word);
    if (flavorWords.length >= 2) break;
  }

  if (flavorWords.length === 0) return null;
  return flavorWords.join(" ");
}

function getArchetype(profile: StatProfile): string {
  const p = profile;
  if ((p.intelligence ?? 0) >= 0.25 && (p.dexterity ?? 0) >= 0.2) return "Spellblade";
  if ((p.intelligence ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2) return "Battlemage";
  if ((p.faith ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2) return "Paladin";
  if ((p.dexterity ?? 0) >= 0.25 && (p.arcane ?? 0) >= 0.2) return "Assassin";
  if ((p.arcane ?? 0) >= 0.4) return "Blood Mage";
  if ((p.intelligence ?? 0) >= 0.4) return "Sorcerer";
  if ((p.faith ?? 0) >= 0.4) return "Prophet";
  if ((p.strength ?? 0) >= 0.4) return "Warrior";
  if ((p.dexterity ?? 0) >= 0.4) return "Ronin";
  if ((p.strength ?? 0) >= 0.2 && (p.dexterity ?? 0) >= 0.2) return "Quality";
  return "Tarnished";
}

function pickFrom(pool: string[], rng: SeededRng): string {
  return pool[rng.randomInt(pool.length)];
}

export function generateBuildName(
  seedItems: SeedItem[],
  profile: StatProfile,
  damageTypes: string[],
  rng: SeededRng,
): string {
  const archetype = getArchetype(profile);

  // Determine damage flavor
  const primaryDamage = damageTypes.find((d) => d !== "physical") ?? damageTypes[0] ?? "physical";
  // Check status effects for bleed/frost/poison
  let effectType: string | null = null;
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      const w = weapons[seed.index];
      if (w?.statusEffects) {
        if (w.statusEffects.bleed) effectType = "bleed";
        else if (w.statusEffects.frostbite) effectType = "frost";
        else if (w.statusEffects.poison) effectType = "poison";
      }
    }
  }
  const flavorKey = effectType ?? primaryDamage;
  const adjectives = DAMAGE_ADJECTIVES[flavorKey] ?? DAMAGE_ADJECTIVES.physical;

  // Determine role from weapon category
  const primarySeed = seedItems.find((s) => s.type === "weapon");
  const category = primarySeed ? weapons[primarySeed.index]?.category : null;
  const roles = category
    ? (CATEGORY_ROLES[category] ?? CATEGORY_ROLES["Straight Sword"])
    : CATEGORY_ROLES["Straight Sword"];

  // Extract item flavor
  const itemFlavor = primarySeed ? extractItemFlavor(primarySeed.name) : null;

  // Archetype name pool
  const archetypeNames = ARCHETYPE_NAMES[archetype] ?? ARCHETYPE_NAMES.Tarnished;

  // Pick template (5 patterns)
  const templateIdx = rng.randomInt(5);

  switch (templateIdx) {
    case 0:
      // "{Adjective} {Role}" — "Blazing Crusader"
      return `${pickFrom(adjectives, rng)} ${pickFrom(roles, rng)}`;
    case 1:
      // "{Adjective} {Archetype}" — "Crimson Assassin"
      return `${pickFrom(adjectives, rng)} ${pickFrom(archetypeNames, rng)}`;
    case 2:
      // "{ItemFlavor} {Role}" — "Moonlight Sentinel"
      if (itemFlavor) return `${itemFlavor} ${pickFrom(roles, rng)}`;
      return `${pickFrom(adjectives, rng)} ${pickFrom(roles, rng)}`;
    case 3:
      // "{Role} of {Element}" — "Knight of Frost"
      return `${pickFrom(roles, rng)} of ${pickFrom(adjectives, rng).replace(/ing$/, "")}`;
    case 4: {
      // "{Adjective}{Role}" compound — "Stormblade", "Bloodfang"
      const adj = pickFrom(adjectives, rng).toLowerCase();
      const role = pickFrom(roles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjectives, rng)} ${pickFrom(archetypeNames, rng)}`;
  }
}
