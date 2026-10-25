import type { Metadata } from "next";
import { AiScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "AI Assistant — VOII" };

export default function Page() {
  return <AiScreen />;
}
