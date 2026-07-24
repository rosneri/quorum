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
import { SubmitButton } from "@/components/SubmitButton";
import { reopenEvent, removeAvailability } from "@/lib/actions";
import { LocaleToggle } from "@/components/LocaleToggle";
import { isPast } from "@/lib/status";
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

  const q = resolveQuorum(event.rsvps);
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
        <div className="flex flex-wrap justify-center gap-3">
          {mine && (
            <form action={reopenEvent}>
              <input type="hidden" name="eventId" value={event.id} />
              <SubmitButton className="btn">{t("reopenPlan")}</SubmitButton>
            </form>
          )}
          <Link href="/new" className="btn btn-quiet">{t("startNewPlan")}</Link>
          <Link href="/" className="btn btn-quiet">{t("home")}</Link>
        </div>
      </main>
    );
  }

  const isCreator = user?.id === event.creatorId;
  const past = isPast(event);
  const wasEdited = !!event.editedAt && event.editedAt.getTime() > event.createdAt.getTime();
  const attendingSet = new Set(q.attending);
  const wasPoll = !event.isPoll && event.pollOptions.length > 0;
  const topVotes = Math.max(0, ...event.pollOptions.map((p) => p.votes.length));
  const nameById = new Map(event.availabilities.map((a) => [a.userId, a.user.name]));

  return (
    <main className="flex flex-col gap-6">
      <AutoRefresh seconds={8} />
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label={t("home")} className="chip">{locale === "he" ? "→" : "←"}</Link>
          <StatusChip status={event.status} isPoll={event.isPoll} isPast={past} />
        </div>
        <LocaleToggle />
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {event.emoji ? `${event.emoji} ` : ""}{event.title}
          </h1>
          {!event.isPoll && event.startsAt && (
            <AddToCalendar
              token={event.inviteToken}
              title={`${event.emoji ? event.emoji + " " : ""}${event.title}`}
              startsAtIso={event.startsAt.toISOString()}
            />
          )}
        </div>
        <p className="text-base" style={{ color: "var(--color-ink-2)" }}>
          {event.isPoll ? (
            t("voteOnTimeBelow")
          ) : event.startsAt ? (
            <When iso={event.startsAt.toISOString()} flexMinutes={event.flexMinutes} />
          ) : null}
          {event.group ? ` · ${event.group.name}` : ""} · {t("by", { name: event.creator.name })}
        </p>
        <div className="flex flex-wrap gap-2">
          {wasPoll && event.startsAt && (
            <span
              className="self-start rounded-full px-2.5 py-1 text-xs font-bold pop-in"
              style={{ background: "var(--color-accent-2)" }}
            >
              {t("decidedByVote")}
            </span>
          )}
          {wasEdited && !past && (
            <span
              className="self-start rounded-full px-2.5 py-1 text-xs font-bold pop-in"
              style={{ background: "var(--color-accent-2)" }}
            >
              {t("timeUpdated")}
            </span>
          )}
        </div>
      </div>

      {past && (
        <div className="card flex flex-col gap-1 p-5">
          <span className="text-lg font-bold">🌙 {t("behindUs")}</span>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>{t("behindUsBlurb")}</p>
        </div>
      )}

      {!event.isPoll && !past && (
        <div className="card flex flex-col gap-4 p-5">
          <QuorumMeter
            attending={q.attending.length}
            confirmed={q.confirmed}
            soloMaybe={mine?.state === "MAYBE" && event.rsvps.length === 1}
          />
          <RsvpPanel
            eventId={event.id}
            known={!!user}
            myState={mine?.state ?? null}
            myMin={mine?.personalMin ?? 0}
            lastOneIn={
              mine?.state === "IN" &&
              !event.rsvps.some((r) => r.state === "IN" && r.userId !== user?.id)
            }
          />
        </div>
      )}

      {event.isPoll && !past && (
        <div className="card flex flex-col gap-3 p-5">
          <span className="label">{t("whenWorks")}</span>
          {!event.publicVotes && (
            <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("votesPrivate")}</p>
          )}
          {!user && (
            <form action={onboard} className="flex flex-col gap-3">
              <input type="hidden" name="redirectTo" value={`/e/${event.inviteToken}`} />
              <NameField known={false} />
              <SubmitButton className="btn self-start text-sm">{t("saveNameVote")}</SubmitButton>
            </form>
          )}
          {event.pollOptions.map((o) => {
            const votedByMe = user ? o.votes.some((v) => v.userId === user.id) : false;
            const top = Math.max(1, ...event.pollOptions.map((p) => p.votes.length));
            const freeHere = availableUserIds(event.availabilities, o.startsAt);
            return (
              <div key={o.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <form action={vote} className="min-w-0 flex-1">
                    <input type="hidden" name="optionId" value={o.id} />
                    <SubmitButton
                      className="chip w-full items-center justify-between text-left"
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
                    </SubmitButton>
                  </form>
                  {isCreator && (
                    <form action={lockOption} className="shrink-0">
                      <input type="hidden" name="optionId" value={o.id} />
                      <SubmitButton className="btn btn-mint px-3 py-1.5 text-sm">{t("lockIn")}</SubmitButton>
                    </form>
                  )}
                </div>
                {o.votes.length > 0 && (
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      background: "var(--color-accent-2)",
                      width: `${(o.votes.length / top) * 100}%`,
                      transition: "width 220ms var(--ease-out)",
                    }}
                  />
                )}
                {(event.publicVotes || isCreator) && o.votes.length > 0 && (
                  <span className="text-xs" style={{ color: "var(--color-ink-2)" }}>
                    {topVotes === o.votes.length ? "🏆 " : ""}{o.votes.map((v) => v.user.name).join(", ")}
                  </span>
                )}
              </div>
            );
          })}
          {event.availabilities.length > 0 && (event.publicVotes || isCreator) && (
            <div className="mt-1 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
              <span className="label">{t("freeWhen")}</span>
              {event.availabilities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {nameById.get(a.userId)}
                    {a.userId === user?.id ? ` (${t("you")})` : ""}
                  </span>
                  <span className="flex items-center gap-2" style={{ color: "var(--color-ink-2)" }}>
                    <When iso={a.from.toISOString()} />
                    {a.until && (
                      <>
                        {" – "}
                        <TimeOnly iso={a.until.toISOString()} />
                      </>
                    )}
                    {a.userId === user?.id && (
                      <form action={removeAvailability} className="inline-flex">
                        <input type="hidden" name="id" value={a.id} />
                        <SubmitButton
                          aria-label="✕"
                          className="inline-flex items-center font-bold"
                          style={{ color: "var(--color-accent-3)" }}
                        >
                          ✕
                        </SubmitButton>
                      </form>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {user && (
            <div className="border-t pt-3" style={{ borderColor: "var(--color-paper-3)" }}>
<AvailabilityPanel eventId={event.id} known={!!user} />
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

      {!event.isPoll && event.rsvps.length > 0 && !(event.publicVotes || isCreator) && (
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>{t("whosInPrivate")}</p>
      )}
      {!event.isPoll && event.rsvps.length > 0 && (event.publicVotes || isCreator) && (
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
                        : r.state === "MAYBE"
                          ? `${t("rMaybe")} 🤔`
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
        {isCreator && !past && (
          <Link
            href={`/e/${event.inviteToken}/edit`}
            className="text-sm font-semibold"
            style={{ color: "var(--color-ink-2)" }}
          >
            {t("editPlan")}
          </Link>
        )}
        {isCreator && !past && <CancelButton eventId={event.id} />}
      </div>
    </main>
  );
}
