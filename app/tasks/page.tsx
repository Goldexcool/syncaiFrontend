import type { Metadata } from "next";
import { TasksScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "Tasks — VOII" };

export default function Page() {
  return <TasksScreen />;
}
