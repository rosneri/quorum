"use client";

import type { EventStatus } from "@/generated/prisma/enums";
import { useI18n } from "./I18nProvider";

const styles = {
  CONFIRMED: { bg: "var(--color-mint)", key: "stConfirmed" },
  PROPOSED: { bg: "var(--color-accent)", key: "stGathering" },
  CANCELLED: { bg: "var(--color-paper-3)", key: "stCancelled" },
  DONE: { bg: "var(--color-paper-3)", key: "stDone" },
  POLL: { bg: "var(--color-accent-2)", key: "stVoting" },
  LIVE: { bg: "var(--color-mint)", key: "stLive" },
} as const;

export function StatusChip({
  status,
  isPoll,
  isPast,
  isLive,
}: {
  status: EventStatus;
  isPoll?: boolean;
  isPast?: boolean;
  isLive?: boolean;
}) {
  const { t } = useI18n();
  const active = status !== "CANCELLED";
  const s =
    isLive && active
      ? styles.LIVE
      : isPast && active
        ? styles.DONE
        : isPoll && status === "PROPOSED"
          ? styles.POLL
          : styles[status];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-bold"
      style={{ background: s.bg }}
      data-live={isLive && active ? true : undefined}
    >
      {t(s.key)}
    </span>
  );
}
