import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signIn, signUp, signOut } from "@/lib/account";
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
