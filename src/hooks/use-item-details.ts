import { use } from "react";
import type { ItemCategory } from "../components/icons/item-icons";
import type {
  ArmamentDetail,
  ArmorDetail,
  TalismanDetail,
  SpellDetail,
  AshDetail,
  ItemDetails,
} from "../types/item-details";

type DetailMap = Record<string, ItemDetails>;

const cache: Partial<Record<string, Promise<DetailMap>>> = {};

function getDetailPromise(category: ItemCategory): Promise<DetailMap> {
  const key = category;
  if (!cache[key]) {
    switch (category) {
      case "weapon":
        cache[key] = import("../data/weapon-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "shield":
        cache[key] = import("../data/shield-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "seal":
        cache[key] = import("../data/catalyst-details.json").then(
          (m) => m.default as unknown as Record<string, ArmamentDetail>,
        );
        break;
      case "armor":
        cache[key] = import("../data/armor-details.json").then(
          (m) => m.default as unknown as Record<string, ArmorDetail>,
        );
        break;
      case "talisman":
        cache[key] = import("../data/talisman-details.json").then(
          (m) => m.default as unknown as Record<string, TalismanDetail>,
        );
        break;
      case "spell":
        cache[key] = import("../data/spell-details.json").then(
          (m) => m.default as unknown as Record<string, SpellDetail>,
        );
        break;
      case "ash":
        cache[key] = import("../data/ash-details.json").then(
          (m) => m.default as unknown as Record<string, AshDetail>,
        );
        break;
    }
  }
  return cache[key]!;
}

export function prefetchItemDetails(): void {
  getDetailPromise("weapon");
  getDetailPromise("shield");
  getDetailPromise("seal");
  getDetailPromise("armor");
  getDetailPromise("talisman");
  getDetailPromise("spell");
  getDetailPromise("ash");
}

export function useItemDetails(itemName: string, category: ItemCategory): ItemDetails | undefined {
  const map = use(getDetailPromise(category));
  return map[itemName];
}
