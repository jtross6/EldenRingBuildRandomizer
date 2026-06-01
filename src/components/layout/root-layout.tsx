import { Outlet, Link, useMatchRoute } from "@tanstack/react-router";

export function RootLayout() {
  const matchRoute = useMatchRoute();
  const isLanding = matchRoute({ to: "/" });
  const isGenerate = matchRoute({ to: "/generate", fuzzy: true });
  const isFate = matchRoute({ to: "/fate" });

  return (
    <main className="relative z-[1] mx-auto max-w-5xl px-4 pb-28 pt-6">
      {!isLanding && (
        <nav className="mb-4 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light"
          >
            Home
          </Link>
          <span className="text-text-dim">/</span>
          <Link
            to="/random"
            className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-text-dim transition-colors hover:text-gold-light [&.active]:text-gold-light"
          >
            Chaos Forge
          </Link>
          <span className="text-text-dim">/</span>
          <Link
            to="/generate"
            className={`font-display text-[11px] font-semibold uppercase tracking-[2px] transition-colors hover:text-gold-light ${
              isGenerate ? "text-gold-light" : "text-text-dim"
            }`}
          >
            Guided Hand
          </Link>
          <span className="text-text-dim">/</span>
          <Link
            to="/fate"
            className={`font-display text-[11px] font-semibold uppercase tracking-[2px] transition-colors hover:text-gold-light ${
              isFate ? "text-gold-light" : "text-text-dim"
            }`}
          >
            Path of Fate
          </Link>
        </nav>
      )}
      <Outlet />
    </main>
  );
}
