export interface ArmamentDetail {
  description: string[];
  rarity?: string;
  attackAttributes?: string[];
  damage?: Record<string, number>;
  scaling?: Record<string, number>;
  guard?: Record<string, number>;
  statusEffects?: Record<string, number>;
  requirements?: Record<string, number>;
  weight: number;
  upgradeMaterial?: string;
  isBuffable?: boolean;
  defaultSkillId?: number;
}

export interface ArmorDetail {
  description: string[];
  rarity?: string;
  absorptions?: Record<string, number>;
  resistances?: Record<string, number>;
  weight: number;
}

export interface TalismanDetail {
  description: string[];
  summary?: string;
  rarity?: string;
  effects?: { attribute: string; value: number; model: string; type: string }[];
  conflicts?: string[];
  weight: number;
}

export interface SpellDetail {
  description: string[];
  summary?: string;
  fpCost: number;
  spCost?: number;
  slotsUsed: number;
  isHorsebackCastable?: boolean;
  isWeaponBuff?: boolean;
  requirements?: Record<string, number>;
}

export interface AshDetail {
  description?: string[];
  armamentCategories?: string[];
  defaultAffinity?: string;
  possibleAffinities?: string[];
}

export type ItemDetails =
  | ArmamentDetail
  | ArmorDetail
  | TalismanDetail
  | SpellDetail
  | AshDetail;
