"use client";

import { useSyncExternalStore } from "react";
import { formatWhen, formatRange } from "@/lib/format";
import { useI18n } from "./I18nProvider";

const noop = () => () => {};
const tag = (locale: string) => (locale === "he" ? "he-IL" : "en-US");

/**
 * The timing line for a plan card: the chosen date once a time is decided,
 * otherwise the candidate date range plus the current leading time. Formatted
 * in the viewer's timezone (client-only), mirroring <When />.
 */
export function PlanTiming({
  chosenIso,
  flexMinutes,
  rangeStartIso,
  rangeEndIso,
  leadingIso,
  multi,
}: {
  chosenIso?: string | null;
  flexMinutes?: number | null;
  rangeStartIso?: string | null;
  rangeEndIso?: string | null;
  leadingIso?: string | null;
  multi?: boolean;
}) {
  const { t, locale } = useI18n();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const muted = { color: "var(--color-ink-2)" };
  if (!mounted) {
    return (
      <span suppressHydrationWarning className="text-sm" style={muted}>
        …
      </span>
    );
  }

  const labels = { today: t("today"), tomorrow: t("tomorrow"), yesterday: t("yesterday") };
  const l = tag(locale);

  if (chosenIso) {
    return (
      <span className="text-sm" style={muted}>
        {formatWhen(new Date(chosenIso), flexMinutes, l, labels)}
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-0.5 text-sm" style={muted}>
      {multi && rangeStartIso && rangeEndIso && (
        <span>{formatRange(new Date(rangeStartIso), new Date(rangeEndIso), l, labels)}</span>
      )}
      {leadingIso ? (
        <span>
          🔥 {t("leadingTime")} · {formatWhen(new Date(leadingIso), flexMinutes, l, labels)}
        </span>
      ) : (
        <span>{t("votingOnTime")}</span>
      )}
    </span>
  );
}
