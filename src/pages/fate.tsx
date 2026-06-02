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
import { FateActionBar } from "../components/fate/fate-action-bar";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function FatePage() {
  const { fate: encodedFate } = fateRoute.useSearch();
  const navigate = useNavigate();
  const toast = useToast();

  const [constraints, setConstraints] = useState<PlaystyleConstraint>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [card, setCard] = useState<PlaystyleCard | null>(() => {
    if (encodedFate) {
      const decoded = decodeFate(encodedFate);
      if (decoded) return decoded;
    }
    return null;
  });

  const hasRolled = card !== null;
  const [isFirstReveal, setIsFirstReveal] = useState(!hasRolled);

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
    setIsFirstReveal(true);

    const encoded = encodeFate(newCard);
    navigate({ to: "/fate", search: { fate: encoded }, replace: true });

    setTimeout(() => setIsFirstReveal(false), 3000);
  }, [constraints, navigate]);

  const handleGenerateBuild = useCallback(() => {
    if (!card) return;
    const build = generateBuildFromFate(card);
    const encoded = encodeBuild(build);
    navigate({ to: "/random", search: { build: encoded } });
  }, [card, navigate]);

  async function handleShare() {
    if (!card) return;
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

        {!hasRolled ? (
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="relative w-full overflow-hidden rounded-2xl border-2 border-gold-dim/40 bg-gradient-to-br from-[#1a1510]/60 to-bg-dark/60 p-10 text-center">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-gold-dim/30 to-transparent" />
              <div className="flex items-center justify-center gap-3 text-gold-dim/30">
                <span className="font-display text-2xl">&#10033;</span>
                <span className="font-display text-lg">&#10033;</span>
                <span className="font-display text-2xl">&#10033;</span>
              </div>
              <p className="mt-3 text-[12px] italic text-text-dim">Your fate awaits...</p>
            </div>

            <button
              type="button"
              onClick={handleRoll}
              className="w-full cursor-pointer rounded-xl bg-gradient-to-br from-gold to-[#b8943d] px-6 py-4 font-display text-[15px] font-bold uppercase tracking-wider text-bg-dark shadow-[0_2px_24px_rgba(200,169,81,0.3)] transition-all hover:-translate-y-0.5 hover:from-gold-light hover:to-gold hover:shadow-[0_4px_32px_rgba(200,169,81,0.35)] active:scale-[0.98] active:translate-y-0"
            >
              Reveal My Fate
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-[12px] text-text-dim transition-colors hover:text-gold-dim"
            >
              &#9881; Constrain my fate
            </button>
          </div>
        ) : (
          <>
            <PlaystyleCardDisplay card={card} isFirstReveal={isFirstReveal} />

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleShare}
                className="text-[11px] text-gold-dim transition-colors hover:text-gold-light"
              >
                &#128279; Share This Fate
              </button>
              <span className="text-border-dark">|</span>
              <button
                type="button"
                onClick={handleGenerateBuild}
                className="text-[11px] text-gold-dim transition-colors hover:text-gold-light"
              >
                &#10024; Generate Build &rarr;
              </button>
            </div>
          </>
        )}
      </div>

      {hasRolled && (
        <FateActionBar
          onRoll={handleRoll}
          onOpenConstraints={() => setDrawerOpen(true)}
          pinCount={pinCount}
        />
      )}

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
