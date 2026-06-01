export interface Weapon {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
  allowAshOfWar?: boolean;
  defaultSkillId?: number;
}

export interface Shield {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
  allowAshOfWar?: boolean;
  defaultSkillId?: number;
}

export interface Catalyst {
  name: string;
  category: string;
  weight: number;
  scaling?: Record<string, number>;
  requirements?: Record<string, number>;
  damageTypes?: string[];
  statusEffects?: Record<string, number>;
}

export interface ArmorPiece {
  name: string;
  weight: number;
}

export interface Talisman {
  name: string;
  weight: number;
}

export interface Spell {
  name: string;
  fpCost: number;
  slotsUsed: number;
  requirements?: Record<string, number>;
  tags?: string[];
}

export interface AshOfWar {
  name: string;
  armamentCategories?: string[];
  defaultAffinity?: string;
  possibleAffinities?: string[];
}
