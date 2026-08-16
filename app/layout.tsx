import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOII — The conversation becomes work",
  description:
    "A calm workspace for turning conversations into knowledge, tasks, and momentum.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
