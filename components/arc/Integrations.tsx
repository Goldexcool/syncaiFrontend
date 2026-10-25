import Link from "next/link";
import { Reveal } from "@/components/arc/motion";

/**
 * What VOII connects to. Only capabilities the product actually lists are
 * named — no invented partners or logos. Two counter-running rails so the
 * section has motion without needing precise positioning.
 */
const ROW_A = [
  "Google Calendar", "Google Workspace", "Email notifications",
  "Export to PDF", "Public sharing", "Client workspaces",
];
const ROW_B = [
  "AI chat", "Advanced search", "Voice notes", "Shared AI memory",
  "SSO / SCIM", "Audit logs", "Usage analytics",
];

function Rail({ items, dir }: { items: string[]; dir: "a" | "b" }) {
  return (
    <div className={`ig__rail ig__rail--${dir}`} aria-hidden="true">
      <div className="ig__run">
        {[0, 1].map((copy) => (
          <div className="ig__set" key={copy}>
            {items.map((label) => (
              <span className="ig__chipItem" key={`${copy}-${label}`}>
                <i />{label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Integrations() {
  return (
    <section className="ig" aria-labelledby="ig-title">
      <Reveal className="ig__head">
        <span className="ig__chip">
          API on Enterprise <Link href="/contact">Talk to VOII →</Link>
        </span>
        <h2 id="ig-title">Weave VOII into the tools<br />you already work in.</h2>
        <p className="ig__sub">
          Everything below ships today. The plan you pick decides how much of it you get.
        </p>
      </Reveal>

      <div className="ig__stream">
        <Rail items={ROW_A} dir="a" />
        <Rail items={ROW_B} dir="b" />
        <span className="ig__core" aria-hidden="true">
          <i /><i /><i />VOII
        </span>
      </div>

      <Reveal className="ig__foot" delay={0.1}>
        <Link className="arc-btn arc-btn--quiet" href="/pricing">See what each plan includes</Link>
      </Reveal>
    </section>
  );
}
