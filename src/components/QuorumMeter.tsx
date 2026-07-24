"use client";

import { useI18n } from "./I18nProvider";

/**
 * The signature visual: one dot per needed attendee, filling as people commit.
 * Extra attendees beyond the minimum render as coral pop dots.
 */
export function QuorumMeter({
  attending,
  minQuorum,
  confirmed,
}: {
  attending: number;
  minQuorum: number;
  confirmed: boolean;
}) {
  const { t } = useI18n();
  const slots = Math.max(minQuorum, attending);
  return (
    <div
      className="flex items-center gap-2"
      aria-label={t("meterAria", { a: attending, q: minQuorum })}
    >
      <div className="flex gap-1.5">
        {Array.from({ length: slots }, (_, i) => (
          <span
            key={i}
            className="qdot"
            data-fill={i < attending}
            data-pop={confirmed && i >= minQuorum - 1 && i < attending}
          />
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color: "var(--color-ink-2)" }}>
        {confirmed
          ? t("meterOn", { n: attending })
          : t("meterNeed", { a: attending, q: minQuorum, m: minQuorum - attending })}
      </span>
    </div>
  );
}
