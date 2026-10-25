import type { Metadata } from "next";
import BoardPage from "@/components/app/BoardPage";

export const metadata: Metadata = { title: "Board — VOII" };

export default function Page() {
  return <BoardPage />;
}
