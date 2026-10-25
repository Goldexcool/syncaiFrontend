"use client";

import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Summary } from "@/lib/api/app";

/** Markdown + LaTeX, styled like a textbook page (see .notes in globals.css). */
export function Markdown({ children }: { children: string }) {
  return <div className="notes"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{children}</ReactMarkdown></div>;
}

/** Summary → Markdown, so meetings and lectures render (and print) the same way. */
export function summaryToMarkdown(summary: Summary): string {
  if (summary.notes) return summary.notes;
  const list = (title: string, items?: Array<{ title?: string; question?: string; description?: string; context?: string }> | null) =>
    items?.length ? `\n## ${title}\n${items.map((i) => `- **${i.title ?? i.question}**${i.description || i.context ? ` — ${i.description ?? i.context}` : ""}`).join("\n")}\n` : "";
  return [
    summary.long || summary.short || "",
    list("Decisions", summary.decisions),
    list("Next steps", summary.nextSteps),
    list("Open questions", summary.questions),
  ].join("\n");
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
