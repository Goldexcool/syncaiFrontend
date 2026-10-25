import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/** One family, carrying display and text on its optical-size axis. */
const bricolage = Bricolage_Grotesque({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const TITLE = "VOII — You had the conversation. VOII remembers what matters.";
const DESCRIPTION =
  "VOII turns your conversations into organised notes, tasks, knowledge and follow-ups — so you can focus on what comes next.";

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

/**
 * Applied before first paint so a stored theme never flashes the wrong one.
 * No stored value means the OS setting wins, which is the default state.
 */
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("voii-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={bricolage.variable} lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
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
