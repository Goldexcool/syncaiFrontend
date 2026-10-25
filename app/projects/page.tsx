import type { Metadata } from "next";
import { ProjectsScreen } from "@/components/app/screens/Workspace";

export const metadata: Metadata = { title: "Projects — VOII" };

export default function Page() {
  return <ProjectsScreen />;
}
