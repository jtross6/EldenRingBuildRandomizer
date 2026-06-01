import type { WeaponStance } from "../../types/fate";

const STANCES: { value: WeaponStance | undefined; label: string }[] = [
  { value: undefined, label: "Any" },
  { value: "two-hand", label: "Two-hand" },
  { value: "dual-wield", label: "Dual Wield" },
  { value: "sword-board", label: "Sword & Board" },
  { value: "ranged", label: "Ranged" },
];

interface StanceChipsProps {
  value: WeaponStance | undefined;
  onChange: (value: WeaponStance | undefined) => void;
}

export function StanceChips({ value, onChange }: StanceChipsProps) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
        Weapon Stance
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STANCES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange(s.value)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              value === s.value
                ? "border border-gold bg-gold/10 text-gold-light"
                : "border border-border-dark bg-white/[0.02] text-text-secondary hover:border-gold-dim hover:text-text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
