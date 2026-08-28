import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms | VOII",
  description: "The principles behind using the VOII workspace.",
};

export default function Page() {
  return <LegalPage kind="terms" />;
}
