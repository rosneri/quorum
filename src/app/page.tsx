import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboard } from "@/lib/actions";
import { resolveQuorum } from "@/lib/quorum";
import { QuorumMeter } from "@/components/QuorumMeter";
import { StatusChip } from "@/components/StatusChip";
import { When } from "@/components/When";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { t } = await getT();
  const user = await getUser();

  if (!user) {
    return (
      <main className="flex min-h-[70dvh] flex-col justify-center gap-8">
        <div>
          <div className="flex items-start justify-between"><h1 className="text-5xl font-extrabold tracking-tight">{t("appName")}</h1><LocaleToggle /></div>
          <p className="mt-3 text-lg" style={{ color: "var(--color-ink-2)" }}>
            {t("tagline")}
          </p>
        </div>
        <form action={onboard} className="card flex flex-col gap-4 p-5">
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
          <button className="btn text-lg">{t("letsGo")}</button>
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
            {t("noPassword")}
          </p>
        </form>
      </main>
    );
  }

  const [events, groups] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: { in: ["PROPOSED", "CONFIRMED"] },
        // polls have no time yet; timed events drop off 3h after they start
        OR: [{ startsAt: null }, { startsAt: { gte: new Date(Date.now() - 3 * 3_600_000) } }],
        AND: {
          OR: [
            { rsvps: { some: { userId: user.id } } },
            { group: { memberships: { some: { userId: user.id } } } },
          ],
        },
      },
      include: { rsvps: true, group: true },
      orderBy: [{ startsAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.group.findMany({
      where: { memberships: { some: { userId: user.id } } },
      include: { _count: { select: { memberships: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <AutoRefresh seconds={20} />
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("appName")}</h1>
        <span className="text-sm font-semibold" style={{ color: "var(--color-ink-2)" }}>
          {t("hi", { name: user.name })}
        </span>
        <LocaleToggle />
      </header>

      <Link href="/new" className="btn text-lg">
        {t("newPlan")}
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="label">{t("plans")}</h2>
        {events.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {t("noPlans")}
          </p>
        )}
        {events.map((e) => {
          const q = resolveQuorum(e.rsvps, e.minQuorum);
          return (
            <Link key={e.id} href={`/e/${e.inviteToken}`} className="card flex flex-col gap-2.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg font-bold">
                  {e.emoji ? `${e.emoji} ` : ""}{e.title}
                </span>
                <StatusChip status={e.status} isPoll={e.isPoll} />
              </div>
              <div className="text-sm" style={{ color: "var(--color-ink-2)" }}>
                {e.isPoll ? (
                  t("votingOnTime")
                ) : e.startsAt ? (
                  <When iso={e.startsAt.toISOString()} flexMinutes={e.flexMinutes} />
                ) : null}
                {e.group ? ` · ${e.group.name}` : ""}
              </div>
              {!e.isPoll && (
                <QuorumMeter attending={q.attending.length} minQuorum={e.minQuorum} confirmed={q.confirmed} />
              )}
            </Link>
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
    </main>
  );
}
