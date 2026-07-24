import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { formatWhen } from "@/lib/format";
import { isPast, isLive } from "@/lib/status";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Quorum plan";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { t, locale, dict } = await getT();
  const { token } = await params;
  const event = await prisma.event.findUnique({
    where: { inviteToken: token },
    include: { creator: true, group: true },
  });

  if (!event) {
    return ogCard({ title: t("planMissing"), pill: { label: "Quorum", tone: "quiet" } });
  }

  const dir = locale === "he" ? "rtl" : "ltr";
  const when = event.startsAt
    ? formatWhen(event.startsAt, event.flexMinutes, locale, dict)
    : t("voteOnTimeBelow");
  const subtitle = event.group
    ? `${when} · ${event.group.name} · ${t("by", { name: event.creator.name })}`
    : `${when} · ${t("by", { name: event.creator.name })}`;

  let pill: { label: string; tone: "mint" | "accent" | "quiet" };
  if (event.status === "CANCELLED") pill = { label: t("stCancelled"), tone: "quiet" };
  else if (isLive(event)) pill = { label: t("stLive"), tone: "mint" };
  else if (isPast(event)) pill = { label: t("stDone"), tone: "quiet" };
  else if (event.isPoll) pill = { label: t("stVoting"), tone: "accent" };
  else if (event.status === "CONFIRMED") pill = { label: t("stConfirmed"), tone: "mint" };
  else pill = { label: t("stGathering"), tone: "accent" };

  return ogCard({ emoji: event.emoji, title: event.title, subtitle, pill, dir });
}
