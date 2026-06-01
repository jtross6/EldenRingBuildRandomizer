import type { Build } from "../types/build";
import type {
  GeneratorInput,
  GeneratedBuild,
  ArmorClass,
  SeedItem,
  LoadoutProfile,
} from "../types/generator";
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { createRng, type SeededRng } from "./seeded-rng";
import { extractStatProfile } from "./stat-profile";
import {
  scoreWeapons,
  scoreShields,
  scoreCatalysts,
  scoreTalismans,
  scoreAshes,
  scoreSpells,
  type ScoredCandidate,
} from "./candidate-scorer";
import { generateBuildName } from "./build-namer";
import { selectLoadoutProfile } from "./loadout-profiles";

function pickFromPool<T>(
  scored: ScoredCandidate<T>[],
  creativity: number,
  rng: SeededRng,
  count: number,
  exclude: Set<number>,
): { item: T; index: number }[] {
  const eligible = scored.filter((c) => !exclude.has(c.index));
  if (eligible.length === 0) return [];

  const eligiblePercent = (10 + creativity * 0.9) / 100;
  const poolSize = Math.max(1, Math.ceil(eligible.length * eligiblePercent));
  const pool = eligible.slice(0, poolSize);

  const picks: { item: T; index: number }[] = [];
  const pickedIndices = new Set<number>();

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const available = pool.filter((c) => !pickedIndices.has(c.index));
    if (available.length === 0) break;

    const weights = available.map((c) => Math.max(c.score, 0.01));
    const picked = rng.weightedPick(available, weights);
    picks.push({ item: picked.item, index: picked.index });
    pickedIndices.add(picked.index);
  }

  return picks;
}

function getBuildDamageTypes(seedItems: SeedItem[]): string[] {
  const types = new Set<string>();
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      const weapon = weapons[seed.index];
      if (weapon?.damageTypes) {
        for (const t of weapon.damageTypes) types.add(t);
      }
    }
  }
  return [...types];
}

function getWeaponCategories(seedItems: SeedItem[], selectedWeaponIndices: number[]): string[] {
  const categories = new Set<string>();
  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      categories.add(weapons[seed.index].category);
    }
  }
  for (const idx of selectedWeaponIndices) {
    categories.add(weapons[idx].category);
  }
  return [...categories];
}

function determineArmorClass(
  profile: Record<string, number>,
  totalWeaponWeight: number,
): ArmorClass {
  const casterStats = (profile.intelligence ?? 0) + (profile.faith ?? 0) + (profile.arcane ?? 0);
  if (casterStats > 0.6 && totalWeaponWeight < 8) return "light";
  if ((profile.strength ?? 0) > 0.25 || totalWeaponWeight > 12) return "heavy";
  return "medium";
}

export function generateBuild(input: GeneratorInput): GeneratedBuild {
  const { seedItems, creativity, seed } = input;
  const rng = createRng(seed);
  const profile = extractStatProfile(seedItems);
  const damageTypes = getBuildDamageTypes(seedItems);

  const seedWeaponIndices = new Set(
    seedItems.filter((s) => s.type === "weapon").map((s) => s.index),
  );
  const seedShieldIndices = new Set(
    seedItems.filter((s) => s.type === "shield").map((s) => s.index),
  );
  const seedCatalystIndices = new Set(
    seedItems.filter((s) => s.type === "catalyst").map((s) => s.index),
  );
  const seedTalismanIndices = new Set(
    seedItems.filter((s) => s.type === "talisman").map((s) => s.index),
  );
  const seedAshIndices = new Set(
    seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index),
  );

  // Fill weapons (3 right, 3 left)
  const rightHandSeeds = seedItems
    .filter((s) => s.type === "weapon")
    .slice(0, 3)
    .map((s) => s.index);
  const neededRight = 3 - rightHandSeeds.length;

  const scoredWeapons = scoreWeapons(weapons, profile, seedItems, damageTypes);
  const excludeWeapons = new Set(seedWeaponIndices);
  const additionalRight = pickFromPool(scoredWeapons, creativity, rng, neededRight, excludeWeapons);
  for (const w of additionalRight) excludeWeapons.add(w.index);

  const weaponsRight = [...rightHandSeeds, ...additionalRight.map((w) => w.index)];

  // Left hand: catalyst if INT/FTH build, otherwise more weapons
  const hasIntOrFth = (profile.intelligence ?? 0) >= 0.15 || (profile.faith ?? 0) >= 0.15;
  const hasSeedCatalyst = seedItems.some((s) => s.type === "catalyst");
  const hasSeedShield = seedItems.some((s) => s.type === "shield");

  let catalystIdx = -1;
  let shieldIdx = -1;
  const weaponsLeft: number[] = [];

  if (hasSeedCatalyst) {
    catalystIdx = seedItems.find((s) => s.type === "catalyst")!.index;
  } else if (hasIntOrFth) {
    const scoredCatalysts = scoreCatalysts(catalysts, profile, seedItems);
    const pick = pickFromPool(scoredCatalysts, creativity, rng, 1, seedCatalystIndices);
    if (pick.length > 0) catalystIdx = pick[0].index;
  }

  if (hasSeedShield) {
    shieldIdx = seedItems.find((s) => s.type === "shield")!.index;
  } else if (!hasIntOrFth && !hasSeedCatalyst) {
    const scoredShields = scoreShields(shields, profile, seedItems);
    const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
    if (pick.length > 0) shieldIdx = pick[0].index;
  }

  // Fill left hand weapons
  const neededLeft = 3;
  const additionalLeft = pickFromPool(scoredWeapons, creativity, rng, neededLeft, excludeWeapons);
  for (const w of additionalLeft) {
    weaponsLeft.push(w.index);
    excludeWeapons.add(w.index);
  }

  // Talismans (4)
  const scoredTalismans = scoreTalismans(talismans, seedItems);
  const talismanSeeds = seedItems.filter((s) => s.type === "talisman").map((s) => s.index);
  const neededTalismans = 4 - talismanSeeds.length;
  const additionalTalismans = pickFromPool(
    scoredTalismans,
    creativity,
    rng,
    neededTalismans,
    seedTalismanIndices,
  );
  const talismanIndices = [...talismanSeeds, ...additionalTalismans.map((t) => t.index)];

  // Ashes of War (3)
  const allWeaponCategories = getWeaponCategories(seedItems, [...weaponsRight, ...weaponsLeft]);
  const scoredAshes = scoreAshes(ashesOfWar, profile, seedItems, allWeaponCategories);
  const ashSeeds = seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index);
  const neededAshes = 3 - ashSeeds.length;
  const additionalAshes = pickFromPool(scoredAshes, creativity, rng, neededAshes, seedAshIndices);
  const ashIndices = [...ashSeeds, ...additionalAshes.map((a) => a.index)];

  // Spells
  const hasInt = (profile.intelligence ?? 0) >= 0.1;
  const hasFth = (profile.faith ?? 0) >= 0.1;

  let sorceryIndices: number[] = [];
  let incantationIndices: number[] = [];

  if (hasInt) {
    const scoredSorceries = scoreSpells(sorceries, profile, seedItems);
    const spellSeeds = seedItems
      .filter((s) => s.type === "spell")
      .map((s) => s.index)
      .filter((idx) => idx < sorceries.length);
    const needed = 4 - spellSeeds.length;
    const picks = pickFromPool(scoredSorceries, creativity, rng, needed, new Set(spellSeeds));
    sorceryIndices = [...spellSeeds, ...picks.map((p) => p.index)];
  }

  if (hasFth) {
    const scoredIncantations = scoreSpells(incantations, profile, seedItems);
    const spellSeeds = seedItems
      .filter((s) => s.type === "spell")
      .map((s) => s.index)
      .filter((idx) => idx >= sorceries.length)
      .map((idx) => idx - sorceries.length);
    const needed = 4 - spellSeeds.length;
    const picks = pickFromPool(scoredIncantations, creativity, rng, needed, new Set(spellSeeds));
    incantationIndices = [...spellSeeds, ...picks.map((p) => p.index)];
  }

  // Armor class
  const totalWeaponWeight = weaponsRight.reduce((sum, idx) => sum + (weapons[idx]?.weight ?? 0), 0);
  const armorClass = determineArmorClass(profile, totalWeaponWeight / weaponsRight.length);

  const build: Build = {
    buildName: generateBuildName(seedItems, profile),
    weaponsRight,
    weaponsLeft,
    helm: -1,
    chest: -1,
    gauntlets: -1,
    legs: -1,
    shield: shieldIdx >= 0 ? shieldIdx : 0,
    catalyst: catalystIdx >= 0 ? catalystIdx : 0,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };

  const loadoutProfile: LoadoutProfile = selectLoadoutProfile(seedItems, profile);

  return {
    build,
    armorClass,
    statProfile: profile,
    buildName: build.buildName ?? "Tarnished",
    loadoutProfile,
  };
}
