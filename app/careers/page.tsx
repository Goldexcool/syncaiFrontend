import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Careers | VOII",
  description: "Build thoughtful tools for the work after the words with VOII.",
};

export default function Page() {
  return <LegalPage kind="careers" />;
}
