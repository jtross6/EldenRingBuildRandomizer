import type { Build } from "../types/build";
import type { ArmamentRef, ArmamentType } from "./armaments";
import {
  weapons,
  shields,
  staves,
  seals,
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

function randomChance(): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0xffffffff;
}

function randomArmamentRef(type: ArmamentType, poolSize: number): ArmamentRef {
  return { type, index: randomIndex(poolSize) };
}

export function generateRandomBuild(): Build {
  const rightHand: ArmamentRef[] = [];
  const leftHand: ArmamentRef[] = [];

  // 1-3 weapons in right hand
  const rightCount = 1 + randomIndex(3);
  for (let i = 0; i < rightCount; i++) {
    rightHand.push(randomArmamentRef("weapon", weapons.length));
  }

  // 1-3 items in left hand (mix of weapon types)
  const leftCount = 1 + randomIndex(3);
  for (let i = 0; i < leftCount; i++) {
    const roll = randomChance();
    if (roll < 0.5) {
      leftHand.push(randomArmamentRef("weapon", weapons.length));
    } else if (roll < 0.75) {
      leftHand.push(randomArmamentRef("shield", shields.length));
    } else if (roll < 0.875) {
      leftHand.push(randomArmamentRef("staff", staves.length));
    } else {
      leftHand.push(randomArmamentRef("seal", seals.length));
    }
  }

  return {
    rightHand,
    leftHand,
    helm: randomIndex(armorHead.length),
    chest: randomIndex(armorBody.length),
    gauntlets: randomIndex(armorArms.length),
    legs: randomIndex(armorLegs.length),
    talismans: randomIndices(talismans.length, 4),
    ashesOfWar: randomIndices(ashesOfWar.length, 3),
    sorceries: randomIndices(sorceries.length, 4),
    incantations: randomIndices(incantations.length, 4),
  };
}
