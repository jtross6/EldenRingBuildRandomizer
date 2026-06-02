import type {
  PlaystyleConstraint,
  WeaponFamily,
  WeaponStance,
  MagicLevel,
  MagicSchool,
  StatusEffect,
  ArmorClass,
} from "../../types/fate";
import {
  ALL_FAMILIES,
  ALL_STANCES,
  ALL_STATUS_EFFECTS,
  FAMILY_LABELS,
  SCHOOL_LABELS,
  STATUS_LABELS,
  getValidSchools,
  getValidFamilies,
  getValidStances,
} from "../../lib/fate/taxonomy";

interface ConstraintsDrawerProps {
  open: boolean;
  onClose: () => void;
  constraints: PlaystyleConstraint;
  onChange: (constraints: PlaystyleConstraint) => void;
  onApplyAndRoll: () => void;
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  labels,
  onSelect,
}: {
  label: string;
  options: T[];
  selected: T | undefined;
  labels: Record<T, string>;
  onSelect: (value: T | undefined) => void;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
            !selected
              ? "border border-gold bg-gold/10 text-gold-light"
              : "border border-border-dark bg-white/[0.02] text-text-secondary hover:border-gold-dim"
          }`}
        >
          Any
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(selected === opt ? undefined : opt)}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              selected === opt
                ? "border border-gold bg-gold/10 text-gold-light"
                : "border border-border-dark bg-white/[0.02] text-text-secondary hover:border-gold-dim"
            }`}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

const MAGIC_OPTIONS: { value: MagicLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "support", label: "Support" },
  { value: "primary", label: "Primary" },
  { value: "any", label: "Any" },
];

const STANCE_LABELS: Record<WeaponStance, string> = {
  "two-hand": "Two-hand",
  "dual-wield": "Dual Wield",
  "sword-board": "Sword & Board",
  ranged: "Ranged",
};

export function ConstraintsDrawer({
  open,
  onClose,
  constraints,
  onChange,
  onApplyAndRoll,
}: ConstraintsDrawerProps) {
  const validFamilies = getValidFamilies(constraints.stance);
  const validStances = getValidStances(constraints.family);
  const validSchools = getValidSchools(constraints.magic, undefined);

  const selectedMagic = constraints.magic ?? "any";

  const armorOptions: ArmorClass[] = ["light", "medium", "heavy"];
  const armorLabels: Record<ArmorClass, string> = {
    light: "Light",
    medium: "Medium",
    heavy: "Heavy",
  };

  function handleMagicChange(magic: MagicLevel) {
    const next = { ...constraints, magic: magic === "any" ? undefined : magic };
    if (magic === "none") {
      delete next.school;
    }
    onChange(next);
  }

  function handleStanceChange(stance: WeaponStance | undefined) {
    const next = { ...constraints, stance };
    if (stance === "ranged") {
      next.family = "ranged";
    } else if (constraints.stance === "ranged" && constraints.family === "ranged") {
      delete next.family;
    }
    onChange(next);
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 transition-opacity" onClick={onClose} />
      )}
      <div
        className={`fixed bottom-0 left-1/2 z-[70] w-full max-w-[600px] -translate-x-1/2 rounded-t-2xl border-t-2 border-gold-dim bg-bg-card transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <div className="p-4">
          <div className="mx-auto mb-3 h-[3px] w-8 rounded-full bg-gold-dim" />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-bold text-gold-light">Constraints</h3>
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold text-gold-light">
              &#128204;{" "}
              {Object.values(constraints).filter((v) => v !== undefined && v !== "any").length}
            </span>
          </div>

          <div className="mb-4">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
              Magic
            </div>
            <div className="flex overflow-hidden rounded-lg border border-border-dark">
              {MAGIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleMagicChange(opt.value)}
                  className={`flex-1 cursor-pointer border-r border-border-dark px-3 py-2 text-center text-[11px] font-medium transition-colors last:border-r-0 ${
                    selectedMagic === opt.value
                      ? "bg-gold-dim text-gold-light"
                      : "bg-white/[0.02] text-text-secondary hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup<WeaponStance>
            label="Weapon Stance"
            options={validStances.filter((s): s is WeaponStance => ALL_STANCES.includes(s))}
            selected={constraints.stance}
            labels={STANCE_LABELS}
            onSelect={handleStanceChange}
          />

          <div className="my-4 border-t border-border-dark" />

          <ChipGroup<WeaponFamily>
            label="Weapon Family"
            options={validFamilies.filter((f): f is WeaponFamily => ALL_FAMILIES.includes(f))}
            selected={constraints.family}
            labels={FAMILY_LABELS}
            onSelect={(family) => onChange({ ...constraints, family })}
          />

          {validSchools.length > 0 && (
            <ChipGroup<MagicSchool>
              label="Magic School"
              options={validSchools}
              selected={constraints.school}
              labels={SCHOOL_LABELS}
              onSelect={(school) => onChange({ ...constraints, school })}
            />
          )}

          <ChipGroup<StatusEffect>
            label="Status Effect"
            options={ALL_STATUS_EFFECTS}
            selected={constraints.statusEffect}
            labels={STATUS_LABELS}
            onSelect={(statusEffect) => onChange({ ...constraints, statusEffect })}
          />

          <ChipGroup<ArmorClass>
            label="Armor Class"
            options={armorOptions}
            selected={constraints.armorClass}
            labels={armorLabels}
            onSelect={(armorClass) => onChange({ ...constraints, armorClass })}
          />

          <button
            type="button"
            onClick={onApplyAndRoll}
            className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px active:scale-[0.98]"
          >
            Apply &amp; Roll
          </button>
        </div>
      </div>
    </>
  );
}
