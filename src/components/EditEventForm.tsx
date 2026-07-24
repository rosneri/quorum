"use client";

import { editEvent } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";
import { EmojiPicker, TimePicker, toLocalInputValue } from "./EventFormBits";

export function EditEventForm({
  eventId,
  title,
  emoji,
  isPoll,
  startsAtIso,
  flexMinutes,
}: {
  eventId: string;
  title: string;
  emoji: string | null;
  isPoll: boolean;
  startsAtIso: string | null;
  flexMinutes: number | null;
}) {
  const { t } = useI18n();
  const initialWhen = startsAtIso ? toLocalInputValue(new Date(startsAtIso)) : undefined;

  return (
    <form action={editEvent} className="flex flex-col gap-5">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="title">{t("whatsThePlan")}</label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          defaultValue={title}
          placeholder={t("titlePlaceholder")}
          className="field text-lg"
        />
        <EmojiPicker initial={emoji} />
      </div>

      {/* Poll plans aren't time-editable until a time is locked in. */}
      {!isPoll && <TimePicker initialWhen={initialWhen} initialFlex={flexMinutes ?? 30} />}

      <SubmitButton className="btn text-lg">{t("saveChanges")}</SubmitButton>
    </form>
  );
}
