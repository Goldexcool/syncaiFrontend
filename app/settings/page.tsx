import type { Metadata } from "next";
import { SettingsScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "Settings — VOII" };

export default function Page() {
  return <SettingsScreen />;
}
