import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewEventForm } from "@/components/NewEventForm";

export const dynamic = "force-dynamic";

export default async function NewPlan({ searchParams }: PageProps<"/new">) {
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
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="chip">←</Link>
        <h1 className="text-2xl font-extrabold">New plan</h1>
      </header>
      <NewEventForm
        known={!!user}
        groups={groups}
        defaultGroupId={typeof g === "string" ? g : undefined}
      />
    </main>
  );
}
