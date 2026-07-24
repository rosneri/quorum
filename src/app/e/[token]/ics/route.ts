import { prisma } from "@/lib/db";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(req: Request, ctx: RouteContext<"/e/[token]/ics">) {
  const { token } = await ctx.params;
  const event = await prisma.event.findUnique({
    where: { inviteToken: token },
    include: { rsvps: true },
  });
  if (!event || !event.startsAt) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const pageUrl = `${url.origin}/e/${event.inviteToken}`;
  const start = event.startsAt;
  const end = new Date(start.getTime() + 90 * 60_000);
  const title = `${event.emoji ? event.emoji + " " : ""}${event.title}`;
  const flexNote = event.flexMinutes ? ` (flexible ±${event.flexMinutes} min)` : "";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quorum//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@quorum`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(`Planned on Quorum${flexNote}. Details: ${pageUrl}`)}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="quorum-${event.inviteToken}.ics"`,
    },
  });
}
