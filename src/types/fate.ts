export type CombatIdentity = "warrior" | "spellcaster" | "spellblade" | "skirmisher";

export type WeaponStance = "two-hand" | "dual-wield" | "sword-board" | "ranged";

export type WeaponFamily =
  | "light-blades"
  | "heavy-blades"
  | "colossal"
  | "axes-hammers"
  | "polearms"
  | "agile-exotic"
  | "ranged";

export type WeaponSubGroup =
  | "daggers"
  | "curved-swords"
  | "katanas"
  | "thrusting-swords"
  | "backhand-blades"
  | "throwing-blades"
  | "straight-swords"
  | "greatswords"
  | "great-katanas"
  | "colossal-swords"
  | "colossal-weapons"
  | "axes"
  | "hammers"
  | "spears"
  | "halberds"
  | "reapers"
  | "twinblades"
  | "whips"
  | "fist-weapons"
  | "torches"
  | "perfume-bottles"
  | "bows"
  | "crossbows";

export type MagicSchool =
  | "glintstone"
  | "moon-frost"
  | "gravity"
  | "night"
  | "aberrant"
  | "golden-order"
  | "blackflame"
  | "dragon"
  | "lightning"
  | "bestial"
  | "fire"
  | "blood"
  | "frenzied-flame";

export type MagicLevel = "none" | "support" | "primary" | "any";

export type StatusEffect = "bleed" | "frost" | "poison" | "scarlet-rot" | "madness" | "sleep";

export type ArmorClass = "light" | "medium" | "heavy";

export interface PlaystyleCard {
  identity: CombatIdentity;
  stance: WeaponStance;
  family: WeaponFamily;
  subGroups: WeaponSubGroup[];
  school: MagicSchool | null;
  statusEffect: StatusEffect | null;
  armorClass: ArmorClass;
  primaryStats: string[];
  name: string;
  flavor: string;
  seed: number;
}

export interface PlaystyleConstraint {
  magic?: MagicLevel;
  stance?: WeaponStance;
  family?: WeaponFamily;
  school?: MagicSchool;
  statusEffect?: StatusEffect;
  armorClass?: ArmorClass;
}
