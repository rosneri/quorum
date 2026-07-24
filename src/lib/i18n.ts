import { cookies, headers } from "next/headers";
import { dictionaries, fill, type Dict, type Locale } from "./dictionaries";

export type { Dict, Locale };
export { dictionaries, fill };

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const override = store.get("locale")?.value;
  if (override === "he" || override === "en") return override;
  const h = await headers();
  if (h.get("x-vercel-ip-country")?.toUpperCase() === "IL") return "he";
  if (/(^|[,;])\s*he\b/i.test(h.get("accept-language") ?? "")) return "he";
  return "en";
}

/** Server-side translator. */
export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const t = (key: keyof Dict, vars?: Record<string, string | number>) => fill(dict[key], vars);
  return { t, locale, dict };
}
