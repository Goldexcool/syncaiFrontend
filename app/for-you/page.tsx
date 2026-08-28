import type { Metadata } from "next";
import ForYouPage from "@/components/ForYouPage";

export const metadata: Metadata = {
  title: "For you — VOII",
  description: "One connected workspace for individual work, study, client conversations, and teams.",
};

export default function Page() {
  return <ForYouPage />;
}
