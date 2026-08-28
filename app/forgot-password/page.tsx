import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Reset your password — VOII",
  description: "Find your way back to your VOII workspace.",
};

export default function Page() {
  return <AuthPage mode="forgot-password" />;
}
