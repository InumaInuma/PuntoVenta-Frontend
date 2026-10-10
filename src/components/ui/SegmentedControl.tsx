interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: number | string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex bg-slate-200/70 p-1 rounded-full shadow-inner ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                : 'text-slate-600 hover:text-slate-900 active:text-slate-800'
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
