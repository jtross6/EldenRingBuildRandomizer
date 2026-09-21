import type { CombatIdentity, MagicSchool } from "../../types/fate";
import { sorceries, incantations, spellTags } from "../../data";
import { ALL_SCHOOLS, IDENTITY_STATS, isSorcerySchool } from "./taxonomy";

/** Stat abbreviations used in IDENTITY_STATS, mapped to their requirement keys. */
const REQUIREMENT_KEY: Record<string, string> = {
  INT: "intelligence",
  FTH: "faith",
  ARC: "arcane",
};

/** Only these stats gate whether a spell can be cast; STR/DEX never do. */
const CASTING_REQUIREMENTS = ["intelligence", "faith", "arcane"];

/**
 * The largest loadout the build generator ever draws (a spellcaster's).
 *
 * A stat focus that can cast fewer spells than this cannot fill a spellbook,
 * so it does not count as a real option for the school. This is what keeps
 * token matches out: Dragon Communion has two Arcane-only Bayle incantations
 * and Golden Order has two Intelligence-only Law sorceries, and neither is
 * enough to build around.
 */
const REQUIRED_CASTABLE_SPELLS = 4;

type SpellRequirements = { requirements?: Record<string, number> };

function schoolSpells(school: MagicSchool) {
  const isSorc = isSorcerySchool(school);
  const list = isSorc ? sorceries : incantations;
  const tags = isSorc ? spellTags.sorceries : spellTags.incantations;
  return list.filter((spell) => tags[spell.name]?.includes(school));
}

/** How many of a school's spells a given stat focus actually meets the requirements for. */
function castableSpellCount(school: MagicSchool, stats: string[]): number {
  const focus = new Set(stats.map((s) => REQUIREMENT_KEY[s]).filter(Boolean));
  return schoolSpells(school).filter((spell) => {
    const required = Object.keys((spell as SpellRequirements).requirements ?? {}).filter((r) =>
      CASTING_REQUIREMENTS.includes(r),
    );
    return required.length > 0 && required.every((r) => focus.has(r));
  }).length;
}

/**
 * Whether a stat focus can carry a school.
 *
 * Derived from the shipped spell requirements rather than a hand-written
 * school-to-stat table, so retagging a spell moves this automatically.
 */
export function statsCanCast(school: MagicSchool, stats: string[]): boolean {
  return castableSpellCount(school, stats) >= REQUIRED_CASTABLE_SPELLS;
}

/**
 * The stat focuses an identity may take for a school, never empty for a school
 * that `schoolsForIdentity` offered.
 */
export function statOptionsForSchool(
  identity: CombatIdentity,
  school: MagicSchool | null,
): string[][] {
  const options = IDENTITY_STATS[identity];
  if (!school) return options;
  const castable = options.filter((stats) => statsCanCast(school, stats));
  return castable.length > 0 ? castable : options;
}

/**
 * Schools an identity can actually cast.
 *
 * A skirmisher has no Intelligence in any of its stat spreads, so the
 * Intelligence sorcery schools are dropped for it rather than handed over and
 * then mis-statted.
 */
export function schoolsForIdentity(identity: CombatIdentity): MagicSchool[] {
  return ALL_SCHOOLS.filter((school) =>
    IDENTITY_STATS[identity].some((stats) => statsCanCast(school, stats)),
  );
}
