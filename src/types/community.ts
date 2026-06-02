export interface CommunityBuild {
  id: string;
  name: string;
  weapons: string[];
  primaryStats: string[];
  tags: string[];
  playstyle: string;
  strategy: string;
  sourceUrl: string;
  shield?: string | null;
  armor?: string[];
  talismans?: string[];
  skills?: string[];
  spells?: string[];
  secondaryStats?: string[];
}
