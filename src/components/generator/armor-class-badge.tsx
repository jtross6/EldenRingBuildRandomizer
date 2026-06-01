import type { ArmorClass } from "../../types/generator";

const ARMOR_CONFIG: Record<ArmorClass, { label: string; description: string }> = {
  light: { label: "Light Armor", description: "Fastest rolls, lowest poise" },
  medium: { label: "Medium Armor", description: "Balanced weight and protection" },
  heavy: { label: "Heavy Armor", description: "Maximum poise, fat roll threshold" },
};

interface ArmorClassBadgeProps {
  armorClass: ArmorClass;
}

export function ArmorClassBadge({ armorClass }: ArmorClassBadgeProps) {
  const config = ARMOR_CONFIG[armorClass];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-dark bg-bg-card px-4 py-3 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover">
      <div className="cat-armor flex size-11 shrink-0 items-center justify-center rounded-sm">
        <svg className="size-6 opacity-60 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L3 7v6c0 5.25 3.83 10.18 9 11.38 5.17-1.2 9-6.13 9-11.38V7l-9-5z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-text-dim">Armor</div>
        <div className="font-display text-[13px] font-semibold text-text-primary">
          {config.label}
        </div>
        <div className="text-[10px] text-text-dim">{config.description}</div>
      </div>
    </div>
  );
}
