"use client";

function gDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function AddToCalendar({
  token,
  title,
  startsAtIso,
}: {
  token: string;
  title: string;
  startsAtIso: string;
}) {
  const start = new Date(startsAtIso);
  const end = new Date(start.getTime() + 90 * 60_000);
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${gDate(start)}/${gDate(end)}&details=${encodeURIComponent(
    `Planned on Quorum: ${typeof window !== "undefined" ? window.location.origin : ""}/e/${token}`
  )}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/e/${token}/ics`} className="chip" download>
        📅 Add to calendar
      </a>
      <a href={google} target="_blank" rel="noreferrer" className="chip">
        Google Calendar
      </a>
    </div>
  );
}
