import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { randomRoute } from "../router";
import { decodeBuild, encodeBuild } from "../lib/build-codec";
import { generateRandomBuild } from "../lib/randomizer";
import {
  weapons,
  shields,
  staves,
  seals,
  armorHead,
  armorBody,
  armorArms,
  armorLegs,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";
import { BuildIdentity } from "../components/equipment/build-identity";
import { EquipmentSection } from "../components/equipment/equipment-section";
import { ItemSlot } from "../components/equipment/item-slot";
import { ItemDetailModal } from "../components/equipment/item-detail-modal";
import { ActionBar } from "../components/action-bar";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";
import { prefetchItemDetails } from "../hooks/use-item-details";
import type { ItemCategory } from "../components/icons/item-icons";

interface SelectedItem {
  name: string;
  category: ItemCategory;
}

export function BuildViewerPage() {
  const { build: encodedBuild } = randomRoute.useSearch();
  const navigate = useNavigate();
  const toast = useToast();
  const initialRedirectDone = useRef(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  useEffect(() => {
    prefetchItemDetails();
  }, []);

  const build = useMemo(() => {
    if (encodedBuild) {
      const decoded = decodeBuild(encodedBuild);
      if (decoded) return decoded;
    }
    return generateRandomBuild();
  }, [encodedBuild]);

  useEffect(() => {
    if (!encodedBuild && !initialRedirectDone.current) {
      initialRedirectDone.current = true;
      const encoded = encodeBuild(build);
      navigate({ to: "/random", search: { build: encoded }, replace: true });
    }
  }, [encodedBuild, build, navigate]);

  function handleRandomize() {
    const newBuild = generateRandomBuild();
    const encoded = encodeBuild(newBuild);
    navigate({ to: "/random", search: { build: encoded } });
  }

  async function handleShare() {
    try {
      const encoded = encodeBuild(build);
      const url = new URL(window.location.href);
      url.searchParams.set("build", encoded);
      await navigator.clipboard.writeText(url.toString());
      toast.show("Link copied to clipboard");
    } catch {
      toast.show("Failed to copy link");
    }
  }

  function selectItem(name: string, category: ItemCategory) {
    setSelectedItem({ name, category });
  }

  const weaponSlotsR = build.weaponsRight.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Right Hand ${i + 1}`,
    slotId: `right-${i}`,
  }));
  const weaponSlotsL = build.weaponsLeft.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Left Hand ${i + 1}`,
    slotId: `left-${i}`,
  }));

  const armorPieces = [
    { name: armorHead[build.helm]?.name ?? "Unknown", label: "Helm", slotId: "helm" },
    { name: armorBody[build.chest]?.name ?? "Unknown", label: "Chest Armor", slotId: "chest" },
    {
      name: armorArms[build.gauntlets]?.name ?? "Unknown",
      label: "Gauntlets",
      slotId: "gauntlets",
    },
    { name: armorLegs[build.legs]?.name ?? "Unknown", label: "Leg Armor", slotId: "legs" },
  ];

  const talismanNames = build.talismans.map((idx) => talismans[idx]?.name ?? "Unknown");
  const ashNames = build.ashesOfWar.map((idx) => ashesOfWar[idx]?.name ?? "Unknown");
  const sorceryNames = build.sorceries.map((idx) => sorceries[idx]?.name ?? "Unknown");
  const incantNames = build.incantations.map((idx) => incantations[idx]?.name ?? "Unknown");

  return (
    <>
      <div className="animate-fade-in">
        <BuildIdentity buildName={build.buildName} buildImage={build.buildImage} />

        <EquipmentSection title="Armament">
          <div className="grid grid-cols-2 gap-2">
            {weaponSlotsR.map((w) => (
              <ItemSlot
                key={w.slotId}
                itemName={w.name}
                slotLabel={w.label}
                slotId={w.slotId}
                category="weapon"
                variant="standard"
                onClick={() => selectItem(w.name, "weapon")}
              />
            ))}
            {weaponSlotsL.map((w) => (
              <ItemSlot
                key={w.slotId}
                itemName={w.name}
                slotLabel={w.label}
                slotId={w.slotId}
                category="weapon"
                variant="standard"
                onClick={() => selectItem(w.name, "weapon")}
              />
            ))}
          </div>
        </EquipmentSection>

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
          <EquipmentSection title="Armor">
            <div className="grid grid-cols-2 gap-2">
              {armorPieces.map((a) => (
                <ItemSlot
                  key={a.slotId}
                  itemName={a.name}
                  slotLabel={a.label}
                  slotId={a.slotId}
                  category="armor"
                  variant="standard"
                  onClick={() => selectItem(a.name, "armor")}
                />
              ))}
            </div>
          </EquipmentSection>
        </div>

        {(build.shields?.length ?? 0) > 0 && (
          <EquipmentSection title="Shields">
            <div className="grid gap-2">
              {build.shields!.map((idx, i) => {
                const name = shields[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`shield-${i}`}
                    itemName={name}
                    slotLabel="Shield"
                    slotId={`shield-${i}`}
                    category="shield"
                    variant="standard"
                    onClick={() => selectItem(name, "shield")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}

        {(build.staves?.length ?? 0) > 0 && (
          <EquipmentSection title="Staves">
            <div className="grid gap-2">
              {build.staves!.map((idx, i) => {
                const name = staves[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`staff-${i}`}
                    itemName={name}
                    slotLabel="Staff"
                    slotId={`staff-${i}`}
                    category="staff"
                    variant="standard"
                    onClick={() => selectItem(name, "staff")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}

        {(build.seals?.length ?? 0) > 0 && (
          <EquipmentSection title="Seals">
            <div className="grid gap-2">
              {build.seals!.map((idx, i) => {
                const name = seals[idx]?.name ?? "Unknown";
                return (
                  <ItemSlot
                    key={`seal-${i}`}
                    itemName={name}
                    slotLabel="Seal"
                    slotId={`seal-${i}`}
                    category="seal"
                    variant="standard"
                    onClick={() => selectItem(name, "seal")}
                  />
                );
              })}
            </div>
          </EquipmentSection>
        )}

        {talismanNames.length > 0 && (
          <EquipmentSection title="Talismans">
            <div className="grid grid-cols-4 gap-2">
              {talismanNames.map((name, i) => (
                <ItemSlot
                  key={`talisman-${i}`}
                  itemName={name}
                  slotId={`talisman-${i}`}
                  category="talisman"
                  variant="talisman"
                  onClick={() => selectItem(name, "talisman")}
                />
              ))}
            </div>
          </EquipmentSection>
        )}

        {ashNames.length > 0 && (
          <EquipmentSection title="Ashes of War">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {ashNames.map((name, i) => (
                <ItemSlot
                  key={`ash-${i}`}
                  itemName={name}
                  slotId={`ash-${i}`}
                  category="ash"
                  variant="compact"
                  onClick={() => selectItem(name, "ash")}
                />
              ))}
            </div>
          </EquipmentSection>
        )}

        {(sorceryNames.length > 0 || incantNames.length > 0) && (
          <EquipmentSection title="Sorceries & Incantations">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {sorceryNames.map((name, i) => (
                <ItemSlot
                  key={`sorc-${i}`}
                  itemName={name}
                  slotId={`sorc-${i}`}
                  category="spell"
                  variant="compact"
                  onClick={() => selectItem(name, "spell")}
                />
              ))}
              {incantNames.map((name, i) => (
                <ItemSlot
                  key={`incant-${i}`}
                  itemName={name}
                  slotId={`incant-${i}`}
                  category="spell"
                  variant="compact"
                  onClick={() => selectItem(name, "spell")}
                />
              ))}
            </div>
          </EquipmentSection>
        )}
      </div>

      <ActionBar onRandomize={handleRandomize} onShare={handleShare} />
      <Toast message={toast.message} />

      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem.name}
          category={selectedItem.category}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
