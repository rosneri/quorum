import Link from "next/link";
import type { ReactNode } from "react";
import type { EventStatus } from "@/generated/prisma/enums";
import { StatusChip } from "./StatusChip";
import { QuorumMeter } from "./QuorumMeter";
import { PlanTiming } from "./PlanTiming";

/**
 * One plan in a list. A leading emoji medallion anchors the row, the title and
 * a status chip share the top line, the time reads as the headline, and a
 * quiet meta row (attendance + group) sits underneath. Shared by the home and
 * group pages so every plan list looks and behaves the same.
 */
export function PlanCard({
  href,
  emoji,
  title,
  status,
  isPoll,
  isLive,
  isPast,
  chosenIso,
  flexMinutes,
  rangeStartIso,
  rangeEndIso,
  leadingIso,
  multi,
  groupName,
  meter,
  badge,
  statusSlot,
  muted,
}: {
  href: string;
  emoji?: string | null;
  title: string;
  status: EventStatus;
  isPoll: boolean;
  isLive?: boolean;
  isPast?: boolean;
  chosenIso?: string;
  flexMinutes?: number | null;
  rangeStartIso?: string;
  rangeEndIso?: string;
  leadingIso?: string;
  multi?: boolean;
  groupName?: string | null;
  /** Attendance meter for non-poll plans; omit to hide. */
  meter?: { attending: number; confirmed: boolean } | null;
  /** Extra highlight under the timing line (e.g. the owner's suggestions bell). */
  badge?: ReactNode;
  /** Replaces the status chip (e.g. a "you're out" tag on declined plans). */
  statusSlot?: ReactNode;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="card flex items-start gap-3.5 p-4"
      style={muted ? { opacity: 0.6 } : undefined}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ background: "var(--color-paper-2)" }}
        aria-hidden
      >
        {emoji || "📅"}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-lg font-bold leading-snug">{title}</span>
          {statusSlot ?? (
            <StatusChip status={status} isPoll={isPoll} isLive={isLive} isPast={isPast} />
          )}
        </div>

        <PlanTiming
          chosenIso={chosenIso}
          flexMinutes={flexMinutes}
          rangeStartIso={rangeStartIso}
          rangeEndIso={rangeEndIso}
          leadingIso={leadingIso}
          multi={multi}
        />

        {badge}

        {(meter || groupName) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {meter && <QuorumMeter attending={meter.attending} confirmed={meter.confirmed} />}
            {meter && groupName && <span style={{ color: "var(--color-ink-2)" }}>·</span>}
            {groupName && <span style={{ color: "var(--color-ink-2)" }}>{groupName}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
