import { useMemo, useState, type FC } from "react";

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const buildTimeOptions = (): string[] => {
  const result: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (const min of [0, 30] as const) {
      const h = String(hour).padStart(2, "0");
      const m = String(min).padStart(2, "0");
      result.push(`${h}:${m}`);
    }
  }
  return result;
};

const TimePickerField: FC<TimePickerFieldProps> = ({ value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => buildTimeOptions(), []);

  const label = value || placeholder || "Selecciona hora";

  return (
    <div className="w-full relative">
      <button
        type="button"
        className="w-full h-11 px-4 rounded-md border border-borderSoft bg-surfaceMuted text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/60"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-dark" : "text-muted"}>{label}</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl border border-borderSoft bg-surface text-sm shadow-soft">
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 ${selected
                  ? "bg-primary text-dark font-medium"
                  : "hover:bg-surfaceMuted text-dark"
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimePickerField;
