// src/components/gallery/build-card.tsx
import type { BuildPick } from "../../types/picks";
import { weapons } from "../../data";

const STAT_LABELS: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  intelligence: "INT",
  faith: "FTH",
  arcane: "ARC",
};

function CommunityCard({
  pick,
  onSelect,
}: {
  pick: Extract<BuildPick, { kind: "community" }>;
  onSelect: () => void;
}) {
  const { build, matchReason } = pick;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border-dark bg-bg-card p-4 text-left transition-all hover:border-gold-dim/50 hover:bg-bg-card-hover hover:shadow-[0_0_24px_rgba(200,169,81,0.08)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">👤</span>
              <h3 className="truncate font-display text-[14px] font-bold tracking-wide text-gold-light">
                {build.name}
              </h3>
            </div>
            <p className="mt-0.5 font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
              {build.playstyle}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-[11px] leading-relaxed text-text-secondary">
          {build.strategy}
        </p>

        <div className="flex flex-wrap gap-1">
          {build.weapons.slice(0, 2).map((w) => (
            <span
              key={w}
              className="rounded bg-bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-primary"
            >
              {w}
            </span>
          ))}
        </div>

        {matchReason !== "similar build style" && (
          <p className="text-[10px] italic text-gold-dim">Relevant: {matchReason}</p>
        )}
      </div>
    </button>
  );
}

function GeneratedCard({
  pick,
  onSelect,
}: {
  pick: Extract<BuildPick, { kind: "generated" }>;
  onSelect: () => void;
}) {
  const { generated } = pick;
  const statEntries = Object.entries(generated.statProfile)
    .filter(([, value]) => value > 0.1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const primaryWeapons = generated.build.weaponsRight
    .map((idx) => weapons[idx]?.name ?? "Unknown")
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border-dark bg-bg-card p-4 text-left transition-all hover:border-gold-dim/50 hover:bg-bg-card-hover hover:shadow-[0_0_24px_rgba(200,169,81,0.08)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <h3 className="truncate font-display text-[14px] font-bold tracking-wide text-gold-light">
            {generated.buildName}
          </h3>
        </div>

        <p className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
          {generated.loadoutProfile} · {generated.armorClass} Armor
        </p>

        <div className="space-y-1">
          {statEntries.map(([stat, value]) => (
            <div key={stat} className="flex items-center gap-2">
              <span className="w-7 text-right font-display text-[9px] font-semibold uppercase tracking-wider text-text-dim">
                {STAT_LABELS[stat] ?? stat.slice(0, 3).toUpperCase()}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {primaryWeapons.map((w) => (
            <span
              key={w}
              className="rounded bg-bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-primary"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

export function BuildCard({
  pick,
  onSelect,
}: {
  pick: BuildPick;
  onSelect: () => void;
}) {
  if (pick.kind === "community") {
    return <CommunityCard pick={pick} onSelect={onSelect} />;
  }
  return <GeneratedCard pick={pick} onSelect={onSelect} />;
}
