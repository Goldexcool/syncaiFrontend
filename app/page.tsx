import type { Metadata } from "next";
import VoiiExperience from "@/components/VoiiExperience";

export const metadata: Metadata = {
  title: "VOII — The conversation becomes work",
  description: "Record meetings and calls, keep the decisions, and turn the next steps into organized work.",
};

export default function Page() {
  return <VoiiExperience />;
}
