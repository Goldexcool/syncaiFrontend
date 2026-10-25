import type { Metadata } from "next";
import Home from "@/components/arc/Home";

export const metadata: Metadata = {
  title: "VOII — You had the conversation. VOII remembers what matters.",
  description:
    "VOII turns your conversations into organised notes, tasks, knowledge and follow-ups — so you can focus on what comes next.",
};

// Previous design preserved at /classic.
export default function Page() {
  return <Home />;
}
