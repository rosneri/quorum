"use client";

import { useState } from "react";
import { lockCustomTime } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { DateTimeField } from "./DateTimeField";
import { SubmitButton } from "./SubmitButton";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Creator-only: decide on any time (e.g. the middle of everyone's overlap). */
export function LockCustom({ eventId }: { eventId: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(toLocalInputValue(new Date(Date.now() + 3_600_000)));

  if (!open) {
    return (
      <button type="button" className="chip self-start" onClick={() => setOpen(true)}>
        {t("lockDifferent")}
      </button>
    );
  }
  return (
    <form action={lockCustomTime} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="w-full"><DateTimeField value={at} onChange={setAt} disallowPast /></div>
      <input type="hidden" name="startsAt" value={at ? new Date(at).toISOString() : ""} />
      <SubmitButton className="btn btn-mint px-3 py-1.5 text-sm">{t("lockIn")}</SubmitButton>
    </form>
  );
}
