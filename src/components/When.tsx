"use client";

import { useSyncExternalStore } from "react";
import { formatWhen } from "@/lib/format";
import { useI18n } from "./I18nProvider";

const noop = () => () => {};

function localeTag(locale: string) {
  return locale === "he" ? "he-IL" : "en-US";
}

/** Formats a timestamp in the viewer's timezone (client-only to avoid server-TZ mismatch). */
export function When({ iso, flexMinutes }: { iso: string; flexMinutes?: number | null }) {
  const { t, locale } = useI18n();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <span suppressHydrationWarning>…</span>;
  return (
    <span>
      {formatWhen(new Date(iso), flexMinutes, localeTag(locale), {
        today: t("today"),
        tomorrow: t("tomorrow"),
        yesterday: t("yesterday"),
      })}
    </span>
  );
}

/** Just the clock time, viewer-local. */
export function TimeOnly({ iso }: { iso: string }) {
  const { locale } = useI18n();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return <span suppressHydrationWarning>…</span>;
  return (
    <span>
      {new Date(iso).toLocaleTimeString(localeTag(locale), { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}
