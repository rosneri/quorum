"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";
import { CustomDatePill, DateTimeField, Strip, buildDays, buildTimes, localeTag, toLocalInputValue as tliv } from "./DateTimeField";
import { useMemo } from "react";
import { SubmitButton } from "./SubmitButton";

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

// floored to the 15-min grid so the time dropdown has a matching slot;
// a few minutes in the past is fine (the server allows a 15-min grace)
function rightNow(): string {
  const d = new Date();
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
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
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const [emoji, setEmoji] = useState("☕");
  const [isPoll, setIsPoll] = useState(false);
  const [when, setWhen] = useState(quickTime(1));
  const [flex, setFlex] = useState(30);
  const [options, setOptions] = useState<string[]>([]);
  const [pollDay, setPollDay] = useState(() => tliv(new Date()).slice(0, 10));
  const [publicVotes, setPublicVotes] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pollDays = useMemo(() => buildDays(tag, { today: t("today"), tomorrow: t("tomorrow") }), [tag, locale]);
  const pollTimes = useMemo(() => buildTimes(tag), [tag]);

  function optionLabel(v: string): string {
    const todayKey = tliv(new Date()).slice(0, 10);
    const tomorrowKey = tliv(new Date(Date.now() + 86_400_000)).slice(0, 10);
    const d = new Date(v);
    const day =
      v.slice(0, 10) === todayKey
        ? t("today")
        : v.slice(0, 10) === tomorrowKey
          ? t("tomorrow")
          : d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" });
    return `${day} · ${d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })}`;
  }

  return (
    <form action={createEvent} className="flex flex-col gap-5">
      <NameField known={known} />

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="title">{t("whatsThePlan")}</label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder={t("titlePlaceholder")}
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
          <label className="label" htmlFor="groupId">{t("whoInvited")}</label>
          <select id="groupId" name="groupId" defaultValue={defaultGroupId ?? ""} className="field">
            <option value="">{t("anyoneWithLink")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="label">{t("whenQ")}</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip" data-on={!isPoll} onClick={() => setIsPoll(false)}>
            {t("pickATime")}
          </button>
          <button type="button" className="chip" data-on={isPoll} onClick={() => setIsPoll(true)}>
            {t("letPeopleVote")}
          </button>
        </div>
      </div>
      <input type="hidden" name="isPoll" value={isPoll ? "1" : "0"} />

      {!isPoll ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[
              [t("now"), rightNow()],
              [t("in1Hour"), quickTime(1)],
              [t("in2Hours"), quickTime(2)],
              [t("tonight8"), tonight()],
            ].map(([label, v]) => (
              <button key={label} type="button" className="chip" data-on={when === v} onClick={() => setWhen(v)}>
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
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl p-3" style={{ background: "var(--color-paper-2)" }}>
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pollHint")}</p>
          <Strip
            items={pollDays}
            selected={pollDay}
            onPick={setPollDay}
            ariaLabel={t("whenQ")}
            trailing={
              <CustomDatePill
                selectedDay={pollDay}
                stripKeys={pollDays.map((d) => d.key)}
                onPick={setPollDay}
              />
            }
          />
          <Strip
            items={pollTimes}
            selected={options.filter((o) => o.startsWith(pollDay)).map((o) => o.slice(11))}
            onPick={(time) => {
              const v = `${pollDay}T${time}`;
              setOptions((prev) =>
                prev.includes(v)
                  ? prev.filter((x) => x !== v)
                  : prev.length >= 6
                    ? prev
                    : [...prev, v].sort()
              );
            }}
            isDisabled={(time) =>
              pollDay === tliv(new Date()).slice(0, 10) && time < tliv(new Date()).slice(11)
            }
            ariaLabel={t("whenQ")}
          />
          {options.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
              <span className="label">{t("chosenTimes")}</span>
              <div className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className="chip text-sm"
                    aria-label={t("removeOption")}
                    onClick={() => setOptions(options.filter((x) => x !== o))}
                  >
                    {optionLabel(o)} ✕
                  </button>
                ))}
              </div>
            </div>
          )}
          {options.map((o) => (
            <input key={o} type="hidden" name="option" value={new Date(o).toISOString()} />
          ))}
          <button
            type="button"
            className="chip self-start text-sm"
            data-on={publicVotes}
            onClick={() => setPublicVotes(!publicVotes)}
          >
            {publicVotes ? "👀 " : "🙈 "}{t("showVoters")}
          </button>
          <input type="hidden" name="publicVotes" value={publicVotes ? "1" : "0"} />
        </div>
      )}

      <input type="hidden" name="minQuorum" value={2} />

      <SubmitButton className="btn text-lg" disabled={isPoll && options.length < 2}>
        {t("createPlan")}
      </SubmitButton>
    </form>
  );
}
