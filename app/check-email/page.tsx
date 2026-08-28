import type { Metadata } from "next";
import CheckEmailPage from "@/components/CheckEmailPage";

export const metadata: Metadata = {
  title: "Check your inbox — VOII",
  description: "The next step back into your VOII workspace.",
};

export default function Page() {
  return <CheckEmailPage />;
}
