import type { Metadata } from "next";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing — VOII",
  description: "Choose the VOII plan that fits how you work, from Free to Enterprise.",
};

export default function Page() {
  return <PricingPage />;
}
