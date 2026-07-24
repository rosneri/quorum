"use client";

import { useI18n } from "./I18nProvider";

/**
 * Inline first-run identity: when the viewer has no cookie yet, forms include
 * this field so joining/RSVPing and introducing yourself is a single step.
 */
export function NameField({ known }: { known: boolean }) {
  const { t } = useI18n();
  if (known) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label" htmlFor="name">
        {t("yourName")}
      </label>
      <input
        id="name"
        name="name"
        required
        maxLength={40}
        placeholder={t("namePlaceholder")}
        className="field"
        autoComplete="given-name"
      />
    </div>
  );
}
