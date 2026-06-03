import type {
  PlaystyleCard,
  PlaystyleConstraint,
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  WeaponSubGroup,
  MagicSchool,
  MagicLevel,
  StatusEffect,
  ArmorClass,
} from "../../types/fate";
import { createRng, type SeededRng } from "../seeded-rng";
import {
  ALL_STATUS_EFFECTS,
  IDENTITY_STATS,
  FAMILY_SUB_GROUPS,
  deriveArmorClass,
  deriveIdentity,
  getValidFamilies,
  getValidStances,
  getValidSchools,
  identityAllowsMagic,
} from "./taxonomy";
import { generateFateName } from "./fate-namer";
import { generateFlavorText } from "./flavor-text";
import { resolveFlavorIdentity } from "./flavor-identity";

function pick<T>(arr: T[], rng: SeededRng): T {
  return arr[rng.randomInt(arr.length)];
}

function resolveMagicLevel(
  constraint: MagicLevel | undefined,
  identity: CombatIdentity,
  rng: SeededRng,
): MagicLevel {
  if (constraint && constraint !== "any") return constraint;
  if (identity === "warrior") return "none";
  if (identity === "spellcaster") return "primary";
  if (identity === "spellblade") return pick(["support", "primary"], rng);
  if (identity === "skirmisher") return pick(["none", "support"], rng);
  return pick(["none", "support", "primary"], rng);
}

const DERIVED_SEED_XOR = 0x44455249;

const STANCE_WEIGHTS: Record<WeaponStance, number> = {
  "two-hand": 30,
  "dual-wield": 30,
  "sword-board": 30,
  ranged: 8,
  "double-shield": 1,
};

function pickSubGroups(
  family: WeaponFamily,
  stance: WeaponStance,
  rng: SeededRng,
): WeaponSubGroup[] {
  const pool = FAMILY_SUB_GROUPS[family];

  if (stance !== "dual-wield" || pool.length < 2) {
    return [pool[rng.randomInt(pool.length)]];
  }

  const powerstance = rng.next() < 0.6;
  if (powerstance) {
    const sg = pool[rng.randomInt(pool.length)];
    return [sg, sg];
  }

  const first = rng.randomInt(pool.length);
  let second = rng.randomInt(pool.length - 1);
  if (second >= first) second++;
  return [pool[first], pool[second]];
}

export function deriveDynamicFields(
  identity: CombatIdentity,
  stance: WeaponStance,
  family: WeaponFamily | null,
  school: MagicSchool | null,
  statusEffect: StatusEffect | null,
  seed: number,
): {
  primaryStats: string[];
  subGroups: WeaponSubGroup[];
  name: string;
  flavor: string;
  flavorIdentity: string;
} {
  const rng = createRng(seed ^ DERIVED_SEED_XOR);

  const statOptions = IDENTITY_STATS[identity];
  const primaryStats = statOptions[rng.randomInt(statOptions.length)];
  const subGroups = family ? pickSubGroups(family, stance, rng) : [];
  const primarySubGroup: WeaponSubGroup | null = subGroups.length > 0 ? subGroups[0] : null;
  const name = generateFateName(identity, stance, primarySubGroup, school, statusEffect, rng);
  const flavor = generateFlavorText(
    identity,
    stance,
    family,
    school,
    statusEffect,
    rng,
    primarySubGroup,
  );
  const flavorIdentity = resolveFlavorIdentity(primarySubGroup, stance, identity, school);

  return { primaryStats, subGroups, name, flavor, flavorIdentity };
}

export function generatePlaystyle(constraints: PlaystyleConstraint, seed: number): PlaystyleCard {
  const rng = createRng(seed);

  // 1. Resolve combat identity
  const validIdentities = deriveIdentity(constraints.magic, constraints.school);
  const identity: CombatIdentity = pick(validIdentities, rng);

  // 2. Resolve weapon stance (weighted)
  let stance: WeaponStance;
  if (constraints.stance) {
    stance = constraints.stance;
  } else {
    const validStances = getValidStances(constraints.family);
    const weights = validStances.map((s) => STANCE_WEIGHTS[s]);
    stance = rng.weightedPick(validStances, weights);
  }

  // 3. Resolve weapon family (null for double-shield)
  let family: WeaponFamily | null = null;
  if (stance !== "double-shield") {
    const validFamiliesFromStance = getValidFamilies(stance);
    const familyPool = constraints.family ? [constraints.family] : validFamiliesFromStance;
    family = pick(familyPool, rng);
  }

  // 4. Resolve magic level and school
  const magicLevel = resolveMagicLevel(constraints.magic, identity, rng);
  let school: MagicSchool | null = null;
  if (magicLevel !== "none" && identityAllowsMagic(identity)) {
    if (constraints.school) {
      school = constraints.school;
    } else {
      const validSchools = getValidSchools(constraints.magic, identity);
      if (validSchools.length > 0) {
        school = pick(validSchools, rng);
      }
    }
  }

  // 5. Resolve status effect
  let statusEffect: StatusEffect | null = null;
  if (constraints.statusEffect) {
    statusEffect = constraints.statusEffect;
  } else if (identity === "skirmisher" || rng.next() < 0.3) {
    statusEffect = pick(ALL_STATUS_EFFECTS, rng);
  }

  // 6. Resolve armor class
  const armorClass: ArmorClass = constraints.armorClass ?? deriveArmorClass(identity, family);

  const { primaryStats, subGroups, name, flavor, flavorIdentity } = deriveDynamicFields(
    identity,
    stance,
    family,
    school,
    statusEffect,
    seed,
  );

  return {
    identity,
    stance,
    family,
    subGroups,
    school,
    statusEffect,
    armorClass,
    primaryStats,
    name,
    flavor,
    flavorIdentity,
    seed,
  };
}
