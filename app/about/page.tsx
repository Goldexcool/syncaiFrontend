import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { ArrowLink, PageKicker } from "@/components/MarketingPrimitives";

export default function Page() {
  return (
    <main className="marketing-page about-page bg-cream text-ink">
      <SiteHeader />
      <section className="about-hero"><div className="about-hero__meta"><span>VOII / ABOUT</span><span>THE WORK AFTER THE WORDS</span></div><div className="about-hero__content"><PageKicker>A note from VOII</PageKicker><h1>Make room for the work that happens <em>after.</em></h1><p>VOII is a workspace for the meaning that lives between conversations — the decisions, promises, and small beginnings that deserve to keep moving.</p></div></section>
      <section className="about-manifesto"><div><PageKicker>Our starting point</PageKicker><h2>Most work does not disappear in the meeting. It disappears in the space after it.</h2></div><div className="about-manifesto__copy"><p>We are building VOII around a simple conviction: the best tools should reduce the distance between understanding something and doing something about it.</p><p>That means the product should feel calm before it feels clever. It should show its logic in the moment you need it. And it should keep context close enough that progress feels natural.</p><ArrowLink href="/how-it-works">See how VOII works</ArrowLink></div></section>
      <section className="about-quote"><span>“</span><blockquote>The conversation is not the end of the work. It is where the work gets its direction.</blockquote><span>VOII</span></section>
      <section className="dark-cta-band"><PageKicker>Come see the idea</PageKicker><h2>Start with a conversation.</h2><ArrowLink href="/#story" inverse>Enter VOII</ArrowLink></section>
      <SiteFooter />
    </main>
  );
}
