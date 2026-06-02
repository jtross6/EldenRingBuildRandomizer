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
  armament: ResolvedItem[];
  staves: ResolvedItem[];
  seals: ResolvedItem[];
  shield: ResolvedItem | null;
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

function resolveWeapons(
  names: string[],
): { armament: ResolvedItem[]; staves: ResolvedItem[]; seals: ResolvedItem[] } {
  const armament: ResolvedItem[] = [];
  const resolvedStaves: ResolvedItem[] = [];
  const resolvedSeals: ResolvedItem[] = [];

  for (const name of names) {
    const weaponIdx = findByName(weapons, name);
    if (weaponIdx >= 0) {
      armament.push({ name: weapons[weaponIdx].name, index: weaponIdx, category: "weapon" });
      continue;
    }

    const staffIdx = findByName(staves, name);
    if (staffIdx >= 0) {
      resolvedStaves.push({ name: staves[staffIdx].name, index: staffIdx, category: "staff" });
      continue;
    }

    const sealIdx = findByName(seals, name);
    if (sealIdx >= 0) {
      resolvedSeals.push({ name: seals[sealIdx].name, index: sealIdx, category: "seal" });
    }
  }

  return { armament, staves: resolvedStaves, seals: resolvedSeals };
}

function resolveShield(name: string | null | undefined): ResolvedItem | null {
  if (!name) return null;
  const idx = findByName(shields, name);
  if (idx < 0) return null;
  return { name: shields[idx].name, index: idx, category: "shield" };
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
  const { armament, staves: resolvedStaves, seals: resolvedSeals } = resolveWeapons(build.weapons);
  const { sorceries: resolvedSorceries, incantations: resolvedIncantations } = resolveSpells(
    build.spells,
  );

  return {
    armament,
    staves: resolvedStaves,
    seals: resolvedSeals,
    shield: resolveShield(build.shield),
    armor: resolveArmor(build.armor),
    talismans: resolveTalismans(build.talismans),
    ashesOfWar: resolveSkills(build.skills),
    sorceries: resolvedSorceries,
    incantations: resolvedIncantations,
  };
}

export { ARMOR_LABELS };
