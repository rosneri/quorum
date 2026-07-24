"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";
import { DateTimeField } from "./DateTimeField";

export const EMOJI = ["☕", "🍕", "🏀", "🎬", "🎲", "🍻", "🥾", "🎮"];

export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function quickTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInputValue(d);
}

// next free 15-min slot: 16:12 -> 16:15 (never a slot that already passed)
export function rightNow(): string {
  const d = new Date();
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInputValue(d);
}

export function tonight(): string {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return toLocalInputValue(d);
}

/** Emoji strip + hidden `emoji` input. */
export function EmojiPicker({ initial }: { initial?: string | null }) {
  const [emoji, setEmoji] = useState(initial || "☕");
  return (
    <>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {EMOJI.map((e) => (
          <button key={e} type="button" className="chip px-3" data-on={emoji === e} onClick={() => setEmoji(e)}>
            {e}
          </button>
        ))}
      </div>
      <input type="hidden" name="emoji" value={emoji} />
    </>
  );
}

/**
 * Single-time picker: quick chips + snap-strip date/time + flexibility slider,
 * with hidden `startsAt` (UTC ISO) and `flexMinutes` inputs. Shared by the new
 * plan form and the edit form.
 */
export function TimePicker({ initialWhen, initialFlex }: { initialWhen?: string; initialFlex?: number }) {
  const { t } = useI18n();
  // computed once on mount so the chip identities stay stable across renders
  const [quick] = useState(() => ({
    now: rightNow(),
    in1: quickTime(1),
    in2: quickTime(2),
    tonight: tonight(),
  }));
  const [when, setWhen] = useState(initialWhen ?? quick.in1);
  const [flex, setFlex] = useState(initialFlex ?? 30);

  return (
    <>
      <div className="strip">
        {[
          [t("now"), quick.now],
          [t("in1Hour"), quick.in1],
          [t("in2Hours"), quick.in2],
          [t("tonight8"), quick.tonight],
        ].map(([label, v]) => (
          <button key={label} type="button" className="chip strip-pill" data-on={when === v} onClick={() => setWhen(v)}>
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl p-3" style={{ background: "var(--color-paper-2)" }}>
        <DateTimeField value={when} onChange={setWhen} disallowPast />
      </div>
      {/* send UTC — the server may run in a different timezone */}
      <input type="hidden" name="startsAt" value={when ? new Date(when).toISOString() : ""} />
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
    </>
  );
}
