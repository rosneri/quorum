import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveQuorum } from "@/lib/quorum";
import { QuorumMeter } from "@/components/QuorumMeter";
import { StatusChip } from "@/components/StatusChip";
import { When } from "@/components/When";
import { ShareButton } from "@/components/ShareButton";
import { getT } from "@/lib/i18n";
import { GroupAdmin, KickableMember } from "@/components/GroupAdmin";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: PageProps<"/g/[id]">) {
  const { t, locale } = await getT();
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/");

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: true }, orderBy: { joinedAt: "asc" } },
      events: {
        where: {
          status: { in: ["PROPOSED", "CONFIRMED"] },
          OR: [{ startsAt: null }, { startsAt: { gte: new Date(Date.now() - 3 * 3_600_000) } }],
        },
        include: { rsvps: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!group) notFound();
  if (!group.memberships.some((m) => m.userId === userId)) {
    redirect(`/g/join/${group.inviteToken}`);
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label={t("home")} className="chip">{locale === "he" ? "→" : "←"}</Link>
        <h1 className="text-2xl font-extrabold">{group.name}</h1>
      </header>

      <div className="flex gap-3">
        <Link href={`/new?g=${group.id}`} className="btn flex-1">{t("newPlan")}</Link>
        <ShareButton path={`/g/join/${group.inviteToken}`} title={t("joinTitle", { name: group.name })} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="label">{t("plans")}</h2>
        {group.events.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {t("noGroupPlans")}
          </p>
        )}
        {group.events.map((e) => {
          const q = resolveQuorum(e.rsvps, e.minQuorum);
          return (
            <Link key={e.id} href={`/e/${e.inviteToken}`} className="card flex flex-col gap-2.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-lg font-bold">
                  {e.emoji ? `${e.emoji} ` : ""}{e.title}
                </span>
                <StatusChip status={e.status} isPoll={e.isPoll} />
              </div>
              {e.startsAt && (
                <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>
                  <When iso={e.startsAt.toISOString()} flexMinutes={e.flexMinutes} />
                </span>
              )}
              {!e.isPoll && (
                <QuorumMeter attending={q.attending.length} minQuorum={e.minQuorum} confirmed={q.confirmed} />
              )}
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="label">{t("membersLabel")}</h2>
        <div className="flex flex-wrap gap-1.5">
          {group.memberships.map((m) => (
            <KickableMember
              key={m.userId}
              groupId={group.id}
              userId={m.userId}
              name={m.user.name}
              isSelf={m.userId === userId}
              canKick={group.adminId === userId}
            />
          ))}
        </div>
      </section>

      {group.adminId === userId && <GroupAdmin groupId={group.id} name={group.name} />}
    </main>
  );
}
