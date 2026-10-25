# VOII — What's left, and the student build

Written 2026-10-25 when the project restarted. Frontend: `~/projects/voii` (Next.js 15).
Backend: `~/projects/sync` (Express + Prisma + Postgres + Redis + RabbitMQ + worker).
Design language: [DESIGN.md](DESIGN.md).

---

## 0. Where things stand

**Done**
- New "Dusk" design across the whole frontend (marketing, auth, onboarding, dashboard). Old "arc" design, `/classic`, GSAP/Lenis/Motion removed. Snapshot of the old design is commit `a15af51`.
- Backend has almost every module built (see `sync/BACKEND_MASTER_PLAN_V2.md` §13): auth, workspaces, meetings, uploads, processing worker, Deepgram transcripts (diarization supported), OpenAI summaries + action items, tasks/projects/boards, notifications (SSE + email), billing (Paystack + Lemon Squeezy), calendar bot (Recall.ai), sharing, AI assistant, admin analytics, clients.

**Risk to fix first**
- `sync` has **~149 uncommitted files** (schema, auth, config, docs). Review and commit them before any new backend work, or one bad checkout loses months of work.

**The gap:** the backend is far ahead of the frontend. The dashboard only lists things; most flows have no UI.

---

## 1. Finish the core app (frontend ↔ existing backend)

In order — each is a vertical slice you can ship.

| # | Slice | Backend endpoints (already built) |
|---|---|---|
| 1 | **Record / upload a recording** — browser recorder (MediaRecorder) + file upload → signed URL → upload-complete | `POST /meetings/:id/upload-url`, `/upload-complete` |
| 2 | **Processing status** — live progress on a meeting | `GET /meetings/:id/processing-status` (poll, or SSE) |
| 3 | **Meeting detail page** — summary, transcript with timestamps, click-to-play source | `GET /meetings/:id`, `/transcript`, `/summary` |
| 4 | **Action item review** — approve / reject / bulk, convert to tasks | `/action-items/*`, `/convert-to-tasks` |
| 5 | **Projects → boards → tasks** — board view with columns, drag to move | `/projects`, `/boards`, `/tasks/:id/move` |
| 6 | **Settings** — profile, password, notification preferences, delete account | `/users/me*`, `/notifications/preferences` |
| 7 | **Billing** — plan page in-app, checkout (NGN Paystack / USD Lemon Squeezy), handle `402 PLAN_LIMIT_EXCEEDED` globally | `/billing/*` |
| 8 | **Sharing** — share dialog (expiry, password) + public `/share/[token]` page | `/meetings/:id/share`, `/share/:token` |
| 9 | **Ask your notes** — AI assistant panel (⌘K) | `/ai/command`, `/ai/suggestions` |
| 10 | **Realtime** — notification bell on SSE instead of polling | `/notifications/stream` |
| 11 | **Admin** (later, separate route group) | `/admin/*` |

Backend roadmap still open (master plan §10): Commitment API (Phase 3) → events → reminder engine → client portal → AI commitment extraction → analytics → portal limits.

---

## 2. NEW — Students: lecture mode

**Goal:** a student taps record in class; VOII filters out the room, keeps the lecturer, and sends back
rigorous, well-structured notes — including the maths — by email and into their account.

### 2.1 Product shape

- Onboarding gets a 4th path: **"Lecture notes — I'm a student"** (new `UsagePath.lecture_notes`).
- Student workspace shows **Courses** (MTH 201, ECO 104…) instead of Clients; each lecture lives in a course.
- Recorder screen (mobile-first, PWA): big record button, timer, live "audio quality" meter, **📷 Snap the board** button.
- After class: notification + email "Your MTH 201 notes are ready", PDF attached.
- Note page: outline, definitions, theorems, worked examples with rendered equations, assignments & deadlines, likely exam questions, "Questions from the class". Every block has a tap-to-hear timestamp.

### 2.2 The honest hard part: calculations

Audio alone does **not** contain what the lecturer writes on the board. "So this becomes… and that cancels…"
can't be turned into correct maths without seeing the board. So:

1. **Board snaps** — student taps a button to photograph the board during class; each photo is timestamped.
   A vision model reads the board (handwriting → LaTeX) and the note writer merges it with what was said at that time.
2. Without photos, VOII still reconstructs maths from speech, but **flags low-confidence steps** ("check against the board") rather than inventing them.
3. A **verification pass** re-derives each worked example and flags steps that don't follow.

This is the difference between "nice summary" and notes a student can trust before an exam.

### 2.3 Pipeline (backend + worker)

```
phone mic ──► chunked upload (every 30s, survives sleep/drop)
          ──► [1] clean audio      ──► [2] transcribe + diarize ──► [3] pick lecturer
          ──► [4] write notes (+ board photos) ──► [5] verify maths ──► [6] save + email + PDF
```

| Step | Approach | Notes |
|---|---|---|
| Capture | `getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } })` + MediaRecorder (Opus), Wake Lock API, chunked upload | Free first layer of noise reduction, native in every browser |
| [1] Clean | Speech enhancement worker: **DeepFilterNet** (open source, self-hosted Python worker) — or a hosted voice-isolation API behind the existing AI provider abstraction | Removes chatter, fans, chairs. Keep original too, for playback |
| [2] Transcribe | Existing Deepgram Nova-3 provider with `diarize: true`, `smart_format: true`, keyterms from the course (names, jargon) | Already built — add per-course keyterms |
| [3] Lecturer | Dominant speaker by talk time = lecturer; other speakers kept only as "Questions from the class" | Simple, robust; let the student correct it |
| [4] Write | Stronger model for lectures than the meeting default (gpt-4o-mini is too weak for maths). Long lectures: chunk by topic → section notes → assemble. Output **Markdown + LaTeX** | Use the AI provider settings so the model is admin-switchable |
| [5] Verify | Second pass re-checks every derivation, marks unsure steps | Cheap relative to the value |
| [6] Deliver | Save to course; email via existing Brevo worker with PDF attachment; in-app notification | Email template restyled to Dusk |

### 2.4 Data model (Prisma, minimal)

- `enum MeetingKind { meeting lecture }` → `Meeting.kind` (default `meeting`). Lectures reuse the whole meeting pipeline.
- `model Course { id, workspaceId, name, code?, lecturer?, keyterms String[], createdAt, deletedAt? }` → `Meeting.courseId?`.
- `model BoardCapture { id, meetingId, storageKey, capturedAtSeconds, ocrLatex?, status }`.
- `MeetingSummary.noteMarkdown String?` + `noteFormat` (lecture template output).
- `UsagePath.lecture_notes`.

### 2.5 Frontend

- `/record` — mobile-first recorder (PWA installable so it lives on the home screen).
- Courses view in dashboard; lecture note page rendering Markdown + **KaTeX** for equations.
- PDF export (print stylesheet first; server PDF later only if needed).

### 2.6 Pricing & limits

Lectures are long (1–3h). Count **processing minutes**, not recordings, for the student plan;
enforce the currently soft `processingMinutesPerMonth` limit for lectures. Campus/department licences on the Enterprise tier.

### 2.7 Consent

Add a pre-record reminder ("Check your university's recording policy and tell your lecturer") and a terms clause. Required, not optional.

---

## 3. Suggested order

1. Commit / clean up the `sync` backend working tree.
2. Frontend slices 1–4 (record → status → detail → action items). This is also 80% of lecture mode's UI.
3. Lecture mode backend: schema + `kind` + Course + lecture note prompt + stronger model + KaTeX rendering.
4. Noise-cleaning worker + dominant-speaker filter.
5. Board snaps (vision) + maths verification pass.
6. Email/PDF delivery, student onboarding path, pricing changes.
7. Remaining frontend slices 5–11, then backend Phases 3–10.

## 4. Decisions needed

| # | Question | Recommendation |
|---|---|---|
| 1 | Production storage | Cloudflare R2 (no egress fees; lectures are big files) |
| 2 | Noise cleaning: self-host DeepFilterNet vs hosted API | Start hosted for speed, move to self-hosted once volume justifies a GPU worker |
| 3 | Lecture note model | A frontier model for lecture notes; keep gpt-4o-mini for meeting summaries |
| 4 | Native mobile app? | No — PWA recorder first; native only if background recording on iOS proves unreliable |
| 5 | Student price | ₦8,500 Personal is likely too high for most Nigerian students; consider a student tier by processing minutes |
