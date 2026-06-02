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
  subGroup: WeaponSubGroup,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  rng: SeededRng,
): string {
  const adjPool = school
    ? SCHOOL_ADJECTIVES[school]
    : statusEffect
      ? (STATUS_ADJECTIVES[statusEffect] ?? ["Savage", "Iron", "Steel", "Brutal"])
      : ["Savage", "Iron", "Steel", "Brutal", "Stone", "Heavy"];

  const subGroupRoles = SUB_GROUP_ROLES[subGroup] ?? SUB_GROUP_ROLES["straight-swords"];
  const identityRoles = IDENTITY_ROLES[identity] ?? IDENTITY_ROLES.warrior;

  const templateIdx = rng.randomInt(4);
  switch (templateIdx) {
    case 0:
      return `${pickFrom(adjPool, rng)} ${pickFrom(subGroupRoles, rng)}`;
    case 1:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
    case 2:
      return `${pickFrom(subGroupRoles, rng)} of ${pickFrom(adjPool, rng).replace(/ing$/, "")}`;
    case 3: {
      const adj = pickFrom(adjPool, rng).toLowerCase();
      const role = pickFrom(subGroupRoles, rng).toLowerCase();
      return `${adj.charAt(0).toUpperCase()}${adj.slice(1)}${role}`;
    }
    default:
      return `${pickFrom(adjPool, rng)} ${pickFrom(identityRoles, rng)}`;
  }
}
