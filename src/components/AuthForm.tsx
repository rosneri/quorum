"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";

type Labels = {
  createAccount: string;
  signInAction: string;
  yourName: string;
  namePlaceholder: string;
  email: string;
  password: string;
  passwordHint: string;
  accountPitch: string;
  accountOptional: string;
  switchToSignUp: string;
  switchToSignIn: string;
};

/**
 * One form for both signing in and creating an account, with a toggle between
 * the two modes. Signing up shows a name field (unless the visitor already has
 * a guest identity to link) plus a password hint; signing in drops both. The
 * form's action switches with the mode, so the same fields post to whichever
 * server action the visitor picked.
 */
export function AuthForm({
  signIn,
  signUp,
  hasUser,
  next,
  labels,
}: {
  signIn: (formData: FormData) => void | Promise<void>;
  signUp: (formData: FormData) => void | Promise<void>;
  hasUser: boolean;
  next: string;
  labels: Labels;
}) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const isSignUp = mode === "signUp";

  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">
          {isSignUp ? labels.createAccount : labels.signInAction}
        </h2>
        {isSignUp && (
          <p className="text-sm" style={{ color: "var(--color-ink-2)" }}>
            {labels.accountPitch}
          </p>
        )}
      </div>

      <form action={isSignUp ? signUp : signIn} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />

        {isSignUp && !hasUser && (
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="auth-name">{labels.yourName}</label>
            <input
              id="auth-name"
              name="name"
              required
              maxLength={40}
              placeholder={labels.namePlaceholder}
              className="field"
              autoComplete="given-name"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="auth-email">{labels.email}</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            required
            className="field"
            autoComplete="email"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label" htmlFor="auth-password">{labels.password}</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={isSignUp ? 8 : undefined}
            placeholder={isSignUp ? labels.passwordHint : undefined}
            className="field"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            dir="ltr"
          />
        </div>

        <SubmitButton className="btn">
          {isSignUp ? labels.createAccount : labels.signInAction}
        </SubmitButton>
        {isSignUp && (
          <p className="text-xs" style={{ color: "var(--color-ink-2)" }}>
            {labels.accountOptional}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => setMode(isSignUp ? "signIn" : "signUp")}
        className="self-center text-sm font-bold"
        style={{ color: "var(--color-accent-2)" }}
      >
        {isSignUp ? labels.switchToSignIn : labels.switchToSignUp}
      </button>
    </section>
  );
}
