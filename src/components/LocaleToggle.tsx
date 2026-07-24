"use client";

import { useI18n } from "./I18nProvider";
import { setLocale } from "@/lib/actions";

export function LocaleToggle() {
  const { locale } = useI18n();
  const other = locale === "he" ? "en" : "he";
  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={other} />
      <button
        className="text-xs font-bold"
        style={{ color: "var(--color-ink-2)" }}
        aria-label={other === "he" ? "עברית" : "English"}
      >
        {other === "he" ? "עברית" : "EN"}
      </button>
    </form>
  );
}
