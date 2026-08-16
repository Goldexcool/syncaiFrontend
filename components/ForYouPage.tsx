"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ArrowLink, ObjectBadge, PageKicker } from "@/components/MarketingPrimitives";
import { personaCopy, type PersonaId } from "@/lib/story";

const personaDetails: Record<PersonaId, { kicker: string; title: string; object: string; objectType: "conversation" | "knowledge" | "task" | "project"; stat: string; statLabel: string }> = {
  individual: { kicker: "For your own work", title: "A quieter mind for the work that is yours.", object: "Ideas worth returning to", objectType: "knowledge", stat: "1 thread", statLabel: "from thought to next move" },
  student: { kicker: "For learning together", title: "Your notes become a way forward.", object: "Seminar discussion", objectType: "conversation", stat: "4 ideas", statLabel: "kept after the room empties" },
  freelancer: { kicker: "For client work", title: "Make space for the work only you can do.", object: "Northstar launch", objectType: "project", stat: "3 promises", statLabel: "with owners and dates" },
  organization: { kicker: "For the whole organization", title: "The work moves as one.", object: "Shared decision", objectType: "task", stat: "1 source", statLabel: "everyone can return to" },
};

const personaIds = Object.keys(personaCopy) as PersonaId[];

export default function ForYouPage() {
  const [persona, setPersona] = useState<PersonaId>("individual");
  const detail = personaDetails[persona];

  return (
    <main className="marketing-page for-you-page bg-cream text-ink">
      <SiteHeader />
      <section className="for-you-hero"><div className="for-you-hero__meta"><span>VOII / FOR YOU</span><span>ONE SYSTEM / MANY WAYS IN</span></div><div className="for-you-hero__content"><PageKicker>Make it yours</PageKicker><h1>Different work. The same <em>thread.</em></h1><p>VOII meets you where you are — then keeps the important part moving.</p></div><div className="persona-tabs" role="tablist" aria-label="Choose your perspective">{personaIds.map((item) => <button type="button" role="tab" aria-selected={item === persona} className={item === persona ? "is-active" : ""} key={item} onClick={() => setPersona(item)}><span>{personaCopy[item].label}</span><i aria-hidden="true">↗</i></button>)}</div></section>

      <section className="persona-feature" aria-live="polite"><div className="persona-feature__copy"><AnimatePresence mode="wait"><motion.div key={persona} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }}><PageKicker>{detail.kicker}</PageKicker><h2>{detail.title}</h2><p>{personaCopy[persona].support}</p><ArrowLink href="/how-it-works">See the system in motion</ArrowLink></motion.div></AnimatePresence></div><div className="persona-feature__stage"><div className="persona-feature__halo" aria-hidden="true" /><motion.div className="persona-feature__object" key={persona} initial={{ opacity: 0, y: 30, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 100, damping: 18 }}><div className="persona-feature__object-head"><ObjectBadge type={detail.objectType}>{detail.objectType === "conversation" ? "C" : detail.objectType === "knowledge" ? "K" : detail.objectType === "task" ? "T" : "N"}</ObjectBadge><div><span className="product-label">{detail.objectType}</span><strong>{detail.object}</strong></div><span className="persona-feature__object-menu">···</span></div><div className="persona-feature__object-rule" /><div className="persona-feature__stat"><strong>{detail.stat}</strong><span>{detail.statLabel}</span></div><div className="persona-feature__object-footer"><span>↗ Connected to your work</span><span>VOII</span></div></motion.div></div></section>

      <section className="for-you-principles"><div><PageKicker>What stays constant</PageKicker><h2>The product changes emphasis, not its belief in context.</h2></div><div className="for-you-principles__list"><div><strong>Keep the source.</strong><span>Every useful thing remains attached to where it came from.</span></div><div><strong>Keep it human.</strong><span>The interface gets quieter as the work gets clearer.</span></div><div><strong>Keep moving.</strong><span>Progress is a relationship between a promise and its next step.</span></div></div></section>
      <section className="dark-cta-band"><PageKicker>Whichever way you enter</PageKicker><h2>The next move is still yours.</h2><ArrowLink href="/#story" inverse>Start with a conversation</ArrowLink></section>
      <SiteFooter />
    </main>
  );
}
