import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboard } from "@/lib/actions";
import { resolveQuorum } from "@/lib/quorum";
import { planTiming } from "@/lib/planTiming";
import { PlanCard } from "@/components/PlanCard";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LocaleToggle } from "@/components/LocaleToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { isLive, isPast } from "@/lib/status";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t } = await getT();
  const user = await getUser();

  if (!user) {
    const steps = [
      { emoji: "💡", title: t("how1"), body: t("how1Body") },
      { emoji: "🔗", title: t("how2"), body: t("how2Body") },
      { emoji: "🎉", title: t("how3"), body: t("how3Body") },
    ];
    return (
      <main className="flex min-h-[75dvh] flex-col justify-center gap-8 py-6">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-4xl pop-in" aria-hidden>☕️</span>
              <h1 className="text-5xl font-extrabold tracking-tight">{t("appName")}</h1>
            </div>
            <LocaleToggle />
          </div>
          <p className="mt-4 text-2xl font-bold leading-snug">{t("tagline")}</p>
          <p className="mt-3 text-lg" style={{ color: "var(--color-ink-2)" }}>
            {t("heroPitch")}
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="card flex items-start gap-3.5 p-4">
              <span className="text-2xl pop-in" aria-hidden style={{ animationDelay: `${i * 90}ms` }}>
                {s.emoji}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{s.title}</span>
                <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>{s.body}</span>
              </div>
            </li>
          ))}
        </ol>

        <form action={onboard} className="card flex flex-col gap-4 p-5">
          <span className="label">{t("startHere")}</span>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="name">{t("whatToCallYou")}</label>
            <input
              id="name"
              name="name"
              required
              maxLength={40}
              placeholder={t("yourName")}
              className="field text-lg"
              autoComplete="given-name"
            />
          </div>
          <SubmitButton className="btn text-lg">{t("letsGo")}</SubmitButton>
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
            {t("noPassword")}
          </p>
        </form>
        <Link
          href="/account"
          className="self-center text-sm font-bold"
          style={{ color: "var(--color-accent-2)" }}
        >
          {t("haveAccountSignIn")}
        </Link>
      </main>
    );
  }

  const [events, groups] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: { in: ["PROPOSED", "CONFIRMED"] },
        // Keep recent past events around (up to 30 days) so they can show in the
        // "past & declined" section; polls with no time age out ~7 days after
        // creation. Live partitioning into upcoming vs past happens below.
        OR: [
          { startsAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
          { AND: [{ startsAt: null }, { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }] },
        ],
        AND: {
          OR: [
            { rsvps: { some: { userId: user.id } } },
            { group: { memberships: { some: { userId: user.id } } } },
          ],
        },
      },
      include: {
        rsvps: true,
        group: true,
        // all candidate times (with votes) drive the range + leading date; the
        // `suggested` flag also feeds the owner's "new suggestions" badge
        pollOptions: {
          select: { id: true, startsAt: true, suggested: true, votes: { select: { userId: true } } },
        },
      },
      orderBy: [{ startsAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
      take: 60,
    }),
    prisma.group.findMany({
      where: { memberships: { some: { userId: user.id } } },
      include: { _count: { select: { memberships: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Split plans: upcoming ones stay up top; anything past or that I declined
  // drops into its own section below the groups.
  const myState = (e: (typeof events)[number]) =>
    e.rsvps.find((r) => r.userId === user.id)?.state;
  const isArchived = (e: (typeof events)[number]) => isPast(e) || myState(e) === "OUT";
  const upcoming = events.filter((e) => !isArchived(e));
  const archived = events
    .filter(isArchived)
    .sort(
      (a, b) =>
        (b.startsAt?.getTime() ?? b.createdAt.getTime()) -
        (a.startsAt?.getTime() ?? a.createdAt.getTime())
    );

  return (
    <main className="flex flex-col gap-8">
      <AutoRefresh seconds={20} />
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
        <Link
          href="/account"
          className="text-sm font-semibold"
          style={{ color: "var(--color-ink-2)" }}
        >
          {t("hi", { name: user.name })}{user.authId ? "" : ` · ${t("account")}`}
        </Link>
        <LocaleToggle />
      </header>

      <Link href="/new" className="btn text-lg">
        {t("newPlan")}
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="label">{t("plans")}</h2>
        {upcoming.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {t("noPlans")}
          </p>
        )}
        {upcoming.map((e) => {
          const q = resolveQuorum(e.rsvps);
          const timing = planTiming(e);
          const suggestedCount =
            e.creatorId === user.id ? e.pollOptions.filter((o) => o.suggested).length : 0;
          return (
            <PlanCard
              key={e.id}
              href={`/e/${e.inviteToken}`}
              emoji={e.emoji}
              title={e.title}
              status={e.status}
              isPoll={e.isPoll}
              isLive={isLive(e)}
              chosenIso={timing.chosen?.toISOString()}
              flexMinutes={e.flexMinutes}
              rangeStartIso={timing.rangeStart?.toISOString()}
              rangeEndIso={timing.rangeEnd?.toISOString()}
              leadingIso={timing.leading?.toISOString()}
              multi={timing.multi}
              groupName={e.group?.name}
              meter={e.isPoll ? null : { attending: q.attending.length, confirmed: q.confirmed }}
              badge={
                suggestedCount > 0 ? (
                  <span
                    className="self-start rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ background: "var(--color-accent-2)", color: "white" }}
                  >
                    🔔 {t("newSuggestions", { n: suggestedCount })}
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="label">{t("groups")}</h2>
          <Link href="/g/new" className="text-sm font-bold" style={{ color: "var(--color-accent-2)" }}>
            {t("newGroup")}
          </Link>
        </div>
        {groups.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {t("groupsHint")}
          </p>
        )}
        {groups.map((g) => (
          <Link key={g.id} href={`/g/${g.id}`} className="card flex items-center justify-between p-4">
            <span className="font-bold">{g.name}</span>
            <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>
              {g._count.memberships} {g._count.memberships === 1 ? t("member") : t("members")}
            </span>
          </Link>
        ))}
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="label">{t("archiveTitle")}</h2>
          {archived.map((e) => {
            const declined = myState(e) === "OUT";
            const timing = planTiming(e);
            return (
              <PlanCard
                key={e.id}
                href={`/e/${e.inviteToken}`}
                emoji={e.emoji}
                title={e.title}
                status={e.status}
                isPoll={e.isPoll}
                isPast={isPast(e)}
                chosenIso={timing.chosen?.toISOString()}
                flexMinutes={e.flexMinutes}
                rangeStartIso={timing.rangeStart?.toISOString()}
                rangeEndIso={timing.rangeEnd?.toISOString()}
                leadingIso={timing.leading?.toISOString()}
                multi={timing.multi}
                groupName={e.group?.name}
                muted
                statusSlot={declined ? <span className="chip">{t("youDeclined")}</span> : undefined}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}
