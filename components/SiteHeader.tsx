"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-you", label: "For you" },
  { href: "/about", label: "About" },
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`logo ${compact ? "logo--compact" : ""}`} aria-label="VOII">
      <span className="logo__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="logo__word">VOII</span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header flex items-center justify-between ${scrolled ? "site-header--scrolled" : ""} ${menuOpen ? "site-header--menu-open" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Link className="site-header__logo" href="/" aria-label="VOII home">
        <Logo />
      </Link>
      <nav className="site-header__nav" aria-label="Primary navigation">
        {primaryLinks.map((link) => (
          <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} key={link.href}>{link.label}</Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__signin" href="/signin" aria-current={pathname === "/signin" || pathname === "/login" ? "page" : undefined}>Sign in</Link>
        <Link className="button button--header" href="/signup">
          <span className="button--header__label button--header__label--desktop">Start with a conversation</span>
          <span className="button--header__label button--header__label--mobile">Get started</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          className="site-header__menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      {menuOpen ? (
        <div className="site-header__mobile-menu" id="mobile-navigation">
          <div className="site-header__mobile-menu-inner">
            <p className="eyebrow">The work after the words</p>
            <nav aria-label="Mobile navigation">
              {primaryLinks.map((link) => (
                <Link href={link.href} aria-current={pathname === link.href ? "page" : undefined} key={link.href} onClick={closeMenu}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="site-header__mobile-menu-footer">
              <span>Conversation · Knowledge · Tasks · Momentum</span>
              <Link href="/signup" onClick={closeMenu}>Start with a conversation <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/" aria-label="VOII home">
        <Logo />
      </Link>
      <nav className="site-footer__nav" aria-label="Footer navigation">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/for-you">For you</Link>
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/careers">Careers</Link>
      </nav>
      <span>Made for the work after the words.</span>
    </footer>
  );
}
