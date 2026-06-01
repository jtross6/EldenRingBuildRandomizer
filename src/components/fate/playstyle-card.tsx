import { useEffect, useState } from "react";
import type { PlaystyleCard } from "../../types/fate";
import { FAMILY_LABELS, SCHOOL_LABELS } from "../../lib/fate/taxonomy";

interface PlaystyleCardDisplayProps {
  card: PlaystyleCard;
  isFirstReveal: boolean;
}

const STANCE_LABELS: Record<string, string> = {
  "two-hand": "Two-hander",
  "dual-wield": "Dual Wield",
  "sword-board": "Sword & Board",
  ranged: "Ranged",
};

const IDENTITY_LABELS: Record<string, string> = {
  warrior: "Warrior",
  spellcaster: "Spellcaster",
  spellblade: "Spellblade",
  skirmisher: "Skirmisher",
};

export function PlaystyleCardDisplay({ card, isFirstReveal }: PlaystyleCardDisplayProps) {
  const [animPhase, setAnimPhase] = useState<"idle" | "glow" | "name" | "details">(
    isFirstReveal ? "idle" : "details",
  );
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);

    if (isFirstReveal) {
      setAnimPhase("glow");
      const t1 = setTimeout(() => setAnimPhase("name"), 400);
      const t2 = setTimeout(() => setAnimPhase("details"), 700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    setAnimPhase("details");
  }, [card.seed, isFirstReveal]);

  const schoolLabel = card.school ? SCHOOL_LABELS[card.school] : null;
  const subtitle = [
    schoolLabel,
    IDENTITY_LABELS[card.identity],
    STANCE_LABELS[card.stance],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      key={animKey}
      className={`relative overflow-hidden rounded-2xl border-2 border-gold-dim bg-gradient-to-br from-[#1a1510] to-bg-dark p-6 text-center ${
        animPhase === "glow" ? "animate-fate-glow" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {(animPhase === "name" || animPhase === "details") && (
        <h2
          className={`font-display text-[24px] font-bold text-gold-light ${
            animPhase === "name" ? "animate-fate-name" : ""
          }`}
        >
          {card.name}
        </h2>
      )}

      {animPhase === "details" && (
        <>
          <p className="animate-fate-details mt-1 text-[13px] text-text-secondary">{subtitle}</p>

          <p
            className="animate-fate-details mx-auto mt-3 max-w-[400px] text-[13px] italic leading-relaxed text-text-primary"
            style={{ animationDelay: "100ms", opacity: 0 }}
          >
            {card.flavor}
          </p>

          <div
            className="animate-fate-details mt-4 flex flex-wrap justify-center gap-4"
            style={{ animationDelay: "200ms", opacity: 0 }}
          >
            <StatPill label="Weapons" value={FAMILY_LABELS[card.family]} />
            {schoolLabel && <StatPill label="School" value={schoolLabel} />}
            <StatPill label="Armor" value={card.armorClass.charAt(0).toUpperCase() + card.armorClass.slice(1)} />
            <StatPill label="Stats" value={card.primaryStats.join(" / ")} />
          </div>
        </>
      )}

      {animPhase === "glow" && (
        <div className="py-8 text-gold-dim opacity-50">
          <span className="font-display text-xl">&#8942; &#8942; &#8942;</span>
        </div>
      )}

      {animPhase === "idle" && <div className="py-12" />}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-[0.08em] text-text-secondary">{label}</div>
      <div className="font-display text-[13px] font-semibold text-gold-light">{value}</div>
    </div>
  );
}
