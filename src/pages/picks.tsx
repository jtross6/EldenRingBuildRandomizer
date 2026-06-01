// src/pages/picks.tsx
import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { SeedItem } from "../types/generator";
import type { BuildPick } from "../types/picks";
import { generatePicks } from "../lib/pick-generator";
import { BuildCard } from "../components/gallery/build-card";

const STORAGE_KEY = "erbr-generator-state";
const PICK_KEY = "erbr-selected-pick";

interface PersistedState {
  seedItems: SeedItem[];
  creativity: number;
  seed: number;
}

function loadGeneratorState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function PicksPage() {
  const navigate = useNavigate();
  const state = loadGeneratorState();

  const [picks, setPicks] = useState<BuildPick[]>(() => {
    if (!state || state.seedItems.length === 0) return [];
    return generatePicks(state.seedItems, state.creativity);
  });

  const handleShuffle = useCallback(() => {
    if (!state || state.seedItems.length === 0) return;
    setPicks(generatePicks(state.seedItems, state.creativity));
  }, [state]);

  function handleSelect(pick: BuildPick) {
    try {
      sessionStorage.setItem(PICK_KEY, JSON.stringify(pick));
    } catch {}
    navigate({ to: "/generate/build" });
  }

  if (!state || state.seedItems.length === 0) {
    navigate({ to: "/generate" });
    return null;
  }

  const communityCount = picks.filter((p) => p.kind === "community").length;
  const generatedCount = picks.filter((p) => p.kind === "generated").length;

  return (
    <div className="animate-fade-in">
      <div className="mb-7 text-center">
        <h1 className="font-display text-[22px] font-bold tracking-wide text-gold-light">
          The Council Speaks
        </h1>
        <p className="mt-1 text-[12px] text-text-secondary">
          Choose a build to view its full details
        </p>
      </div>

      {communityCount > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 border-b border-gold/10 pb-1.5 font-display text-[11px] font-semibold uppercase tracking-[3px] text-gold-dim">
            <span className="block size-1 shrink-0 rotate-45 bg-gold-dim" />
            Community Wisdom
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {picks
              .filter((p) => p.kind === "community")
              .map((pick, i) => (
                <div
                  key={pick.kind === "community" ? pick.build.id : i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
                >
                  <BuildCard pick={pick} onSelect={() => handleSelect(pick)} />
                </div>
              ))}
          </div>
        </div>
      )}

      {generatedCount > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 border-b border-gold/10 pb-1.5 font-display text-[11px] font-semibold uppercase tracking-[3px] text-gold-dim">
            <span className="block size-1 shrink-0 rotate-45 bg-gold-dim" />
            Forged for You
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {picks
              .filter((p) => p.kind === "generated")
              .map((pick, i) => (
                <div
                  key={pick.kind === "generated" ? pick.seed : i}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${(communityCount + i) * 80}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <BuildCard pick={pick} onSelect={() => handleSelect(pick)} />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[600px] gap-2.5">
          <button
            type="button"
            onClick={() => navigate({ to: "/generate" })}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-dark bg-bg-card px-4 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-gold-dim hover:bg-bg-card-hover hover:text-text-primary"
          >
            &#8592; Back
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="flex flex-2 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0"
          >
            ⚄ Shuffle All
          </button>
        </div>
      </div>
    </div>
  );
}
