interface CreativitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function CreativitySlider({ value, onChange }: CreativitySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-display text-[11px] font-semibold uppercase tracking-[2px] text-gold-dim">
          Creativity
        </label>
        <span className="font-display text-[11px] text-text-secondary">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-surface
          [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold-light
          [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-bg-surface
          [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-light [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(200,169,81,0.4)]"
      />
      <div className="flex justify-between text-[10px] text-text-dim">
        <span>Focused</span>
        <span>Creative</span>
      </div>
    </div>
  );
}
