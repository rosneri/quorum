import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createGroup } from "@/lib/actions";
import { NameField } from "@/components/NameField";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function NewGroup() {
  const { t, locale } = await getT();
  const user = await getUser();
  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label={t("back")} className="chip">{locale === "he" ? "→" : "←"}</Link>
        <h1 className="text-2xl font-extrabold">{t("newGroupTitle")}</h1>
      </header>
      <form action={createGroup} className="card flex flex-col gap-4 p-5">
        <NameField known={!!user} />
        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="groupName">{t("groupName")}</label>
          <input
            id="groupName"
            name="groupName"
            required
            maxLength={60}
            placeholder={t("groupPlaceholder")}
            className="field text-lg"
          />
        </div>
        <button className="btn text-lg">{t("createGroup")}</button>
        <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
          {t("groupLinkHint")}
        </p>
      </form>
    </main>
  );
}
