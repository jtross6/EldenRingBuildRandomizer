import type { ArmorClass, LoadoutProfile, StatProfile } from "../../types/generator";

const STAT_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  intelligence: "INT",
  faith: "FTH",
  arcane: "ARC",
};

const ARMOR_LABELS: Record<ArmorClass, string> = {
  light: "Light Armor",
  medium: "Medium Armor",
  heavy: "Heavy Armor",
};

interface StatProfileDisplayProps {
  statProfile: StatProfile;
  armorClass: ArmorClass;
  loadoutProfile: LoadoutProfile;
}

export function StatProfileDisplay({
  statProfile,
  armorClass,
  loadoutProfile,
}: StatProfileDisplayProps) {
  const entries = Object.entries(statProfile)
    .filter(([, value]) => value > 0.1)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
      <div className="space-y-1.5">
        {entries.map(([stat, value]) => (
          <div key={stat} className="flex items-center gap-3">
            <span className="w-8 text-right font-display text-[10px] font-semibold uppercase tracking-wider text-text-dim">
              {STAT_LABELS[stat] ?? stat.slice(0, 3).toUpperCase()}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                style={{ width: `${Math.round(value * 100)}%` }}
              />
            </div>
            <span className="w-8 text-left font-display text-[10px] text-text-secondary">
              {Math.round(value * 100)}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 border-t border-border-dark pt-2 text-center font-display text-[10px] uppercase tracking-[2px] text-text-dim">
        {ARMOR_LABELS[armorClass]} · {loadoutProfile} Loadout
      </div>
    </div>
  );
}
