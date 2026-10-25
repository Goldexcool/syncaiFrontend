import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/for-you", label: "For you" },
      { href: "/dashboard", label: "Workspace" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function ArcFooter() {
  return (
    <footer className="ft">
      {/* Letters are separate so they can spread the full width. */}
      <span className="ft__ghost" aria-hidden="true">
        {"VOII".split("").map((ch, i) => <span key={i}>{ch}</span>)}
      </span>

      <div className="ft__panel">
        <div className="ft__main">
          <div className="ft__brand">
            <Link aria-label="VOII home" className="ft__mark" href="/">
              <span aria-hidden="true"><i /><i /><i /></span>VOII
            </Link>
            <p>The work after the words.</p>
          </div>

          <nav className="ft__nav" aria-label="Footer navigation">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <aside className="ft__cta">
          <p className="ft__ctaTitle">Start with the next conversation.</p>
          <p className="ft__ctaSub">Free to try. No credit card.</p>
          <div className="ft__ctaRow">
            <Link className="ft__go" href="/signup">Start free <span aria-hidden="true">↗</span></Link>
            <Link className="ft__ghostBtn" href="/signin">Sign in</Link>
          </div>
        </aside>
      </div>

      <div className="ft__base">
        <span>© {new Date().getFullYear()} VOII</span>
        <span>Conversation · Knowledge · Tasks · Momentum</span>
      </div>
    </footer>
  );
}
