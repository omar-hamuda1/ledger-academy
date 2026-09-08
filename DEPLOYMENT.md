# Deploying Ledger Academy (Vercel)

Status: **not yet deployed.** This is the runbook for the first deploy as a
**private staging environment** — not a public launch. Launch is separately
gated on real course content, SendGrid activation, and an end-to-end pass on
the live site.

## Why Vercel + `fra1`

- Vercel is the natural host for Next.js 16 App Router.
- Region is pinned to **Frankfurt (`fra1`)** in `vercel.json` because the Neon
  database is in `eu-central-1` — co-locating the serverless functions with
  the DB is the biggest latency win (every request makes several DB
  round-trips). Frankfurt is also decent latency to Egypt (~60–80 ms).

## One-time setup

### 1. Push the branch

```bash
git push origin main
```

Vercel deploys from GitHub; local commits it can't see don't deploy.

### 2. Create the Vercel project

- vercel.com → **Add New… → Project** → import **`omar-hamuda1/ledger-academy`**.
- Framework preset: **Next.js** (auto-detected). Root directory: leave default
  (repo root *is* the project root).
- Build command / install command: leave default. `package.json`'s `build` is
  already `prisma generate && next build` so the Prisma Client is regenerated
  on Vercel's cached `node_modules`.

### 3. Environment variables

Set these in **Project → Settings → Environment Variables** (all
environments) **before the first deploy** — the marketing pages query the DB
at build time, so a missing `DATABASE_URL` fails the build.

**Easiest path:** connect the **Neon ↔ Vercel integration** (Neon dashboard →
Integrations → Vercel). It auto-syncs `DATABASE_URL` (pooled) and the
`AWS_*` object-storage vars. Then you only add the NextAuth + Upstash + SendGrid
ones by hand.

| Variable | Required? | Value |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Neon **pooled** connection string (host contains `-pooler`). Neon dashboard → Connect → "Pooled connection". Not the one in local `.env` if that's the direct host. |
| `NEXTAUTH_SECRET` | **yes** | Copy from local `.env.local` (or generate a new one with `openssl rand -base64 32` — a new value just logs everyone out, fine for staging). |
| `NEXTAUTH_URL` | **yes** | The deployment URL, e.g. `https://ledger-academy.vercel.app`. Set it, deploy, correct it if the assigned domain differs, redeploy. |
| `AWS_ACCESS_KEY_ID` | for uploads | From local `.env.local` (written by `neon env pull`). Without it, payment-proof upload 503s and the "اطلب كودًا" form can't submit. |
| `AWS_SECRET_ACCESS_KEY` | for uploads | ″ |
| `AWS_ENDPOINT_URL_S3` | for uploads | ″ |
| `AWS_REGION` | for uploads | ″ (`eu-central-1`) |
| `UPSTASH_REDIS_REST_URL` | recommended | Free account at upstash.com (no card). **Without it, rate limiting is effectively off on serverless** — each request can hit a fresh instance with an empty in-memory counter, so the OTP / login / redeem limits don't hold. |
| `UPSTASH_REDIS_REST_TOKEN` | recommended | ″ |
| `GMAIL_USER` | for real signups | The Gmail address to send from. Until it's set, OTP emails only `console.log` — invisible on serverless, so **signup / password reset don't work for anyone but a dev reading logs**. |
| `GMAIL_APP_PASSWORD` | for real signups | Enable 2-Step Verification on that Google account, then create an App Password at myaccount.google.com/apppasswords. 16 chars, spaces OK. **Stopgap** — ~500/day, freemail sender hits spam; replace with a custom domain + SPF/DKIM provider before scaling. |
| `EMAIL_FROM` | optional | Envelope sender; defaults to `GMAIL_USER` (Gmail rewrites it unless it's a verified "Send mail as" alias). |
| `EMAIL_FROM_NAME` | optional | Display name on the email; defaults to `Ledger Academy`. |

Do **not** set `DATABASE_URL_UNPOOLED`, `NEON_BRANCH`, or anything from
`.env.test` — those are local-only (Prisma CLI / tests).

### 4. Make it private

Vercel Hobby can't password-protect *production* deployments, so the app has a
built-in gate: set a **`STAGING_PASSWORD`** env var (any value) on Vercel. While
it's set, every route serves an Arabic password page (API routes → 401 JSON)
until a visitor submits the password once — it's then stored in an httpOnly
cookie for 30 days — and all responses carry `X-Robots-Tag: noindex`. Unset the
var (and redeploy) to open the site for launch. Implemented in `src/middleware.ts`
(`stagingGate`); unlock form posts to `/staging-unlock`.

(If you're on Vercel Pro, **Settings → Deployment Protection → Vercel
Authentication** is an alternative and you can skip `STAGING_PASSWORD`.)

### 5. Deploy

Push to `main` → Vercel builds and deploys automatically. From here on every
push redeploys; a failed build leaves the previous deployment live.

## After the first deploy — smoke test on the live URL

- Home / `/courses` / `/pricing` render (ISR pages hit the DB at build).
- Register a throwaway account. The OTP email is sent via Gmail SMTP; **check
  spam**, since the sender is a freemail `@gmail.com` address. If `GMAIL_USER` /
  `GMAIL_APP_PASSWORD` aren't set, use `npm run admin:recover` against prod, or
  the OTP dev-log, to get in.
- Log in → `/dashboard/student` and `/dashboard/admin` load, the notification
  bell polls without errors.
- Admin: create a course, generate prepaid codes, send a broadcast notification.
- Student on a paid course: upload a payment-proof screenshot (checks the
  `AWS_*` vars + the `payment-proofs` bucket end to end), submit a request;
  admin approves; student gets the notification and the course unlocks.

## Known rough edges on serverless

- **Schema changes still run from localhost** (`prisma db push` against the
  Neon branches). Vercel does not migrate. After a schema change: push code →
  Vercel redeploys, and separately `prisma db push` to prod. Out-of-order =
  a broken deploy until both land.
- **ISR marketing pages query the DB at build time.** A DB outage during a
  Vercel build fails the build (the live site stays up on the old build).
- **`next dev` rewrites `AGENTS.md`** with a banner block; it's committed and
  harmless, just noisy in diffs.
