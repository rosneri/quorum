import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveQuorum } from "@/lib/quorum";
import { planTiming } from "@/lib/planTiming";
import { PlanCard } from "@/components/PlanCard";
import { ShareButton } from "@/components/ShareButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LocaleToggle } from "@/components/LocaleToggle";
import { PAST_GRACE_MS, isLive } from "@/lib/status";
import { getT } from "@/lib/i18n";
import {
  EditableGroupTitle,
  DeleteGroupButton,
  KickableMember,
  LeaveGroupButton,
} from "@/components/GroupAdmin";

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
          OR: [
            { startsAt: { gte: new Date(Date.now() - PAST_GRACE_MS) } },
            // polls have no time — age them out ~7 days after creation
            { AND: [{ startsAt: null }, { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }] },
          ],
        },
        include: {
          rsvps: true,
          pollOptions: {
            select: { id: true, startsAt: true, votes: { select: { userId: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!group) notFound();
  if (!group.memberships.some((m) => m.userId === userId)) {
    redirect(`/g/join/${group.inviteToken}`);
  }
  const isAdmin = group.adminId === userId;

  return (
    <main className="flex flex-col gap-6">
      <AutoRefresh seconds={20} />
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label={t("home")} className="chip">{locale === "he" ? "→" : "←"}</Link>
          {isAdmin ? (
            <EditableGroupTitle groupId={group.id} name={group.name} />
          ) : (
            <h1 className="text-2xl font-extrabold">{group.name}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <DeleteGroupButton groupId={group.id} />}
          <LocaleToggle />
        </div>
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
          const q = resolveQuorum(e.rsvps);
          const timing = planTiming(e);
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
              meter={e.isPoll ? null : { attending: q.attending.length, confirmed: q.confirmed }}
            />
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

      {!isAdmin && <LeaveGroupButton groupId={group.id} />}
    </main>
  );
}
