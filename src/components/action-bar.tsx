import { useRef } from "react";

interface ActionBarProps {
  onRandomize: () => void;
  onShare: () => void;
  shareLabel?: string;
}

export function ActionBar({
  onRandomize,
  onShare,
  shareLabel = "\u{1F517} Share",
}: ActionBarProps) {
  const diceRef = useRef<HTMLSpanElement>(null);

  function handleRandomize() {
    if (diceRef.current) {
      diceRef.current.classList.remove("animate-dice-spin");
      void diceRef.current.offsetWidth;
      diceRef.current.classList.add("animate-dice-spin");
    }
    onRandomize();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-dark bg-bg-deepest/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[600px] gap-2.5">
        <button
          type="button"
          onClick={handleRandomize}
          className="flex flex-2 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-gold to-[#b8943d] px-5 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-bg-dark shadow-[0_2px_16px_rgba(200,169,81,0.25)] transition-all hover:-translate-y-px hover:from-gold-light hover:to-gold hover:shadow-[0_4px_24px_rgba(200,169,81,0.25)] active:scale-[0.98] active:translate-y-0"
        >
          <span ref={diceRef} className="inline-block">
            &#9858;
          </span>
          Randomize
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-dark bg-bg-card px-4 py-3.5 font-display text-[13px] font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-gold-dim hover:bg-bg-card-hover hover:text-text-primary"
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
