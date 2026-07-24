import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";
import { I18nProvider } from "@/components/I18nProvider";
import { dictionaries, getLocale } from "@/lib/i18n";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Rubik carries the Hebrew glyphs (same rounded-humanist register as Jakarta)
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quorum",
  description: "Spontaneous plans that only happen when enough friends are in.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quorum",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f6ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "he" ? "rtl" : "ltr"}
      className={`${jakarta.variable} ${rubik.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <I18nProvider locale={locale} dict={dictionaries[locale]}>
          <SwRegister />
          <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-4">{children}</div>
        </I18nProvider>
      </body>
    </html>
  );
}
