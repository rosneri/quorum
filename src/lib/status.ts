import { prisma } from "./db";
import { resolveQuorum } from "./quorum";

/** How long after an event's window a timed plan lingers before it's "past". */
export const PAST_GRACE_MS = 3 * 3_600_000;

/** A timed plan is behind us once its start (+ flex + grace) has passed. Polls never count. */
export function isPast(event: {
  isPoll: boolean;
  startsAt: Date | null;
  flexMinutes: number | null;
}, now: number = Date.now()): boolean {
  if (event.isPoll || !event.startsAt) return false;
  const end = event.startsAt.getTime() + (event.flexMinutes ?? 0) * 60_000 + PAST_GRACE_MS;
  return now >= end;
}

/** Recompute PROPOSED/CONFIRMED from rsvps; never touches CANCELLED/DONE. */
export async function syncEventStatus(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: true },
  });
  if (!event || event.status === "CANCELLED" || event.status === "DONE") return;
  if (event.isPoll) return;
  const q = resolveQuorum(event.rsvps);
  const next = q.confirmed ? "CONFIRMED" : "PROPOSED";
  if (next !== event.status) {
    await prisma.event.update({ where: { id: eventId }, data: { status: next } });
  }
}
