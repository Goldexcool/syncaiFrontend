import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Create your VOII account",
  description: "Start turning conversations into organized work with VOII.",
};

export default function Page() {
  return <AuthPage mode="signup" />;
}
