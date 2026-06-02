import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function WeaponIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M14.5 3L21 9.5 9.5 21 3 14.5z" />
      <path d="M14.5 3L18 6.5" />
      <path d="M3 14.5L6.5 18" />
    </svg>
  );
}

export function ArmorIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 3L4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 3L4 7v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V7l-8-4z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function SealIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx={12} cy={12} r={8} />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

export function StaffIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 2v16" />
      <circle cx={12} cy={4} r={2} />
      <path d="M8 20h8" />
      <path d="M9 18l3-2 3 2" />
    </svg>
  );
}

export function TalismanIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z" />
    </svg>
  );
}

export function AshIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M12 2v8l4 4-4 8-4-8 4-4z" />
      <path d="M8 10l-4 2" />
      <path d="M16 10l4 2" />
    </svg>
  );
}

export function SpellIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </svg>
  );
}

export type ItemCategory = "weapon" | "armor" | "shield" | "seal" | "staff" | "talisman" | "ash" | "spell";

const ICON_MAP: Record<ItemCategory, (props: IconProps) => React.ReactElement> = {
  weapon: WeaponIcon,
  armor: ArmorIcon,
  shield: ShieldIcon,
  seal: SealIcon,
  staff: StaffIcon,
  talisman: TalismanIcon,
  ash: AshIcon,
  spell: SpellIcon,
};

const CAT_CLASS_MAP: Record<ItemCategory, string> = {
  weapon: "cat-weapon",
  armor: "cat-armor",
  shield: "cat-shield",
  seal: "cat-seal",
  staff: "cat-seal",
  talisman: "cat-talisman",
  ash: "cat-ash",
  spell: "cat-spell",
};

export function getCategoryClass(category: ItemCategory): string {
  return CAT_CLASS_MAP[category];
}

export function CategoryIcon({ category, ...props }: IconProps & { category: ItemCategory }) {
  const Icon = ICON_MAP[category];
  return <Icon {...props} />;
}
