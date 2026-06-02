import type { CombatIdentity, WeaponStance, WeaponSubGroup, MagicSchool } from "../../types/fate";

interface FlavorRule {
  subGroup?: WeaponSubGroup | WeaponSubGroup[];
  stance?: WeaponStance | WeaponStance[];
  identity?: CombatIdentity | CombatIdentity[];
  school?: MagicSchool | MagicSchool[];
  title: string;
}

function matches<T>(value: T, criterion: T | T[] | undefined): boolean {
  if (criterion === undefined) return true;
  if (Array.isArray(criterion)) return criterion.includes(value);
  return value === criterion;
}

const FLAVOR_RULES: FlavorRule[] = [
  // --- Specific weapon combos (sub-group + stance + school/identity) ---

  // Straight swords + sword-board + school
  { subGroup: "straight-swords", stance: "sword-board", school: "golden-order", title: "Paladin" },
  { subGroup: "straight-swords", stance: "sword-board", school: "fire", title: "Crusader" },
  { subGroup: "straight-swords", stance: "sword-board", school: "lightning", title: "Templar" },
  { subGroup: "straight-swords", stance: "sword-board", identity: "warrior", title: "Knight" },

  // Greatswords + stance + identity
  { subGroup: "greatswords", stance: "two-hand", identity: "warrior", title: "Greatknight" },

  // Hammers + sword-board + school
  { subGroup: "hammers", stance: "sword-board", school: "golden-order", title: "Templar" },
  { subGroup: "hammers", stance: "sword-board", school: "fire", title: "Inquisitor" },
  { subGroup: "hammers", stance: "sword-board", identity: "warrior", title: "Bulwark" },

  // Hammers + spellblade + school
  { subGroup: "hammers", identity: "spellblade", school: "golden-order", title: "Cleric" },

  // Fist + dual-wield + warrior
  { subGroup: "fist-weapons", stance: "dual-wield", identity: "warrior", title: "Brawler" },

  // --- Sub-group + stance combos ---

  // Katanas + stance + identity
  {
    subGroup: "katanas",
    stance: ["two-hand", "dual-wield"],
    identity: "warrior",
    title: "Samurai",
  },

  // Curved swords
  { subGroup: "curved-swords", stance: "dual-wield", title: "Dervish" },

  // Thrusting swords
  { subGroup: "thrusting-swords", stance: "sword-board", title: "Fencer" },

  // Greatswords + stance
  { subGroup: "greatswords", stance: "dual-wield", title: "Berserker" },
  { subGroup: "greatswords", stance: "sword-board", title: "Sentinel" },

  // Axes + stance
  { subGroup: "axes", stance: "dual-wield", title: "Berserker" },
  { subGroup: "axes", stance: "sword-board", title: "Warlord" },

  // Spears + stance
  { subGroup: "spears", stance: "sword-board", title: "Legionnaire" },

  // Halberds + stance
  { subGroup: "halberds", stance: "sword-board", title: "Warden" },

  // Twinblades + stance
  { subGroup: "twinblades", stance: "dual-wield", title: "Tempest" },

  // --- Sub-group + identity combos ---

  { subGroup: "katanas", identity: "skirmisher", title: "Shinobi" },
  { subGroup: "katanas", identity: "spellblade", title: "Kensei" },

  { subGroup: "great-katanas", identity: "warrior", title: "Shogun" },
  { subGroup: "great-katanas", identity: "skirmisher", title: "Ronin" },
  { subGroup: "great-katanas", identity: "spellblade", title: "Sword Saint" },

  { subGroup: "daggers", identity: "skirmisher", title: "Assassin" },
  { subGroup: "daggers", identity: "spellblade", title: "Nightblade" },

  { subGroup: "backhand-blades", identity: "skirmisher", title: "Assassin" },

  { subGroup: "curved-swords", identity: "skirmisher", title: "Corsair" },

  { subGroup: "thrusting-swords", identity: "spellblade", title: "Spellsword" },

  { subGroup: "straight-swords", identity: "spellblade", title: "Spellsword" },

  { subGroup: "greatswords", identity: "spellblade", title: "Dark Knight" },

  { subGroup: "colossal-swords", identity: "spellblade", title: "Abyssal Knight" },

  { subGroup: "axes", identity: "skirmisher", title: "Marauder" },

  { subGroup: "spears", identity: "skirmisher", title: "Dragoon" },

  { subGroup: "reapers", identity: "skirmisher", title: "Deathbringer" },

  { subGroup: "twinblades", identity: "spellblade", title: "Spell Dancer" },

  { subGroup: "whips", identity: "skirmisher", title: "Scourge" },

  { subGroup: "fist-weapons", identity: "spellblade", title: "Monk" },

  { subGroup: "bows", identity: "skirmisher", title: "Scout" },
  { subGroup: "bows", identity: "spellblade", title: "Arcane Archer" },

  { subGroup: "crossbows", identity: "skirmisher", title: "Sharpshooter" },

  // --- Sub-group + school combos ---

  { subGroup: "katanas", school: "night", title: "Shinobi" },
  { subGroup: "katanas", school: "blood", title: "Blood Ronin" },

  { subGroup: "daggers", school: "night", title: "Shadow" },
  { subGroup: "daggers", school: "blood", title: "Blood Thorn" },

  { subGroup: "reapers", school: "blackflame", title: "Godskin" },

  { subGroup: "whips", school: "golden-order", title: "Penitent" },

  { subGroup: "fist-weapons", school: ["golden-order", "bestial"], title: "Monk" },

  // --- Spellcaster + school overrides (no sub-group constraint) ---

  { identity: "spellcaster", school: "glintstone", title: "Astrologer" },
  { identity: "spellcaster", school: "moon-frost", title: "Cryomancer" },
  { identity: "spellcaster", school: "gravity", title: "Stargazer" },
  { identity: "spellcaster", school: "night", title: "Nightseer" },
  { identity: "spellcaster", school: "aberrant", title: "Heretic" },
  { identity: "spellcaster", school: "golden-order", title: "Oracle" },
  { identity: "spellcaster", school: "blackflame", title: "Godskin Apostle" },
  { identity: "spellcaster", school: "dragon", title: "Dragon Priest" },
  { identity: "spellcaster", school: "lightning", title: "Stormcaller" },
  { identity: "spellcaster", school: "bestial", title: "Beast Shaman" },
  { identity: "spellcaster", school: "fire", title: "Prophet" },
  { identity: "spellcaster", school: "blood", title: "Hemomancer" },
  { identity: "spellcaster", school: "frenzied-flame", title: "Madman" },

  // --- Sub-group fallbacks ---

  { subGroup: "katanas", title: "Ronin" },
  { subGroup: "great-katanas", title: "Shogun" },
  { subGroup: "daggers", title: "Rogue" },
  { subGroup: "backhand-blades", title: "Reaver" },
  { subGroup: "throwing-blades", title: "Trickster" },
  { subGroup: "curved-swords", title: "Dancer" },
  { subGroup: "thrusting-swords", title: "Duelist" },
  { subGroup: "straight-swords", title: "Swordsman" },
  { subGroup: "greatswords", title: "Greatknight" },
  { subGroup: "colossal-swords", title: "Titan" },
  { subGroup: "colossal-weapons", title: "Juggernaut" },
  { subGroup: "axes", title: "Executioner" },
  { subGroup: "hammers", title: "Bonecrusher" },
  { subGroup: "spears", title: "Lancer" },
  { subGroup: "halberds", title: "Vanguard" },
  { subGroup: "reapers", title: "Harvester" },
  { subGroup: "twinblades", title: "Windcutter" },
  { subGroup: "whips", title: "Flagellant" },
  { subGroup: "fist-weapons", title: "Pugilist" },
  { subGroup: "torches", title: "Firebrand" },
  { subGroup: "perfume-bottles", title: "Alchemist" },
  { subGroup: "bows", title: "Archer" },
  { subGroup: "crossbows", title: "Arbalist" },

  // --- Identity fallbacks (ultimate safety net) ---

  { identity: "warrior", title: "Warrior" },
  { identity: "spellcaster", title: "Sorcerer" },
  { identity: "spellblade", title: "Spellblade" },
  { identity: "skirmisher", title: "Skirmisher" },
];

export function resolveFlavorIdentity(
  subGroup: WeaponSubGroup,
  stance: WeaponStance,
  identity: CombatIdentity,
  school: MagicSchool | null,
): string {
  for (const rule of FLAVOR_RULES) {
    if (!matches(subGroup, rule.subGroup)) continue;
    if (!matches(stance, rule.stance)) continue;
    if (!matches(identity, rule.identity)) continue;
    if (rule.school !== undefined && (school === null || !matches(school, rule.school))) continue;
    return rule.title;
  }
  return "Tarnished";
}
