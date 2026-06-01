import type { MagicLevel } from "../../types/fate";

const OPTIONS: { value: MagicLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "support", label: "Support" },
  { value: "primary", label: "Primary" },
  { value: "any", label: "Any" },
];

interface MagicControlProps {
  value: MagicLevel | undefined;
  onChange: (value: MagicLevel) => void;
}

export function MagicControl({ value, onChange }: MagicControlProps) {
  const selected = value ?? "any";

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
        Magic
      </div>
      <div className="flex overflow-hidden rounded-lg border border-border-dark">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 cursor-pointer border-r border-border-dark px-3 py-2 text-center text-[12px] font-medium transition-colors last:border-r-0 ${
              selected === opt.value
                ? "bg-gold-dim text-gold-light"
                : "bg-white/[0.02] text-text-secondary hover:bg-white/[0.05]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
