import type { Metadata } from "next";
import ProtectedWorkspacePage from "@/components/ProtectedWorkspacePage";

export const metadata: Metadata = {
  title: "Begin with VOII",
  description: "Start turning conversations into organized work.",
};

export default function Page() {
  return <ProtectedWorkspacePage kind="onboarding" />;
}
