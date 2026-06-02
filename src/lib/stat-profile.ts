import type { SeedItem, StatProfile } from "../types/generator";
import { weapons, shields, staves, seals, sorceries, incantations, ashesOfWar } from "../data";

const AFFINITY_STAT_MAP: Record<string, Record<string, number>> = {
  Heavy: { strength: 1.0 },
  Keen: { dexterity: 1.0 },
  Quality: { strength: 0.5, dexterity: 0.5 },
  Fire: { strength: 0.5, faith: 0.5 },
  "Flame Art": { faith: 0.7, strength: 0.3 },
  Lightning: { dexterity: 0.7, faith: 0.3 },
  Sacred: { faith: 1.0 },
  Magic: { intelligence: 1.0 },
  Cold: { intelligence: 1.0 },
  Blood: { arcane: 1.0 },
  Occult: { arcane: 1.0 },
  Poison: { arcane: 0.5, dexterity: 0.5 },
  Standard: {},
};

function getWeaponScaling(name: string): Record<string, number> | undefined {
  const w = weapons.find((w) => w.name === name);
  if (w?.scaling) return w.scaling;
  const s = shields.find((s) => s.name === name);
  if (s?.scaling) return s.scaling;
  const st = staves.find((st) => st.name === name);
  if (st?.scaling) return st.scaling;
  const se = seals.find((se) => se.name === name);
  if (se?.scaling) return se.scaling;
  return undefined;
}

function getSpellRequirements(name: string): Record<string, number> | undefined {
  const sorc = sorceries.find((s) => s.name === name);
  if (sorc?.requirements) return sorc.requirements;
  const inc = incantations.find((i) => i.name === name);
  if (inc?.requirements) return inc.requirements;
  return undefined;
}

function getAshAffinity(name: string): string | undefined {
  const ash = ashesOfWar.find((a) => a.name === name);
  return ash?.defaultAffinity;
}

export function extractStatProfile(seedItems: SeedItem[]): StatProfile {
  const raw: Record<string, number> = {};

  for (const item of seedItems) {
    let contributions: Record<string, number> | undefined;

    switch (item.type) {
      case "weapon":
      case "shield":
      case "staff":
      case "seal":
        contributions = getWeaponScaling(item.name);
        break;
      case "spell": {
        const reqs = getSpellRequirements(item.name);
        if (reqs) {
          contributions = {};
          for (const [stat, val] of Object.entries(reqs)) {
            contributions[stat] = val / 50;
          }
        }
        break;
      }
      case "ashOfWar": {
        const affinity = getAshAffinity(item.name);
        if (affinity) {
          contributions = AFFINITY_STAT_MAP[affinity];
        }
        break;
      }
      case "talisman":
        break;
    }

    if (contributions) {
      for (const [stat, val] of Object.entries(contributions)) {
        raw[stat] = (raw[stat] ?? 0) + val;
      }
    }
  }

  const total = Object.values(raw).reduce((sum, v) => sum + v, 0);
  if (total === 0) return {};

  const profile: StatProfile = {};
  for (const [stat, val] of Object.entries(raw)) {
    profile[stat] = val / total;
  }
  return profile;
}
