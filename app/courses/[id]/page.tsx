import type { Metadata } from "next";
import { CoursePage } from "@/components/app/screens/Courses";

export const metadata: Metadata = { title: "Course — VOII" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoursePage id={id} />;
}
