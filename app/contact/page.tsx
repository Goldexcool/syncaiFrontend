import type { Metadata } from "next";
import { LegalPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Contact | VOII",
  description: "Talk to the VOII team about the work after the words.",
};

export default function Page() {
  return <LegalPage kind="contact" />;
}
