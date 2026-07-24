/** Pure, DB-free time-state helpers for events (safe to import anywhere). */

/** How long after an event's window a timed plan lingers before it's "past". */
export const PAST_GRACE_MS = 3 * 3_600_000;

type TimedEvent = { isPoll: boolean; startsAt: Date | null; flexMinutes: number | null };

/** When a timed plan ages out: start + flex + grace. Null for polls/timeless. */
function endOf(event: TimedEvent): number | null {
  if (event.isPoll || !event.startsAt) return null;
  return event.startsAt.getTime() + (event.flexMinutes ?? 0) * 60_000 + PAST_GRACE_MS;
}

/** A timed plan is behind us once its start (+ flex + grace) has passed. Polls never count. */
export function isPast(event: TimedEvent, now: number = Date.now()): boolean {
  const end = endOf(event);
  return end !== null && now >= end;
}

/** A timed plan is underway from its start time until it ages out. Polls never count. */
export function isLive(event: TimedEvent, now: number = Date.now()): boolean {
  const end = endOf(event);
  return end !== null && now >= event.startsAt!.getTime() && now < end;
}
