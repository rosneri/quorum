"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";

function gDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const iconBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "var(--radius-pill)",
  background: "var(--color-paper-2)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--color-ink)",
};

function CalendarPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M12 13.5v5M9.5 16h5" />
    </svg>
  );
}

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77Z" />
    </svg>
  );
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
  const { t } = useI18n();
  // origin is only known on the client — set it after mount so server and
  // client markup match (no hydration mismatch).
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const start = new Date(startsAtIso);
  const end = new Date(start.getTime() + 90 * 60_000);
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${gDate(start)}/${gDate(end)}&details=${encodeURIComponent(
    `Planned on Quorum: ${origin}/e/${token}`
  )}`;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <a
        href={`/e/${token}/ics`}
        download
        className="cal-icon"
        style={iconBtn}
        aria-label={t("addToCalendar").replace("📅 ", "")}
        title={t("addToCalendar").replace("📅 ", "")}
      >
        <CalendarPlusIcon />
      </a>
      <a
        href={google}
        target="_blank"
        rel="noreferrer"
        className="cal-icon"
        style={iconBtn}
        aria-label={t("googleCalendar")}
        title={t("googleCalendar")}
      >
        <GoogleGIcon />
      </a>
    </div>
  );
}
