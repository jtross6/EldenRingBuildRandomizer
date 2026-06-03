import { useEffect, useState, useRef } from "react";
import type { PlaystyleCard, MagicSchool } from "../../types/fate";
import {
  SUB_GROUP_LABELS,
  SUB_GROUP_LABELS_SINGULAR,
  SCHOOL_LABELS,
  isSorcerySchool,
} from "../../lib/fate/taxonomy";

import godrickRune from "../../assets/great-runes/godrick_gr.webp";
import maleniaRune from "../../assets/great-runes/malenia_gr.webp";
import mohgRune from "../../assets/great-runes/mohg_gr.webp";
import morgottRune from "../../assets/great-runes/morgott_gr.webp";
import radanRune from "../../assets/great-runes/radan_gr.webp";
import rykardRune from "../../assets/great-runes/rykard_gr.webp";
import unbornRune from "../../assets/great-runes/unborn_gr.webp";

interface PlaystyleCardDisplayProps {
  card: PlaystyleCard;
  isFirstReveal: boolean;
}

const GREAT_RUNES = [
  godrickRune,
  maleniaRune,
  mohgRune,
  morgottRune,
  radanRune,
  rykardRune,
  unbornRune,
];

function getCombatValue(card: PlaystyleCard): string {
  if (card.stance === "ranged") return "Ranged";
  if (card.stance === "sword-board")
    return `${SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]]} + Shield`;
  if (card.stance === "two-hand") return `Two-hand ${SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]]}`;
  const primary = SUB_GROUP_LABELS[card.subGroups[0]];
  if (card.subGroups[0] === card.subGroups[1]) return `Powerstance ${primary}`;
  const secondary = SUB_GROUP_LABELS[card.subGroups[1]];
  return `Dual-wield ${primary} & ${secondary}`;
}

function getMagicValue(school: MagicSchool): string {
  const type = isSorcerySchool(school) ? "Sorceries" : "Incantations";
  return `${SCHOOL_LABELS[school]} ${type}`;
}

function getWeaponNoun(card: PlaystyleCard): string {
  if (card.stance === "dual-wield" && card.subGroups[0] !== card.subGroups[1]) {
    return `${SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase()} and ${SUB_GROUP_LABELS[card.subGroups[1]].toLowerCase()}`;
  }
  if (card.stance === "two-hand" || card.stance === "sword-board") {
    return SUB_GROUP_LABELS_SINGULAR[card.subGroups[0]].toLowerCase();
  }
  return SUB_GROUP_LABELS[card.subGroups[0]].toLowerCase();
}

const MAGIC_ROLES: Record<string, string> = {
  spellcaster: "are your primary weapon",
  spellblade: "complement your attacks",
  skirmisher: "add utility at range",
};

function getTacticalSummary(card: PlaystyleCard): string {
  const noun = getWeaponNoun(card);
  let weaponPart: string;
  switch (card.stance) {
    case "two-hand":
      weaponPart = `Grip your ${noun} with both hands for extra damage and stagger`;
      break;
    case "dual-wield":
      weaponPart =
        card.subGroups[0] === card.subGroups[1]
          ? `Powerstance ${noun} for relentless aggression`
          : `Dual-wield ${noun} for relentless aggression`;
      break;
    case "sword-board":
      weaponPart = `Pair your ${noun} with a shield for staying power`;
      break;
    case "ranged":
      weaponPart = `Strike from range, close to melee only when cornered`;
      break;
    case "double-shield":
      weaponPart = `Turtle behind two shields, punishing every opening`;
      break;
  }

  if (card.school && card.identity !== "warrior") {
    const schoolName = SCHOOL_LABELS[card.school];
    const spellType = isSorcerySchool(card.school) ? "sorceries" : "incantations";
    const role = MAGIC_ROLES[card.identity] ?? "add utility at range";
    return `${weaponPart}. ${schoolName} ${spellType} ${role}.`;
  }

  return `${weaponPart}.`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickChosenRune(seed: number): string {
  return GREAT_RUNES[seed % GREAT_RUNES.length];
}

type AnimPhase = "idle" | "orbiting" | "converging" | "locked" | "name" | "details";

const ORBIT_POSITIONS = [
  { top: -10, left: 35 },
  { top: 35, left: -10 },
  { top: 35, left: 80 },
  { top: 80, left: 35 },
];

export function PlaystyleCardDisplay({ card, isFirstReveal }: PlaystyleCardDisplayProps) {
  const [animPhase, setAnimPhase] = useState<AnimPhase>(isFirstReveal ? "idle" : "details");
  const [animKey, setAnimKey] = useState(0);
  const [orbitRunes, setOrbitRunes] = useState<string[]>([]);
  const [visibleOrbits, setVisibleOrbits] = useState<boolean[]>([false, false, false, false]);
  const [chosenRune, setChosenRune] = useState("");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setAnimKey((k) => k + 1);

    if (isFirstReveal) {
      const chosen = pickChosenRune(card.seed);
      setChosenRune(chosen);
      const others = shuffleArray(GREAT_RUNES.filter((r) => r !== chosen)).slice(0, 4);
      setOrbitRunes(others);
      setVisibleOrbits([false, false, false, false]);
      setAnimPhase("orbiting");

      const timers: ReturnType<typeof setTimeout>[] = [];

      // Fade in scattered runes one by one
      for (let i = 0; i < 4; i++) {
        timers.push(
          setTimeout(() => {
            setVisibleOrbits((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, i * 200),
        );
      }

      // Converge toward center
      const convergeStart = 4 * 200 + 700;
      timers.push(setTimeout(() => setAnimPhase("converging"), convergeStart));

      // Lock chosen rune
      const lockStart = convergeStart + 600;
      timers.push(setTimeout(() => setAnimPhase("locked"), lockStart));

      // Show name
      const nameStart = lockStart + 500;
      timers.push(setTimeout(() => setAnimPhase("name"), nameStart));

      // Show details
      const detailsStart = nameStart + 300;
      timers.push(setTimeout(() => setAnimPhase("details"), detailsStart));

      timersRef.current = timers;

      return () => {
        timers.forEach(clearTimeout);
      };
    }

    setChosenRune(pickChosenRune(card.seed));
    setAnimPhase("details");
  }, [card.seed, isFirstReveal]);

  const subtitle = card.flavorIdentity;
  const tacticalSummary = getTacticalSummary(card);
  const showWatermark = animPhase === "name" || animPhase === "details";

  return (
    <div
      key={animKey}
      className={`relative overflow-hidden rounded-2xl border-2 border-gold-dim bg-gradient-to-br from-[#1a1510] to-bg-dark p-6 text-center ${
        animPhase === "locked" ? "animate-fate-glow" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Watermark rune behind text */}
      {chosenRune && (
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-600 ${
            showWatermark ? "opacity-15" : "opacity-0"
          }`}
        >
          <img
            src={chosenRune}
            alt=""
            className="h-[180px] w-[180px] object-contain blur-[1px] drop-shadow-[0_0_30px_rgba(200,169,81,0.1)]"
          />
        </div>
      )}

      {/* Orbiting phase: 4 scattered runes */}
      {(animPhase === "orbiting" || animPhase === "converging") && (
        <div className="relative mx-auto h-[130px] w-[130px]">
          {orbitRunes.map((rune, i) => (
            <img
              key={rune}
              src={rune}
              alt=""
              className={`absolute h-[70px] w-[70px] object-contain drop-shadow-[0_0_12px_rgba(200,169,81,0.2)] ${
                animPhase === "converging"
                  ? "transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  : visibleOrbits[i]
                    ? "animate-rune-orbit-pulse"
                    : ""
              }`}
              style={
                animPhase === "converging"
                  ? { top: "30px", left: "30px", opacity: 0, transform: "scale(0.3)" }
                  : {
                      top: `${ORBIT_POSITIONS[i].top}px`,
                      left: `${ORBIT_POSITIONS[i].left}px`,
                      opacity: visibleOrbits[i] ? 0.5 : 0,
                      transition: "opacity 0.3s ease",
                    }
              }
            />
          ))}
        </div>
      )}

      {/* Locked phase: chosen rune appears and pulses */}
      {animPhase === "locked" && (
        <div className="flex items-center justify-center py-2">
          <img
            src={chosenRune}
            alt=""
            className="animate-rune-lock h-[120px] w-[120px] object-contain drop-shadow-[0_0_20px_rgba(200,169,81,0.3)]"
          />
        </div>
      )}

      {/* Name + details phases */}
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

          <p
            className="animate-fate-details mx-auto mt-3 max-w-[400px] text-[12px] leading-relaxed text-text-secondary"
            style={{ animationDelay: "150ms", opacity: 0 }}
          >
            {tacticalSummary}
          </p>

          <div
            className="animate-fate-details mt-4 flex flex-wrap justify-center gap-4"
            style={{ animationDelay: "250ms", opacity: 0 }}
          >
            <StatPill label="Weapons" value={getCombatValue(card)} />
            {card.school && <StatPill label="Magic" value={getMagicValue(card.school)} />}
            <StatPill
              label="Armor"
              value={card.armorClass.charAt(0).toUpperCase() + card.armorClass.slice(1)}
            />
            <StatPill label="Focus" value={card.primaryStats.join(" / ")} />
          </div>
        </>
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
