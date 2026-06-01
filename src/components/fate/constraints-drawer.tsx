import type { PlaystyleConstraint, WeaponFamily, MagicSchool, StatusEffect, ArmorClass } from "../../types/fate";
import {
  ALL_FAMILIES,
  ALL_STATUS_EFFECTS,
  FAMILY_LABELS,
  SCHOOL_LABELS,
  STATUS_LABELS,
  getValidSchools,
  getValidFamilies,
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
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-secondary">{label}</div>
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

export function ConstraintsDrawer({
  open,
  onClose,
  constraints,
  onChange,
  onApplyAndRoll,
}: ConstraintsDrawerProps) {
  const validFamilies = getValidFamilies(constraints.stance);
  const validSchools = getValidSchools(constraints.magic, undefined);

  const armorOptions: ArmorClass[] = ["light", "medium", "heavy"];
  const armorLabels: Record<ArmorClass, string> = { light: "Light", medium: "Medium", heavy: "Heavy" };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl border-t-2 border-gold-dim bg-bg-card transition-transform duration-300 ${
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
