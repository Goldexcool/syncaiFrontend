import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="page-hero ink">
          <div className="wrap">
            <p className="eyebrow">404</p>
            <h1>This page isn’t here.</h1>
            <p>The link may be old or mistyped.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
              <Link className="btn btn--primary" href="/">Go home <span aria-hidden="true">→</span></Link>
              <Link className="btn btn--ghost" href="/dashboard">Open your workspace</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
