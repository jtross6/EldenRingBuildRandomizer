import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { BuildPick, GeneratedPick, CommunityPick } from "../types/picks";
import {
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { armamentName } from "../lib/armaments";
import { BuildIdentity } from "../components/equipment/build-identity";
import { EquipmentSection } from "../components/equipment/equipment-section";
import { ItemSlot } from "../components/equipment/item-slot";
import { ItemDetailModal } from "../components/equipment/item-detail-modal";
import { StatProfileDisplay } from "../components/generator/stat-profile-display";
import { ArmorClassBadge } from "../components/generator/armor-class-badge";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import { encodeBuild } from "../lib/build-codec";
import { prefetchItemDetails } from "../hooks/use-item-details";
import type { ItemCategory } from "../components/icons/item-icons";
import { seedGuidedHand } from "../lib/guided-hand-nav";
import {
  resolveCommunityBuild,
  ARMOR_LABELS,
} from "../lib/resolve-community-build";

const PICK_KEY = "erbr-selected-pick";

interface SelectedItem {
  name: string;
  category: ItemCategory;
}

function loadPick(): BuildPick | null {
  try {
    const raw = sessionStorage.getItem(PICK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuildPick;
  } catch {
    return null;
  }
}

function GeneratedBuildView({
  pick,
  onSelectItem,
}: {
  pick: GeneratedPick;
  onSelectItem: (name: string, category: ItemCategory) => void;
}) {
  const { generated } = pick;
  const build = generated.build;
  const toast = useToast();

  async function handleShare() {
    try {
      const encoded = encodeBuild(build);
      const url = new URL(window.location.origin + import.meta.env.BASE_URL);
      url.searchParams.set("build", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  return (
    <>
      <BuildIdentity buildName={generated.buildName} />

      <StatProfileDisplay
        statProfile={generated.statProfile}
        armorClass={generated.armorClass}
        loadoutProfile={generated.loadoutProfile}
      />

      <EquipmentSection title="Armament">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const ref = build.rightHand[i];
              const name = ref ? armamentName(ref) : "Empty";
              return (
                <ItemSlot
                  key={`gen-right-${i}`}
                  itemName={name}
                  slotLabel={`Right Hand ${i + 1}`}
                  slotId={`gen-right-${i}`}
                  category={ref?.type ?? "weapon"}
                  variant="standard"
                  isEmpty={!ref}
                  onClick={ref ? () => onSelectItem(name, ref.type) : undefined}
                />
              );
            })}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const ref = build.leftHand[i];
              const name = ref ? armamentName(ref) : "Empty";
              return (
                <ItemSlot
                  key={`gen-left-${i}`}
                  itemName={name}
                  slotLabel={`Left Hand ${i + 1}`}
                  slotId={`gen-left-${i}`}
                  category={ref?.type ?? "weapon"}
                  variant="standard"
                  isEmpty={!ref}
                  onClick={ref ? () => onSelectItem(name, ref.type) : undefined}
                />
              );
            })}
          </div>
        </div>
      </EquipmentSection>

      <EquipmentSection title="Armor">
        <ArmorClassBadge armorClass={generated.armorClass} />
      </EquipmentSection>

      {build.talismans.length > 0 && (
        <EquipmentSection title="Talismans">
          <div className="grid grid-cols-4 gap-2">
            {build.talismans.map((idx, i) => (
              <ItemSlot
                key={`tal-${i}`}
                itemName={talismans[idx]?.name ?? "Unknown"}
                slotId={`gen-talisman-${i}`}
                category="talisman"
                variant="talisman"
                onClick={() => onSelectItem(talismans[idx]?.name ?? "Unknown", "talisman")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {build.ashesOfWar.length > 0 && (
        <EquipmentSection title="Ashes of War">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {build.ashesOfWar.map((idx, i) => (
              <ItemSlot
                key={`ash-${i}`}
                itemName={ashesOfWar[idx]?.name ?? "Unknown"}
                slotId={`gen-ash-${i}`}
                category="ash"
                variant="compact"
                onClick={() => onSelectItem(ashesOfWar[idx]?.name ?? "Unknown", "ash")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {(build.sorceries.length > 0 || build.incantations.length > 0) && (
        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {build.sorceries.map((idx, i) => (
              <ItemSlot
                key={`sorc-${i}`}
                itemName={sorceries[idx]?.name ?? "Unknown"}
                slotId={`gen-sorc-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(sorceries[idx]?.name ?? "Unknown", "spell")}
              />
            ))}
            {build.incantations.map((idx, i) => (
              <ItemSlot
                key={`inc-${i}`}
                itemName={incantations[idx]?.name ?? "Unknown"}
                slotId={`gen-incant-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(incantations[idx]?.name ?? "Unknown", "spell")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[600px] gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0"
          >
            &#128279; Share
          </button>
        </div>
      </div>

      <Toast message={toast.message} />
    </>
  );
}

function CommunityBuildView({
  pick,
  onSelectItem,
}: {
  pick: CommunityPick;
  onSelectItem: (name: string, category: ItemCategory) => void;
}) {
  const { build } = pick;
  const resolved = resolveCommunityBuild(build);

  return (
    <>
      <BuildIdentity buildName={build.name} />

      <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
        <p className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
          {build.playstyle}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">{build.strategy}</p>
      </div>

      <EquipmentSection title="Armament">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const item = resolved.rightHand[i];
              return (
                <ItemSlot
                  key={`comm-right-${i}`}
                  itemName={item?.name ?? "Empty"}
                  slotLabel={`Right Hand ${i + 1}`}
                  slotId={`comm-right-${i}`}
                  category={item?.category ?? "weapon"}
                  variant="standard"
                  isEmpty={!item}
                  onClick={item ? () => onSelectItem(item.name, item.category) : undefined}
                />
              );
            })}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => {
              const item = resolved.leftHand[i];
              return (
                <ItemSlot
                  key={`comm-left-${i}`}
                  itemName={item?.name ?? "Empty"}
                  slotLabel={`Left Hand ${i + 1}`}
                  slotId={`comm-left-${i}`}
                  category={item?.category ?? "weapon"}
                  variant="standard"
                  isEmpty={!item}
                  onClick={item ? () => onSelectItem(item.name, item.category) : undefined}
                />
              );
            })}
          </div>
        </div>
      </EquipmentSection>

      {resolved.armor.some((a) => a !== null) && (
        <EquipmentSection title="Armor">
          <div className="grid grid-cols-2 gap-2">
            {resolved.armor.map((item, i) =>
              item ? (
                <ItemSlot
                  key={`comm-armor-${i}`}
                  itemName={item.name}
                  slotLabel={ARMOR_LABELS[i]}
                  slotId={`comm-armor-${i}`}
                  category="armor"
                  variant="standard"
                  onClick={() => onSelectItem(item.name, "armor")}
                />
              ) : null,
            )}
          </div>
        </EquipmentSection>
      )}

      {resolved.talismans.length > 0 && (
        <EquipmentSection title="Talismans">
          <div className="grid grid-cols-4 gap-2">
            {resolved.talismans.map((item, i) => (
              <ItemSlot
                key={`comm-tal-${i}`}
                itemName={item.name}
                slotId={`comm-tal-${i}`}
                category="talisman"
                variant="talisman"
                onClick={() => onSelectItem(item.name, "talisman")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {resolved.ashesOfWar.length > 0 && (
        <EquipmentSection title="Ashes of War">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {resolved.ashesOfWar.map((item, i) => (
              <ItemSlot
                key={`comm-ash-${i}`}
                itemName={item.name}
                slotId={`comm-ash-${i}`}
                category="ash"
                variant="compact"
                onClick={() => onSelectItem(item.name, "ash")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {(resolved.sorceries.length > 0 || resolved.incantations.length > 0) && (
        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {resolved.sorceries.map((item, i) => (
              <ItemSlot
                key={`comm-sorc-${i}`}
                itemName={item.name}
                slotId={`comm-sorc-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(item.name, "spell")}
              />
            ))}
            {resolved.incantations.map((item, i) => (
              <ItemSlot
                key={`comm-incant-${i}`}
                itemName={item.name}
                slotId={`comm-incant-${i}`}
                category="spell"
                variant="compact"
                onClick={() => onSelectItem(item.name, "spell")}
              />
            ))}
          </div>
        </EquipmentSection>
      )}

      {(build.primaryStats.length > 0 || (build.secondaryStats?.length ?? 0) > 0) && (
        <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
          {build.primaryStats.length > 0 && (
            <>
              <div className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
                Primary Stats
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {build.primaryStats.map((stat) => (
                  <span
                    key={stat}
                    className="rounded bg-bg-surface px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </>
          )}
          {(build.secondaryStats?.length ?? 0) > 0 && (
            <>
              <div className={`${build.primaryStats.length > 0 ? "mt-3" : ""} font-display text-[10px] uppercase tracking-[1.5px] text-text-dim`}>
                Secondary Stats
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {build.secondaryStats!.map((stat) => (
                  <span
                    key={stat}
                    className="rounded bg-bg-surface px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-wider text-text-dim"
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mb-6 text-center">
        <a
          href={build.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-display text-[11px] font-semibold uppercase tracking-wider text-gold-dim transition-colors hover:text-gold-light"
        >
          View full guide on Fextralife &#8599;
        </a>
      </div>
    </>
  );
}

export function GenerateBuildPage() {
  const navigate = useNavigate();
  const pick = loadPick();
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  useEffect(() => {
    prefetchItemDetails();
  }, []);

  if (!pick) {
    navigate({ to: "/generate" });
    return null;
  }

  function handleSelectItem(name: string, category: ItemCategory) {
    setSelectedItem({ name, category });
  }

  function handleGuidedHand(name: string, category: ItemCategory) {
    if (seedGuidedHand(name, category)) {
      navigate({ to: "/generate/picks" });
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/generate/picks" })}
          className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light"
        >
          &#8592; Back to picks
        </button>
      </div>

      {pick.kind === "generated" ? (
        <GeneratedBuildView pick={pick} onSelectItem={handleSelectItem} />
      ) : (
        <CommunityBuildView pick={pick} onSelectItem={handleSelectItem} />
      )}

      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
          onGuidedHand={
            selectedItem.category !== "armor"
              ? () => handleGuidedHand(selectedItem.name, selectedItem.category)
              : undefined
          }
        />
      )}
    </div>
  );
}
