"use client";

import { useState } from "react";
import { editEvent } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";
import { EmojiPicker, FlexSlider, TimeMultiPicker, toLocalInputValue } from "./EventFormBits";

export function EditEventForm({
  eventId,
  title,
  emoji,
  optionIsos,
  flexMinutes,
}: {
  eventId: string;
  title: string;
  emoji: string | null;
  optionIsos: string[];
  flexMinutes: number | null;
}) {
  const { t } = useI18n();
  const [count, setCount] = useState(optionIsos.length);
  const initial = optionIsos.map((iso) => toLocalInputValue(new Date(iso)));

  return (
    <form action={editEvent} className="flex flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="title">{t("whatsThePlan")}</label>
        <input
          id="title"
          name="title"
          maxLength={80}
          defaultValue={title}
          placeholder={t("titlePlaceholder")}
          className="field text-lg"
        />
        <EmojiPicker initial={emoji} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="label">{t("whenQ")}</span>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("whenPickHint")}</p>
        <TimeMultiPicker initial={initial} onCountChange={setCount} />
        <FlexSlider initial={flexMinutes ?? 30} />
      </div>

      {count === 0 && (
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pickOneTime")}</p>
      )}
      <SubmitButton className="btn text-lg" disabled={count === 0}>{t("saveChanges")}</SubmitButton>
    </form>
  );
}
