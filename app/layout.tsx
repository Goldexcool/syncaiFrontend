import type { Metadata } from "next";
import { IBM_Plex_Sans, Libre_Caslon_Text } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
});

const libreCaslonText = Libre_Caslon_Text({
  display: "swap",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-libre-caslon-text",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "VOII — The conversation becomes work",
  description:
    "A calm workspace for turning conversations into knowledge, tasks, and momentum.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${libreCaslonText.variable}`}><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
