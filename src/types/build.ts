export interface Build {
  buildName?: string;
  buildImage?: string;
  weaponsRight: number[];
  weaponsLeft: number[];
  helm: number;
  chest: number;
  gauntlets: number;
  legs: number;
  shields?: number[];
  staves?: number[];
  seals?: number[];
  talismans: number[];
  ashesOfWar: number[];
  sorceries: number[];
  incantations: number[];
}
