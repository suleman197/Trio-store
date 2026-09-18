import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, onChange, max = 99, min = 1, size = 'md' }) {
  const btn =
    size === 'sm'
      ? 'w-7 h-7'
      : 'w-9 h-9';
  const disabledMinus = value <= min;
  const disabledPlus = value >= max;

  return (
    <div className={`inline-flex items-center border border-ink-700 bg-[#111] rounded-lg overflow-hidden ${size === 'sm' ? 'gap-0' : ''}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabledMinus}
        aria-label="Decrease quantity"
        className={`${btn} flex items-center justify-center hover:bg-ink-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white`}
      >
        <Minus size={14} />
      </button>
      <span className={`${size === 'sm' ? 'w-8 text-xs' : 'w-10 text-sm'} text-center font-semibold select-none text-white`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabledPlus}
        aria-label="Increase quantity"
        className={`${btn} flex items-center justify-center hover:bg-ink-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
