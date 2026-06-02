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
  staves,
  seals,
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
  scoreStaves,
  scoreSeals,
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

const RANGED_CATEGORIES = new Set(["Bow", "Light Bow", "Crossbow", "Greatbow", "Ballista"]);

function fillWeaponsByProfile(
  loadoutProfile: LoadoutProfile,
  seedItems: SeedItem[],
  scoredWeapons: ScoredCandidate<(typeof weapons)[number]>[],
  profile: ReturnType<typeof extractStatProfile>,
  creativity: number,
  rng: SeededRng,
  seedWeaponIndices: Set<number>,
  seedShieldIndices: Set<number>,
  seedStaffIndices: Set<number>,
  seedSealIndices: Set<number>,
): {
  weaponsRight: number[];
  weaponsLeft: number[];
  shieldIndices: number[];
  staffIndices: number[];
  sealIndices: number[];
} {
  const excludeWeapons = new Set(seedWeaponIndices);
  const weaponsRight: number[] = [];
  const weaponsLeft: number[] = [];
  const shieldIndices: number[] = [];
  const staffIndices: number[] = [];
  const sealIndices: number[] = [];

  const seedWeaponList = seedItems.filter((s) => s.type === "weapon");
  const primarySeedIdx = seedWeaponList[0]?.index ?? -1;

  switch (loadoutProfile) {
    case "Pure Caster": {
      const hasSeedStaff = seedItems.some((s) => s.type === "staff");
      const hasSeedSeal = seedItems.some((s) => s.type === "seal");
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (hasSeedStaff) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (hasSeedSeal) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
      break;
    }

    case "Spellblade": {
      // 1 weapon right, catalyst in left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      const hasInt = (profile.intelligence ?? 0) >= 0.1;
      const hasFth = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasInt) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (seedItems.some((s) => s.type === "seal")) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFth) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
      break;
    }

    case "Sword & Board": {
      // 1-2 weapons right, shield in left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      }
      const neededRight = primarySeedIdx >= 0 ? (rng.next() < 0.4 ? 1 : 0) : 1;
      const additionalRight = pickFromPool(
        scoredWeapons,
        creativity,
        rng,
        neededRight,
        excludeWeapons,
      );
      for (const w of additionalRight) {
        weaponsRight.push(w.index);
        excludeWeapons.add(w.index);
      }
      // Ensure at least 1 weapon
      if (weaponsRight.length === 0) {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      const hasSeedShield = seedItems.some((s) => s.type === "shield");
      if (hasSeedShield) {
        shieldIndices.push(seedItems.find((s) => s.type === "shield")!.index);
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIndices.push(pick[0].index);
      }
      break;
    }

    case "Shield Caster": {
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      // Shield
      const hasSeedShieldSC = seedItems.some((s) => s.type === "shield");
      if (hasSeedShieldSC) {
        shieldIndices.push(seedItems.find((s) => s.type === "shield")!.index);
      } else {
        const scoredShields = scoreShields(shields, profile, seedItems);
        const pick = pickFromPool(scoredShields, creativity, rng, 1, seedShieldIndices);
        if (pick.length > 0) shieldIndices.push(pick[0].index);
      }
      // Staff/Seal (for casting)
      const hasIntSC = (profile.intelligence ?? 0) >= 0.1;
      const hasFthSC = (profile.faith ?? 0) >= 0.1;

      if (seedItems.some((s) => s.type === "staff")) {
        staffIndices.push(seedItems.find((s) => s.type === "staff")!.index);
      } else if (hasIntSC) {
        const scored = scoreStaves(staves, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedStaffIndices);
        if (pick.length > 0) staffIndices.push(pick[0].index);
      }

      if (seedItems.some((s) => s.type === "seal")) {
        sealIndices.push(seedItems.find((s) => s.type === "seal")!.index);
      } else if (hasFthSC) {
        const scored = scoreSeals(seals, profile, seedItems);
        const pick = pickFromPool(scored, creativity, rng, 1, seedSealIndices);
        if (pick.length > 0) sealIndices.push(pick[0].index);
      }
      break;
    }

    case "Two-hander": {
      // 1 weapon right, empty left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      break;
    }

    case "Colossal Powerstance": {
      // 1 colossal weapon right, 1 colossal of same category left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const colossalCandidates = scoredWeapons.filter((c) =>
          ["Colossal Sword", "Colossal Weapon", "Great Hammer", "Greataxe"].includes(
            c.item.category,
          ),
        );
        const pick = pickFromPool(colossalCandidates, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      if (weaponsRight.length > 0) {
        const category = weapons[weaponsRight[0]]?.category;
        if (category) {
          const sameCatCandidates = scoredWeapons.filter((c) => c.item.category === category);
          const pick = pickFromPool(sameCatCandidates, creativity, rng, 1, excludeWeapons);
          if (pick.length > 0) {
            weaponsLeft.push(pick[0].index);
            excludeWeapons.add(pick[0].index);
          }
        }
      }
      break;
    }

    case "Powerstance": {
      // 1 weapon right, 1 weapon of SAME CATEGORY left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      if (weaponsRight.length > 0) {
        const category = weapons[weaponsRight[0]]?.category;
        if (category) {
          const sameCatCandidates = scoredWeapons.filter((c) => c.item.category === category);
          const pick = pickFromPool(sameCatCandidates, creativity, rng, 1, excludeWeapons);
          if (pick.length > 0) {
            weaponsLeft.push(pick[0].index);
            excludeWeapons.add(pick[0].index);
          }
        }
      }
      break;
    }

    case "Ranged": {
      // 1 bow/crossbow right, 1 melee backup left
      if (primarySeedIdx >= 0 && RANGED_CATEGORIES.has(weapons[primarySeedIdx]?.category)) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        // Pick a ranged weapon
        const rangedCandidates = scoredWeapons.filter((c) =>
          RANGED_CATEGORIES.has(c.item.category),
        );
        const pick = pickFromPool(rangedCandidates, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      // Melee backup in left
      const meleeCandidates = scoredWeapons.filter((c) => !RANGED_CATEGORIES.has(c.item.category));
      const meleePick = pickFromPool(meleeCandidates, creativity, rng, 1, excludeWeapons);
      if (meleePick.length > 0) {
        weaponsLeft.push(meleePick[0].index);
        excludeWeapons.add(meleePick[0].index);
      }
      break;
    }

    case "Dual Wield":
    default: {
      // 1 weapon right, 1 different weapon left
      if (primarySeedIdx >= 0) {
        weaponsRight.push(primarySeedIdx);
        excludeWeapons.add(primarySeedIdx);
      } else {
        const pick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
        if (pick.length > 0) {
          weaponsRight.push(pick[0].index);
          excludeWeapons.add(pick[0].index);
        }
      }
      const leftPick = pickFromPool(scoredWeapons, creativity, rng, 1, excludeWeapons);
      if (leftPick.length > 0) {
        weaponsLeft.push(leftPick[0].index);
        excludeWeapons.add(leftPick[0].index);
      }
      break;
    }
  }

  return { weaponsRight, weaponsLeft, shieldIndices, staffIndices, sealIndices };
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
  const seedStaffIndices = new Set(seedItems.filter((s) => s.type === "staff").map((s) => s.index));
  const seedSealIndices = new Set(seedItems.filter((s) => s.type === "seal").map((s) => s.index));
  const seedTalismanIndices = new Set(
    seedItems.filter((s) => s.type === "talisman").map((s) => s.index),
  );
  const seedAshIndices = new Set(
    seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index),
  );

  // Determine loadout profile first so weapon filling can use it
  const loadoutProfile: LoadoutProfile = selectLoadoutProfile(seedItems, profile);

  // Score weapons once for reuse
  const scoredWeapons = scoreWeapons(weapons, profile, seedItems, damageTypes);

  // Fill weapons by profile
  const { weaponsRight, weaponsLeft, shieldIndices, staffIndices, sealIndices } =
    fillWeaponsByProfile(
      loadoutProfile,
      seedItems,
      scoredWeapons,
      profile,
      creativity,
      rng,
      seedWeaponIndices,
      seedShieldIndices,
      seedStaffIndices,
      seedSealIndices,
    );

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

  // Ashes of War (scaled to weapon count)
  const allWeaponCategories = getWeaponCategories(seedItems, [...weaponsRight, ...weaponsLeft]);
  const scoredAshes = scoreAshes(ashesOfWar, profile, seedItems, allWeaponCategories);
  const ashSeeds = seedItems.filter((s) => s.type === "ashOfWar").map((s) => s.index);
  const ashCount = Math.max(1, weaponsRight.length + weaponsLeft.length);
  const neededAshes = Math.min(ashCount, 3) - ashSeeds.length;
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
    buildName: generateBuildName(seedItems, profile, damageTypes, rng),
    weaponsRight,
    weaponsLeft,
    helm: -1,
    chest: -1,
    gauntlets: -1,
    legs: -1,
    shields: shieldIndices.length > 0 ? shieldIndices : undefined,
    staves: staffIndices.length > 0 ? staffIndices : undefined,
    seals: sealIndices.length > 0 ? sealIndices : undefined,
    talismans: talismanIndices,
    ashesOfWar: ashIndices,
    sorceries: sorceryIndices,
    incantations: incantationIndices,
  };

  return {
    build,
    armorClass,
    statProfile: profile,
    buildName: build.buildName ?? "Tarnished",
    loadoutProfile,
  };
}
