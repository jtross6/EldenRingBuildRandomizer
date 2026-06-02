interface FateActionBarProps {
  onRoll: () => void;
  onOpenConstraints: () => void;
  pinCount: number;
}

export function FateActionBar({ onRoll, onOpenConstraints, pinCount }: FateActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto flex max-w-[600px] gap-2.5">
        <button
          type="button"
          onClick={onOpenConstraints}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-dark bg-bg-card px-4 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-gold-dim hover:bg-bg-card-hover hover:text-text-primary"
        >
          &#9881; Constraints
          {pinCount > 0 && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold-light">
              {pinCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onRoll}
          className="flex flex-2 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0"
        >
          &#127922; Roll Again
        </button>
      </div>
    </div>
  );
}
