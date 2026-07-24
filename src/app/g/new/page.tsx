import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createGroup } from "@/lib/actions";
import { NameField } from "@/components/NameField";

export const dynamic = "force-dynamic";

export default async function NewGroup() {
  const user = await getUser();
  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="chip">←</Link>
        <h1 className="text-2xl font-extrabold">New group</h1>
      </header>
      <form action={createGroup} className="card flex flex-col gap-4 p-5">
        <NameField known={!!user} />
        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="groupName">Group name</label>
          <input
            id="groupName"
            name="groupName"
            required
            maxLength={60}
            placeholder="Tuesday coffee crew"
            className="field text-lg"
          />
        </div>
        <button className="btn text-lg">Create group</button>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
          You&apos;ll get an invite link to share — friends join with one tap.
        </p>
      </form>
    </main>
  );
}
