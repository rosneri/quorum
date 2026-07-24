import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signIn, signUp, signOut, updateName, updateEmail, updatePassword } from "@/lib/account";
import { LocaleToggle } from "@/components/LocaleToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthForm } from "@/components/AuthForm";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const ERROR_KEYS = {
  invalid: "errInvalid",
  emailTaken: "errEmailTaken",
  credentials: "errCredentials",
  unconfirmed: "errUnconfirmed",
  rateLimited: "errRateLimited",
  wrongPassword: "errWrongPassword",
  authFailed: "errAuthFailed",
} as const;

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { t, locale } = await getT();
  const sp = await searchParams;
  const rawError = typeof sp.error === "string" ? sp.error : "";
  const errorKey = rawError in ERROR_KEYS ? ERROR_KEYS[rawError as keyof typeof ERROR_KEYS] : null;
  const justSaved = sp.saved === "1";
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
      {justSaved && !errorKey && (
        <p
          className="rounded-xl px-4 py-3 text-sm font-semibold pop-in"
          style={{ background: "var(--color-accent)" }}
        >
          {t("saved")}
        </p>
      )}

      {user?.authId ? (
        <>
          <div className="card flex flex-col gap-1 p-5">
            <span className="text-lg font-bold">{t("hi", { name: user.name })}</span>
            <span className="text-sm" style={{ color: "var(--color-ink-2)" }}>
              {t("signedInAs", { email: user.email ?? "" })}
            </span>
          </div>

          <section className="card flex flex-col gap-4 p-5">
            <h2 className="text-lg font-bold">{t("editProfile")}</h2>
            <form action={updateName} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="pf-name">{t("yourName")}</label>
                <input
                  id="pf-name"
                  name="name"
                  required
                  maxLength={40}
                  defaultValue={user.name}
                  placeholder={t("namePlaceholder")}
                  className="field"
                  autoComplete="name"
                />
              </div>
              <SubmitButton className="btn btn-quiet">{t("saveChanges")}</SubmitButton>
            </form>
          </section>

          <section className="card flex flex-col gap-4 p-5">
            <h2 className="text-lg font-bold">{t("changeEmail")}</h2>
            <form action={updateEmail} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="em-email">{t("newEmail")}</label>
                <input
                  id="em-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email ?? ""}
                  className="field"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="em-password">{t("currentPassword")}</label>
                <input
                  id="em-password"
                  name="password"
                  type="password"
                  required
                  className="field"
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>
              <SubmitButton className="btn btn-quiet">{t("saveChanges")}</SubmitButton>
            </form>
          </section>

          <section className="card flex flex-col gap-4 p-5">
            <h2 className="text-lg font-bold">{t("changePassword")}</h2>
            <form action={updatePassword} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="pw-current">{t("currentPassword")}</label>
                <input
                  id="pw-current"
                  name="current"
                  type="password"
                  required
                  className="field"
                  autoComplete="current-password"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label" htmlFor="pw-new">{t("newPassword")}</label>
                <input
                  id="pw-new"
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
              <SubmitButton className="btn btn-quiet">{t("saveChanges")}</SubmitButton>
            </form>
          </section>

          <form action={signOut}>
            <SubmitButton className="btn btn-quiet">{t("signOut")}</SubmitButton>
          </form>
        </>
      ) : (
        <>
          <AuthForm
            signIn={signIn}
            signUp={signUp}
            hasUser={!!user}
            next={next}
            labels={{
              createAccount: t("createAccount"),
              signInAction: t("signInAction"),
              yourName: t("yourName"),
              namePlaceholder: t("namePlaceholder"),
              email: t("email"),
              password: t("password"),
              passwordHint: t("passwordHint"),
              accountPitch: t("accountPitch"),
              accountOptional: t("accountOptional"),
              switchToSignUp: t("switchToSignUp"),
              switchToSignIn: t("switchToSignIn"),
            }}
          />
          {!user && (
            <Link
              href="/"
              className="self-center text-sm font-bold"
              style={{ color: "var(--color-ink-2)" }}
            >
              {t("continueAsGuest")}
            </Link>
          )}
          {user && (
            <p className="text-center text-xs" style={{ color: "var(--color-ink-2)" }}>
              {t("switchDeviceHint")}
            </p>
          )}
        </>
      )}
    </main>
  );
}
