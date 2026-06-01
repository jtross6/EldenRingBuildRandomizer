import { Outlet, Link } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <main className="relative z-[1] mx-auto max-w-5xl px-4 pb-28 pt-6">
      <nav className="mb-4 flex items-center justify-center gap-4">
        <Link
          to="/"
          className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light [&.active]:text-gold-light"
        >
          Viewer
        </Link>
        <span className="text-text-dim">/</span>
        <Link
          to="/generate"
          className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light [&.active]:text-gold-light"
        >
          Generator
        </Link>
      </nav>
      <Outlet />
    </main>
  );
}
