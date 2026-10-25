import type { Metadata } from "next";
import VoiiExperience from "@/components/VoiiExperience";

export const metadata: Metadata = {
  title: "VOII — previous design",
  robots: { index: false, follow: false },
};

export default function ClassicPage() {
  return <VoiiExperience />;
}
