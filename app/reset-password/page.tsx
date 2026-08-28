import type { Metadata } from "next";
import ResetPasswordPage from "@/components/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Choose a new password — VOII",
  description: "Set a new password for your VOII workspace.",
};

export default function Page() {
  return <ResetPasswordPage />;
}
