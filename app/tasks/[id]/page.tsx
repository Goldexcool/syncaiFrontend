"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { apiClient } from "@/lib/api/client";

/** Task links from notifications land here; tasks live on their board. */
function OpenTask({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    apiClient
      .get<{ task: { boardId?: string | null } }>(`/tasks/${id}`)
      .then(({ task }) => router.replace(task.boardId ? `/board?board=${task.boardId}&task=${id}` : "/tasks"))
      .catch(() => router.replace("/tasks"));
  }, [id, router]);
  return null;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate><OpenTask id={id} /></AuthGate>;
}
