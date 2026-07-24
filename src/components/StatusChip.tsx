"use client";

import type { EventStatus } from "@/generated/prisma/enums";
import { useI18n } from "./I18nProvider";

const styles = {
  CONFIRMED: { bg: "var(--color-mint)", key: "stConfirmed" },
  PROPOSED: { bg: "var(--color-accent)", key: "stGathering" },
  CANCELLED: { bg: "var(--color-paper-3)", key: "stCancelled" },
  DONE: { bg: "var(--color-paper-3)", key: "stDone" },
  POLL: { bg: "var(--color-accent-2)", key: "stVoting" },
} as const;

export function StatusChip({ status, isPoll, isPast }: { status: EventStatus; isPoll?: boolean; isPast?: boolean }) {
  const { t } = useI18n();
  const s =
    isPast && status !== "CANCELLED"
      ? styles.DONE
      : isPoll && status === "PROPOSED"
        ? styles.POLL
        : styles[status];
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: s.bg }}>
      {t(s.key)}
    </span>
  );
}
