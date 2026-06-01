import type { SeedItem, StatProfile } from "../types/generator";
import type { Weapon, Shield, Catalyst, Spell, AshOfWar, Talisman } from "../types/items";
import { coOccurrence } from "../data";

export interface ScoredCandidate<T> {
  item: T;
  index: number;
  score: number;
}

function dotProduct(a: Record<string, number>, b: Record<string, number>): number {
  let sum = 0;
  for (const key of Object.keys(a)) {
    if (b[key] != null) {
      sum += a[key] * b[key];
    }
  }
  return sum;
}

function normalizeVector(v: Record<string, number>): Record<string, number> {
  const magnitude = Math.sqrt(Object.values(v).reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return v;
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(v)) {
    result[key] = val / magnitude;
  }
  return result;
}

function getCoOccurrenceScore(candidateName: string, seedItems: SeedItem[]): number {
  let total = 0;
  for (const seed of seedItems) {
    const relations = coOccurrence[seed.name];
    if (relations && relations[candidateName]) {
      total += relations[candidateName];
    }
  }
  return total;
}

export function scoreWeapons(
  candidates: Weapon[],
  profile: StatProfile,
  seedItems: SeedItem[],
  buildDamageTypes: string[],
): ScoredCandidate<Weapon>[] {
  const scored: ScoredCandidate<Weapon>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((weapon, index) => {
    const coScore = getCoOccurrenceScore(weapon.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { weapon, index, coScore };
  });

  for (const { weapon, index, coScore } of rawScores) {
    const scalingVec = weapon.scaling ? normalizeVector(weapon.scaling) : {};
    const statScore = dotProduct(scalingVec, profile);

    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;

    let synergyScore = 0;
    if (weapon.damageTypes && buildDamageTypes.length > 0) {
      const overlap = weapon.damageTypes.filter((d) => buildDamageTypes.includes(d)).length;
      synergyScore = overlap / Math.max(weapon.damageTypes.length, 1);
    }

    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + synergyScore * 0.1;
    scored.push({ item: weapon, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreSpells(
  candidates: Spell[],
  profile: StatProfile,
  seedItems: SeedItem[],
): ScoredCandidate<Spell>[] {
  const scored: ScoredCandidate<Spell>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((spell, index) => {
    const coScore = getCoOccurrenceScore(spell.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { spell, index, coScore };
  });

  for (const { spell, index, coScore } of rawScores) {
    const reqVec = spell.requirements
      ? normalizeVector(
          Object.fromEntries(Object.entries(spell.requirements).map(([k, v]) => [k, v / 50])),
        )
      : {};
    const statScore = dotProduct(reqVec, profile);

    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;

    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: spell, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreTalismans(
  candidates: Talisman[],
  seedItems: SeedItem[],
): ScoredCandidate<Talisman>[] {
  const scored: ScoredCandidate<Talisman>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((talisman, index) => {
    const coScore = getCoOccurrenceScore(talisman.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { talisman, index, coScore };
  });

  for (const { talisman, index, coScore } of rawScores) {
    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;
    scored.push({ item: talisman, index, score: normalizedCo });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreAshes(
  candidates: AshOfWar[],
  profile: StatProfile,
  seedItems: SeedItem[],
  weaponCategories: string[],
): ScoredCandidate<AshOfWar>[] {
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
  };

  const scored: ScoredCandidate<AshOfWar>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((ash, index) => {
    const coScore = getCoOccurrenceScore(ash.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { ash, index, coScore };
  });

  for (const { ash, index, coScore } of rawScores) {
    const compatible =
      !ash.armamentCategories ||
      ash.armamentCategories.length === 0 ||
      ash.armamentCategories.some((cat) => weaponCategories.includes(cat));
    if (!compatible) continue;

    const affinityVec = ash.defaultAffinity ? (AFFINITY_STAT_MAP[ash.defaultAffinity] ?? {}) : {};
    const statScore = dotProduct(normalizeVector(affinityVec), profile);

    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;

    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: ash, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreShields(
  candidates: Shield[],
  profile: StatProfile,
  seedItems: SeedItem[],
): ScoredCandidate<Shield>[] {
  const scored: ScoredCandidate<Shield>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((shield, index) => {
    const coScore = getCoOccurrenceScore(shield.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { shield, index, coScore };
  });

  for (const { shield, index, coScore } of rawScores) {
    const scalingVec = shield.scaling ? normalizeVector(shield.scaling) : {};
    const statScore = dotProduct(scalingVec, profile);
    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;
    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: shield, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}

export function scoreCatalysts(
  candidates: Catalyst[],
  profile: StatProfile,
  seedItems: SeedItem[],
): ScoredCandidate<Catalyst>[] {
  const scored: ScoredCandidate<Catalyst>[] = [];
  let maxCoOccurrence = 0;

  const rawScores = candidates.map((catalyst, index) => {
    const coScore = getCoOccurrenceScore(catalyst.name, seedItems);
    if (coScore > maxCoOccurrence) maxCoOccurrence = coScore;
    return { catalyst, index, coScore };
  });

  for (const { catalyst, index, coScore } of rawScores) {
    const scalingVec = catalyst.scaling ? normalizeVector(catalyst.scaling) : {};
    const statScore = dotProduct(scalingVec, profile);
    const normalizedCo = maxCoOccurrence > 0 ? coScore / maxCoOccurrence : 0;
    const totalScore = statScore * 0.6 + normalizedCo * 0.3 + 0.1 * 0.5;
    scored.push({ item: catalyst, index, score: totalScore });
  }

  return scored.sort((a, b) => b.score - a.score);
}
