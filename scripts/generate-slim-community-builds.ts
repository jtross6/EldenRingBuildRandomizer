import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

interface EnrichedBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
}

const enriched: EnrichedBuild[] = JSON.parse(
  readFileSync(join(ROOT, "data", "enriched-community-builds.json"), "utf-8"),
);

const slim = enriched.map((b) => ({
  id: b.id,
  name: b.name,
  weapons: b.weapons.slice(0, 3),
  primaryStats: b.primaryStats,
  tags: b.tags,
  playstyle: b.playstyle,
  strategy: b.strategy,
  sourceUrl: b.sourceUrl,
}));

writeFileSync(join(ROOT, "src", "data", "community-builds.json"), JSON.stringify(slim) + "\n");
console.log(`Generated ${slim.length} slim community builds -> src/data/community-builds.json`);
