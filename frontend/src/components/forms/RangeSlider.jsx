export function RangeSlider({ label, name, min = 0, max = 10, step = 1, value, onChange, showValue = true, unit = '' }) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={name} className="label mb-0">{label}</label>
          {showValue && <span className="text-sm font-medium text-primary">{value ?? min}{unit}</span>}
        </div>
      )}
      <input
        id={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow-primary [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-text-tertiary">{min}{unit}</span>
        <span className="text-xs text-text-tertiary">{max}{unit}</span>
      </div>
    </div>
  );
}
