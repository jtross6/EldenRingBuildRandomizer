import type { CommunityBuild } from "../types/community";
import type { SeedItem } from "../types/generator";
import { weapons, catalysts } from "../data";

function seedItemTags(seedItems: SeedItem[]): Set<string> {
  const tags = new Set<string>();

  for (const seed of seedItems) {
    if (seed.type === "weapon") {
      const w = weapons[seed.index];
      if (w) {
        tags.add(w.category.toLowerCase());
        tags.add(seed.name.toLowerCase());
      }
    } else if (seed.type === "shield") {
      tags.add("shield");
      tags.add(seed.name.toLowerCase());
    } else if (seed.type === "catalyst") {
      const c = catalysts[seed.index];
      if (c) tags.add(c.category.toLowerCase());
      tags.add("caster");
      tags.add(seed.name.toLowerCase());
    } else if (seed.type === "spell") {
      tags.add("caster");
      tags.add(seed.name.toLowerCase());
    } else if (seed.type === "ashOfWar") {
      tags.add(seed.name.toLowerCase());
    } else if (seed.type === "talisman") {
      tags.add(seed.name.toLowerCase());
    }
  }

  return tags;
}

export interface ScoredCommunityBuild {
  build: CommunityBuild;
  score: number;
  matchReason: string;
}

export function matchCommunityBuilds(
  communityBuilds: CommunityBuild[],
  seedItems: SeedItem[],
  maxResults: number,
): ScoredCommunityBuild[] {
  const userTags = seedItemTags(seedItems);
  if (userTags.size === 0) return [];

  const scored: ScoredCommunityBuild[] = [];

  for (const build of communityBuilds) {
    let score = 0;
    const reasons: string[] = [];

    // Direct weapon name match (strongest signal)
    for (const seed of seedItems) {
      if (build.weapons.some((w) => w.toLowerCase() === seed.name.toLowerCase())) {
        score += 5;
        reasons.push(`uses ${seed.name}`);
      }
    }

    // Tag overlap
    for (const tag of build.tags) {
      if (userTags.has(tag)) {
        score += 1;
      }
    }

    // Primary stat overlap with seed weapon scaling
    for (const stat of build.primaryStats) {
      if (userTags.has(stat)) {
        score += 2;
      }
    }

    if (score > 0) {
      scored.push({
        build,
        score,
        matchReason: reasons.length > 0 ? reasons.join(", ") : "similar build style",
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}
