import { useEffect, useRef, Suspense, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ItemCategory } from "../icons/item-icons";
import { getCategoryClass, CategoryIcon } from "../icons/item-icons";
import { useImageMap } from "../../hooks/use-image-map";
import { useItemDetails } from "../../hooks/use-item-details";
import type {
  ArmamentDetail,
  ArmorDetail,
  TalismanDetail,
  SpellDetail,
  AshDetail,
} from "../../types/item-details";

interface ItemDetailModalProps {
  itemName: string;
  category: ItemCategory;
  onClose: () => void;
  onGuidedHand?: () => void;
}

function scalingGrade(value: number): string {
  if (value >= 1.5) return "S";
  if (value >= 1.0) return "A";
  if (value >= 0.75) return "B";
  if (value >= 0.5) return "C";
  if (value >= 0.25) return "D";
  return "E";
}

const STAT_ABBR: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  intelligence: "INT",
  faith: "FTH",
  arcane: "ARC",
};

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-gold/5 py-1 text-[12px]">
      <span className="text-text-secondary">{label}</span>
      <span className="tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

function StatsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <div className="mb-2 text-[10px] uppercase tracking-[2px] text-text-dim">{label}</div>
      {children}
    </div>
  );
}

function ArmamentStats({ detail }: { detail: ArmamentDetail }) {
  return (
    <>
      {detail.damage && Object.keys(detail.damage).length > 0 && (
        <StatsSection label="Attack Power">
          {Object.entries(detail.damage).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.scaling && Object.keys(detail.scaling).length > 0 && (
        <StatsSection label="Scaling">
          {Object.entries(detail.scaling).map(([stat, val]) => (
            <StatRow key={stat} label={stat} value={`${scalingGrade(val)} (${val.toFixed(2)})`} />
          ))}
        </StatsSection>
      )}

      {detail.guard && Object.keys(detail.guard).length > 0 && (
        <StatsSection label="Guard">
          {Object.entries(detail.guard).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.statusEffects && Object.keys(detail.statusEffects).length > 0 && (
        <StatsSection label="Status Effects">
          {Object.entries(detail.statusEffects).map(([effect, val]) => (
            <StatRow key={effect} label={effect} value={val} />
          ))}
        </StatsSection>
      )}

      {detail.attackAttributes && detail.attackAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {detail.attackAttributes.map((attr) => (
            <span
              key={attr}
              className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
            >
              {attr}
            </span>
          ))}
          {detail.upgradeMaterial && (
            <span className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
              {detail.upgradeMaterial}
            </span>
          )}
          {detail.isBuffable && (
            <span className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
              Buffable
            </span>
          )}
        </div>
      )}
    </>
  );
}

function ArmorStats({ detail }: { detail: ArmorDetail }) {
  return (
    <>
      {detail.absorptions && Object.keys(detail.absorptions).length > 0 && (
        <StatsSection label="Damage Negation">
          {Object.entries(detail.absorptions).map(([type, val]) => (
            <StatRow key={type} label={type} value={val.toFixed(1)} />
          ))}
        </StatsSection>
      )}

      {detail.resistances && Object.keys(detail.resistances).length > 0 && (
        <StatsSection label="Resistance">
          {Object.entries(detail.resistances).map(([type, val]) => (
            <StatRow key={type} label={type} value={val} />
          ))}
        </StatsSection>
      )}
    </>
  );
}

function TalismanStats({ detail }: { detail: TalismanDetail }) {
  return (
    <>
      {detail.effects && detail.effects.length > 0 && (
        <StatsSection label="Effects">
          {detail.effects.map((effect, i) => (
            <StatRow
              key={i}
              label={effect.attribute}
              value={
                effect.model === "multiplicative"
                  ? `${((effect.value - 1) * 100).toFixed(0)}%`
                  : `${effect.value > 0 ? "+" : ""}${effect.value}`
              }
            />
          ))}
        </StatsSection>
      )}

      {detail.conflicts && detail.conflicts.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Conflicts With
          </div>
          <div className="text-[11px] text-text-secondary">{detail.conflicts.join(", ")}</div>
        </div>
      )}
    </>
  );
}

function SpellStats({ detail }: { detail: SpellDetail }) {
  return (
    <StatsSection label="Spell Info">
      <StatRow label="FP Cost" value={detail.fpCost} />
      {detail.spCost != null && <StatRow label="Stamina Cost" value={detail.spCost} />}
      <StatRow label="Slots Used" value={detail.slotsUsed} />
      {detail.isHorsebackCastable && <StatRow label="Horseback" value="Yes" />}
      {detail.isWeaponBuff && <StatRow label="Weapon Buff" value="Yes" />}
    </StatsSection>
  );
}

function AshStats({ detail }: { detail: AshDetail }) {
  return (
    <>
      {detail.defaultAffinity && (
        <StatsSection label="Affinity">
          <StatRow label="Default" value={detail.defaultAffinity} />
        </StatsSection>
      )}

      {detail.possibleAffinities && detail.possibleAffinities.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Possible Affinities
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.possibleAffinities.map((aff) => (
              <span
                key={aff}
                className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
              >
                {aff}
              </span>
            ))}
          </div>
        </div>
      )}

      {detail.armamentCategories && detail.armamentCategories.length > 0 && (
        <div className="px-5 pb-3">
          <div className="mb-1 text-[10px] uppercase tracking-[2px] text-text-dim">
            Compatible Weapons
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detail.armamentCategories.map((cat) => (
              <span
                key={cat}
                className="rounded bg-bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function isArmamentCategory(cat: ItemCategory): boolean {
  return cat === "weapon" || cat === "shield" || cat === "seal" || cat === "staff";
}

function DetailContent({ itemName, category }: { itemName: string; category: ItemCategory }) {
  const detail = useItemDetails(itemName, category);

  if (!detail) {
    return (
      <div className="px-5 py-4 text-center text-[12px] text-text-dim">
        No detail data available
      </div>
    );
  }

  const description =
    "description" in detail && detail.description ? (detail.description as string[]) : undefined;

  const requirements =
    "requirements" in detail
      ? (detail.requirements as Record<string, number> | undefined)
      : undefined;

  const weight = "weight" in detail ? (detail.weight as number) : undefined;

  const rarity = "rarity" in detail ? (detail.rarity as string | undefined) : undefined;

  const summary = "summary" in detail ? (detail.summary as string | undefined) : undefined;

  return (
    <div className="animate-fade-in">
      {rarity && (
        <div className="px-5 pt-3">
          <span className="text-[10px] uppercase tracking-[2px] text-gold-dim">{rarity}</span>
        </div>
      )}

      {summary && <div className="px-5 pt-2 text-[12px] text-text-secondary">{summary}</div>}

      {description && description.length > 0 && (
        <div className="border-b border-gold/10 px-5 py-4">
          <p className="text-[12px] leading-relaxed text-text-secondary italic">
            {description.filter((l) => l.length > 0).join(" ")}
          </p>
        </div>
      )}

      {isArmamentCategory(category) && <ArmamentStats detail={detail as ArmamentDetail} />}
      {category === "armor" && <ArmorStats detail={detail as ArmorDetail} />}
      {category === "talisman" && <TalismanStats detail={detail as TalismanDetail} />}
      {category === "spell" && <SpellStats detail={detail as SpellDetail} />}
      {category === "ash" && <AshStats detail={detail as AshDetail} />}

      {requirements && Object.keys(requirements).length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-gold/10 px-5 py-3">
          {Object.entries(requirements).map(([stat, val]) => (
            <span
              key={stat}
              className="rounded-md border border-gold/15 bg-gold/5 px-2.5 py-1 text-[11px] font-semibold text-gold-dim"
            >
              {STAT_ABBR[stat] ?? stat} {val}
            </span>
          ))}
          {weight != null && (
            <span className="rounded-md border border-gold/15 bg-gold/5 px-2.5 py-1 text-[11px] font-semibold text-gold-dim">
              Wt. {weight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3 px-5 py-4">
      <div className="h-3 w-20 animate-shimmer rounded" />
      <div className="h-16 animate-shimmer rounded" />
      <div className="h-3 w-32 animate-shimmer rounded" />
      <div className="space-y-1.5">
        <div className="h-3 animate-shimmer rounded" />
        <div className="h-3 animate-shimmer rounded" />
        <div className="h-3 w-3/4 animate-shimmer rounded" />
      </div>
    </div>
  );
}

function ModalHeaderImage({ itemName, category }: { itemName: string; category: ItemCategory }) {
  const imageMap = useImageMap();
  const entry = imageMap[itemName];

  if (!entry) {
    return (
      <div
        className={`${getCategoryClass(category)} flex size-[72px] shrink-0 items-center justify-center rounded-lg`}
      >
        <CategoryIcon category={category} className="size-3/5 opacity-50" />
      </div>
    );
  }

  return (
    <div
      className={`${getCategoryClass(category)} relative size-[72px] shrink-0 overflow-hidden rounded-lg`}
    >
      <img src={entry.image_url} alt={itemName} className="size-full object-contain" />
    </div>
  );
}

function AnimatedHeight({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const observer = new ResizeObserver(() => {
      outer.style.height = `${inner.offsetHeight}px`;
    });

    outer.style.height = `${inner.offsetHeight}px`;
    observer.observe(inner);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} className="overflow-hidden transition-[height] duration-300 ease-out">
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  weapon: "Weapon",
  armor: "Armor",
  shield: "Shield",
  seal: "Seal",
  staff: "Staff",
  talisman: "Talisman",
  ash: "Ash of War",
  spell: "Spell",
};

export function ItemDetailModal({ itemName, category, onClose, onGuidedHand }: ItemDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`${itemName} details`}
          className="animate-modal-in pointer-events-auto relative max-h-[85vh] w-[min(420px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-gold/15 bg-bg-dark shadow-[0_8px_32px_rgba(0,0,0,0.6)] outline-none"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-gold/15 bg-bg-card text-[14px] text-text-dim transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            &times;
          </button>

          <div className="flex items-center gap-4 border-b border-gold/10 p-5">
            <ModalHeaderImage itemName={itemName} category={category} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[16px] font-bold leading-tight text-text-primary">
                {itemName}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[2px] text-text-dim">
                {CATEGORY_LABELS[category]}
              </div>
            </div>
          </div>

          <AnimatedHeight>
            <Suspense fallback={<DetailSkeleton />}>
              <DetailContent itemName={itemName} category={category} />
            </Suspense>
            {onGuidedHand && (
              <div className="border-t border-gold/10 px-5 py-4">
                <button
                  type="button"
                  onClick={onGuidedHand}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gold-dim/40 bg-gold/5 px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-wider text-gold-dim transition-colors hover:border-gold-dim hover:bg-gold/10 hover:text-gold-light"
                >
                  Guided Hand Builds
                </button>
              </div>
            )}
          </AnimatedHeight>
        </div>
      </div>
    </div>,
    document.body,
  );
}
