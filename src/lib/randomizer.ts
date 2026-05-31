import type { Build } from "../types/build";
import {
  weapons,
  shields,
  catalysts,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";

function randomIndex(poolSize: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % poolSize;
}

function randomIndices(poolSize: number, count: number): number[] {
  const picked = new Set<number>();
  while (picked.size < Math.min(count, poolSize)) {
    picked.add(randomIndex(poolSize));
  }
  return [...picked];
}

export function generateRandomBuild(): Build {
  return {
    weaponsRight: randomIndices(weapons.length, 3),
    weaponsLeft: randomIndices(weapons.length, 3),
    helm: randomIndex(armorHead.length),
    chest: randomIndex(armorBody.length),
    gauntlets: randomIndex(armorArms.length),
    legs: randomIndex(armorLegs.length),
    shield: randomIndex(shields.length),
    catalyst: randomIndex(catalysts.length),
    talismans: randomIndices(talismans.length, 4),
    ashesOfWar: randomIndices(ashesOfWar.length, 3),
    sorceries: randomIndices(sorceries.length, 4),
    incantations: randomIndices(incantations.length, 4),
  };
}
