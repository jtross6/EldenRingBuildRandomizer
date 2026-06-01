import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { randomRoute } from "../router";
import { decodeBuild, encodeBuild } from "../lib/build-codec";
import { generateRandomBuild } from "../lib/randomizer";
import {
  weapons,
  shields,
  catalysts,
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
import { ActionBar } from "../components/action-bar";
import { Toast } from "../components/toast";
import { useToast } from "../hooks/use-toast";

export function BuildViewerPage() {
  const { build: encodedBuild } = randomRoute.useSearch();
  const navigate = useNavigate();
  const toast = useToast();
  const initialRedirectDone = useRef(false);

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

  const weaponSlotsR = build.weaponsRight.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Right Hand ${i + 1}`,
  }));
  const weaponSlotsL = build.weaponsLeft.map((idx, i) => ({
    name: weapons[idx]?.name ?? "Unknown",
    label: `Left Hand ${i + 1}`,
  }));

  const armorPieces = [
    { name: armorHead[build.helm]?.name ?? "Unknown", label: "Helm" },
    { name: armorBody[build.chest]?.name ?? "Unknown", label: "Chest Armor" },
    { name: armorArms[build.gauntlets]?.name ?? "Unknown", label: "Gauntlets" },
    { name: armorLegs[build.legs]?.name ?? "Unknown", label: "Leg Armor" },
  ];

  const shieldName = shields[build.shield]?.name ?? "Unknown";
  const catalystName = catalysts[build.catalyst]?.name ?? "Unknown";

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
                key={w.label}
                itemName={w.name}
                slotLabel={w.label}
                category="weapon"
                variant="standard"
              />
            ))}
            {weaponSlotsL.map((w) => (
              <ItemSlot
                key={w.label}
                itemName={w.name}
                slotLabel={w.label}
                category="weapon"
                variant="standard"
              />
            ))}
          </div>
        </EquipmentSection>

        <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
          <EquipmentSection title="Armor">
            <div className="grid grid-cols-2 gap-2">
              {armorPieces.map((a) => (
                <ItemSlot
                  key={a.label}
                  itemName={a.name}
                  slotLabel={a.label}
                  category="armor"
                  variant="standard"
                />
              ))}
            </div>
          </EquipmentSection>

          <EquipmentSection title="Shield & Catalyst">
            <div className="grid gap-2">
              <ItemSlot
                itemName={shieldName}
                slotLabel="Shield"
                category="shield"
                variant="standard"
              />
              <ItemSlot
                itemName={catalystName}
                slotLabel="Seal / Staff"
                category="seal"
                variant="standard"
              />
            </div>
          </EquipmentSection>
        </div>

        <EquipmentSection title="Talismans">
          <div className="grid grid-cols-4 gap-2">
            {talismanNames.map((name, i) => (
              <ItemSlot
                key={`talisman-${i}`}
                itemName={name}
                category="talisman"
                variant="talisman"
              />
            ))}
          </div>
        </EquipmentSection>

        <EquipmentSection title="Ashes of War">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {ashNames.map((name, i) => (
              <ItemSlot key={`ash-${i}`} itemName={name} category="ash" variant="compact" />
            ))}
          </div>
        </EquipmentSection>

        <EquipmentSection title="Sorceries & Incantations">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {sorceryNames.map((name, i) => (
              <ItemSlot key={`sorc-${i}`} itemName={name} category="spell" variant="compact" />
            ))}
            {incantNames.map((name, i) => (
              <ItemSlot key={`incant-${i}`} itemName={name} category="spell" variant="compact" />
            ))}
          </div>
        </EquipmentSection>
      </div>

      <ActionBar onRandomize={handleRandomize} onShare={handleShare} />
      <Toast message={toast.message} />
    </>
  );
}
