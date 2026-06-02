import type { Build } from "../../types/build";
import type { PlaystyleCard, WeaponSubGroup } from "../../types/fate";
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
  spellTags,
} from "../../data";
import { createRng, type SeededRng } from "../seeded-rng";
import { SUB_GROUP_CATEGORIES, isSorcerySchool, identityAllowsMagic } from "./taxonomy";

const AFFINITY_BY_STAT: Record<string, string[]> = {
  STR: ["Heavy"],
  DEX: ["Keen"],
  INT: ["Magic", "Cold"],
  FTH: ["Sacred", "Flame Art"],
  ARC: ["Blood", "Occult"],
};

function pickRandom<T>(
  arr: T[],
  rng: SeededRng,
  count: number,
  exclude = new Set<number>(),
): number[] {
  const available = arr.map((_, i) => i).filter((i) => !exclude.has(i));
  const shuffled = rng.shuffle(available);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function filterWeaponsBySubGroup(subGroup: WeaponSubGroup): number[] {
  const validCategories = new Set(SUB_GROUP_CATEGORIES[subGroup]);
  return weapons
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => validCategories.has(w.category))
    .map(({ i }) => i);
}

function filterSpellsBySchool(
  spellList: typeof sorceries | typeof incantations,
  tags: Record<string, string[]>,
  school: string,
): number[] {
  return spellList
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      const t = tags[s.name];
      return t && t.includes(school);
    })
    .map(({ i }) => i);
}

function pickArmor(pool: typeof armorHead, rng: SeededRng): number {
  return rng.randomInt(pool.length);
}

export function generateBuildFromFate(card: PlaystyleCard): Build {
  const rng = createRng(card.seed ^ 0x46415445);

  const weaponsRight: number[] = [];
  const weaponsLeft: number[] = [];
  const shieldIndices: number[] = [];
  const staffIndices: number[] = [];
  const sealIndices: number[] = [];
  const exclude = new Set<number>();

  switch (card.stance) {
    case "two-hand": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      break;
    }
    case "dual-wield": {
      const rightCandidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (rightCandidates.length > 0) {
        const shuffled = rng.shuffle(rightCandidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      if (card.subGroups[0] === card.subGroups[1]) {
        const remaining = filterWeaponsBySubGroup(card.subGroups[1]).filter(
          (i) => !exclude.has(i),
        );
        if (remaining.length > 0) {
          const shuffled = rng.shuffle(remaining);
          weaponsLeft.push(shuffled[0]);
          exclude.add(shuffled[0]);
        }
      } else {
        const leftCandidates = filterWeaponsBySubGroup(card.subGroups[1]);
        if (leftCandidates.length > 0) {
          const shuffled = rng.shuffle(leftCandidates);
          weaponsLeft.push(shuffled[0]);
          exclude.add(shuffled[0]);
        }
      }
      break;
    }
    case "sword-board": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      const shieldPick = pickRandom(shields, rng, 1);
      if (shieldPick.length > 0) shieldIndices.push(shieldPick[0]);
      break;
    }
    case "ranged": {
      const candidates = filterWeaponsBySubGroup(card.subGroups[0]);
      if (candidates.length > 0) {
        const shuffled = rng.shuffle(candidates);
        weaponsRight.push(shuffled[0]);
        exclude.add(shuffled[0]);
      }
      const meleeWeapons = weapons
        .map((w, i) => ({ w, i }))
        .filter(
          ({ w }) =>
            !["Bow", "Light Bow", "Greatbow", "Crossbow", "Ballista"].includes(w.category),
        )
        .map(({ i }) => i);
      if (meleeWeapons.length > 0) {
        const meleePick = rng.shuffle(meleeWeapons);
        weaponsLeft.push(meleePick[0]);
      }
      break;
    }
  }

  if (identityAllowsMagic(card.identity) && card.school) {
    const isSorc = card.school ? isSorcerySchool(card.school) : false;
    if (isSorc) {
      const pool = staves.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        staffIndices.push(shuffled[0]);
      }
    } else {
      const pool = seals.map((_, i) => i);
      if (pool.length > 0) {
        const shuffled = rng.shuffle(pool);
        sealIndices.push(shuffled[0]);
      }
    }
  }

  let sorceryIndices: number[] = [];
  let incantationIndices: number[] = [];
  if (card.school && identityAllowsMagic(card.identity)) {
    const isSorc = isSorcerySchool(card.school);
    if (isSorc) {
      const matching = filterSpellsBySchool(sorceries, spellTags.sorceries, card.school);
      const count = card.identity === "spellcaster" ? 4 : 2;
      sorceryIndices = rng.shuffle(matching).slice(0, Math.min(count, matching.length));
    } else {
      const matching = filterSpellsBySchool(incantations, spellTags.incantations, card.school);
      const count = card.identity === "spellcaster" ? 4 : 2;
      incantationIndices = rng.shuffle(matching).slice(0, Math.min(count, matching.length));
    }
  }

  const talismanCount = card.identity === "spellcaster" ? 4 : card.identity === "warrior" ? 2 : 3;
  const talismanIndices = pickRandom(talismans, rng, talismanCount);

  const ashIndices: number[] = [];
  const equippedWeapons = [...weaponsRight, ...weaponsLeft];
  const targetAffinities = card.primaryStats.flatMap((s) => AFFINITY_BY_STAT[s] ?? []);
  for (const wIdx of equippedWeapons) {
    const w = weapons[wIdx];
    if (!w?.allowAshOfWar) continue;
    const matchingAshes = ashesOfWar
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => {
        if (targetAffinities.length === 0) return true;
        return a.defaultAffinity ? targetAffinities.includes(a.defaultAffinity) : false;
      })
      .map(({ i }) => i);
    if (matchingAshes.length > 0) {
      const shuffled = rng.shuffle(matchingAshes);
      const picked = shuffled[0];
      if (!ashIndices.includes(picked)) ashIndices.push(picked);
    }
    if (ashIndices.length >= 2) break;
  }

  const helm = pickArmor(armorHead, rng);
  const chest = pickArmor(armorBody, rng);
  const gauntlets = pickArmor(armorArms, rng);
  const legs = pickArmor(armorLegs, rng);

  return {
    buildName: card.name,
    weaponsRight,
    weaponsLeft,
    helm,
    chest,
    gauntlets,
    legs,
    shields: shieldIndices.length > 0 ? shieldIndices : undefined,
    staves: staffIndices.length > 0 ? staffIndices : undefined,
    seals: sealIndices.length > 0 ? sealIndices : undefined,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };
}
