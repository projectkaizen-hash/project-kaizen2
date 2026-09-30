import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const isocpeur = localFont({
  src: "../../public/fonts/isocpeur.ttf",
  variable: "--font-isocpeur",
  display: "swap",
});

const urwDin = localFont({
  src: "../../public/fonts/URWDIN-Regular.ttf",
  variable: "--font-urw-din",
  display: "swap",
});

const urwDinBold = localFont({
  src: "../../public/fonts/URWDIN-Bold.ttf",
  variable: "--font-urw-din-bold",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Kaizen — A design collaboration",
  description:
    "Project Kaizen is a design collaboration where we explore possibilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fraunces.variable} ${isocpeur.variable} ${urwDin.variable} ${urwDinBold.variable}`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg font-sans">
        {children}
      </body>
    </html>
  );
}