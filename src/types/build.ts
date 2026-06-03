import type { ArmamentRef } from "../lib/armaments";

export interface Build {
  buildName?: string;
  buildImage?: string;
  rightHand: ArmamentRef[];
  leftHand: ArmamentRef[];
  helm: number;
  chest: number;
  gauntlets: number;
  legs: number;
  talismans: number[];
  ashesOfWar: number[];
  sorceries: number[];
  incantations: number[];
}
