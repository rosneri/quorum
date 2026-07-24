"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";
import { CustomDatePill, Strip, buildDays, buildTimes, localeTag, toLocalInputValue as tliv, withSelectedDay } from "./DateTimeField";
import { EmojiPicker, TimePicker } from "./EventFormBits";
import { useMemo } from "react";
import { SubmitButton } from "./SubmitButton";

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
  const [isPoll, setIsPoll] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [pollDay, setPollDay] = useState(() => tliv(new Date()).slice(0, 10));
  const [publicVotes, setPublicVotes] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pollDays = useMemo(() => buildDays(tag, { today: t("today"), tomorrow: t("tomorrow") }), [tag, locale]);
  const pollTimes = useMemo(() => buildTimes(tag), [tag]);

  // On today, start the time strip at the current 15-min slot instead of
  // midnight — the first option shown should be roughly "now". Other days
  // show the full day.
  const todayKey = tliv(new Date()).slice(0, 10);
  const nowSlotKey = (() => {
    const d = new Date();
    d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
    return tliv(d).slice(11);
  })();
  const pollTimesForDay =
    pollDay === todayKey ? pollTimes.filter((s) => s.key >= nowSlotKey) : pollTimes;

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
        <EmojiPicker />
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
        <span className="label">{t("privacyLabel")}</span>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip text-sm" data-on={publicVotes} onClick={() => setPublicVotes(true)}>
            {t("privacyPublic")}
          </button>
          <button type="button" className="chip text-sm" data-on={!publicVotes} onClick={() => setPublicVotes(false)}>
            {t("privacyPrivate")}
          </button>
        </div>
      </div>
      <input type="hidden" name="publicVotes" value={publicVotes ? "1" : "0"} />

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
        <TimePicker />
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl p-3" style={{ background: "var(--color-paper-2)" }}>
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pollHint")}</p>
          <Strip
            items={withSelectedDay(pollDays, pollDay, tag)}
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
            items={pollTimesForDay}
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

        </div>
      )}

      {isPoll && options.length < 2 && (
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pickTwoTimes")}</p>
      )}
      <SubmitButton className="btn text-lg" disabled={isPoll && options.length < 2}>
        {t("createPlan")}
      </SubmitButton>
    </form>
  );
}
