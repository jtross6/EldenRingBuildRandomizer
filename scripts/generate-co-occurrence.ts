import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "src", "data");

interface CommunityBuild {
  id: string;
  name: string;
  weapons: string[];
  shield: string | null;
  talismans: string[];
  skills: string[];
  spells: string[];
}

function loadSlimNames(filename: string): Set<string> {
  const data = JSON.parse(readFileSync(join(OUT, filename), "utf-8"));
  return new Set(data.map((item: { name: string }) => item.name));
}

const allItemNames = new Set<string>();
for (const file of [
  "weapons.json",
  "shields.json",
  "catalysts.json",
  "talismans.json",
  "sorceries.json",
  "incantations.json",
  "ashes-of-war.json",
]) {
  for (const name of loadSlimNames(file)) {
    allItemNames.add(name);
  }
}

function fuzzyMatch(target: string, candidates: Set<string>): string | null {
  const lower = target.toLowerCase();
  for (const candidate of candidates) {
    if (candidate.toLowerCase() === lower) return candidate;
  }
  for (const candidate of candidates) {
    if (candidate.toLowerCase().includes(lower) || lower.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return null;
}

const builds: CommunityBuild[] = JSON.parse(
  readFileSync(join(ROOT, "data", "community-builds.json"), "utf-8"),
);

const coOccurrence: Record<string, Record<string, number>> = {};
let matchedItems = 0;
let unmatchedItems = 0;

for (const build of builds) {
  const allBuildItems: string[] = [
    ...build.weapons,
    ...(build.shield ? [build.shield] : []),
    ...build.talismans,
    ...build.skills,
    ...build.spells,
  ];

  const resolvedItems: string[] = [];
  for (const item of allBuildItems) {
    if (allItemNames.has(item)) {
      resolvedItems.push(item);
      matchedItems++;
    } else {
      const match = fuzzyMatch(item, allItemNames);
      if (match) {
        resolvedItems.push(match);
        matchedItems++;
      } else {
        unmatchedItems++;
      }
    }
  }

  for (let i = 0; i < resolvedItems.length; i++) {
    for (let j = i + 1; j < resolvedItems.length; j++) {
      const a = resolvedItems[i];
      const b = resolvedItems[j];

      if (!coOccurrence[a]) coOccurrence[a] = {};
      coOccurrence[a][b] = (coOccurrence[a][b] ?? 0) + 1;

      if (!coOccurrence[b]) coOccurrence[b] = {};
      coOccurrence[b][a] = (coOccurrence[b][a] ?? 0) + 1;
    }
  }
}

const filtered: Record<string, Record<string, number>> = {};
for (const [item, relations] of Object.entries(coOccurrence)) {
  const filteredRelations: Record<string, number> = {};
  for (const [related, count] of Object.entries(relations)) {
    if (count >= 2) {
      filteredRelations[related] = count;
    }
  }
  if (Object.keys(filteredRelations).length > 0) {
    filtered[item] = filteredRelations;
  }
}

writeFileSync(join(OUT, "co-occurrence.json"), JSON.stringify(filtered, null, 2) + "\n");
console.log(`Co-occurrence index: ${Object.keys(filtered).length} items indexed`);
console.log(`  Matched: ${matchedItems}, Unmatched: ${unmatchedItems}`);
