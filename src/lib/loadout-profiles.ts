import type { LoadoutProfile, SeedItem, StatProfile } from "../types/generator";
import { weapons } from "../data";

const TWO_HANDER_CATEGORIES = new Set([
  "Colossal Sword",
  "Colossal Weapon",
  "Great Hammer",
  "Greataxe",
]);

const POWERSTANCE_CATEGORIES = new Set([
  "Dagger",
  "Curved Sword",
  "Katana",
  "Fist",
  "Twinblade",
  "Thrusting Sword",
]);

const RANGED_CATEGORIES = new Set(["Bow", "Light Bow", "Crossbow", "Greatbow", "Ballista"]);

export function selectLoadoutProfile(
  seedItems: SeedItem[],
  profile: StatProfile,
): LoadoutProfile {
  const seedWeapons = seedItems.filter((s) => s.type === "weapon");
  const seedCategories = seedWeapons.map((s) => weapons[s.index].category);

  // 1. Two weapons of same category → Powerstance
  if (seedWeapons.length >= 2) {
    const catCounts = new Map<string, number>();
    for (const cat of seedCategories) {
      catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
    }
    for (const count of catCounts.values()) {
      if (count >= 2) return "Powerstance";
    }
  }

  // 2. Ranged weapon category
  if (seedCategories.some((cat) => RANGED_CATEGORIES.has(cat))) {
    return "Ranged";
  }

  // 3. Colossal/heavy weapon → Two-hander
  if (seedWeapons.length > 0) {
    const primaryWeapon = weapons[seedWeapons[0].index];
    if (TWO_HANDER_CATEGORIES.has(primaryWeapon.category) || primaryWeapon.weight > 12) {
      return "Two-hander";
    }
  }

  // 4. Pure caster (high INT/FTH, no weapon/shield seeds)
  const hasWeaponOrShieldSeed = seedItems.some(
    (s) => s.type === "weapon" || s.type === "shield",
  );
  const intOrFth = Math.max(profile.intelligence ?? 0, profile.faith ?? 0);
  if (intOrFth > 0.6 && !hasWeaponOrShieldSeed) {
    return "Pure Caster";
  }

  // 5. Powerstance-friendly categories (single weapon seed, no shield/catalyst)
  if (seedWeapons.length === 1) {
    const cat = seedCategories[0];
    const hasShieldOrCatalyst = seedItems.some(
      (s) => s.type === "shield" || s.type === "catalyst",
    );
    if (POWERSTANCE_CATEGORIES.has(cat) && !hasShieldOrCatalyst) {
      return "Powerstance";
    }
  }

  // 6. Spellblade (has caster stats)
  if (intOrFth > 0.15) {
    return "Spellblade";
  }

  // 7. Sword & Board (no caster stats)
  const casterTotal = (profile.intelligence ?? 0) + (profile.faith ?? 0);
  if (casterTotal < 0.15) {
    return "Sword & Board";
  }

  // 8. Fallback
  return "Dual Wield";
}
