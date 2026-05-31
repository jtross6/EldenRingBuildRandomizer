interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      className={`fixed bottom-[90px] left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-gold-dim bg-bg-card px-6 py-2.5 font-display text-xs tracking-wider text-gold-light transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      {message ?? ""}
    </div>
  );
}
