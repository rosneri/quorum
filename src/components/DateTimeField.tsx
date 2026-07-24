"use client";

import { useEffect, useMemo, useRef } from "react";
import { useI18n } from "./I18nProvider";

/** Local-format value: "YYYY-MM-DDTHH:mm" — same contract as datetime-local. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localeTag(locale: string) {
  return locale === "he" ? "he-IL" : "en-US";
}

export function Strip({
  items,
  selected,
  onPick,
  isDisabled,
  ariaLabel,
  trailing,
}: {
  items: { key: string; label: string; sub?: string }[];
  selected: string | string[];
  onPick: (key: string) => void;
  isDisabled?: (key: string) => boolean;
  ariaLabel: string;
  trailing?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const isOn = (key: string) =>
    Array.isArray(selected) ? selected.includes(key) : key === selected;

  // keep the selected pill centered — including when a quick-chip changes the value.
  // multi-select strips manage their own scroll position.
  useEffect(() => {
    if (Array.isArray(selected)) return;
    const el = ref.current?.querySelector<HTMLElement>('[data-on="true"]');
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(selected) ? "" : selected]);

  return (
    <div ref={ref} className="strip" role="listbox" aria-label={ariaLabel}>
      {items.map((it) => {
        const disabled = isDisabled?.(it.key) ?? false;
        return (
          <button
            key={it.key}
            type="button"
            role="option"
            aria-selected={isOn(it.key)}
            className="chip strip-pill"
            data-on={isOn(it.key)}
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
      {trailing}
    </div>
  );
}

/**
 * "Any other date" pill: last item of a day strip. Opens the native date
 * picker; once a date outside the strip is chosen, the pill shows it selected.
 */
export function CustomDatePill({
  selectedDay,
  stripKeys,
  onPick,
}: {
  selectedDay: string;
  stripKeys: string[];
  onPick: (dayKey: string) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = !stripKeys.includes(selectedDay);
  const todayKey = toLocalInputValue(new Date()).slice(0, 10);
  return (
    <span className="strip-pill relative inline-flex">
      <button
        type="button"
        className="chip"
        onClick={() => {
          try {
            inputRef.current?.showPicker();
          } catch {
            inputRef.current?.click();
          }
        }}
      >
        {t("customDate")}
      </button>
      {/* transparent native input covers the pill so a plain tap opens the OS picker */}
      <input
        ref={inputRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        min={todayKey}
        value={isCustom ? selectedDay : ""}
        onChange={(e) => e.target.value && onPick(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}

/** If the selected day isn't one of the strip's stock days, add it as a pill. */
export function withSelectedDay(
  days: { key: string; label: string; sub?: string }[],
  selectedDay: string,
  tag: string
): { key: string; label: string; sub?: string }[] {
  if (days.some((d) => d.key === selectedDay)) return days;
  const d = new Date(`${selectedDay}T12:00`);
  return [
    ...days,
    {
      key: selectedDay,
      label: d.toLocaleDateString(tag, { day: "numeric", month: "short" }),
      sub: d.toLocaleDateString(tag, { weekday: "short" }),
    },
  ];
}

export function buildDays(
  tag: string,
  labels: { today: string; tomorrow: string },
  count = 14
): { key: string; label: string; sub?: string }[] {
  const out: { key: string; label: string; sub?: string }[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * 86_400_000);
    const key = toLocalInputValue(d).slice(0, 10);
    if (i === 0) out.push({ key, label: labels.today });
    else if (i === 1) out.push({ key, label: labels.tomorrow });
    else
      out.push({
        key,
        label: d.toLocaleDateString(tag, { day: "numeric", month: "short" }),
        sub: d.toLocaleDateString(tag, { weekday: "short" }),
      });
  }
  return out;
}

export function buildTimes(tag: string): { key: string; label: string }[] {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => buildDays(tag, { today: t("today"), tomorrow: t("tomorrow") }), [tag, locale]);

  const times = useMemo(() => buildTimes(tag), [tag]);

  return (
    <div className="flex flex-col gap-2">
      <Strip
        items={withSelectedDay(days, currentDay, tag)}
        selected={currentDay}
        onPick={(day) => onChange(`${day}T${currentTime}`)}
        ariaLabel={t("whenQ")}
        trailing={
          <CustomDatePill
            selectedDay={currentDay}
            stripKeys={days.map((d) => d.key)}
            onPick={(day) => onChange(`${day}T${currentTime}`)}
          />
        }
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
