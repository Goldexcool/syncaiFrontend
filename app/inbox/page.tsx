import type { Metadata } from "next";
import { InboxScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "Inbox — VOII" };

export default function Page() {
  return <InboxScreen />;
}
