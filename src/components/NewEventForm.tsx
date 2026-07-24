"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { NameField } from "./NameField";

const EMOJI = ["☕", "🍕", "🏀", "🎬", "🎲", "🍻", "🥾", "🎮"];

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function quickTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInputValue(d);
}

function tonight(): string {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return toLocalInputValue(d);
}

export function NewEventForm({
  known,
  groups,
  defaultGroupId,
}: {
  known: boolean;
  groups: { id: string; name: string }[];
  defaultGroupId?: string;
}) {
  const [emoji, setEmoji] = useState("☕");
  const [isPoll, setIsPoll] = useState(false);
  const [when, setWhen] = useState(quickTime(1));
  const [flex, setFlex] = useState(30);
  const [minQuorum, setMinQuorum] = useState(2);
  const [options, setOptions] = useState<string[]>([quickTime(1), tonight()]);

  return (
    <form action={createEvent} className="flex flex-col gap-5">
      <NameField known={known} />

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="title">What&apos;s the plan?</label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder="Coffee at Nira's"
          className="field text-lg"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {EMOJI.map((e) => (
            <button key={e} type="button" className="chip px-3" data-on={emoji === e} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
        <input type="hidden" name="emoji" value={emoji} />
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="groupId">Who&apos;s invited?</label>
          <select id="groupId" name="groupId" defaultValue={defaultGroupId ?? ""} className="field">
            <option value="">Anyone with the link</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="label">When?</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip" data-on={!isPoll} onClick={() => setIsPoll(false)}>
            Pick a time
          </button>
          <button type="button" className="chip" data-on={isPoll} onClick={() => setIsPoll(true)}>
            Let people vote
          </button>
        </div>
      </div>
      <input type="hidden" name="isPoll" value={isPoll ? "1" : "0"} />

      {!isPoll ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["In 1 hour", quickTime(1)],
              ["In 2 hours", quickTime(2)],
              ["Tonight 8pm", tonight()],
            ].map(([label, v]) => (
              <button key={label} type="button" className="chip" data-on={when === v} onClick={() => setWhen(v)}>
                {label}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={when}
            min={toLocalInputValue(new Date())}
            onChange={(e) => setWhen(e.target.value)}
            required
            className="field"
          />
          {/* send UTC — the server may run in a different timezone */}
          <input type="hidden" name="startsAt" value={when ? new Date(when).toISOString() : ""} />
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="flex">
              Flexibility: {flex === 0 ? "sharp" : `±${flex} min`}
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
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="datetime-local"
                value={o}
                min={toLocalInputValue(new Date())}
                onChange={(e) =>
                  setOptions(options.map((x, j) => (j === i ? e.target.value : x)))
                }
                required
                className="field"
              />
              <input type="hidden" name="option" value={o ? new Date(o).toISOString() : ""} />
              {options.length > 2 && (
                <button
                  type="button"
                  className="chip"
                  aria-label="Remove option"
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button type="button" className="chip self-start" onClick={() => setOptions([...options, tonight()])}>
              + Add option
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="label">Happens only if at least…</span>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" className="chip" data-on={minQuorum === n} onClick={() => setMinQuorum(n)}>
              {n}
            </button>
          ))}
        </div>
        <input type="hidden" name="minQuorum" value={minQuorum} />
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
          The plan confirms itself once {minQuorum} people are in. You count too.
        </p>
      </div>

      <button className="btn text-lg">Create plan</button>
    </form>
  );
}
