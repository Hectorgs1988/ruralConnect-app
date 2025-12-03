import { useState, type FC } from "react";

interface DatePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const toYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseYMD = (value: string | null): Date => {
  if (!value) return new Date();
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};

const formatHuman = (value: string | null): string => {
  if (!value) return "";
  const d = parseYMD(value);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DatePickerField: FC<DatePickerFieldProps> = ({ value, onChange, placeholder }) => {
  const initialDate = parseYMD(value || null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  const label = value ? formatHuman(value) : placeholder ?? "Selecciona fecha";

  const calendarYear = month.getFullYear();
  const calendarMonthIndex = month.getMonth();
  const calendarLabel = month.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7; // lunes = 0

  const calendarCells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(new Date(calendarYear, calendarMonthIndex, day));
  }

  const handleSelect = (date: Date) => {
    const next = toYMD(date);
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        className="w-full h-11 px-4 rounded-full border border-borderSoft bg-surfaceMuted text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary/60"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? "text-dark" : "text-muted"}>{label}</span>
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-2xl border border-borderSoft bg-surfaceMuted/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="px-2 py-1 rounded-full hover:bg-surface"
              onClick={() =>
                setMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))
              }
            >
              «
            </button>
            <span className="font-medium capitalize">{calendarLabel}</span>
            <button
              type="button"
              className="px-2 py-1 rounded-full hover:bg-surface"
              onClick={() =>
                setMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))
              }
            >
              »
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted mb-1">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const ymd = toYMD(date);
              const isSelected = value === ymd;

              let className =
                "flex items-center justify-center rounded-full w-8 h-8 text-[11px] border-2 transition-colors ";
              if (isSelected) {
                className += "border-transparent bg-primary text-dark";
              } else {
                className += "border-transparent bg-surface hover:bg-primarySoft";
              }

              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => handleSelect(date)}
                  className={className}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePickerField;

