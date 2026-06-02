import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

interface EnrichedBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  secondaryStats?: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
  shield?: string | null;
  armor?: string[];
  talismans?: string[];
  skills?: string[];
  spells?: string[];
}

const enriched: EnrichedBuild[] = JSON.parse(
  readFileSync(join(ROOT, "data", "enriched-community-builds.json"), "utf-8"),
);

function nonEmpty<T>(arr: T[] | undefined): T[] | undefined {
  return arr && arr.length > 0 ? arr : undefined;
}

const slim = enriched.map((b) => ({
  id: b.id,
  name: b.name,
  weapons: b.weapons.slice(0, 3),
  primaryStats: b.primaryStats,
  tags: b.tags,
  playstyle: b.playstyle,
  strategy: b.strategy,
  sourceUrl: b.sourceUrl,
  ...(b.shield != null ? { shield: b.shield } : {}),
  ...(nonEmpty(b.armor) ? { armor: b.armor } : {}),
  ...(nonEmpty(b.talismans) ? { talismans: b.talismans } : {}),
  ...(nonEmpty(b.skills) ? { skills: b.skills } : {}),
  ...(nonEmpty(b.spells) ? { spells: b.spells } : {}),
  ...(nonEmpty(b.secondaryStats) ? { secondaryStats: b.secondaryStats } : {}),
}));

writeFileSync(join(ROOT, "src", "data", "community-builds.json"), JSON.stringify(slim) + "\n");
console.log(`Generated ${slim.length} slim community builds -> src/data/community-builds.json`);
