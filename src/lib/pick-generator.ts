import type { SeedItem } from "../types/generator";
import type { BuildPick } from "../types/picks";
import { communityBuilds } from "../data";
import { matchCommunityBuilds } from "./community-matcher";
import { generateBuild } from "./build-generator";

const TOTAL_PICKS = 5;
const MAX_COMMUNITY = 3;

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function generatePicks(seedItems: SeedItem[], creativity: number): BuildPick[] {
  const picks: BuildPick[] = [];

  const communityMatches = matchCommunityBuilds(communityBuilds, seedItems, MAX_COMMUNITY);
  for (const match of communityMatches) {
    picks.push({
      kind: "community",
      build: match.build,
      matchReason: match.matchReason,
      score: match.score,
    });
  }

  const generatedCount = TOTAL_PICKS - picks.length;
  for (let i = 0; i < generatedCount; i++) {
    const seed = randomSeed();
    const generated = generateBuild({ seedItems, creativity, seed });
    picks.push({
      kind: "generated",
      generated,
      seed,
    });
  }

  return picks;
}
