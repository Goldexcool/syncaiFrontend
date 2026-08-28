import type { Metadata } from "next";
import VerifyEmailPage from "@/components/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verify your email — VOII",
  description: "Confirm your email and continue into VOII.",
};

export default function Page() {
  return <VerifyEmailPage />;
}
