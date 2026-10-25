import type { Metadata } from "next";
import { HomePage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "VOII — Notes that show their work",
  description: "VOII records your meetings, client calls and lectures, isolates the voice that matters, and returns notes, tasks and formulas — each linked to the moment it was said.",
};

export default function Page() {
  return <HomePage />;
}
