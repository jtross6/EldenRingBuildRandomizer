import { useState, Suspense } from "react";
import { CategoryIcon, getCategoryClass, type ItemCategory } from "../icons/item-icons";
import { useImageMap } from "../../hooks/use-image-map";

interface ItemSlotProps {
  itemName: string;
  slotLabel?: string;
  category: ItemCategory;
  variant: "standard" | "compact" | "talisman";
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

export function ItemSlot({ itemName, slotLabel, category, variant }: ItemSlotProps) {
  if (variant === "talisman") {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border-dark bg-bg-card p-3 pb-2.5 text-center transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover">
        <Suspense fallback={<FallbackIcon category={category} size={40} />}>
          <ItemImage itemName={itemName} category={category} size={40} />
        </Suspense>
        <span className="break-words font-display text-[10px] font-semibold leading-tight text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border-dark bg-bg-card px-2.5 py-2 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover">
        <Suspense fallback={<FallbackIcon category={category} size={32} />}>
          <ItemImage itemName={itemName} category={category} size={32} />
        </Suspense>
        <span className="min-w-0 flex-1 truncate font-display text-[11px] font-semibold text-text-primary">
          {itemName}
        </span>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-border-dark bg-bg-card px-3 py-2.5 transition-colors hover:border-gold-dim/30 hover:bg-bg-card-hover">
      <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-gold-dim opacity-0 transition-opacity group-hover:opacity-100" />
      <Suspense fallback={<FallbackIcon category={category} size={44} />}>
        <ItemImage itemName={itemName} category={category} size={44} />
      </Suspense>
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
