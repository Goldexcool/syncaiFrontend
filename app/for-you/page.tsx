import type { Metadata } from "next";
import { ForYouPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "VOII for teams and students",
  description: "Meeting notes and commitments for teams; lecture mode with noise filtering and full maths notes for students.",
};

export default function Page() {
  return <ForYouPage />;
}
