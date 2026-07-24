export type DayLabels = { today: string; tomorrow: string; yesterday: string };

/** The day part of a timestamp: today/tomorrow/yesterday, else a short date. */
export function formatDayLabel(date: Date, locale: string, labels: DayLabels): string {
  const now = new Date();
  const startDay = new Date(date);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.tomorrow;
  if (diffDays === -1) return labels.yesterday;
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatWhen(
  startsAt: Date,
  flexMinutes: number | null | undefined,
  locale: string,
  labels: DayLabels
): string {
  const time = startsAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const day = formatDayLabel(startsAt, locale, labels);
  const flex = flexMinutes ? ` ±${flexMinutes}m` : "";
  return `${day} · ${time}${flex}`;
}

/** A span of candidate days, e.g. "Mar 3 – Mar 7" (collapses to one when same day). */
export function formatRange(from: Date, to: Date, locale: string, labels: DayLabels): string {
  const a = formatDayLabel(from, locale, labels);
  const b = formatDayLabel(to, locale, labels);
  return a === b ? a : `${a} – ${b}`;
}
