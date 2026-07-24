import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./db";

const COOKIE = "quorum_uid";
const MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years

function sign(value: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(value).digest("base64url");
}

function encode(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function decode(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const userId = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  return userId;
}

export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return decode(store.get(COOKIE)?.value);
}

export async function getUser() {
  const id = await getUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

/** Only callable from Server Actions / Route Handlers (cookie write). */
export async function clearUserCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Only callable from Server Actions / Route Handlers (cookie write). */
export async function setUserCookie(userId: string) {
  const store = await cookies();
  store.set(COOKIE, encode(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}
