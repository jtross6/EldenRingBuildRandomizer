import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

interface RawBuildField {
  value: string;
  items?: string[];
}

interface RawBuild {
  buildId: string;
  buildName: string;
  fields: Record<string, RawBuildField>;
}

interface CommunityBuild {
  id: string;
  name: string;
  class: string;
  primaryStats: string[];
  secondaryStats: string[];
  weapons: string[];
  shield: string | null;
  armor: string[];
  talismans: string[];
  skills: string[];
  spells: string[];
}

const WEAPON_KEYS = [
  "Weapon",
  "Main Weapon",
  "Off-Hand Weapon",
  "Off-Hand Weapon:",
  "Alternate Weapon",
  "Optional Off-Hand Weapon",
  "Optional Off-Hand",
  "Off-Hand Weapon (Optional)",
];

const TALISMAN_KEYS = ["Talismans", "Talismans:", "Alternate Talismans", "Alternate Talismans:"];

const SPELL_KEYS = [
  "Spells",
  "Support Spells",
  "Main Spells",
  "Other Spells",
  "Primary Spells",
  "Alternate Spells",
];

const SKILL_KEYS = ["Skills", "Alternate Skill", "Alternate Skills"];

const STAT_KEYS = [
  "Primary Stats",
  "Secondary Stats",
  "Secondary Stats:",
  "Secondary Stats: Mind",
];

const NULL_VALUES = new Set(["n/a", "N/A", "none", "None", "Any", ""]);

const STAT_NORMALIZE: Record<string, string> = {
  vigor: "vigor",
  mind: "mind",
  endurance: "endurance",
  strength: "strength",
  dexterity: "dexterity",
  intelligence: "intelligence",
  faith: "faith",
  arcane: "arcane",
};

function normalizeStatName(raw: string): string | null {
  const lower = raw.trim().toLowerCase();
  return STAT_NORMALIZE[lower] ?? null;
}

function extractItems(field: RawBuildField | undefined): string[] {
  if (!field) return [];
  if (field.items && field.items.length > 0) {
    return field.items.filter((item) => !NULL_VALUES.has(item));
  }
  if (NULL_VALUES.has(field.value)) return [];
  return field.value
    .split(/,\s*(?:or\s+)?|;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !NULL_VALUES.has(s));
}

function extractStats(fields: Record<string, RawBuildField>, isPrimary: boolean): string[] {
  const keys = isPrimary ? ["Primary Stats"] : STAT_KEYS.filter((k) => k !== "Primary Stats");
  const stats: string[] = [];
  for (const key of keys) {
    const field = fields[key];
    if (!field) continue;
    const items = field.items ?? field.value.split(/,\s*/).map((s) => s.trim());
    for (const item of items) {
      const normalized = normalizeStatName(item);
      if (normalized && !stats.includes(normalized)) {
        stats.push(normalized);
      }
    }
  }
  return stats;
}

function processBuilds(rawBuilds: RawBuild[]): CommunityBuild[] {
  return rawBuilds.map((raw) => {
    const fields = raw.fields;

    const weapons: string[] = [];
    for (const key of WEAPON_KEYS) {
      weapons.push(...extractItems(fields[key]));
    }

    const talismans: string[] = [];
    for (const key of TALISMAN_KEYS) {
      talismans.push(...extractItems(fields[key]));
    }

    const spells: string[] = [];
    for (const key of SPELL_KEYS) {
      spells.push(...extractItems(fields[key]));
    }

    const skills: string[] = [];
    for (const key of SKILL_KEYS) {
      skills.push(...extractItems(fields[key]));
    }

    const shieldField = fields["Shield"];
    const shieldValue =
      shieldField && !NULL_VALUES.has(shieldField.value)
        ? (shieldField.items?.[0] ?? shieldField.value)
        : null;

    const armorField = fields["Armor"];
    const armor = armorField ? extractItems(armorField) : [];

    const classField = fields["Class"] ?? fields["Class:"];
    const className = classField ? classField.value.replace(/^:\s*/, "").trim() : "";

    return {
      id: raw.buildId,
      name: raw.buildName,
      class: NULL_VALUES.has(className) ? "" : className,
      primaryStats: extractStats(fields, true),
      secondaryStats: extractStats(fields, false),
      weapons: [...new Set(weapons)],
      shield: shieldValue && !NULL_VALUES.has(shieldValue) ? shieldValue : null,
      armor: [...new Set(armor)],
      talismans: [...new Set(talismans)],
      skills: [...new Set(skills)],
      spells: [...new Set(spells)],
    };
  });
}

const rawData = JSON.parse(readFileSync(join(ROOT, "data", "fextralife-all-builds.json"), "utf-8"));
const builds = processBuilds(rawData.builds);

writeFileSync(join(ROOT, "data", "community-builds.json"), JSON.stringify(builds, null, 2) + "\n");
console.log(`Processed ${builds.length} community builds -> data/community-builds.json`);
