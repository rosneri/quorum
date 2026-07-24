export type DayLabels = { today: string; tomorrow: string; yesterday: string };

export function formatWhen(
  startsAt: Date,
  flexMinutes: number | null | undefined,
  locale: string,
  labels: DayLabels
): string {
  const now = new Date();
  const time = startsAt.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });

  let day: string;
  const startDay = new Date(startsAt);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) day = labels.today;
  else if (diffDays === 1) day = labels.tomorrow;
  else if (diffDays === -1) day = labels.yesterday;
  else
    day = startsAt.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: startsAt.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });

  const flex = flexMinutes ? ` ±${flexMinutes}m` : "";
  return `${day} · ${time}${flex}`;
}
