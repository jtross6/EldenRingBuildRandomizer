import type { Build } from "./build";

export type ItemType = "weapon" | "shield" | "catalyst" | "spell" | "ashOfWar" | "talisman";

export interface SeedItem {
  name: string;
  type: ItemType;
  index: number;
}

export type StatProfile = Record<string, number>;

export type ArmorClass = "light" | "medium" | "heavy";

export type LoadoutProfile =
  | "Pure Caster"
  | "Spellblade"
  | "Sword & Board"
  | "Two-hander"
  | "Powerstance"
  | "Ranged"
  | "Dual Wield";

export interface GeneratorInput {
  seedItems: SeedItem[];
  creativity: number;
  seed: number;
}

export interface GeneratedBuild {
  build: Build;
  armorClass: ArmorClass;
  statProfile: StatProfile;
  buildName: string;
  loadoutProfile: LoadoutProfile;
}
