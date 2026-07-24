export function formatWhen(startsAt: Date, flexMinutes?: number | null): string {
  const now = new Date();
  const time = startsAt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  let day: string;
  const startDay = new Date(startsAt);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) day = "Today";
  else if (diffDays === 1) day = "Tomorrow";
  else if (diffDays === -1) day = "Yesterday";
  else
    day = startsAt.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: startsAt.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });

  const flex = flexMinutes ? ` ±${flexMinutes}m` : "";
  return `${day} · ${time}${flex}`;
}
