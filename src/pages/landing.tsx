import { Link } from "@tanstack/react-router";

export function LandingPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-10 text-center">
        <h1 className="font-display text-[28px] font-bold tracking-wide text-gold-light md:text-[34px]">
          Elden Ring Build Randomizer
        </h1>
        <p className="mt-2 text-[13px] text-text-secondary">Choose your path, Tarnished</p>
      </div>

      <div className="mx-auto grid max-w-xl gap-4">
        <Link
          to="/random"
          className="group relative overflow-hidden rounded-xl border border-border-dark bg-bg-card p-6 transition-all hover:border-gold-dim/50 hover:bg-bg-card-hover hover:shadow-[0_0_30px_rgba(200,169,81,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 text-3xl">
              &#9858;
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[17px] font-bold tracking-wide text-gold-light">
                Chaos Forge
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
                Leave your fate to the Erdtree. Fully randomized builds with every weapon, spell,
                and talisman in the game.
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/generate"
          className="group relative overflow-hidden rounded-xl border border-border-dark bg-bg-card p-6 transition-all hover:border-gold-dim/50 hover:bg-bg-card-hover hover:shadow-[0_0_30px_rgba(200,169,81,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="relative flex items-center gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 text-3xl">
              &#10024;
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[17px] font-bold tracking-wide text-gold-light">
                Guided Hand
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
                Choose your weapons and the build shapes itself around them. Synergy-aware
                generation powered by community wisdom.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
