import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ArrowLink, PageKicker } from "@/components/MarketingPrimitives";

export const metadata: Metadata = {
  title: "About VOII — The work after the words",
  description: "Why VOII turns recorded conversations into searchable knowledge, assigned tasks, and connected project work.",
};

export default function Page() {
  return (
    <main className="marketing-page about-page bg-cream text-ink" id="main-content">
      <SiteHeader />
      <section className="about-hero"><div className="about-hero__meta"><span>VOII / ABOUT</span><span>THE WORK AFTER THE WORDS</span></div><div className="about-hero__content"><PageKicker>A note from VOII</PageKicker><h1>Make room for the work that happens <em>after.</em></h1><p>VOII turns recorded conversations into searchable knowledge, assigned tasks, and project context your team can return to.</p></div></section>
      <section className="about-manifesto"><div><PageKicker>Our starting point</PageKicker><h2>Most work does not disappear in the meeting. It disappears in the space after it.</h2></div><div className="about-manifesto__copy"><p>We are building VOII around one practical job: reduce the gap between understanding a conversation and acting on it.</p><p>The product shows the transcript, decision, owner, and due date together, then keeps each one linked to the source conversation.</p><ArrowLink href="/how-it-works">See how VOII works</ArrowLink></div></section>
      <section className="about-quote"><span>“</span><blockquote>The conversation is not the end of the work. It is where the work gets its direction.</blockquote><span>VOII</span></section>
      <section className="dark-cta-band"><PageKicker>Come see the idea</PageKicker><h2>Start with a conversation.</h2><ArrowLink href="/signup" inverse>Enter VOII</ArrowLink></section>
      <SiteFooter />
    </main>
  );
}
