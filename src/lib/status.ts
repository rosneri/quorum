import { prisma } from "./db";
import { resolveEvent } from "./quorum";
import { isAvailableAt } from "./availability";

// Re-export the pure time-state helpers so existing `@/lib/status` importers
// keep working; the implementations live in a DB-free module for testability.
export { PAST_GRACE_MS, isPast, isLive } from "./eventTime";

/**
 * Recompute an event from its candidate times, votes and rsvps and persist the
 * derived shape: the decided/effective `startsAt`, `status`, and `isPoll`
 * ("still choosing a time"). Never resurrects a CANCELLED plan.
 *
 * - A single-time event always has its time.
 * - A multi-time event only gets a concrete time once the leading time clears
 *   quorum (auto-confirm); until then its time is undecided (null).
 */
export async function syncEventStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { pollOptions: true, rsvps: true, availabilities: true },
  });
  if (!event || event.status === "CANCELLED") return;

  const votes = await prisma.pollVote.findMany({ where: { option: { eventId } } });
  const res = resolveEvent(event.pollOptions, votes, event.rsvps, event.availabilities, isAvailableAt);

  const options = event.pollOptions;
  const multi = options.length > 1;
  const leader = res.leaderOptionId ? options.find((o) => o.id === res.leaderOptionId) ?? null : null;

  const startsAt = !multi
    ? options[0]?.startsAt ?? null
    : res.confirmed
      ? leader?.startsAt ?? null
      : null;
  const status = res.confirmed ? "CONFIRMED" : "PROPOSED";
  const isPoll = multi && !res.confirmed;

  if (
    startsAt?.getTime() !== event.startsAt?.getTime() ||
    status !== event.status ||
    isPoll !== event.isPoll
  ) {
    await prisma.event.update({ where: { id: eventId }, data: { startsAt, status, isPoll } });
  }
}
