import type { GeneratedBuild } from "./generator";
import type { CommunityBuild } from "./community";

export interface CommunityPick {
  kind: "community";
  build: CommunityBuild;
  matchReason: string;
  score: number;
}

export interface GeneratedPick {
  kind: "generated";
  generated: GeneratedBuild;
  seed: number;
}

export type BuildPick = CommunityPick | GeneratedPick;
