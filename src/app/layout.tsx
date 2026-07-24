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

const DESCRIPTION = "Spontaneous plans that only happen when enough friends are in. Share a link, everyone says if they're in, and the plan confirms itself once it hits quorum.";

export const metadata: Metadata = {
  metadataBase: new URL("https://quorumeet.vercel.app"),
  title: {
    default: "Quorum — plans that happen when enough friends are in",
    template: "%s · Quorum",
  },
  description: DESCRIPTION,
  applicationName: "Quorum",
  keywords: [
    "group plans",
    "RSVP",
    "meetup scheduling",
    "quorum",
    "when enough people are in",
    "hangout planner",
    "friends",
    "no app needed",
  ],
  authors: [{ name: "Quorum" }],
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Quorum",
    title: "Quorum — plans that happen when enough friends are in",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quorum — plans that happen when enough friends are in",
    description: DESCRIPTION,
  },
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
