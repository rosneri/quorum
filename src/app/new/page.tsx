import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewEventForm } from "@/components/NewEventForm";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function NewPlan({ searchParams }: PageProps<"/new">) {
  const { t, locale } = await getT();
  const user = await getUser();
  const { g } = await searchParams;
  const groups = user
    ? await prisma.group.findMany({
        where: { memberships: { some: { userId: user.id } } },
        select: { id: true, name: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label={t("back")} className="chip">{locale === "he" ? "→" : "←"}</Link>
          <h1 className="text-2xl font-extrabold">{t("newPlanTitle")}</h1>
        </div>
        <LocaleToggle />
      </header>
      <NewEventForm
        known={!!user}
        groups={groups}
        defaultGroupId={typeof g === "string" ? g : undefined}
      />
    </main>
  );
}
