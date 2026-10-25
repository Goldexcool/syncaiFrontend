import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const TITLE = "VOII — Notes that show their work";
const DESCRIPTION =
  "VOII records your meetings, client calls and lectures, isolates the voice that matters, and returns notes, tasks and formulas — each linked to the moment it was said.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s" },
  description: DESCRIPTION,
  applicationName: "VOII",
  openGraph: {
    type: "website",
    siteName: "VOII",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  alternates: { canonical: "/" },
};

/** Factual only: name, URL, description and the real free tier. No ratings,
 *  no customer counts — none exist. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VOII",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "NGN", description: "Free plan" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`} lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
