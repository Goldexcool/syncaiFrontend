"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Arc physics: things overshoot and settle. Low damping is the whole point —
 * a critically damped spring reads as "correct", an underdamped one reads as
 * alive. Every primitive collapses to a static state under reduced motion.
 */

export const BOUNCE = { type: "spring", stiffness: 300, damping: 13, mass: 0.9 } as const;
export const SETTLE = { type: "spring", stiffness: 210, damping: 20, mass: 0.8 } as const;

/** Pulls toward the cursor before it arrives, wobbles back on exit. */
export function Magnetic({
  children,
  strength = 0.4,
  radius = 100,
  className,
}: {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 12, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 260, damping: 12, mass: 0.7 });

  useEffect(() => {
    if (reduce) return;
    const onMove = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2);
      const dy = event.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < Math.max(r.width, r.height) / 2 + radius) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else if (x.get() || y.get()) {
        x.set(0);
        y.set(0);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [radius, reduce, strength, x, y]);

  return (
    <motion.span className={className} ref={ref} style={{ x: sx, y: sy, display: "inline-flex" }}>
      {children}
    </motion.span>
  );
}

/** Squashes on press, overshoots on release. */
export function Squish({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      style={{ display: "inline-flex" }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={BOUNCE}
    >
      {children}
    </motion.span>
  );
}

/** Enters with an overshoot when it scrolls in. Visible by default. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26, scale: 0.97 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ ...BOUNCE, delay }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
    >
      {children}
    </motion.div>
  );
}

/* ── Theme ──────────────────────────────────────────────────────────
   System preference is the default and stays the default until someone
   actually chooses; only then is anything written down. */

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem("voii-theme");
      } catch {
        return null;
      }
    })();
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("voii-theme", next);
    } catch {
      /* private mode — the choice just won't persist */
    }
  };

  return (
    <button
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="arc-theme"
      onClick={flip}
      type="button"
    >
      <motion.span animate={{ rotate: theme === "dark" ? 180 : 0 }} transition={BOUNCE}>
        {theme === "dark" ? "☾" : "☀"}
      </motion.span>
    </button>
  );
}
