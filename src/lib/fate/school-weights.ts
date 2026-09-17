import type { MagicSchool } from "../../types/fate";
import { sorceries, incantations, spellTags } from "../../data";
import { ALL_SCHOOLS, isSorcerySchool } from "./taxonomy";

/**
 * How many spells a school can actually offer.
 *
 * A school only ever draws from one list -- sorcery schools from `sorceries`,
 * incantation schools from `incantations` -- so the count has to come from the
 * matching list, the same way `filterSpellsBySchool` selects it.
 */
function countSpells(school: MagicSchool): number {
  const isSorc = isSorcerySchool(school);
  const list = isSorc ? sorceries : incantations;
  const tags = isSorc ? spellTags.sorceries : spellTags.incantations;
  return list.filter((spell) => tags[spell.name]?.includes(school)).length;
}

/**
 * Schools are drawn in proportion to how many spells they hold.
 *
 * Picking uniformly gave a 7-spell school the same odds as a 40-spell one, so
 * the small schools showed up constantly and always with the same few spells --
 * a spellcaster draws 4, which is most of a small school every time. Weighting
 * by pool size keeps the thin flavour schools as an occasional treat.
 *
 * Derived from the data rather than hand-written so retagging a spell moves the
 * odds automatically. A school with no reachable spells lands on weight 0 and
 * drops out of the draw instead of rolling an empty loadout.
 */
export const SCHOOL_WEIGHTS: Record<MagicSchool, number> = Object.fromEntries(
  ALL_SCHOOLS.map((school) => [school, countSpells(school)]),
) as Record<MagicSchool, number>;

export function schoolWeight(school: MagicSchool): number {
  return SCHOOL_WEIGHTS[school] ?? 0;
}
