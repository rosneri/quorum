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
    fail(error?.code === "user_already_exists" ? "emailTaken" : "authFailed", next);
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

/** Forget this device's identity. Signing back in restores it. */
export async function signOut() {
  await clearUserCookie();
  redirect("/");
}
