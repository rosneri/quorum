import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signIn, signUp, signOut } from "@/lib/account";
import { LocaleToggle } from "@/components/LocaleToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ERROR_KEYS = {
  invalid: "errInvalid",
  emailTaken: "errEmailTaken",
  credentials: "errCredentials",
  unconfirmed: "errUnconfirmed",
  authFailed: "errAuthFailed",
} as const;

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { t, locale } = await getT();
  const sp = await searchParams;
  const rawError = typeof sp.error === "string" ? sp.error : "";
  const errorKey = rawError in ERROR_KEYS ? ERROR_KEYS[rawError as keyof typeof ERROR_KEYS] : null;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "";
  const user = await getUser();

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label={t("home")} className="chip">{locale === "he" ? "→" : "←"}</Link>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("accountTitle")}</h1>
        </div>
        <LocaleToggle />
      </header>

      {errorKey && (
        <p
          className="rounded-xl px-4 py-3 text-sm font-semibold pop-in"
          style={{ background: "var(--color-accent-2)" }}
        >
          {t(errorKey)}
        </p>
      )}

      {user?.authId ? (
        <div className="card flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold">{t("hi", { name: user.name })}</span>
            <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>
              {t("signedInAs", { email: user.email ?? "" })}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {t("accountLinkedBlurb")}
          </p>
          <form action={signOut}>
            <SubmitButton className="btn btn-quiet">{t("signOut")}</SubmitButton>
          </form>
        </div>
      ) : (
        <>
          <section className="card flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold">{t("createAccount")}</h2>
              <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
                {t("accountPitch")}
              </p>
            </div>
            <form action={signUp} className="flex flex-col gap-3">
              <input type="hidden" name="next" value={next} />
              {!user && (
                <div className="flex flex-col gap-1.5">
                  <label className="label" htmlFor="su-name">{t("yourName")}</label>
                  <input
                    id="su-name"
                    name="name"
                    required
                    maxLength={40}
                    placeholder={t("namePlaceholder")}
                    className="field"
                    autoComplete="given-name"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="su-email">{t("email")}</label>
                <input
                  id="su-email"
                  name="email"
                  type="email"
                  required
                  className="field"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="su-password">{t("password")}</label>
                <input
                  id="su-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder={t("passwordHint")}
                  className="field"
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>
              <SubmitButton className="btn">{t("createAccount")}</SubmitButton>
              <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
                {t("accountOptional")}
              </p>
            </form>
          </section>

          <section className="card flex flex-col gap-4 p-5">
            <h2 className="text-lg font-bold">{t("signInTitle")}</h2>
            <form action={signIn} className="flex flex-col gap-3">
              <input type="hidden" name="next" value={next} />
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="si-email">{t("email")}</label>
                <input
                  id="si-email"
                  name="email"
                  type="email"
                  required
                  className="field"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="si-password">{t("password")}</label>
                <input
                  id="si-password"
                  name="password"
                  type="password"
                  required
                  className="field"
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>
              <SubmitButton className="btn btn-quiet">{t("signInAction")}</SubmitButton>
              {user && (
                <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
                  {t("switchDeviceHint")}
                </p>
              )}
            </form>
          </section>
        </>
      )}
    </main>
  );
}
