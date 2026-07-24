"use client";

import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "./I18nProvider";

/** Local-format value: "YYYY-MM-DDTHH:mm" — same contract as datetime-local. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localeTag(locale: string) {
  return locale === "he" ? "he-IL" : "en-US";
}

function Strip({
  items,
  selected,
  onPick,
  isDisabled,
  ariaLabel,
}: {
  items: { key: string; label: string; sub?: string }[];
  selected: string;
  onPick: (key: string) => void;
  isDisabled?: (key: string) => boolean;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // keep the selected pill centered — including when a quick-chip changes the value
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-on="true"]');
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div ref={ref} className="strip" role="listbox" aria-label={ariaLabel}>
      {items.map((it) => {
        const disabled = isDisabled?.(it.key) ?? false;
        return (
          <button
            key={it.key}
            type="button"
            role="option"
            aria-selected={it.key === selected}
            className="chip strip-pill"
            data-on={it.key === selected}
            disabled={disabled}
            onClick={() => onPick(it.key)}
          >
            {it.sub ? (
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[11px] font-semibold opacity-70">{it.sub}</span>
                <span>{it.label}</span>
              </span>
            ) : (
              it.label
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fully-localized date+time picker: two horizontal snap strips (day, then
 * 15-minute time slots). Replaces <input type="datetime-local">, whose native
 * UI follows the browser language rather than the app's.
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
  const now = new Date();
  const todayKey = toLocalInputValue(now).slice(0, 10);
  const nowTime = toLocalInputValue(now).slice(11);

  const days = useMemo(() => {
    const out: { key: string; label: string; sub?: string }[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getTime() + i * 86_400_000);
      const key = toLocalInputValue(d).slice(0, 10);
      if (i === 0) out.push({ key, label: t("today") });
      else if (i === 1) out.push({ key, label: t("tomorrow") });
      else
        out.push({
          key,
          label: d.toLocaleDateString(tag, { day: "numeric", month: "short" }),
          sub: d.toLocaleDateString(tag, { weekday: "short" }),
        });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, locale]);

  const times = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const probe = new Date();
    for (let m = 0; m < 24 * 60; m += 15) {
      probe.setHours(Math.floor(m / 60), m % 60, 0, 0);
      out.push({
        key: toLocalInputValue(probe).slice(11),
        label: probe.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" }),
      });
    }
    return out;
  }, [tag]);

  return (
    <div className="flex flex-col gap-2">
      <Strip
        items={days}
        selected={currentDay}
        onPick={(day) => onChange(`${day}T${currentTime}`)}
        ariaLabel={t("whenQ")}
      />
      <Strip
        items={times}
        selected={currentTime}
        onPick={(time) => onChange(`${currentDay}T${time}`)}
        isDisabled={(time) => disallowPast && currentDay === todayKey && time < nowTime}
        ariaLabel={t("whenQ")}
      />
    </div>
  );
}
