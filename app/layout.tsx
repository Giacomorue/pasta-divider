import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pasta Divider - Calcola le porzioni di pasta",
  description: "Calcola facilmente quanto pasta cotta deve mangiare ciascuno in base alle loro esigenze di pasta cruda",
  icons: {
    icon: '/favicon.svg',
  },
  keywords: ["pasta", "calcolatore porzioni", "divisore pasta", "porzioni pasta", "pasta cotta", "pasta cruda"],
  authors: [{ name: "Pasta Divider Team" }],
  openGraph: {
    title: "Pasta Divider - Calcola facilmente le porzioni di pasta",
    description: "App per calcolare quanto pasta cotta deve mangiare ciascuno in base alle loro preferenze",
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
