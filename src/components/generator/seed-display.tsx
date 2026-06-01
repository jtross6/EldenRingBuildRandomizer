import { useState } from "react";

interface SeedDisplayProps {
  seed: number;
  onSeedChange: (seed: number) => void;
}

export function SeedDisplay({ seed, onSeedChange }: SeedDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(seed));

  function handleSubmit() {
    const num = parseInt(editValue, 10);
    if (!isNaN(num)) {
      onSeedChange(num);
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-text-dim">Seed:</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
          className="w-24 rounded border border-gold-dim bg-bg-card px-2 py-0.5 text-[11px] text-text-primary focus:outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setEditValue(String(seed));
        setIsEditing(true);
      }}
      className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-dim hover:text-text-secondary"
      title="Click to edit seed"
    >
      <span>Seed: {seed}</span>
    </button>
  );
}
