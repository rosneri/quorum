import { prisma } from "./db";
import { resolveQuorum } from "./quorum";

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
