import type { ReactNode } from "react";

interface EquipmentSectionProps {
  title: string;
  children: ReactNode;
}

export function EquipmentSection({ title, children }: EquipmentSectionProps) {
  return (
    <div className="mb-5">
      <div className="mb-2.5 flex items-center gap-2 border-b border-gold/10 pb-1.5 font-display text-[11px] font-semibold uppercase tracking-[3px] text-gold-dim">
        <span className="block size-1 shrink-0 rotate-45 bg-gold-dim" />
        {title}
      </div>
      {children}
    </div>
  );
}
