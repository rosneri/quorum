"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import {
  CustomDatePill,
  Strip,
  buildDays,
  buildTimes,
  localeTag,
  toLocalInputValue as tliv,
  withSelectedDay,
} from "./DateTimeField";

export const EMOJI = ["☕", "🍕", "🏀", "🎬", "🎲", "🍻", "🥾", "🎮", "🎉", "🍔", "🎧", "📚", "🏓", "🧗", "🍦", "🎨"];

/** Local-format value: "YYYY-MM-DDTHH:mm". */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Horizontal emoji strip with a leading "custom emoji" pill; writes hidden `emoji`. */
export function EmojiPicker({ initial }: { initial?: string | null }) {
  const { t } = useI18n();
  const [emoji, setEmoji] = useState(initial || "☕");
  const [customOpen, setCustomOpen] = useState(false);
  const inList = EMOJI.includes(emoji);

  return (
    <>
      <div className="strip mt-1">
        <button
          type="button"
          className="chip strip-pill"
          data-on={!inList}
          aria-label={t("customEmoji")}
          onClick={() => setCustomOpen((v) => !v)}
        >
          {inList ? "＋😀" : emoji}
        </button>
        {EMOJI.map((e) => (
          <button key={e} type="button" className="chip strip-pill px-3" data-on={emoji === e} onClick={() => { setEmoji(e); setCustomOpen(false); }}>
            {e}
          </button>
        ))}
      </div>
      {customOpen && (
        <input
          autoFocus
          maxLength={2}
          defaultValue={inList ? "" : emoji}
          placeholder={t("customEmoji")}
          aria-label={t("customEmoji")}
          className="field mt-1 w-24 text-center text-xl"
          onChange={(e) => {
            const v = [...e.target.value.trim()][0] ?? "";
            if (v) setEmoji(v);
          }}
        />
      )}
      <input type="hidden" name="emoji" value={emoji} />
    </>
  );
}

/** Flexibility slider (± minutes around the time); writes hidden `flexMinutes`. */
export function FlexSlider({ initial = 30 }: { initial?: number }) {
  const { t } = useI18n();
  const [flex, setFlex] = useState(initial);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label" htmlFor="flex">
        {flex === 0 ? t("flexSharp") : t("flexMin", { n: flex })}
      </label>
      <input
        id="flex"
        type="range"
        min={0}
        max={120}
        step={15}
        value={flex}
        onChange={(e) => setFlex(Number(e.target.value))}
        className="w-full accent-[var(--color-accent-2)]"
      />
      <input type="hidden" name="flexMinutes" value={flex} />
    </div>
  );
}

/**
 * Pick one or more candidate times. One time = a fixed plan; several = people
 * vote and the winner decides itself. Emits a hidden `option` (UTC ISO) per
 * chosen time. Shared by the new-plan and edit forms.
 *
 * `initial` is an array of local "YYYY-MM-DDTHH:mm" values.
 */
export function TimeMultiPicker({
  initial = [],
  max = 8,
  onCountChange,
}: {
  initial?: string[];
  max?: number;
  onCountChange?: (n: number) => void;
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const [options, setOptions] = useState<string[]>(initial);
  const [day, setDay] = useState(() => initial[0]?.slice(0, 10) ?? tliv(new Date()).slice(0, 10));

  useEffect(() => onCountChange?.(options.length), [options.length, onCountChange]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => buildDays(tag, { today: t("today"), tomorrow: t("tomorrow") }), [tag, locale]);
  const times = useMemo(() => buildTimes(tag), [tag]);

  const todayKey = tliv(new Date()).slice(0, 10);
  const nowSlotKey = (() => {
    const d = new Date();
    d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
    return tliv(d).slice(11);
  })();
  const timesForDay = day === todayKey ? times.filter((s) => s.key >= nowSlotKey) : times;

  function optionLabel(v: string): string {
    const tomorrowKey = tliv(new Date(Date.now() + 86_400_000)).slice(0, 10);
    const d = new Date(v);
    const label =
      v.slice(0, 10) === todayKey
        ? t("today")
        : v.slice(0, 10) === tomorrowKey
          ? t("tomorrow")
          : d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" });
    return `${label} · ${d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })}`;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl p-3" style={{ background: "var(--color-paper-2)" }}>
      <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pollHint")}</p>
      <Strip
        items={withSelectedDay(days, day, tag)}
        selected={day}
        onPick={setDay}
        ariaLabel={t("whenQ")}
        trailing={<CustomDatePill selectedDay={day} stripKeys={days.map((d) => d.key)} onPick={setDay} />}
      />
      <Strip
        items={timesForDay}
        selected={options.filter((o) => o.startsWith(day)).map((o) => o.slice(11))}
        onPick={(time) => {
          const v = `${day}T${time}`;
          setOptions((prev) =>
            prev.includes(v) ? prev.filter((x) => x !== v) : prev.length >= max ? prev : [...prev, v].sort(),
          );
        }}
        ariaLabel={t("whenQ")}
      />
      {options.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
          <span className="label">{t("chosenTimes")}</span>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o) => (
              <button key={o} type="button" className="chip text-sm" aria-label={t("removeOption")} onClick={() => setOptions(options.filter((x) => x !== o))}>
                {optionLabel(o)} ✕
              </button>
            ))}
          </div>
        </div>
      )}
      {options.map((o) => (
        <input key={o} type="hidden" name="option" value={new Date(o).toISOString()} />
      ))}
    </div>
  );
}
