"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { NameField } from "./NameField";
import { useI18n } from "./I18nProvider";
import { EmojiPicker, FlexSlider, TimeMultiPicker } from "./EventFormBits";
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
  const { t } = useI18n();
  const [publicVotes, setPublicVotes] = useState(true);
  const [count, setCount] = useState(0);

  return (
    <form action={createEvent} className="flex flex-col gap-5">
      <NameField known={known} />

      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="title">{t("whatsThePlan")}</label>
        <input
          id="title"
          name="title"
          maxLength={80}
          defaultValue="Coffee"
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

      <div className="flex flex-col gap-2">
        <span className="label">{t("whenQ")}</span>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("whenPickHint")}</p>
        <TimeMultiPicker onCountChange={setCount} />
        <FlexSlider />
      </div>

      {count === 0 && (
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("pickOneTime")}</p>
      )}
      <SubmitButton className="btn text-lg" disabled={count === 0}>
        {t("createPlan")}
      </SubmitButton>
    </form>
  );
}
