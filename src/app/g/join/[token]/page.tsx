import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { joinGroup } from "@/lib/actions";
import { NameField } from "@/components/NameField";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getT } from "@/lib/i18n";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function JoinGroup({ params }: PageProps<"/g/join/[token]">) {
  const { t } = await getT();
  const { token } = await params;
  const [userId, group] = await Promise.all([
    getUserId(),
    prisma.group.findUnique({
      where: { inviteToken: token },
      include: { _count: { select: { memberships: true } } },
    }),
  ]);
  if (!group) notFound();

  if (userId) {
    const member = await prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId: group.id } },
    });
    if (member) redirect(`/g/${group.id}`);
  }

  return (
    <main className="flex min-h-[70dvh] flex-col justify-center gap-6">
      <div className="flex justify-end"><LocaleToggle /></div>
      <div>
        <p className="label">{t("invitedTo")}</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight">{group.name}</h1>
        <p className="mt-2" style={{ color: "var(--color-ink-2)" }}>
          {group._count.memberships} {group._count.memberships === 1 ? t("member") : t("members")} {t("soFar")}
        </p>
      </div>
      <form action={joinGroup} className="card flex flex-col gap-4 p-5">
        <input type="hidden" name="token" value={group.inviteToken} />
        <NameField known={!!userId} />
        <SubmitButton className="btn text-lg">{t("joinGroup")}</SubmitButton>
      </form>
    </main>
  );
}
