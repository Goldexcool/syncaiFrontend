import type { Metadata } from "next";
import InvitePage from "@/components/InvitePage";

export const metadata: Metadata = {
  title: "Join a workspace — VOII",
  description: "Accept your invite to a VOII workspace.",
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InvitePage token={token} />;
}
