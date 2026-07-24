"use client";

import { useMemo, useState } from "react";
import { addAvailability } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";
import {
  CustomDatePill,
  Strip,
  buildDays,
  buildTimes,
  localeTag,
  toLocalInputValue as tliv,
  withSelectedDay,
} from "./DateTimeField";

function defaultTime(offsetHours: number): string {
  const d = new Date(Date.now() + offsetHours * 3_600_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return tliv(d).slice(11);
}

/**
 * "When am I free" picker for polls — same strip language as event creation.
 * Each add is one entry; multiple entries (and several times on the same
 * date) are expected.
 */
export function AvailabilityPanel({
  eventId,
  known,
  labelKey = "suggestTime",
}: {
  eventId: string;
  known: boolean;
  /** collapsed-button label; defaults to the poll "none of these work" phrasing */
  labelKey?: "suggestTime" | "doesntWork";
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(false);
  const [day, setDay] = useState(() => tliv(new Date()).slice(0, 10));
  const [time, setTime] = useState(() => defaultTime(1));
  const [until, setUntil] = useState(() => defaultTime(4));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const days = useMemo(() => buildDays(tag, { today: t("today"), tomorrow: t("tomorrow") }), [tag, locale]);
  const times = useMemo(() => buildTimes(tag), [tag]);
  const dayItems = withSelectedDay(days, day, tag);

  if (!open) {
    return (
      <button
        type="button"
        className="chip w-full items-center justify-start gap-1.5 text-left"
        style={{ display: "flex" }}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>🕗</span>
        {t(labelKey)}
      </button>
    );
  }

  return (
    <form action={addAvailability} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <NameField known={known} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label">{t("orSayFree")}</span>
        <div className="flex gap-1.5">
          <button type="button" className="chip text-sm" data-on={!range} onClick={() => setRange(false)}>
            {t("specificTime")}
          </button>
          <button type="button" className="chip text-sm" data-on={range} onClick={() => setRange(true)}>
            {t("timeRange")}
          </button>
        </div>
      </div>

      <Strip
        items={dayItems}
        selected={day}
        onPick={setDay}
        ariaLabel={t("whenQ")}
        trailing={
          <CustomDatePill selectedDay={day} stripKeys={days.map((d) => d.key)} onPick={setDay} />
        }
      />

      {!range ? (
        <Strip items={times} selected={time} onPick={setTime} ariaLabel={t("whenQ")} />
      ) : (
        <>
          <span className="label">{t("fromLabel")}</span>
          <Strip items={times} selected={time} onPick={setTime} ariaLabel={t("fromLabel")} />
          <span className="label">{t("to")}</span>
          <Strip
            items={times}
            selected={until}
            onPick={setUntil}
            isDisabled={(k) => k <= time}
            ariaLabel={t("to")}
          />
        </>
      )}

      <input type="hidden" name="from" value={new Date(`${day}T${time}`).toISOString()} />
      <input
        type="hidden"
        name="until"
        value={range ? new Date(`${day}T${until}`).toISOString() : ""}
      />
      <SubmitButton className="btn btn-quiet self-start text-sm">{t("addAvailability")}</SubmitButton>
    </form>
  );
}
