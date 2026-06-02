import type { ItemCategory } from "../components/icons/item-icons";
import type { ItemType, SeedItem } from "../types/generator";
import {
  weapons,
  shields,
  staves,
  seals,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../data";

const STORAGE_KEY = "erbr-generator-state";

const CATEGORY_TO_TYPE: Partial<Record<ItemCategory, ItemType>> = {
  weapon: "weapon",
  shield: "shield",
  staff: "staff",
  seal: "seal",
  talisman: "talisman",
  ash: "ashOfWar",
  spell: "spell",
};

interface NamedItem {
  name: string;
}

const CATEGORY_DATA: Partial<Record<ItemCategory, NamedItem[]>> = {
  weapon: weapons,
  shield: shields,
  staff: staves,
  seal: seals,
  talisman: talismans,
  ash: ashesOfWar,
};

function findSpellIndex(itemName: string): number {
  const sorcIdx = sorceries.findIndex((s) => s.name === itemName);
  if (sorcIdx !== -1) return sorcIdx;
  const incIdx = incantations.findIndex((s) => s.name === itemName);
  if (incIdx !== -1) return incIdx + sorceries.length;
  return -1;
}

export function seedGuidedHand(itemName: string, category: ItemCategory): boolean {
  const itemType = CATEGORY_TO_TYPE[category];
  if (!itemType) return false;

  let index: number;
  if (category === "spell") {
    index = findSpellIndex(itemName);
  } else {
    const arr = CATEGORY_DATA[category];
    if (!arr) return false;
    index = arr.findIndex((item) => item.name === itemName);
  }

  if (index === -1) return false;

  const seedItem: SeedItem = { name: itemName, type: itemType, index };
  const state = {
    seedItems: [seedItem],
    creativity: 50,
    seed: (Math.random() * 0xffffffff) >>> 0,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return false;
  }

  return true;
}
