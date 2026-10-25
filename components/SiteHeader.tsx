"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-you", label: "Teams & students" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

export function Logo() {
  return (
    <span className="logo" aria-label="VOII">
      <span className="logo__mark" aria-hidden="true"><span /><span /><span /></span>
      VOII
    </span>
  );
}

/** Transparent over the dusk hero, solid ink once the page scrolls. */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const update = () => setSolid(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <header className={`site-header ${solid || open ? "site-header--solid" : ""} ${open ? "site-header--open" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Link href="/" aria-label="VOII home"><Logo /></Link>
      <nav className="site-header__nav" aria-label="Primary navigation">
        {primaryLinks.map((link) => (
          <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} key={link.href}>{link.label}</Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__signin" href="/signin">Sign in</Link>
        <Link className="btn btn--sm" href="/signup">Get started <span aria-hidden="true">→</span></Link>
        <button
          className="site-header__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      {open ? (
        <nav className="site-header__mobile" id="mobile-navigation" aria-label="Mobile navigation">
          {primaryLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          <Link href="/signin">Sign in</Link>
          <Link className="btn" href="/signup">Get started <span aria-hidden="true">→</span></Link>
        </nav>
      ) : null}
    </header>
  );
}

const FOOTER_COLUMNS = [
  { title: "Product", links: [["/how-it-works", "How it works"], ["/for-you", "Teams & students"], ["/pricing", "Pricing"], ["/dashboard", "Workspace"]] },
  { title: "Company", links: [["/about", "About"], ["/careers", "Careers"], ["/contact", "Contact"]] },
  { title: "Legal", links: [["/privacy", "Privacy"], ["/terms", "Terms"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Link href="/" aria-label="VOII home"><Logo /></Link>
            <p>Notes that show their work — for the meeting room and the lecture hall.</p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h3>{column.title}</h3>
              <ul>{column.links.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <p className="site-footer__word" aria-hidden="true">VOII</p>
        <div className="site-footer__base">
          <span>© {new Date().getFullYear()} VOII</span>
          <a href="mailto:hello@voii.app">hello@voii.app</a>
        </div>
      </div>
    </footer>
  );
}
