import type { Metadata } from "next";
import { LibraryPage } from "@/components/app/screens/Library";

export const metadata: Metadata = { title: "Library — VOII" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LibraryPage id={id} />;
}
