import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Join on Quorum";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { t, locale } = await getT();
  const { token } = await params;
  const group = await prisma.group.findUnique({
    where: { inviteToken: token },
    include: { _count: { select: { memberships: true } } },
  });

  if (!group) {
    return ogCard({ title: t("planMissing"), pill: { label: "Quorum", tone: "quiet" } });
  }

  const n = group._count.memberships;
  return ogCard({
    emoji: "👋",
    title: group.name,
    subtitle: `${t("invitedTo")} · ${n} ${n === 1 ? t("member") : t("members")} ${t("soFar")}`,
    pill: { label: t("joinGroup"), tone: "mint" },
    dir: locale === "he" ? "rtl" : "ltr",
  });
}
