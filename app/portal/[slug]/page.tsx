import type { Metadata } from "next";
import { PortalPage } from "@/components/app/PublicPages";

export const metadata: Metadata = { title: "Project progress — VOII", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <PortalPage slug={(await params).slug} />;
}
