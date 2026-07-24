import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboard } from "@/lib/actions";
import { resolveQuorum } from "@/lib/quorum";
import { QuorumMeter } from "@/components/QuorumMeter";
import { StatusChip } from "@/components/StatusChip";
import { When } from "@/components/When";
import { AutoRefresh } from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="flex min-h-[70dvh] flex-col justify-center gap-8">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight">Quorum</h1>
          <p className="mt-3 text-lg" style={{ color: "var(--color-ink-2)" }}>
            Coffee in an hour? The plan happens only when enough friends are in.
          </p>
        </div>
        <form action={onboard} className="card flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="name">What should friends call you?</label>
            <input
              id="name"
              name="name"
              required
              maxLength={40}
              placeholder="Your name"
              className="field text-lg"
              autoComplete="given-name"
            />
          </div>
          <button className="btn text-lg">Let&apos;s go</button>
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
            No password, no email. Your name lives on this device.
          </p>
        </form>
      </main>
    );
  }

  const [events, groups] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: { in: ["PROPOSED", "CONFIRMED"] },
        OR: [
          { rsvps: { some: { userId: user.id } } },
          { group: { memberships: { some: { userId: user.id } } } },
        ],
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
        <h1 className="text-3xl font-extrabold tracking-tight">Quorum</h1>
        <span className="text-sm font-semibold" style={{ color: "var(--color-ink-2)" }}>
          Hi, {user.name}
        </span>
      </header>

      <Link href="/new" className="btn text-lg">
        + New plan
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="label">Plans</h2>
        {events.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            Nothing brewing yet. Make a plan and share the link.
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
                  "Time is up for a vote"
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
          <h2 className="label">Groups</h2>
          <Link href="/g/new" className="text-sm font-bold" style={{ color: "var(--color-accent-2)" }}>
            + New group
          </Link>
        </div>
        {groups.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            Groups keep your regulars one tap away.
          </p>
        )}
        {groups.map((g) => (
          <Link key={g.id} href={`/g/${g.id}`} className="card flex items-center justify-between p-4">
            <span className="font-bold">{g.name}</span>
            <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>
              {g._count.memberships} {g._count.memberships === 1 ? "member" : "members"}
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
