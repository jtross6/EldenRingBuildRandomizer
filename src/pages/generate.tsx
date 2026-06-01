import { useState, useCallback, useEffect } from "react";
import type { SeedItem } from "../types/generator";
import { generateBuild } from "../lib/build-generator";
import { encodeBuild } from "../lib/build-codec";
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { BuildIdentity } from "../components/equipment/build-identity";
import { EquipmentSection } from "../components/equipment/equipment-section";
import { ItemSlot } from "../components/equipment/item-slot";
import { ItemSearch } from "../components/generator/item-search";
import { CreativitySlider } from "../components/generator/creativity-slider";
import { SeedDisplay } from "../components/generator/seed-display";
import { ArmorClassBadge } from "../components/generator/armor-class-badge";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";

const STORAGE_KEY = "erbr-generator-state";

interface PersistedState {
  seedItems: SeedItem[];
  creativity: number;
  seed: number;
}

function saveState(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
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

function initState(): {
  seedItems: SeedItem[];
  creativity: number;
  seed: number;
  result: ReturnType<typeof generateBuild> | null;
} {
  const saved = loadState();
  if (saved && saved.seedItems.length > 0) {
    const result = generateBuild({
      seedItems: saved.seedItems,
      creativity: saved.creativity,
      seed: saved.seed,
    });
    return { ...saved, result };
  }
  return { seedItems: [], creativity: 50, seed: randomSeed(), result: null };
}

export function GeneratePage() {
  const [initial] = useState(initState);
  const [seedItems, setSeedItems] = useState<SeedItem[]>(initial.seedItems);
  const [creativity, setCreativity] = useState(initial.creativity);
  const [seed, setSeed] = useState(initial.seed);
  const [result, setResult] = useState<ReturnType<typeof generateBuild> | null>(initial.result);
  const toast = useToast();

  useEffect(() => {
    if (seedItems.length > 0 && result) {
      saveState({ seedItems, creativity, seed });
    }
  }, [seedItems, creativity, seed, result]);

  const handleGenerate = useCallback(() => {
    if (seedItems.length === 0) return;
    const newSeed = randomSeed();
    setSeed(newSeed);
    const generated = generateBuild({ seedItems, creativity, seed: newSeed });
    setResult(generated);
  }, [seedItems, creativity]);

  const handleReroll = useCallback(() => {
    if (seedItems.length === 0) return;
    const newSeed = randomSeed();
    setSeed(newSeed);
    const generated = generateBuild({ seedItems, creativity, seed: newSeed });
    setResult(generated);
  }, [seedItems, creativity]);

  const handleGenerateWithCurrentSeed = useCallback(() => {
    if (seedItems.length === 0) return;
    const generated = generateBuild({ seedItems, creativity, seed });
    setResult(generated);
  }, [seedItems, creativity, seed]);

  function handleAddItem(item: SeedItem) {
    setSeedItems((prev) => [...prev, item]);
  }

  function handleRemoveItem(index: number) {
    setSeedItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleShare() {
    if (!result) return;
    try {
      const encoded = encodeBuild(result.build);
      const url = new URL(window.location.origin + import.meta.env.BASE_URL);
      url.searchParams.set("build", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  const build = result?.build;

  return (
    <>
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
          <div className="flex items-center justify-between">
            <SeedDisplay
              seed={seed}
              onSeedChange={(s) => {
                setSeed(s);
                handleGenerateWithCurrentSeed();
              }}
            />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[600px] gap-2.5">
            <button
              type="button"
              onClick={result ? handleReroll : handleGenerate}
              disabled={seedItems.length === 0}
              className="flex flex-2 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none"
            >
              {result ? "⚄ Re-roll" : "✨ Generate"}
            </button>
            {result && (
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-dark bg-bg-card px-4 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-gold-dim hover:bg-bg-card-hover hover:text-text-primary"
              >
                &#128279; Share
              </button>
            )}
          </div>
        </div>

        {build && (
          <div className="animate-fade-in">
            <BuildIdentity buildName={result.buildName} />

            <EquipmentSection title="Armament">
              <div className="grid grid-cols-2 gap-2">
                {build.weaponsRight.map((idx, i) => (
                  <ItemSlot
                    key={`r${i}`}
                    itemName={weapons[idx]?.name ?? "Unknown"}
                    slotLabel={`Right Hand ${i + 1}`}
                    category="weapon"
                    variant="standard"
                  />
                ))}
                {build.weaponsLeft.map((idx, i) => (
                  <ItemSlot
                    key={`l${i}`}
                    itemName={weapons[idx]?.name ?? "Unknown"}
                    slotLabel={`Left Hand ${i + 1}`}
                    category="weapon"
                    variant="standard"
                  />
                ))}
              </div>
            </EquipmentSection>

            <EquipmentSection title="Armor">
              <ArmorClassBadge armorClass={result.armorClass} />
            </EquipmentSection>

            <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
              {build.shield >= 0 && (
                <EquipmentSection title="Shield">
                  <ItemSlot
                    itemName={shields[build.shield]?.name ?? "None"}
                    slotLabel="Shield"
                    category="shield"
                    variant="standard"
                  />
                </EquipmentSection>
              )}
              {build.catalyst >= 0 && (
                <EquipmentSection title="Catalyst">
                  <ItemSlot
                    itemName={catalysts[build.catalyst]?.name ?? "None"}
                    slotLabel="Seal / Staff"
                    category="seal"
                    variant="standard"
                  />
                </EquipmentSection>
              )}
            </div>

            <EquipmentSection title="Talismans">
              <div className="grid grid-cols-4 gap-2">
                {build.talismans.map((idx, i) => (
                  <ItemSlot
                    key={`tal-${i}`}
                    itemName={talismans[idx]?.name ?? "Unknown"}
                    category="talisman"
                    variant="talisman"
                  />
                ))}
              </div>
            </EquipmentSection>

            <EquipmentSection title="Ashes of War">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                {build.ashesOfWar.map((idx, i) => (
                  <ItemSlot
                    key={`ash-${i}`}
                    itemName={ashesOfWar[idx]?.name ?? "Unknown"}
                    category="ash"
                    variant="compact"
                  />
                ))}
              </div>
            </EquipmentSection>

            {(build.sorceries.length > 0 || build.incantations.length > 0) && (
              <EquipmentSection title="Sorceries & Incantations">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                  {build.sorceries.map((idx, i) => (
                    <ItemSlot
                      key={`sorc-${i}`}
                      itemName={sorceries[idx]?.name ?? "Unknown"}
                      category="spell"
                      variant="compact"
                    />
                  ))}
                  {build.incantations.map((idx, i) => (
                    <ItemSlot
                      key={`inc-${i}`}
                      itemName={incantations[idx]?.name ?? "Unknown"}
                      category="spell"
                      variant="compact"
                    />
                  ))}
                </div>
              </EquipmentSection>
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} />
    </>
  );
}
