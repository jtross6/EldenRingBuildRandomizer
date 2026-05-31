interface BuildIdentityProps {
  buildName?: string;
  buildImage?: string;
}

export function BuildIdentity({ buildName, buildImage }: BuildIdentityProps) {
  if (!buildName && !buildImage) return null;

  return (
    <div className="mb-7 text-center">
      {buildImage && (
        <img
          src={buildImage}
          alt={buildName ?? "Build"}
          className="mx-auto mb-3 size-24 rounded-full border-2 border-gold-dim bg-bg-card object-cover shadow-[0_0_30px_rgba(200,169,81,0.25)]"
        />
      )}
      {buildName && (
        <h1 className="font-display text-[22px] font-bold tracking-wide text-gold-light">
          {buildName}
        </h1>
      )}
    </div>
  );
}
