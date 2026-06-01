// src/pages/generate-build.tsx
import { useNavigate } from "@tanstack/react-router";
import type { BuildPick, GeneratedPick, CommunityPick } from "../types/picks";
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
import { StatProfileDisplay } from "../components/generator/stat-profile-display";
import { ArmorClassBadge } from "../components/generator/armor-class-badge";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import { encodeBuild } from "../lib/build-codec";

const PICK_KEY = "erbr-selected-pick";

function loadPick(): BuildPick | null {
  try {
    const raw = sessionStorage.getItem(PICK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuildPick;
  } catch {
    return null;
  }
}

function GeneratedBuildView({ pick }: { pick: GeneratedPick }) {
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
        <ArmorClassBadge armorClass={generated.armorClass} />
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

function CommunityBuildView({ pick }: { pick: CommunityPick }) {
  const { build } = pick;

  return (
    <>
      <BuildIdentity buildName={build.name} />

      <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
        <p className="font-display text-[10px] uppercase tracking-[1.5px] text-text-dim">
          {build.playstyle}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">{build.strategy}</p>
      </div>

      <EquipmentSection title="Weapons">
        <div className="grid grid-cols-2 gap-2">
          {build.weapons.map((w) => (
            <ItemSlot key={w} itemName={w} category="weapon" variant="standard" />
          ))}
        </div>
      </EquipmentSection>

      {build.primaryStats.length > 0 && (
        <div className="mb-6 rounded-lg border border-border-dark bg-bg-card/50 px-4 py-3">
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

  if (!pick) {
    navigate({ to: "/generate" });
    return null;
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
        <GeneratedBuildView pick={pick} />
      ) : (
        <CommunityBuildView pick={pick} />
      )}
    </div>
  );
}
