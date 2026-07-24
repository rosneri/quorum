"use client";

import { useI18n } from "./I18nProvider";

/** One dot per attendee; coral pop once the plan is on. No target — plans are unlimited. */
export function QuorumMeter({
  attending,
  confirmed,
  soloMaybe = false,
}: {
  attending: number;
  confirmed: boolean;
  /** viewer is the only rsvp and is on MAYBE — nudge them to start it */
  soloMaybe?: boolean;
}) {
  const { t } = useI18n();
  const text =
    attending === 0
      ? soloMaybe
        ? t("meterMaybeSolo")
        : t("meterNone")
      : confirmed
        ? t("meterOn", { n: attending })
        : t("meterCount", { n: attending });
  return (
    <div className="flex items-center gap-2" aria-label={text}>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.max(attending, 1) }, (_, i) => (
          <span
            key={i}
            className="qdot"
            data-fill={i < attending}
            data-pop={confirmed && i < attending}
          />
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color: "var(--color-ink-2)" }}>
        {text}
      </span>
    </div>
  );
}
