import type { Metadata } from "next";
import { LegalPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Privacy | VOII",
  description: "How VOII approaches conversations, workspace content, and control.",
};

export default function Page() {
  return <LegalPage kind="privacy" />;
}
