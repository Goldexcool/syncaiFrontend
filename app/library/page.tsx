import type { Metadata } from "next";
import Library from "@/components/app/screens/Library";

export const metadata: Metadata = { title: "Library — VOII" };

export default function Page() {
  return <Library />;
}
