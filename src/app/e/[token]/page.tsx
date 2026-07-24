import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveQuorum } from "@/lib/quorum";
import { vote, lockOption, cancelEvent } from "@/lib/actions";
import { QuorumMeter } from "@/components/QuorumMeter";
import { StatusChip } from "@/components/StatusChip";
import { When } from "@/components/When";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ShareButton } from "@/components/ShareButton";
import { RsvpPanel } from "@/components/RsvpPanel";
import { NameField } from "@/components/NameField";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: PageProps<"/e/[token]">) {
  const { token } = await params;
  const [user, event] = await Promise.all([
    getUser(),
    prisma.event.findUnique({
      where: { inviteToken: token },
      include: {
        creator: true,
        group: true,
        rsvps: { include: { user: true }, orderBy: { updatedAt: "asc" } },
        pollOptions: { include: { votes: { include: { user: true } } }, orderBy: { startsAt: "asc" } },
      },
    }),
  ]);
  if (!event) notFound();

  const q = resolveQuorum(event.rsvps, event.minQuorum);
  const mine = user ? event.rsvps.find((r) => r.userId === user.id) : undefined;
  const isCreator = user?.id === event.creatorId;
  const attendingSet = new Set(q.attending);

  return (
    <main className="flex flex-col gap-6">
      <AutoRefresh seconds={8} />
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Home" className="chip">←</Link>
        <StatusChip status={event.status} isPoll={event.isPoll} />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {event.emoji ? `${event.emoji} ` : ""}{event.title}
        </h1>
        <p className="text-base" style={{ color: "var(--color-ink-2)" }}>
          {event.isPoll ? (
            "Vote on a time below"
          ) : event.startsAt ? (
            <When iso={event.startsAt.toISOString()} flexMinutes={event.flexMinutes} />
          ) : null}
          {event.group ? ` · ${event.group.name}` : ""} · by {event.creator.name}
        </p>
      </div>

      {!event.isPoll && event.status !== "CANCELLED" && (
        <div className="card flex flex-col gap-4 p-5">
          <QuorumMeter attending={q.attending.length} minQuorum={event.minQuorum} confirmed={q.confirmed} />
          <RsvpPanel
            eventId={event.id}
            known={!!user}
            myState={mine?.state ?? null}
            myMin={mine?.personalMin ?? 0}
          />
        </div>
      )}

      {event.isPoll && event.status !== "CANCELLED" && (
        <div className="card flex flex-col gap-3 p-5">
          <span className="label">When works? Tap all that do.</span>
          {event.pollOptions.map((o) => {
            const votedByMe = user ? o.votes.some((v) => v.userId === user.id) : false;
            const top = Math.max(1, ...event.pollOptions.map((p) => p.votes.length));
            return (
              <div key={o.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <form action={vote} className="flex-1">
                    <input type="hidden" name="optionId" value={o.id} />
                    <NameField known={!!user} />
                    <button
                      className="chip w-full justify-between text-left"
                      data-on={votedByMe}
                      style={{ display: "flex" }}
                    >
                      <When iso={o.startsAt.toISOString()} />
                      <span className="font-bold">{o.votes.length} ✋</span>
                    </button>
                  </form>
                  {isCreator && (
                    <form action={lockOption}>
                      <input type="hidden" name="optionId" value={o.id} />
                      <button className="btn btn-mint px-3 py-1.5 text-sm">Lock in</button>
                    </form>
                  )}
                </div>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    background: "var(--color-accent-2)",
                    width: `${(o.votes.length / top) * 100}%`,
                    opacity: o.votes.length ? 1 : 0,
                    transition: "width 220ms var(--ease-out)",
                  }}
                />
                {o.votes.length > 0 && (
                  <span className="text-xs" style={{ color: "var(--color-ink-2)" }}>
                    {o.votes.map((v) => v.user.name).join(", ")}
                  </span>
                )}
              </div>
            );
          })}
          {isCreator && (
            <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
              You created this — lock in the winning time when the votes are in.
            </p>
          )}
        </div>
      )}

      {event.status === "CANCELLED" && (
        <div className="card p-5 text-center font-semibold" style={{ color: "var(--color-ink-2)" }}>
          This plan was called off.
        </div>
      )}

      {!event.isPoll && event.rsvps.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label">Who&apos;s in</h2>
          <div className="flex flex-col gap-1.5">
            {event.rsvps.map((r) => {
              const attending = attendingSet.has(r.userId);
              const waiting = r.state === "IN" && !attending;
              return (
                <div key={r.userId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {r.user.name}
                    {r.userId === user?.id ? " (you)" : ""}
                  </span>
                  <span style={{ color: "var(--color-ink-2)" }}>
                    {attending
                      ? "In ✓"
                      : waiting
                        ? `Waiting for ${r.personalMin}+`
                        : "Out"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3">
        <ShareButton path={`/e/${event.inviteToken}`} title={event.title} />
        {isCreator && event.status !== "CANCELLED" && (
          <form action={cancelEvent}>
            <input type="hidden" name="eventId" value={event.id} />
            <button className="text-sm font-semibold" style={{ color: "var(--color-accent-3)" }}>
              Call it off
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
