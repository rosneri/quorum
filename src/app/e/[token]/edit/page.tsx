import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { EditEventForm } from "@/components/EditEventForm";
import { LocaleToggle } from "@/components/LocaleToggle";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: PageProps<"/e/[token]/edit">) {
  const { t, locale } = await getT();
  const { token } = await params;
  const [userId, event] = await Promise.all([
    getUserId(),
    prisma.event.findUnique({
      where: { inviteToken: token },
      include: { pollOptions: { orderBy: { startsAt: "asc" } } },
    }),
  ]);
  if (!event) notFound();
  // organizer only — everyone else back to the plan
  if (!userId || event.creatorId !== userId || event.status === "CANCELLED") {
    redirect(`/e/${event.inviteToken}`);
  }

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/e/${event.inviteToken}`} aria-label={t("back")} className="chip">
            {locale === "he" ? "→" : "←"}
          </Link>
          <h1 className="text-2xl font-extrabold">{t("editPlanTitle")}</h1>
        </div>
        <LocaleToggle />
      </header>
      <EditEventForm
        eventId={event.id}
        title={event.title}
        emoji={event.emoji}
        optionIsos={event.pollOptions.map((o) => o.startsAt.toISOString())}
        flexMinutes={event.flexMinutes}
      />
    </main>
  );
}
