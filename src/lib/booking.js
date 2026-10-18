export const CLUB_TIMEZONE = "America/Cancun";
export const CHANGE_NOTICE_MS = 24 * 60 * 60 * 1000;
export const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
export const COURTS = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `padel-${i + 1}`,
    sport: "padel",
    name: `Pádel ${String(i + 1).padStart(2, "0")}`,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `pickleball-${i + 1}`,
    sport: "pickleball",
    name: `Pickleball ${String(i + 1).padStart(2, "0")}`,
  })),
];
export function clubToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function startsAt(date, hour) {
  return Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00-05:00`);
}
export function validDate(date) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
  );
}
export function canChange(reservation, now = Date.now()) {
  return (
    reservation.status === "confirmed" &&
    reservation.startsAt - now >= CHANGE_NOTICE_MS
  );
}
export function formatDate(date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    weekday: "short",
    timeZone: CLUB_TIMEZONE,
  }).format(new Date(`${date}T12:00:00-05:00`));
}
export function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}
