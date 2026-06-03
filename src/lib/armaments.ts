import type { Weapon, Shield, Staff, Seal } from "../types/items";
import { weapons, shields, staves, seals } from "../data";

export type ArmamentType = "weapon" | "shield" | "staff" | "seal";

export interface ArmamentRef {
  type: ArmamentType;
  index: number;
}

export type Armament = Weapon | Shield | Staff | Seal;

const DATA_ARRAYS: Record<ArmamentType, readonly Armament[]> = {
  weapon: weapons,
  shield: shields,
  staff: staves,
  seal: seals,
};

export function lookupArmament(ref: ArmamentRef): Armament | undefined {
  return DATA_ARRAYS[ref.type]?.[ref.index];
}

export function armamentName(ref: ArmamentRef): string {
  return lookupArmament(ref)?.name ?? "Unknown";
}

export function armamentCategory(ref: ArmamentRef): ArmamentType {
  return ref.type;
}

export function armamentPoolSize(type: ArmamentType): number {
  return DATA_ARRAYS[type].length;
}

export function allArmamentRefs(type: ArmamentType): ArmamentRef[] {
  return DATA_ARRAYS[type].map((_, index) => ({ type, index }));
}
