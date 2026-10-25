import type { Metadata } from "next";
import { AboutPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "About VOII",
  description: "Why VOII keeps what is said in meetings and lectures — with every line linked to its source.",
};

export default function Page() {
  return <AboutPage />;
}
