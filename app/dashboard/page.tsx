import type { Metadata } from "next";
import Dashboard from "@/components/app/screens/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — VOII",
  description: "Your meetings, the action items waiting on you, and the work in motion.",
};

export default function Page() {
  return <Dashboard />;
}
