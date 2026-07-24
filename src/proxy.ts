import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * `?lang=he` / `?lang=en` on any page sets the locale cookie and redirects to
 * the clean URL. Lets automated tests (and anyone) flip language via the URL,
 * independent of the in-page toggle.
 */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang === "he" || lang === "en") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url);
    res.cookies.set("locale", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  // run on pages only — skip Next internals and static assets
  matcher: ["/((?!_next/|icon.svg|manifest.webmanifest|sw.js|apple-icon.png|icon-192.png|icon-512.png|favicon.ico).*)"],
};
