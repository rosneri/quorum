"use client";

import { useMemo } from "react";
import { useI18n } from "./I18nProvider";

/** Local-format value: "YYYY-MM-DDTHH:mm" — same contract as datetime-local. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localeTag(locale: string) {
  return locale === "he" ? "he-IL" : "en-US";
}

/**
 * Fully-localized replacement for <input type="datetime-local">, whose native
 * UI follows the browser language rather than the app's. Day chips (today,
 * tomorrow, next five days) + a time dropdown in 15-minute steps.
 */
export function DateTimeField({
  value,
  onChange,
  disallowPast = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disallowPast?: boolean;
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);

  const current = value ? new Date(value) : new Date();
  const currentDay = toLocalInputValue(current).slice(0, 10);
  const currentTime = toLocalInputValue(current).slice(11);

  const days = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 86_400_000);
      const key = toLocalInputValue(d).slice(0, 10);
      const label =
        i === 0
          ? t("today")
          : i === 1
            ? t("tomorrow")
            : d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" });
      out.push({ key, label });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, locale]);

  const times = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    for (let m = 0; m < 24 * 60; m += 15) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      const key = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      const probe = new Date();
      probe.setHours(h, mm, 0, 0);
      out.push({
        key,
        label: probe.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" }),
      });
    }
    return out;
  }, [tag]);

  function setDay(day: string) {
    onChange(`${day}T${currentTime}`);
  }
  function setTime(time: string) {
    onChange(`${currentDay}T${time}`);
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <button
            key={d.key}
            type="button"
            className="chip text-sm"
            data-on={d.key === currentDay}
            onClick={() => setDay(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <select
        className="field"
        value={currentTime}
        onChange={(e) => setTime(e.target.value)}
        aria-label={t("whenQ")}
      >
        {times.map((tm) => {
          const disabled =
            disallowPast &&
            currentDay === toLocalInputValue(now).slice(0, 10) &&
            tm.key < toLocalInputValue(now).slice(11);
          return (
            <option key={tm.key} value={tm.key} disabled={disabled}>
              {tm.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
