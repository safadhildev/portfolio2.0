import type { Metadata } from "next";
import {
  Space_Grotesk,
  JetBrains_Mono,
  Courier_Prime,
  Roboto_Mono,
} from "next/font/google";
import { AosInit } from "@/components/AosInit";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Fadhil/Dev — Portfolio",
  description:
    "Syed Ahmad Fadhil — Malaysian software developer working with React Native, ReactJS, and Node.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${robotoMono.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${courierPrime.variable} font-display antialiased text-ink`}
      >
        <AosInit />
        <div className="bg-background">{children}</div>
      </body>
    </html>
  );
}
