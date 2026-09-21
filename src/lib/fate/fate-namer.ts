import type {
  CombatIdentity,
  WeaponStance,
  WeaponSubGroup,
  MagicSchool,
  StatusEffect,
} from "../../types/fate";
import type { SeededRng } from "../seeded-rng";

const SCHOOL_ADJECTIVES: Record<string, string[]> = {
  glintstone: ["Arcane", "Glint", "Crystal", "Astral"],
  "moon-frost": ["Frozen", "Moon", "Rime", "Glacial"],
  gravity: ["Meteoric", "Void", "Cosmic", "Star"],
  night: ["Shadow", "Night", "Dusk", "Phantom"],
  aberrant: ["Twisted", "Aberrant", "Maddened", "Warped"],
  "golden-order": ["Sacred", "Golden", "Radiant", "Divine"],
  blackflame: ["Blackflame", "Godskin", "Duskborn", "Ashen"],
  dragon: ["Draconic", "Ancient", "Wyrm", "Drake"],
  lightning: ["Storm", "Thunder", "Voltaic", "Tempest"],
  bestial: ["Feral", "Stone", "Primal", "Beastial"],
  fire: ["Blazing", "Flame", "Inferno", "Molten"],
  blood: ["Crimson", "Sanguine", "Scarlet", "Blood"],
  "frenzied-flame": ["Frenzied", "Maddened", "Chaos", "Fell"],
  death: ["Deathly", "Spectral", "Rancorous", "Grave"],
  rot: ["Rotting", "Putrid", "Venomous", "Blighted"],
};

const STATUS_ADJECTIVES: Record<string, string[]> = {
  bleed: ["Crimson", "Sanguine", "Scarlet", "Blood"],
  frost: ["Frozen", "Rime", "Glacial", "Winter"],
  poison: ["Venomous", "Toxic", "Serpent", "Noxious"],
  "scarlet-rot": ["Rotting", "Scarlet", "Blooming", "Withered"],
  madness: ["Frenzied", "Maddened", "Howling", "Deranged"],
  sleep: ["Dreaming", "Twilight", "Somnolent", "Misty"],
};

const STAT_ADJECTIVES: Record<string, string[]> = {
  STR: ["Heavy", "Iron", "Brutal", "Stone", "Mighty", "Savage"],
  DEX: ["Swift", "Keen", "Nimble", "Agile", "Fleet", "Precise"],
  INT: ["Arcane", "Astral", "Crystal", "Gleaming", "Eldritch", "Void"],
  FTH: ["Sacred", "Divine", "Holy", "Radiant", "Blessed", "Hallowed"],
  ARC: ["Occult", "Sanguine", "Eldritch", "Fell", "Shadowed", "Crimson"],
  "STR,DEX": ["Savage", "Steel", "Relentless", "Fierce", "Battle", "War"],
  "DEX,INT": ["Arcane", "Swift", "Mystic", "Gleaming", "Astral", "Keen"],
  "STR,INT": ["Runic", "Iron", "Arcane", "Brutal", "Crystal", "Stone"],
  "DEX,FTH": ["Sacred", "Swift", "Blessed", "Keen", "Holy", "Fleet"],
  "STR,FTH": ["Sacred", "Iron", "Holy", "Mighty", "Divine", "Stone"],
  "DEX,ARC": ["Occult", "Swift", "Fell", "Keen", "Shadowed", "Nimble"],
  // Faith and Arcane are both casting stats, so which one leads sets the tone:
  // faith-first reads as a communer, arcane-first as a blood-touched skirmisher.
  "FTH,ARC": ["Sacred", "Sanguine", "Blessed", "Fell", "Divine", "Occult"],
  "ARC,FTH": ["Occult", "Sacred", "Fell", "Blessed", "Sanguine", "Divine"],
};

function getStatAdjectives(primaryStats: string[]): string[] {
  const key = primaryStats.join(",");
  return (
    STAT_ADJECTIVES[key] ??
    STAT_ADJECTIVES[primaryStats[0]] ?? ["Savage", "Iron", "Steel", "Brutal", "Stone", "Heavy"]
  );
}

const SUB_GROUP_ROLES: Record<string, string[]> = {
  daggers: ["Shadow", "Whisper", "Stiletto", "Viper"],
  "curved-swords": ["Dancer", "Dervish", "Crescent", "Duelist"],
  katanas: ["Ronin", "Kensei", "Blade", "Wanderer"],
  "thrusting-swords": ["Duelist", "Fencer", "Rapier", "Piercer"],
  "backhand-blades": ["Reaver", "Ripper", "Slasher", "Unseen"],
  "throwing-blades": ["Flicker", "Thorn", "Needle", "Dart"],
  "straight-swords": ["Knight", "Sentinel", "Crusader", "Sword"],
  greatswords: ["Greatsword", "Claymore", "Bastion", "Vanquisher"],
  "great-katanas": ["Shogun", "Warden", "Odachi", "Cleaver"],
  "colossal-swords": ["Titan", "Destroyer", "Monolith", "Colossus"],
  "colossal-weapons": ["Juggernaut", "Devastator", "Earthshaker", "Colossus"],
  axes: ["Cleaver", "Executioner", "Hewer", "Chopper"],
  hammers: ["Breaker", "Crusher", "Smiter", "Hammer"],
  spears: ["Lancer", "Dragoon", "Impaler", "Pikeman"],
  halberds: ["Warden", "Sentinel", "Halberdier", "Vanguard"],
  reapers: ["Harvester", "Deathbringer", "Scythe", "Reaper"],
  twinblades: ["Cyclone", "Windcutter", "Tempest", "Dervish"],
  whips: ["Lasher", "Scourge", "Flayer", "Serpent"],
  "fist-weapons": ["Brawler", "Pugilist", "Striker", "Fist"],
  torches: ["Firebrand", "Torchbearer", "Lightbringer", "Ember"],
  "perfume-bottles": ["Alchemist", "Perfumer", "Apothecary", "Mist"],
  bows: ["Marksman", "Archer", "Longshot", "Ranger"],
  crossbows: ["Sniper", "Arbalist", "Bolter", "Sharpshooter"],
};

const SHIELD_ROLES: string[] = [
  "Bulwark",
  "Fortress",
  "Rampart",
  "Bastion",
  "Shield Wall",
  "Ironclad",
  "Phalanx",
  "Aegis",
];

const IDENTITY_ROLES: Record<string, string[]> = {
  warrior: ["Warrior", "Champion", "Berserker", "Warlord"],
  spellcaster: ["Sage", "Sorcerer", "Prophet", "Oracle"],
  spellblade: ["Spellblade", "Mageknight", "Paladin", "Battlemage"],
  skirmisher: ["Assassin", "Phantom", "Nightblade", "Reaver"],
};

const NOUN_FORM: Record<string, string> = {
  Blazing: "Blaze",
  Rotting: "Rot",
  Frozen: "Frost",
  Glacial: "Glacier",
  Meteoric: "Meteor",
  Cosmic: "Cosmos",
  Twisted: "Torment",
  Aberrant: "Ruin",
  Warped: "Ruin",
  Draconic: "Dragon",
  Voltaic: "Volt",
  Beastial: "Beast",
  Molten: "Magma",
  Venomous: "Venom",
  Toxic: "Blight",
  Noxious: "Bane",
  Somnolent: "Slumber",
  Deranged: "Madness",
  Brutal: "Brute",
  Mighty: "Might",
  Savage: "Savagery",
  Nimble: "Grace",
  Agile: "Haste",
  Precise: "Precision",
  Relentless: "Fury",
  Fierce: "Ferocity",
};

function toNounForm(adj: string): string {
  return NOUN_FORM[adj] ?? adj.replace(/ing$/, "");
}

function pickFrom(pool: string[], rng: SeededRng): string {
  return pool[rng.randomInt(pool.length)];
}

export function generateFateName(
  identity: CombatIdentity,
  stance: WeaponStance,
  subGroup: WeaponSubGroup | null,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  primaryStats: string[],
  rng: SeededRng,
): string {
  const adjPool = school
    ? SCHOOL_ADJECTIVES[school]
    : statusEffect
      ? (STATUS_ADJECTIVES[statusEffect] ?? ["Savage", "Iron", "Steel", "Brutal"])
      : getStatAdjectives(primaryStats);

  const subGroupRoles =
    stance === "double-shield"
      ? SHIELD_ROLES
      : (SUB_GROUP_ROLES[subGroup!] ?? SUB_GROUP_ROLES["straight-swords"]);
  const identityRoles = IDENTITY_ROLES[identity] ?? IDENTITY_ROLES.warrior;

  const templateIdx = rng.randomInt(4);
  switch (templateIdx) {
    case 0:
      return `${pickFrom(adjPool, rng)} ${pickFrom(subGroupRoles, rng)}`;
    case 1:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
    case 2:
      return `${pickFrom(subGroupRoles, rng)} of ${toNounForm(pickFrom(adjPool, rng))}`;
    case 3: {
      const adj = pickFrom(adjPool, rng).toLowerCase();
      const role = pickFrom(subGroupRoles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
  }
}
