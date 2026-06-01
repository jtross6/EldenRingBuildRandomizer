import type {
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
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
  "frenzied-flame": ["Frenzied", "Maddened", "Chaotic", "Fell"],
};

const STATUS_ADJECTIVES: Record<string, string[]> = {
  bleed: ["Crimson", "Sanguine", "Scarlet", "Blood"],
  frost: ["Frozen", "Rime", "Glacial", "Winter"],
  poison: ["Venomous", "Toxic", "Serpent", "Noxious"],
  "scarlet-rot": ["Rotting", "Scarlet", "Blooming", "Withered"],
  madness: ["Frenzied", "Maddened", "Howling", "Deranged"],
  sleep: ["Dreaming", "Twilight", "Somnolent", "Misty"],
};

const FAMILY_ROLES: Record<string, string[]> = {
  "light-blades": ["Dancer", "Shadow", "Duelist", "Whisper"],
  "heavy-blades": ["Knight", "Sentinel", "Crusader", "Blade"],
  colossal: ["Colossus", "Titan", "Juggernaut", "Destroyer"],
  "axes-hammers": ["Breaker", "Crusher", "Executioner", "Ravager"],
  polearms: ["Lancer", "Dragoon", "Warden", "Impaler"],
  "agile-exotic": ["Brawler", "Windcutter", "Cyclone", "Striker"],
  ranged: ["Marksman", "Ranger", "Sniper", "Archer"],
};

const IDENTITY_ROLES: Record<string, string[]> = {
  warrior: ["Warrior", "Champion", "Berserker", "Warlord"],
  spellcaster: ["Sage", "Sorcerer", "Prophet", "Oracle"],
  spellblade: ["Spellblade", "Mageknight", "Paladin", "Battlemage"],
  skirmisher: ["Assassin", "Phantom", "Nightblade", "Reaver"],
};

function pickFrom(pool: string[], rng: SeededRng): string {
  return pool[rng.randomInt(pool.length)];
}

export function generateFateName(
  identity: CombatIdentity,
  _stance: WeaponStance,
  family: WeaponFamily,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
): string {
  const adjPool = school
    ? SCHOOL_ADJECTIVES[school]
    : statusEffect
      ? (STATUS_ADJECTIVES[statusEffect] ?? ["Savage", "Iron", "Steel", "Brutal"])
      : ["Savage", "Iron", "Steel", "Brutal", "Stone", "Heavy"];

  const familyRoles = FAMILY_ROLES[family] ?? FAMILY_ROLES["heavy-blades"];
  const identityRoles = IDENTITY_ROLES[identity] ?? IDENTITY_ROLES.warrior;

  const templateIdx = rng.randomInt(4);
  switch (templateIdx) {
    case 0:
      return `${pickFrom(adjPool, rng)} ${pickFrom(familyRoles, rng)}`;
    case 1:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
    case 2:
      return `${pickFrom(familyRoles, rng)} of ${pickFrom(adjPool, rng).replace(/ing$/, "")}`;
    case 3: {
      const adj = pickFrom(adjPool, rng).toLowerCase();
      const role = pickFrom(familyRoles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
  }
}
