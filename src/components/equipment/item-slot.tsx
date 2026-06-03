import { useState, Suspense } from "react";
import { CategoryIcon, getCategoryClass, type ItemCategory } from "../icons/item-icons";
import { useImageMap } from "../../hooks/use-image-map";

interface ItemSlotProps {
  itemName: string;
  slotLabel?: string;
  slotId?: string;
  category: ItemCategory;
  variant: "standard" | "compact" | "talisman";
  isEmpty?: boolean;
  onClick?: () => void;
}

function ItemImage({
  itemName,
  category,
  size,
}: {
  itemName: string;
  category: ItemCategory;
  size: number;
}) {
  const imageMap = useImageMap();
  const entry = imageMap[itemName];
  const [failed, setFailed] = useState(false);

  if (!entry || failed) {
    return (
      <div
        className={`${getCategoryClass(category)} flex shrink-0 items-center justify-center rounded-sm`}
        style={{ width: size, height: size }}
      >
        <CategoryIcon category={category} className="size-3/5 opacity-50" />
      </div>
    );
  }

  return (
    <div
      className={`${getCategoryClass(category)} relative shrink-0 overflow-hidden rounded-sm`}
      style={{ width: size, height: size }}
    >
      <img
        src={entry.image_url}
        alt={itemName}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </div>
  );
}

function FallbackIcon({ category, size }: { category: ItemCategory; size: number }) {
  return (
    <div
      className={`${getCategoryClass(category)} flex shrink-0 items-center justify-center rounded-sm`}
      style={{ width: size, height: size }}
    >
      <CategoryIcon category={category} className="size-3/5 opacity-50" />
    </div>
  );
}

function SlotImage({
  itemName,
  category,
  size,
}: {
  itemName: string;
  category: ItemCategory;
  size: number;
}) {
  return (
    <Suspense fallback={<FallbackIcon category={category} size={size} />}>
      <ItemImage itemName={itemName} category={category} size={size} />
    </Suspense>
  );
}

export function ItemSlot({
  itemName,
  slotLabel,
  category,
  variant,
  isEmpty,
  onClick,
}: ItemSlotProps) {
  const interactive = !!onClick;
  const interactiveClasses = interactive ? "cursor-pointer active:scale-[0.98]" : "";
  const emptyClasses = isEmpty ? "opacity-30" : "";

  function handleKeyDown(e: React.KeyboardEvent) {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  }

  const a11yProps = interactive
    ? ({
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
      } as const)
    : {};

  if (variant === "talisman") {
    return (
      <div
        className={`flex flex-col items-center gap-1.5 rounded-lg border border-border-dark bg-bg-card p-3 pb-2.5 text-center transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses} ${emptyClasses}`}
        {...a11yProps}
      >
        <SlotImage itemName={itemName} category={category} size={40} />
        <span className="break-words font-display text-[10px] font-semibold leading-tight text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-border-dark bg-bg-card px-2.5 py-2 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses} ${emptyClasses}`}
        {...a11yProps}
      >
        <SlotImage itemName={itemName} category={category} size={32} />
        <span className="min-w-0 flex-1 truncate font-display text-[11px] font-semibold text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-3 overflow-hidden rounded-lg border border-border-dark bg-bg-card px-3 py-2.5 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover ${interactiveClasses} ${emptyClasses}`}
      {...a11yProps}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-gold-dim opacity-0 transition-opacity group-hover:opacity-100" />
      <SlotImage itemName={itemName} category={category} size={44} />
      <div className="min-w-0 flex-1">
        {slotLabel && (
          <div className="text-[10px] uppercase tracking-wider text-text-dim">{slotLabel}</div>
        )}
        <div className="truncate font-display text-[13px] font-semibold text-text-primary">
          {itemName}
        </div>
      </div>
    </div>
  );
}
