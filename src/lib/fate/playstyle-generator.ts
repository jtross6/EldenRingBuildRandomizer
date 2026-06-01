import type {
  PlaystyleCard,
  PlaystyleConstraint,
  CombatIdentity,
  WeaponStance,
  WeaponFamily,
  MagicSchool,
  MagicLevel,
  StatusEffect,
  ArmorClass,
} from "../../types/fate";
import { createRng } from "../seeded-rng";
import {
  ALL_STANCES,
  ALL_STATUS_EFFECTS,
  IDENTITY_STATS,
  deriveArmorClass,
  deriveIdentity,
  getValidFamilies,
  getValidStances,
  getValidSchools,
  identityAllowsMagic,
} from "./taxonomy";
import { generateFateName } from "./fate-namer";
import { generateFlavorText } from "./flavor-text";

function pick<T>(arr: T[], rng: ReturnType<typeof createRng>): T {
  return arr[rng.randomInt(arr.length)];
}

function resolveMagicLevel(
  constraint: MagicLevel | undefined,
  identity: CombatIdentity,
  rng: ReturnType<typeof createRng>,
): MagicLevel {
  if (constraint && constraint !== "any") return constraint;
  if (identity === "warrior") return "none";
  if (identity === "spellcaster") return "primary";
  if (identity === "spellblade") return pick(["support", "primary"], rng);
  if (identity === "skirmisher") return pick(["none", "support"], rng);
  return pick(["none", "support", "primary"], rng);
}

export function generatePlaystyle(constraints: PlaystyleConstraint, seed: number): PlaystyleCard {
  const rng = createRng(seed);

  // 1. Resolve combat identity
  const validIdentities = deriveIdentity(constraints.magic, constraints.school);
  const identity: CombatIdentity = pick(validIdentities, rng);

  // 2. Resolve weapon stance
  const validStancesFromFamily = getValidStances(constraints.family);
  const stancePool = constraints.stance
    ? [constraints.stance]
    : validStancesFromFamily.filter((s) => ALL_STANCES.includes(s));
  const stance: WeaponStance = pick(stancePool, rng);

  // 3. Resolve weapon family
  const validFamiliesFromStance = getValidFamilies(stance);
  const familyPool = constraints.family ? [constraints.family] : validFamiliesFromStance;
  const family: WeaponFamily = pick(familyPool, rng);

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

  // 7. Resolve primary stats
  const statOptions = IDENTITY_STATS[identity];
  const primaryStats = pick(statOptions, rng);

  // 8. Generate name and flavor
  const name = generateFateName(identity, stance, family, school, statusEffect, rng);
  const flavor = generateFlavorText(identity, stance, family, school, statusEffect, rng);

  return {
    identity,
    stance,
    family,
    school,
    statusEffect,
    armorClass,
    primaryStats,
    name,
    flavor,
    seed,
  };
}
