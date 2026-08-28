import type { Metadata } from "next";
import HowItWorksPage from "@/components/HowItWorksPage";

export const metadata: Metadata = {
  title: "How VOII works — Conversation to organized work",
  description: "See how VOII turns a conversation into knowledge, tasks, and visible project momentum.",
};

export default function Page() {
  return <HowItWorksPage />;
}
