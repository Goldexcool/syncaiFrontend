"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app/AppShell";
import { Icon, SectionHeading, formatDate, sentenceCase } from "@/components/app/kit";
import { cancelPlan, getBillingSubscription, getFullUsage, listPlans, startCheckout, verifyCheckout, type Currency, type FullUsage, type Plan, type Subscription } from "@/lib/api/app";

const REF_KEY = "voii.checkoutRef";

// usage counter → plan limit it is measured against
const METERS: Array<[usage: string, limit: string, label: string]> = [
  ["meetingsCreated", "meetingsPerMonth", "Meetings this month"],
  ["processingMinutesUsed", "processingMinutesPerMonth", "Processing minutes"],
  ["botMeetingsScheduled", "botMeetingsPerMonth", "Bot recordings"],
  ["aiRegenerationsUsed", "aiRegenerationsPerMonth", "AI regenerations"],
  ["storageMbUsed", "storageMb", "Storage (MB)"],
  ["teamMembers", "teamMembers", "Team members"],
  ["projectsCreated", "projects", "Projects"],
  ["boardsCreated", "boards", "Boards"],
];

const money = (amount: number, currency: Currency) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong. Please try again.");

export function BillingScreen() {
  return <AppShell crumbs={["Settings", "Billing"]}><BillingBody /></AppShell>;
}

function BillingBody() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<FullUsage | null>(null);
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [p, s, u] = await Promise.allSettled([listPlans(), getBillingSubscription(), getFullUsage()]);
    if (p.status === "fulfilled") setPlans(p.value.plans);
    if (s.status === "fulfilled") setSub(s.value.subscription);
    if (u.status === "fulfilled") setUsage(u.value);
    if (p.status === "rejected" && s.status === "rejected") setError(errorText(s.reason));
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Back from Bachs checkout: the webhook grants the plan; poll the reference until it lands.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("payment") !== "callback") return;
    window.history.replaceState(null, "", "/settings/billing");
    let ref: string | null = null;
    try { ref = sessionStorage.getItem(REF_KEY); } catch {}
    setNotice("Activating your plan… this can take a minute after payment.");
    if (!ref) return;
    let cancelled = false;
    void (async () => {
      for (let i = 0; i < 10 && !cancelled; i++) {
        const result = await verifyCheckout(ref).catch(() => null);
        if (result?.transaction?.status === "success") {
          try { sessionStorage.removeItem(REF_KEY); } catch {}
          setNotice(`You're on ${sentenceCase(result.transaction.plan)}. Thanks for upgrading.`);
          await load();
          return;
        }
        if (result?.transaction && ["failed", "abandoned"].includes(result.transaction.status)) {
          setNotice("");
          setError("The payment didn't go through. You haven't been charged for a plan.");
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setNotice("Payment is still processing. Your plan will switch over as soon as it's confirmed.");
    })();
    return () => { cancelled = true; };
  }, [load]);

  async function upgrade(plan: Plan) {
    setBusy(plan.key); setError("");
    try {
      const { checkout } = await startCheckout(plan.key, currency);
      try { sessionStorage.setItem(REF_KEY, checkout.reference); } catch {}
      window.location.assign(checkout.authorizationUrl);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  }

  async function cancel() {
    if (!sub || !window.confirm(`Cancel ${sentenceCase(sub.plan)}? You keep it until ${formatDate(sub.currentPeriodEnd, { month: "long", day: "numeric" })}.`)) return;
    setBusy("cancel"); setError("");
    try {
      setSub((await cancelPlan()).subscription);
      setNotice("Plan cancelled. It won't renew.");
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(null);
  }

  const current = sub?.plan ?? usage?.plan ?? "free";
  const cancelledPlan = sub?.status === "cancelled" && current !== "free";

  return <>
    <header className="dashboard-content__header"><div><p className="dashboard-location"><Link href="/settings">Settings</Link> / Billing</p><h1>Plan and billing.</h1><p className="dashboard-intro">What you're on, what you've used this month, and room to grow.</p></div></header>
    {notice ? <div className="dashboard-alert dashboard-alert--success" role="status"><span>{notice}</span></div> : null}
    {error ? <div className="dashboard-alert" role="alert"><span>{error}</span></div> : null}

    <div className="dashboard-settings-grid">
      <section className="dashboard-surface">
        <SectionHeading title="Current plan" />
        <div className="dashboard-plan-line"><span className="dashboard-plan-name">{sentenceCase(current)}</span><span>{cancelledPlan ? "Cancelled" : sentenceCase(sub?.status ?? "active")}</span></div>
        {current !== "free" && sub ? <p className="dashboard-settings-copy">
          {cancelledPlan
            ? `Ends ${formatDate(sub.currentPeriodEnd, { month: "long", day: "numeric", year: "numeric" })}, then you move to Free.`
            : sub.providerSubscriptionId
              ? `Renews ${formatDate(sub.currentPeriodEnd, { month: "long", day: "numeric", year: "numeric" })}, billed by card through Bachs.`
              : `Paid through ${formatDate(sub.currentPeriodEnd, { month: "long", day: "numeric", year: "numeric" })}. Pay again to extend it.`}
        </p> : <p className="dashboard-settings-copy">Free covers a few meetings a month. Upgrade when your team needs more room.</p>}
        {current !== "free" && !cancelledPlan ? <button className="dashboard-outline-button" type="button" onClick={() => void cancel()} disabled={busy !== null}>{busy === "cancel" ? "Cancelling…" : "Cancel plan"}</button> : null}
      </section>

      <section className="dashboard-surface">
        <SectionHeading title="This month" />
        {usage ? <div className="dashboard-usage-list">{METERS.map(([u, l, label]) => {
          const used = usage.usage[u] ?? 0;
          const limit = usage.limits[l];
          if (limit === undefined) return null;
          const unlimited = limit < 0;
          return <div key={u} className="billing-meter">
            <div className="dashboard-usage-row"><span>{label}</span><strong>{used}{unlimited ? " · unlimited" : ` / ${limit}`}</strong></div>
            {unlimited ? null : <div className="progress"><span style={{ width: `${Math.min(100, limit === 0 ? 100 : (used / limit) * 100)}%` }} /></div>}
          </div>;
        })}</div> : <p className="app-muted">Loading…</p>}
      </section>
    </div>

    <section className="dashboard-surface">
      <div className="dashboard-section-heading">
        <h2>Plans</h2>
        <div className="dashboard-filter-group" role="group" aria-label="Currency">
          {(["NGN", "USD"] as const).map((c) => <button key={c} type="button" className={currency === c ? "is-active" : ""} aria-pressed={currency === c} onClick={() => setCurrency(c)}>{c}</button>)}
        </div>
      </div>
      <p className="dashboard-settings-copy">{currency === "USD" ? "USD plans renew monthly by card. Cancel any time." : "NGN plans are paid one month at a time by card or bank transfer. Nothing renews on its own."}</p>
      <div className="billing-plans">
        {plans.map((plan) => {
          const price = plan.pricing[currency];
          const isCurrent = plan.key === current;
          return <article key={plan.key} className={`billing-plan ${isCurrent ? "is-current" : ""}`}>
            <div className="billing-plan__head"><h3>{plan.name}</h3>{isCurrent ? <span className="chip chip--sage">Current</span> : plan.recommended ? <span className="chip chip--peach">Popular</span> : null}</div>
            <p className="billing-plan__price">{plan.pricing.customPricing ? "Custom" : price ? (price.amount === 0 ? "Free" : <>{money(price.amount, currency)}<small> / month</small></>) : "—"}</p>
            <p className="dashboard-settings-copy">{plan.description}</p>
            <ul>{plan.features.map((f) => <li key={f}><Icon name="check" size={14} />{f}</li>)}</ul>
            {plan.pricing.customPricing
              ? <Link className="dashboard-outline-button" href="/contact">Talk to us <Icon name="arrow" size={15} /></Link>
              : !isCurrent && price?.available
                ? <button className="dashboard-primary-button" type="button" onClick={() => void upgrade(plan)} disabled={busy !== null}>{busy === plan.key ? "Opening checkout…" : <>Upgrade to {plan.name} <Icon name="arrow" size={15} /></>}</button>
                : null}
          </article>;
        })}
      </div>
    </section>
  </>;
}
