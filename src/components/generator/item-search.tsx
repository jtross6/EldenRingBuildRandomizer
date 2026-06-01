import { useState, useRef, useEffect } from "react";
import type { ItemType, SeedItem } from "../../types/generator";
import {
  weapons,
  shields,
  catalysts,
  talismans,
  ashesOfWar,
  sorceries,
  incantations,
} from "../../data";

interface SearchableItem {
  name: string;
  type: ItemType;
  index: number;
  category?: string;
}

const ALL_ITEMS: SearchableItem[] = [
  ...weapons.map((w, i) => ({
    name: w.name,
    type: "weapon" as const,
    index: i,
    category: w.category,
  })),
  ...shields.map((s, i) => ({
    name: s.name,
    type: "shield" as const,
    index: i,
    category: s.category,
  })),
  ...catalysts.map((c, i) => ({
    name: c.name,
    type: "catalyst" as const,
    index: i,
    category: c.category,
  })),
  ...talismans.map((t, i) => ({ name: t.name, type: "talisman" as const, index: i })),
  ...ashesOfWar.map((a, i) => ({ name: a.name, type: "ashOfWar" as const, index: i })),
  ...sorceries.map((s, i) => ({ name: s.name, type: "spell" as const, index: i })),
  ...incantations.map((inc, i) => ({
    name: inc.name,
    type: "spell" as const,
    index: i + sorceries.length,
  })),
];

const TYPE_LABELS: Record<ItemType, string> = {
  weapon: "Weapon",
  shield: "Shield",
  catalyst: "Catalyst",
  spell: "Spell",
  ashOfWar: "Ash of War",
  talisman: "Talisman",
};

const TYPE_CATEGORY_CLASS: Record<ItemType, string> = {
  weapon: "cat-weapon",
  shield: "cat-shield",
  catalyst: "cat-seal",
  spell: "cat-spell",
  ashOfWar: "cat-ash",
  talisman: "cat-talisman",
};

interface ItemSearchProps {
  selectedItems: SeedItem[];
  onAdd: (item: SeedItem) => void;
  onRemove: (index: number) => void;
}

export function ItemSearch({ selectedItems, onAdd, onRemove }: ItemSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedNames = new Set(selectedItems.map((s) => s.name));

  const results =
    query.length >= 2
      ? ALL_ITEMS.filter(
          (item) =>
            !selectedNames.has(item.name) && item.name.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, 20)
      : [];

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  function handleSelect(item: SearchableItem) {
    onAdd({ name: item.name, type: item.type, index: item.index });
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-gold-dim">
        Seed Items
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search weapons, spells, ashes..."
          className="w-full rounded-lg border border-border-dark bg-bg-card px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-gold-dim focus:outline-none"
        />

        {isOpen && results.length > 0 && (
          <div
            ref={listRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border-dark bg-bg-card shadow-lg"
          >
            {results.map((item, i) => (
              <button
                key={`${item.type}-${item.index}`}
                type="button"
                onMouseDown={() => handleSelect(item)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === highlightIndex ? "bg-bg-card-hover" : "hover:bg-bg-card-hover"
                }`}
              >
                <span
                  className={`${TYPE_CATEGORY_CLASS[item.type]} inline-block size-2 rounded-full`}
                />
                <span className="flex-1 truncate text-sm text-text-primary">{item.name}</span>
                <span className="text-[10px] uppercase text-text-dim">
                  {TYPE_LABELS[item.type]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item, i) => (
            <span
              key={`${item.name}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-dark bg-bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-text-primary"
            >
              <span
                className={`${TYPE_CATEGORY_CLASS[item.type]} inline-block size-2 rounded-full`}
              />
              {item.name}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-1 text-text-dim hover:text-gold-light"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
