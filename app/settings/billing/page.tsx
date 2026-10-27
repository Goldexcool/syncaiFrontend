import type { Metadata } from "next";
import { BillingScreen } from "@/components/app/screens/Billing";

export const metadata: Metadata = { title: "Billing — VOII" };

export default function Page() {
  return <BillingScreen />;
}
