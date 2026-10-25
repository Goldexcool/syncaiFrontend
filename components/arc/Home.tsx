"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import ArcFooter from "@/components/arc/Footer";
import { Magnetic, Squish } from "@/components/arc/motion";
import HeroScene from "@/components/arc/HeroScene";
import WhySection from "@/components/arc/WhySection";
import StackSection from "@/components/arc/StackSection";
import Bento from "@/components/arc/Bento";
import Solutions from "@/components/arc/Solutions";
import Integrations from "@/components/arc/Integrations";




export default function Home() {

  return (
    <main className="arc" id="main-content">
      <SiteHeader />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="arc-hero" aria-labelledby="arc-hero-title">
        <div className="arc-hero__copy">
          <h1 className="arc-in" id="arc-hero-title">
            You had the conversation.
            <br />
            VOII remembers what matters.
          </h1>
          <p className="arc-lede arc-in" style={{ "--d": "80ms" } as React.CSSProperties}>
            VOII turns your conversations into organised notes, tasks, knowledge and follow-ups —
            so you can focus on what comes next.
          </p>
          <div className="arc-actions arc-in" style={{ "--d": "160ms" } as React.CSSProperties}>
            <Magnetic>
              <Squish>
                <Link className="arc-btn arc-btn--go" href="/signup">
                  Start with a conversation <span aria-hidden="true">↗</span>
                </Link>
              </Squish>
            </Magnetic>
            <Link className="arc-btn arc-btn--quiet" href="/how-it-works">See how it works</Link>
          </div>
        </div>
      </section>

      <div className="arc-stage">
        <HeroScene />
      </div>

      <WhySection />

      <StackSection />

      <Bento />

      <Solutions />

      <Integrations />

      <ArcFooter />
    </main>
  );
}
