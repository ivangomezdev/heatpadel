import { clubToday } from "../../lib/booking";

export default function BookingDatePicker({ value, now, onChange }) {
  const today = clubToday(new Date(now));
  const tomorrow = clubToday(new Date(now + 86400000));
  return (
    <div className="court-picker__step">
      <h3>
        <span>01</span> Elige tu fecha
      </h3>
      <div className="court-picker__quick-dates">
        <button
          type="button"
          aria-pressed={value === today}
          onClick={() => onChange(today)}
        >
          Hoy
        </button>
        <button
          type="button"
          aria-pressed={value === tomorrow}
          onClick={() => onChange(tomorrow)}
        >
          Mañana
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(
              clubToday(
                new Date(`${value}T12:00:00-05:00`).getTime() + 86400000,
              ),
            )
          }
        >
          Día siguiente →
        </button>
      </div>
      <label className="court-picker__date">
        Fecha del partido
        <input
          aria-label="Fecha del partido"
          type="date"
          min={today}
          value={value}
          onInput={(e) => {
            if (e.currentTarget.value) onChange(e.currentTarget.value);
          }}
          onChange={(e) => {
            if (e.target.value && e.target.value !== value)
              onChange(e.target.value);
          }}
        />
      </label>
    </div>
  );
}
