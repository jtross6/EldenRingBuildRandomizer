import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { fateRoute } from "../router";
import type { PlaystyleCard, PlaystyleConstraint } from "../types/fate";
import { generatePlaystyle } from "../lib/fate/playstyle-generator";
import { encodeFate, decodeFate } from "../lib/fate/fate-codec";
import { encodeBuild } from "../lib/build-codec";
import { generateBuildFromFate } from "../lib/fate/fate-build-generator";
import { PlaystyleCardDisplay } from "../components/fate/playstyle-card";
import { ConstraintsDrawer } from "../components/fate/constraints-drawer";
import { MagicControl } from "../components/fate/magic-control";
import { StanceChips } from "../components/fate/stance-chips";
import { FateActionBar } from "../components/fate/fate-action-bar";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import type { MagicLevel, WeaponStance } from "../types/fate";

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function FatePage() {
  const { fate: encodedFate } = fateRoute.useSearch();
  const navigate = useNavigate();
  const toast = useToast();

  const [constraints, setConstraints] = useState<PlaystyleConstraint>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFirstReveal, setIsFirstReveal] = useState(true);

  const [card, setCard] = useState<PlaystyleCard>(() => {
    if (encodedFate) {
      const decoded = decodeFate(encodedFate);
      if (decoded) {
        setIsFirstReveal(false);
        return decoded;
      }
    }
    return generatePlaystyle({}, randomSeed());
  });

  const pinCount =
    (constraints.magic && constraints.magic !== "any" ? 1 : 0) +
    (constraints.stance ? 1 : 0) +
    (constraints.family ? 1 : 0) +
    (constraints.school ? 1 : 0) +
    (constraints.statusEffect ? 1 : 0) +
    (constraints.armorClass ? 1 : 0);

  const handleRoll = useCallback(() => {
    const seed = randomSeed();
    const newCard = generatePlaystyle(constraints, seed);
    setCard(newCard);
    setIsFirstReveal(false);

    const encoded = encodeFate(newCard);
    navigate({ to: "/fate", search: { fate: encoded }, replace: true });
  }, [constraints, navigate]);

  const handleGenerateBuild = useCallback(() => {
    const build = generateBuildFromFate(card);
    const encoded = encodeBuild(build);
    navigate({ to: "/random", search: { build: encoded } });
  }, [card, navigate]);

  async function handleShare() {
    try {
      const encoded = encodeFate(card);
      const url = new URL(window.location.href);
      url.searchParams.set("fate", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Fate link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  function handleMagicChange(magic: MagicLevel) {
    setConstraints((prev) => {
      const next = { ...prev, magic: magic === "any" ? undefined : magic };
      if (magic === "none") {
        delete next.school;
        if (prev.school) {
          toast.show(`${prev.school} unpinned — no magic selected`);
        }
      }
      return next;
    });
  }

  function handleStanceChange(stance: WeaponStance | undefined) {
    setConstraints((prev) => {
      const next = { ...prev, stance };
      if (stance === "ranged") {
        next.family = "ranged";
      } else if (prev.stance === "ranged" && prev.family === "ranged") {
        delete next.family;
      }
      return next;
    });
  }

  return (
    <>
      <div className="animate-fade-in">
        <div className="mb-5 text-center">
          <h1 className="font-display text-[22px] font-bold tracking-wide text-gold-light">
            Path of Fate
          </h1>
          <p className="mt-1 text-[12px] text-text-secondary">
            Let the Erdtree reveal your calling
          </p>
        </div>

        <div className="mb-4 space-y-4 rounded-lg border border-border-dark bg-bg-card/50 p-3">
          <MagicControl value={constraints.magic} onChange={handleMagicChange} />
          <StanceChips value={constraints.stance} onChange={handleStanceChange} />
        </div>

        <PlaystyleCardDisplay card={card} isFirstReveal={isFirstReveal} />

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleShare}
            className="text-[11px] text-gold-dim transition-colors hover:text-gold-light"
          >
            &#128279; Share This Fate
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleGenerateBuild}
            className="rounded-lg border border-border-dark bg-bg-card px-5 py-2.5 font-display text-[12px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-gold-dim hover:text-gold-light"
          >
            &#10024; Generate Build &rarr;
          </button>
        </div>
      </div>

      <FateActionBar
        onRoll={handleRoll}
        onOpenConstraints={() => setDrawerOpen(true)}
        pinCount={pinCount}
      />

      <ConstraintsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        constraints={constraints}
        onChange={setConstraints}
        onApplyAndRoll={() => {
          setDrawerOpen(false);
          handleRoll();
        }}
      />

      <Toast message={toast.message} />
    </>
  );
}
