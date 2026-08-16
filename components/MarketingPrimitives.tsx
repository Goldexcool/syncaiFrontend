"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { type ReactNode } from "react";

export function PageKicker({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function ObjectBadge({ type, children }: { type: "conversation" | "knowledge" | "task" | "project" | "calendar"; children: ReactNode }) {
  return <span className={`object-badge object-badge--${type}`}>{children}</span>;
}

export function ArrowLink({ href, children, inverse = false }: { href: string; children: ReactNode; inverse?: boolean }) {
  return (
    <Link className={`arrow-link ${inverse ? "arrow-link--inverse" : ""}`} href={href}>
      <span>{children}</span>
      <span className="arrow-link__icon" aria-hidden="true">↗</span>
    </Link>
  );
}

export function PageFooterNote({ children }: { children: ReactNode }) {
  return <p className="page-footer-note">{children}</p>;
}

export function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="page-progress-dots" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <motion.span
          animate={{ opacity: index <= active ? 1 : 0.28, scaleX: index === active ? 1.4 : 1 }}
          key={index}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}
