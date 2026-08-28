import type { Metadata } from "next";
import DashboardPage from "@/components/DashboardPage";

export const metadata: Metadata = {
  title: "Your workspace — VOII",
  description: "Your conversations, decisions, and next moves in one place.",
};

export default function Page() {
  return <DashboardPage />;
}
