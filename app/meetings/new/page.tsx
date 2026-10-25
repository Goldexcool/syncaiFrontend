import type { Metadata } from "next";
import NewMeeting from "@/components/app/screens/NewMeeting";

export const metadata: Metadata = { title: "New meeting — VOII" };

export default function Page() {
  return <NewMeeting />;
}
