import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { SeedItem } from "../types/generator";
import { ItemSearch } from "../components/generator/item-search";
import { CreativitySlider } from "../components/generator/creativity-slider";

const STORAGE_KEY = "erbr-generator-state";

interface PersistedState {
  seedItems: SeedItem[];
  creativity: number;
  seed: number;
}

function loadState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

export function GeneratePage() {
  const navigate = useNavigate();
  const saved = loadState();
  const [seedItems, setSeedItems] = useState<SeedItem[]>(saved?.seedItems ?? []);
  const [creativity, setCreativity] = useState(saved?.creativity ?? 50);

  function handleAddItem(item: SeedItem) {
    setSeedItems((prev) => [...prev, item]);
  }

  function handleRemoveItem(index: number) {
    setSeedItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleGenerate() {
    if (seedItems.length === 0) return;
    const state: PersistedState = {
      seedItems,
      creativity,
      seed: randomSeed(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    navigate({ to: "/generate/picks" });
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-7 text-center">
        <h1 className="font-display text-[22px] font-bold tracking-wide text-gold-light">
          Build Generator
        </h1>
        <p className="mt-1 text-[12px] text-text-secondary">
          Choose seed items and generate synergized builds
        </p>
      </div>

      <div className="mb-6 space-y-5 rounded-lg border border-border-dark bg-bg-card/50 p-4">
        <ItemSearch selectedItems={seedItems} onAdd={handleAddItem} onRemove={handleRemoveItem} />
        <CreativitySlider value={creativity} onChange={setCreativity} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[600px] gap-2.5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={seedItems.length === 0}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
          >
            ✨ Generate
          </button>
        </div>
      </div>
    </div>
  );
}
