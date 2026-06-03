import type { CommunityBuild } from "../types/community";
import type { ItemCategory } from "../components/icons/item-icons";
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

export interface ResolvedItem {
  name: string;
  index: number;
  category: ItemCategory;
}

export interface ResolvedCommunityBuild {
  rightHand: ResolvedItem[];
  leftHand: ResolvedItem[];
  armor: (ResolvedItem | null)[];
  talismans: ResolvedItem[];
  ashesOfWar: ResolvedItem[];
  sorceries: ResolvedItem[];
  incantations: ResolvedItem[];
}

function normalize(name: string): string {
  return name
    .replace(/\s*\((?:Spell|Skill)\)\s*$/i, "")
    .replace(/^Ash of War:\s*/i, "")
    .replace(/^Ash of War\s+/i, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function findByName<T extends { name: string }>(
  arr: readonly T[],
  name: string,
): number {
  const norm = normalize(name);
  return arr.findIndex((item) => normalize(item.name) === norm);
}

function resolveArmaments(
  weaponNames: string[],
  shieldName: string | null | undefined,
): { rightHand: ResolvedItem[]; leftHand: ResolvedItem[] } {
  const rightHand: ResolvedItem[] = [];
  const leftHand: ResolvedItem[] = [];

  for (const name of weaponNames) {
    const weaponIdx = findByName(weapons, name);
    if (weaponIdx >= 0) {
      rightHand.push({ name: weapons[weaponIdx].name, index: weaponIdx, category: "weapon" });
      continue;
    }

    const staffIdx = findByName(staves, name);
    if (staffIdx >= 0) {
      leftHand.push({ name: staves[staffIdx].name, index: staffIdx, category: "staff" });
      continue;
    }

    const sealIdx = findByName(seals, name);
    if (sealIdx >= 0) {
      leftHand.push({ name: seals[sealIdx].name, index: sealIdx, category: "seal" });
      continue;
    }

    const shieldIdx = findByName(shields, name);
    if (shieldIdx >= 0) {
      leftHand.push({ name: shields[shieldIdx].name, index: shieldIdx, category: "shield" });
    }
  }

  if (shieldName) {
    const idx = findByName(shields, shieldName);
    if (idx >= 0) {
      leftHand.push({ name: shields[idx].name, index: idx, category: "shield" });
    }
  }

  return { rightHand, leftHand };
}

const ARMOR_ARRAYS = [armorHead, armorBody, armorArms, armorLegs] as const;
const ARMOR_LABELS = ["Helm", "Chest Armor", "Gauntlets", "Leg Armor"] as const;

function resolveArmor(names: string[] | undefined): (ResolvedItem | null)[] {
  if (!names) return [];
  return names.slice(0, ARMOR_ARRAYS.length).map((name, i) => {
    const idx = findByName(ARMOR_ARRAYS[i], name);
    if (idx < 0) return null;
    return { name: ARMOR_ARRAYS[i][idx].name, index: idx, category: "armor" as const };
  });
}

function resolveTalismans(names: string[] | undefined): ResolvedItem[] {
  if (!names) return [];
  const resolved: ResolvedItem[] = [];
  for (const name of names) {
    if (resolved.length >= 4) break;
    const idx = findByName(talismans, name);
    if (idx >= 0) {
      resolved.push({ name: talismans[idx].name, index: idx, category: "talisman" });
    }
  }
  return resolved;
}

function resolveSkills(names: string[] | undefined): ResolvedItem[] {
  if (!names) return [];
  const resolved: ResolvedItem[] = [];
  for (const name of names) {
    const idx = findByName(ashesOfWar, name);
    if (idx >= 0) {
      resolved.push({ name: ashesOfWar[idx].name, index: idx, category: "ash" });
    }
  }
  return resolved;
}

function resolveSpells(
  names: string[] | undefined,
): { sorceries: ResolvedItem[]; incantations: ResolvedItem[] } {
  if (!names) return { sorceries: [], incantations: [] };
  const resolvedSorceries: ResolvedItem[] = [];
  const resolvedIncantations: ResolvedItem[] = [];

  for (const name of names) {
    const sorcIdx = findByName(sorceries, name);
    if (sorcIdx >= 0) {
      resolvedSorceries.push({ name: sorceries[sorcIdx].name, index: sorcIdx, category: "spell" });
      continue;
    }

    const incIdx = findByName(incantations, name);
    if (incIdx >= 0) {
      resolvedIncantations.push({
        name: incantations[incIdx].name,
        index: incIdx,
        category: "spell",
      });
    }
  }

  return { sorceries: resolvedSorceries, incantations: resolvedIncantations };
}

export function resolveCommunityBuild(build: CommunityBuild): ResolvedCommunityBuild {
  const { rightHand, leftHand } = resolveArmaments(build.weapons, build.shield);
  const { sorceries: resolvedSorceries, incantations: resolvedIncantations } = resolveSpells(
    build.spells,
  );

  return {
    rightHand,
    leftHand,
    armor: resolveArmor(build.armor),
    talismans: resolveTalismans(build.talismans),
    ashesOfWar: resolveSkills(build.skills),
    sorceries: resolvedSorceries,
    incantations: resolvedIncantations,
  };
}

export { ARMOR_LABELS };
