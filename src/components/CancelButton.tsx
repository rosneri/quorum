"use client";

import { cancelEvent } from "@/lib/actions";
import { useI18n } from "./I18nProvider";
import { SubmitButton } from "./SubmitButton";

export function CancelButton({ eventId }: { eventId: string }) {
  const { t } = useI18n();
  return (
    <form
      action={cancelEvent}
      onSubmit={(e) => {
        if (!confirm(t("confirmCallOff"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <SubmitButton className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--color-accent-3)" }}>
        {t("callItOff")}
      </SubmitButton>
    </form>
  );
}
