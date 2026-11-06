import type { Metadata } from "next";
import Admin from "@/components/app/screens/Admin";

export const metadata: Metadata = { title: "VOII", robots: { index: false, follow: false } };

export default function Page() {
  return <Admin />;
}
