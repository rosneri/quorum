"use server";

import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getUser, setUserCookie, clearUserCookie } from "./auth";
import { supabaseAuth } from "./supabase";

/** Only allow same-app relative paths as post-auth destinations. */
function safeNext(formData: FormData): string {
  const next = String(formData.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

function fail(code: string, next: string): never {
  const q = new URLSearchParams({ error: code });
  if (next) q.set("next", next);
  redirect(`/account?${q}`);
}

/** Bounce back to the account page with a "saved" confirmation. */
function saved(): never {
  redirect("/account?saved=1");
}

/**
 * Re-verify the account's current password. We don't persist a Supabase
 * session, so to change an email or password we sign in fresh; the returned
 * client instance then carries the session needed for updateUser. Returns null
 * when the password is wrong.
 */
async function reauth(email: string, password: string) {
  const supabase = supabaseAuth();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  return supabase;
}

/** Map a Supabase auth error to one of our own error codes (see ERROR_KEYS). */
function authErrorCode(error: { code?: string } | null): string {
  switch (error?.code) {
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "invalid";
    // Default Supabase SMTP is rate-limited; surface it instead of a generic error.
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    default:
      return "authFailed";
  }
}

/**
 * Link the current (anonymous) user to an email+password account — or, with
 * no current user, create a fresh account. Credentials live in Supabase Auth;
 * our User row just remembers the Supabase user id.
 */
export async function signUp(formData: FormData) {
  const next = safeNext(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) fail("invalid", next);

  const current = await getUser();
  if (current?.authId) redirect(next || "/account");

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) fail("emailTaken", next);

  const name = (
    current?.name ||
    String(formData.get("name") ?? "").trim() ||
    email.split("@")[0]
  ).slice(0, 40);

  const { data, error } = await supabaseAuth().auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error || !data.user) {
    console.error("[signUp] supabase error", { code: error?.code, message: error?.message });
    fail(authErrorCode(error), next);
  }
  // With email confirmation on, Supabase obfuscates existing accounts by
  // returning a ghost user with no identities.
  if ((data.user.identities?.length ?? 0) === 0) fail("emailTaken", next);

  let userId: string;
  if (current) {
    await prisma.user.update({
      where: { id: current.id },
      data: { email, authId: data.user.id },
    });
    userId = current.id;
  } else {
    const created = await prisma.user.create({
      data: { name, email, authId: data.user.id },
    });
    userId = created.id;
  }
  await setUserCookie(userId);
  redirect(next || "/account");
}

/** Verify credentials against Supabase, then point the device at that user. */
export async function signIn(formData: FormData) {
  const next = safeNext(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) fail("credentials", next);

  const { data, error } = await supabaseAuth().auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    console.error("[signIn] supabase error", { code: error?.code, message: error?.message });
    fail(error?.code === "email_not_confirmed" ? "unconfirmed" : "credentials", next);
  }

  let user = await prisma.user.findUnique({ where: { authId: data.user.id } });
  if (!user) {
    // Credentials exist in Supabase but no linked row here (e.g. the link was
    // never written) — adopt the row with that email, or start a fresh one.
    const name = (
      String(data.user.user_metadata?.name ?? "").trim() || email.split("@")[0]
    ).slice(0, 40);
    user = await prisma.user.upsert({
      where: { email },
      update: { authId: data.user.id },
      create: { name, email, authId: data.user.id },
    });
  }
  await setUserCookie(user.id);
  redirect(next || "/");
}

/** Change the display name. Works for any signed-in user, guest or account. */
export async function updateName(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/");
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  if (!name) fail("invalid", "");
  await prisma.user.update({ where: { id: user.id }, data: { name } });
  saved();
}

/** Change the account email, re-verifying the current password first. */
export async function updateEmail(formData: FormData) {
  const user = await getUser();
  if (!user?.authId || !user.email) redirect("/account");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("invalid", "");
  if (email === user.email) saved();

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken && taken.id !== user.id) fail("emailTaken", "");

  const supabase = await reauth(user.email, password);
  if (!supabase) fail("wrongPassword", "");
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    console.error("[updateEmail] supabase error", { code: error.code, message: error.message });
    fail(authErrorCode(error), "");
  }
  await prisma.user.update({ where: { id: user.id }, data: { email } });
  saved();
}

/** Change the account password, re-verifying the current one first. */
export async function updatePassword(formData: FormData) {
  const user = await getUser();
  if (!user?.authId || !user.email) redirect("/account");
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) fail("invalid", "");

  const supabase = await reauth(user.email, current);
  if (!supabase) fail("wrongPassword", "");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[updatePassword] supabase error", { code: error.code, message: error.message });
    fail(authErrorCode(error), "");
  }
  saved();
}

/** Forget this device's identity. Signing back in restores it. */
export async function signOut() {
  await clearUserCookie();
  redirect("/");
}
