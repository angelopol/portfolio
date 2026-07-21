import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { LANGUAGE_COOKIE_NAME, parseLanguage } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Angelo Polgrossi | Dynamic Portfolio",
  description:
    "Portfolio rebuilt with Next.js, TypeScript and Tailwind CSS, including a protected control room for content and style updates.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = parseLanguage(cookies().get(LANGUAGE_COOKIE_NAME)?.value);

  return (
    <html lang={language}>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
