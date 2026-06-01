import type { SeedItem, StatProfile } from "../types/generator";

interface ArchetypeRule {
  label: string;
  test: (profile: StatProfile) => boolean;
}

const ARCHETYPE_RULES: ArchetypeRule[] = [
  {
    label: "Spellblade",
    test: (p) => (p.intelligence ?? 0) >= 0.25 && (p.dexterity ?? 0) >= 0.2,
  },
  {
    label: "Battlemage",
    test: (p) => (p.intelligence ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2,
  },
  {
    label: "Paladin",
    test: (p) => (p.faith ?? 0) >= 0.25 && (p.strength ?? 0) >= 0.2,
  },
  {
    label: "Assassin",
    test: (p) => (p.dexterity ?? 0) >= 0.25 && (p.arcane ?? 0) >= 0.2,
  },
  {
    label: "Blood Mage",
    test: (p) => (p.arcane ?? 0) >= 0.4,
  },
  {
    label: "Sorcerer",
    test: (p) => (p.intelligence ?? 0) >= 0.4,
  },
  {
    label: "Prophet",
    test: (p) => (p.faith ?? 0) >= 0.4,
  },
  {
    label: "Warrior",
    test: (p) => (p.strength ?? 0) >= 0.4,
  },
  {
    label: "Ronin",
    test: (p) => (p.dexterity ?? 0) >= 0.4,
  },
  {
    label: "Quality",
    test: (p) => (p.strength ?? 0) >= 0.2 && (p.dexterity ?? 0) >= 0.2,
  },
];

function getArchetype(profile: StatProfile): string {
  for (const rule of ARCHETYPE_RULES) {
    if (rule.test(profile)) return rule.label;
  }
  return "Tarnished";
}

export function generateBuildName(seedItems: SeedItem[], profile: StatProfile): string {
  const archetype = getArchetype(profile);
  const primaryItem = seedItems[0];
  if (!primaryItem) return archetype;

  const itemName = primaryItem.name.replace(/^Ash of War:\s*/i, "").replace(/^Ash of War\s*/i, "");

  return `${itemName} ${archetype}`;
}
