import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`}>
      <body className="min-h-dvh">
        <SwRegister />
        <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-4">{children}</div>
      </body>
    </html>
  );
}
