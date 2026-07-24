import Link from "next/link";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getT } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-5 text-center">
      <div className="absolute right-4 top-4"><LocaleToggle /></div>
      <span className="text-5xl">🤷</span>
      <h1 className="text-2xl font-extrabold">{t("planMissing")}</h1>
      <p style={{ color: "var(--color-ink-2)" }}>
        {t("planMissingBlurb")}
      </p>
      <Link href="/" className="btn">
        {t("backHome")}
      </Link>
    </main>
  );
}
