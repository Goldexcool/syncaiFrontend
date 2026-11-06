import type { Metadata } from "next";
import Courses from "@/components/app/screens/Courses";

export const metadata: Metadata = { title: "Courses — VOII" };

export default function Page() {
  return <Courses />;
}
