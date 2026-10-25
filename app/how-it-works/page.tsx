import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "How VOII works",
  description: "From clean audio to sourced notes, tasks and formulas — for meetings and lectures.",
};

export default function Page() {
  return <HowItWorksPage />;
}
