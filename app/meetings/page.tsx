import type { Metadata } from "next";
import Meetings from "@/components/app/screens/Meetings";

export const metadata: Metadata = { title: "Meetings — VOII" };

export default function Page() {
  return <Meetings />;
}
