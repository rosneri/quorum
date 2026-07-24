"use client";

import { useState } from "react";
import { setAvailability } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AvailabilityPanel({
  eventId,
  known,
  mine,
}: {
  eventId: string;
  known: boolean;
  mine: { from: string; until: string | null } | null;
}) {
  const { t } = useI18n();
  const [range, setRange] = useState(!!mine?.until);
  const [from, setFrom] = useState(
    mine ? toLocalInputValue(new Date(mine.from)) : toLocalInputValue(new Date(Date.now() + 3_600_000))
  );
  const [until, setUntil] = useState(
    mine?.until
      ? toLocalInputValue(new Date(mine.until))
      : toLocalInputValue(new Date(Date.now() + 4 * 3_600_000))
  );

  return (
    <form action={setAvailability} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <NameField known={known} />
      <div className="flex items-center justify-between">
        <span className="label">{t("orSayFree")}</span>
        {mine && (
          <button name="clear" value="1" className="text-xs font-semibold" style={{ color: "var(--color-ink-2)" }}>
            {t("clear")}
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        <button type="button" className="chip" data-on={!range} onClick={() => setRange(false)}>
          {t("specificTime")}
        </button>
        <button type="button" className="chip" data-on={range} onClick={() => setRange(true)}>
          {t("timeRange")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
          className="field flex-1"
          style={{ minWidth: "12rem" }}
        />
        {range && (
          <>
            <span className="text-sm font-semibold" style={{ color: "var(--color-ink-2)" }}>{t("to")}</span>
            <input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              required
              className="field flex-1"
              style={{ minWidth: "12rem" }}
            />
          </>
        )}
      </div>
      <input type="hidden" name="from" value={from ? new Date(from).toISOString() : ""} />
      <input type="hidden" name="until" value={range && until ? new Date(until).toISOString() : ""} />
      <button className="btn btn-quiet self-start text-sm">
        {mine ? t("updateAvailability") : t("saveAvailability")}
      </button>
    </form>
  );
}
