import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveQuorum } from "@/lib/quorum";
import { vote, lockOption, onboard } from "@/lib/actions";
import { CancelButton } from "@/components/CancelButton";
import { AvailabilityPanel } from "@/components/AvailabilityPanel";
import { LockCustom } from "@/components/LockCustom";
import { AddToCalendar } from "@/components/AddToCalendar";
import { availableUserIds } from "@/lib/availability";
import { QuorumMeter } from "@/components/QuorumMeter";
import { StatusChip } from "@/components/StatusChip";
import { When, TimeOnly } from "@/components/When";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ShareButton } from "@/components/ShareButton";
import { RsvpPanel } from "@/components/RsvpPanel";
import { NameField } from "@/components/NameField";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: PageProps<"/e/[token]">) {
  const { t, locale } = await getT();
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
        availabilities: { include: { user: true }, orderBy: { from: "asc" } },
      },
    }),
  ]);
  if (!event) notFound();

  const q = resolveQuorum(event.rsvps, event.minQuorum);
  const mine = user ? event.rsvps.find((r) => r.userId === user.id) : undefined;
  if (event.status === "CANCELLED") {
    return (
      <main className="flex min-h-[75dvh] flex-col items-center justify-center gap-5 text-center">
        <span className="text-6xl pop-in">🌧️</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{t("calledOff")}</h1>
          <p className="text-lg font-semibold" style={{ color: "var(--color-ink-2)" }}>
            {event.emoji ? `${event.emoji} ` : ""}{event.title}
          </p>
          {event.startsAt && (
            <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
              {t("wasSetFor")} <When iso={event.startsAt.toISOString()} flexMinutes={event.flexMinutes} />
            </p>
          )}
        </div>
        <p className="max-w-xs text-sm" style={{ color: "var(--color-ink-2)" }}>
          {t("cancelledBlurb")}
        </p>
        <div className="flex gap-3">
          <Link href="/new" className="btn">{t("startNewPlan")}</Link>
          <Link href="/" className="btn btn-quiet">{t("home")}</Link>
        </div>
      </main>
    );
  }

  const isCreator = user?.id === event.creatorId;
  const attendingSet = new Set(q.attending);
  const wasPoll = !event.isPoll && event.pollOptions.length > 0;
  const nameById = new Map(event.availabilities.map((a) => [a.userId, a.user.name]));

  return (
    <main className="flex flex-col gap-6">
      <AutoRefresh seconds={8} />
      <header className="flex items-center gap-3">
        <Link href="/" aria-label={t("home")} className="chip">{locale === "he" ? "→" : "←"}</Link>
        <StatusChip status={event.status} isPoll={event.isPoll} />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {event.emoji ? `${event.emoji} ` : ""}{event.title}
        </h1>
        <p className="text-base" style={{ color: "var(--color-ink-2)" }}>
          {event.isPoll ? (
            t("voteOnTimeBelow")
          ) : event.startsAt ? (
            <When iso={event.startsAt.toISOString()} flexMinutes={event.flexMinutes} />
          ) : null}
          {event.group ? ` · ${event.group.name}` : ""} · {t("by", { name: event.creator.name })}
        </p>
        {wasPoll && event.startsAt && (
          <span
            className="self-start rounded-full px-2.5 py-1 text-xs font-bold pop-in"
            style={{ background: "var(--color-accent-2)" }}
          >
            {t("decidedByVote")}
          </span>
        )}
      </div>

      {!event.isPoll && event.startsAt && (
        <AddToCalendar
          token={event.inviteToken}
          title={`${event.emoji ? event.emoji + " " : ""}${event.title}`}
          startsAtIso={event.startsAt.toISOString()}
        />
      )}

      {!event.isPoll && (
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

      {event.isPoll && (
        <div className="card flex flex-col gap-3 p-5">
          <span className="label">{t("whenWorks")}</span>
          {!user && (
            <form action={onboard} className="flex flex-col gap-3">
              <input type="hidden" name="redirectTo" value={`/e/${event.inviteToken}`} />
              <NameField known={false} />
              <button className="btn self-start text-sm">{t("saveNameVote")}</button>
            </form>
          )}
          {event.pollOptions.map((o) => {
            const votedByMe = user ? o.votes.some((v) => v.userId === user.id) : false;
            const top = Math.max(1, ...event.pollOptions.map((p) => p.votes.length));
            const freeHere = availableUserIds(event.availabilities, o.startsAt);
            return (
              <div key={o.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <form action={vote} className="flex-1">
                    <input type="hidden" name="optionId" value={o.id} />
                    <button
                      className="chip w-full justify-between text-left"
                      data-on={votedByMe}
                      disabled={!user}
                      style={{ display: "flex", opacity: user ? 1 : 0.6 }}
                    >
                      <When iso={o.startsAt.toISOString()} />
                      <span className="font-bold">
                        {o.votes.length} ✋
                        {freeHere.length > 0 && (
                          <span style={{ color: "var(--color-mint-deep)" }}> · {t("nFree", { n: freeHere.length })}</span>
                        )}
                      </span>
                    </button>
                  </form>
                  {isCreator && (
                    <form action={lockOption}>
                      <input type="hidden" name="optionId" value={o.id} />
                      <button className="btn btn-mint px-3 py-1.5 text-sm">{t("lockIn")}</button>
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
          {event.availabilities.length > 0 && (
            <div className="mt-1 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
              <span className="label">{t("freeWhen")}</span>
              {event.availabilities.map((a) => (
                <div key={a.userId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {nameById.get(a.userId)}
                    {a.userId === user?.id ? ` (${t("you")})` : ""}
                  </span>
                  <span style={{ color: "var(--color-ink-2)" }}>
                    <When iso={a.from.toISOString()} />
                    {a.until && (
                      <>
                        {" – "}
                        <TimeOnly iso={a.until.toISOString()} />
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {user && (
            <div className="border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
              <AvailabilityPanel
                eventId={event.id}
                known={!!user}
                mine={(() => {
                  const m = event.availabilities.find((a) => a.userId === user.id);
                  return m ? { from: m.from.toISOString(), until: m.until?.toISOString() ?? null } : null;
                })()}
              />
            </div>
          )}
          {isCreator && (
            <>
              <LockCustom eventId={event.id} />
              <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
                {t("creatorHint")}
              </p>
            </>
          )}
        </div>
      )}

      {!event.isPoll && event.rsvps.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label">{t("whosIn")}</h2>
          <div className="flex flex-col gap-1.5">
            {event.rsvps.map((r) => {
              const attending = attendingSet.has(r.userId);
              const waiting = r.state === "IN" && !attending;
              return (
                <div key={r.userId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {r.user.name}
                    {r.userId === user?.id ? ` (${t("you")})` : ""}
                  </span>
                  <span style={{ color: "var(--color-ink-2)" }}>
                    {attending
                      ? t("rIn")
                      : waiting
                        ? t("waitingFor", { n: r.personalMin })
                        : t("rOut")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex items-center gap-3">
        <ShareButton path={`/e/${event.inviteToken}`} title={event.title} />
        {isCreator && <CancelButton eventId={event.id} />}
      </div>
    </main>
  );
}
