import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — VOII",
  description: "Return to the conversations, decisions, and next moves you kept close.",
};

export default function Page() {
  return <AuthPage mode="login" />;
}
