import type { Metadata } from "next";
import { ClientsScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "Client Workspace — VOII" };

export default function Page() {
  return <ClientsScreen />;
}
