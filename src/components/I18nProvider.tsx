"use client";

import { createContext, useContext } from "react";
import { fill, type Dict, type Locale } from "@/lib/dictionaries";

const Ctx = createContext<{ locale: Locale; dict: Dict } | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ locale, dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  const t = (key: keyof Dict, vars?: Record<string, string | number>) =>
    fill(ctx.dict[key], vars);
  return { t, locale: ctx.locale };
}
