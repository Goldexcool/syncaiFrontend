"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="site-header flex items-center justify-between">
      <Link className="site-header__logo" href="/" aria-label="VOII home">
        <Logo />
      </Link>
      <nav className="site-header__nav" aria-label="Primary navigation">
        <Link href="/how-it-works" aria-current={pathname === "/how-it-works" ? "page" : undefined}>How it works</Link>
        <Link href="/pricing" aria-current={pathname === "/pricing" ? "page" : undefined}>Pricing</Link>
        <Link href="/for-you" aria-current={pathname === "/for-you" ? "page" : undefined}>For you</Link>
      </nav>
      <div className="site-header__actions">
        <Link className="site-header__signin" href="/login" aria-current={pathname === "/login" ? "page" : undefined}>Sign in</Link>
        <Link className="button button--header" href="/signup">
          <span className="button--header__label button--header__label--desktop">Start with a conversation</span>
          <span className="button--header__label button--header__label--mobile">Get started</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
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
      </nav>
      <span>Made for the work after the words.</span>
    </footer>
  );
}
