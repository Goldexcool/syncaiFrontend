import type { Metadata } from "next";
import MeetingPage from "@/components/app/MeetingPage";

export const metadata: Metadata = { title: "Notes — VOII" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <MeetingPage id={(await params).id} />;
}
