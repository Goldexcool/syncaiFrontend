# VOII — launch TODO

Updated 2026-10-30, after checking the live Render service (`syncaibackend`), the Render env vars, R2, and the app at 1440px and 375px.
Repos: frontend `~/projects/voii` (`redesign/verity`), backend `~/projects/sync` (`backend-revamp`, already in `origin/main`).
**[needs you]** = needs a key, an account, a payment or a decision from you.

## Done in this pass

- [x] Team invites no longer land on a 404. New `/invite/[token]` page: shows who invited you, lets you sign up or sign in, and brings you back to accept. (`app/invite/[token]`, `components/InvitePage.tsx`, `components/AuthPage.tsx` keeps `returnTo` through sign-up and sign-in)
- [x] Plan-limit (402) prompt in the app shell on every screen, with a link to plans. (`lib/api/client.ts`, `components/app/AppShell.tsx`)
- [x] Settings has profile, password, notification preferences (in app and email, per type), member role change and removal, pending invites with cancel, and delete account. All are laid out in a two-column grid. (`components/app/screens/Workspace.tsx`, `lib/api/dashboard.ts`)
- [x] Layout: New meeting, AI assistant and Inbox were capped at a centred 760px column. They now use the full width. New meeting puts the form beside a "What happens next" panel, and the AI suggestions show as three columns. Checked at 1440px, with no sideways scroll at 375px. (`app/globals.css`, `NewMeeting.tsx`)
- [x] Frontend security headers: frame deny, nosniff, referrer policy, HSTS, permissions policy. (`next.config.ts`)
- [x] Rate limit on the public client-portal message and access endpoints. (`sync/apps/api/src/middleware/rateLimit.middleware.ts`, `modules/portals/portal.routes.ts`)

## Blockers for launch

1. **[needs you]** **`APP_URL` is missing on Render**, so production emails link to `http://localhost:3000`. That covers verification, password reset and invites. Set `APP_URL=https://usevoii.com` on `syncaibackend` (Dashboard → Environment), then redeploy. The CLI has no env-var command, and my API call to set it was blocked.
2. **[needs you]** **R2 key rejected.** The `S3_*` keys in `sync/.env` (bucket `voii`, account `65d4…`) get 403 on put, get and delete. Create an R2 API token with Object Read & Write on `voii`, add a CORS rule allowing PUT from `https://usevoii.com`, then set `S3_*` and `STORAGE_PROVIDER=s3` on Render. Until then, **uploads fail in production**: local storage goes through `/api/dev`, which only works in development, and Render's disk is wiped on every deploy. The `cf` CLI here is signed in to a different Cloudflare account (`5c40…`).
3. **[needs you]** **The free Render plan sleeps after 15 minutes idle.** The worker runs in the same process, so processing stops and the first request or Recall webhook after a quiet spell waits for a cold start. Move to Starter ($7/month) or run the worker as its own service.
4. **[needs you]** **Bachs keys are missing.** No `BACHS_SECRET_KEY` or `BACHS_WEBHOOK_SECRET` is set on Render or locally, so checkout can't work. Add both, register the webhook `https://syncaibackend-jvrm.onrender.com/api/billing/webhooks/bachs`, and run one NGN and one USD payment.
5. **[needs you]** **Email sender.** On Render, `BREVO_SENDER_EMAIL` is a personal Gmail and `EMAIL_FROM` is `hello@usesync.app`. Verify usevoii.com in Brevo (SPF, DKIM and DMARC in Hostinger DNS), then set both to `hello@usevoii.com`.
6. **[needs you]** **Rotate every key pasted in chat:** Deepgram, ElevenLabs, Groq, Recall, Brevo, Google OAuth, and the Neon, Upstash and CloudAMQP URLs. The values on Render match your local `.env`, so they're the exposed ones.
7. **[needs you]** **Google OAuth.** Add the Render callback (`/api/integrations/google-calendar/callback`) to the OAuth client, submit the consent screen for verification (calendar scopes), and test connect → sync → notetaker on an event.
8. **[needs you]** **Recall.** Confirm the Recall dashboard webhook points at `https://syncaibackend-jvrm.onrender.com`. Then run one real Meet call on production.
9. **[needs you]** **API domain.** The frontend at usevoii.com is live, but the API is still `*.onrender.com`. Optionally point `api.usevoii.com` at it and update `API_URL`, `BOT_WEBHOOK_BASE_URL` and the Google redirect.
10. **[needs you]** Paystack and Lemon Squeezy webhooks are still mounted next to Bachs. Decide whether to drop them. (`sync/apps/api/src/modules/billing`)
11. **[needs you]** Final plan limits and prices, including a student tier, and a cap on processing minutes. Right now a 3-hour lecture on the free plan has no cap on AI cost. (`sync/packages/shared` limits, `voii/components/PricingPage.tsx`)
12. **[needs you]** Legal: the privacy and terms pages must cover recording consent, the subprocessors (Recall, Deepgram, ElevenLabs, Groq, Brevo, Bachs, Cloudflare, Neon, Upstash, CloudAMQP) and retention. (`voii/app/privacy`, `voii/app/terms`)
13. Revert the local test workspace that was set to `pro` by hand. It's only in the local DB, not production. (`sync/packages/database`)
14. `render.yaml` lists 16 env vars; the live service has 38. Update it to match, or delete it so nobody re-applies it. (`sync/render.yaml`)

## Product gaps

15. Onboarding lacks the role and invite-team steps from the design. (`components/ProtectedWorkspacePage.tsx`, `design/auth-flow.jsx`)
16. **[needs you]** Client sign-up and sign-in from the design aren't built. The portal is a public slug page. Is that enough for launch? (`app/portal/[slug]`)
17. Board columns can't be added, renamed or removed from the UI, although the API supports it. (`components/app/BoardPage.tsx`)
18. Courses have no screen of their own. You can create one only from the New meeting picker, with no editing of names or keyterms. (`NewMeeting.tsx`, `sync/modules/courses`)
19. Lecture mode extras from PLAN.md §2: a mobile `/record` PWA, board photos read into LaTeX, a maths check pass, and a "notes ready" email with the PDF attached. (`voii/app`, `sync/apps/worker`)
20. Notifications poll the unread count; the SSE stream the backend has isn't used. (`components/app/AppShell.tsx`)
21. **[needs you]** The commitments API is built, but the app barely uses it. Show it or hide it for launch. (`sync/modules/commitments`)
22. There's no admin UI; AI settings, plan overrides and analytics are API-only. Fine for launch.

## Quality

23. There are no frontend tests, and the backend has 5 unit tests. Add a smoke test for sign-up → invite → upload → notes → approve → board, plus a Bachs webhook test.
24. No CI runs lint, types or tests in either repo. (`.github/workflows`)
25. No error monitoring (Sentry or similar) on the frontend, API or worker, and `ALERT_WEBHOOK_URL` is unset.
26. Accessibility pass on the custom pickers, ⌘K, the board and the task panel. (`Picker.tsx`, `AppShell.tsx`, `BoardPage.tsx`)
27. Layout and mobile check of the meeting page and the board with real data. This pass checked empty states only. (`MeetingPage.tsx`, `BoardPage.tsx`)
28. A frontend CSP, once the inline scripts are nonced. (`next.config.ts`)
29. `DESIGN.md` still describes the dark "Dusk" theme; the app is black-and-white light. `PLAN.md` and `BACKEND_MASTER_PLAN_V2.md` still say Paystack and gpt-4o-mini, and show the frontend as "Unknown".
30. Load-test a 2–3 hour lecture through ElevenLabs → Deepgram → Groq, checking timeouts, memory and cost.
31. Never run `next build` while the dev server is running. Note this in the README.

## Later

32. Invoices and receipts, refunds, Stripe.
33. Server-side PDF, if the print CSS isn't enough.
34. Self-hosted DeepFilterNet instead of ElevenLabs, once volume justifies it.
35. Zoom and Teams for the notetaker; only Google Meet has been tested.
36. Backend roadmap: events, reminders, analytics, portal limits.
37. Notion and Slack integrations; a native app only if the PWA recorder is unreliable on iOS.
