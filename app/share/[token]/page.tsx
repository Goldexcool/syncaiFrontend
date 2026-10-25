import type { Metadata } from "next";
import { SharePage } from "@/components/app/PublicPages";

export const metadata: Metadata = { title: "Shared notes — VOII", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <SharePage token={(await params).token} />;
}
