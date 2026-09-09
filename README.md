# Ledger Academy

Arabic (RTL) e-learning platform for Egyptian secondary-school students studying
business administration. Video lessons grouped into courses and modules, a quiz
after each lesson, progress tracking, certificates, student Q&A, and an admin
dashboard for content, enrolment, and users.

There is **no online card payment** (no processor supports Egypt-based
merchants). Paid access is granted by a prepaid code or an admin-approved
manual-transfer request.

## Stack

- **Next.js 16** (App Router, Turbopack, `src/` dir) · React 19 · TypeScript
- **Prisma 6** → **Postgres on Neon** (pooled `DATABASE_URL` + direct
  `DATABASE_URL_UNPOOLED` for migrations)
- **NextAuth v4** (JWT sessions, credentials + email OTP)
- **Tailwind v4** + shadcn/ui (radix), framer-motion, recharts
- **Vitest** against a dedicated Neon `test` branch · GitHub Actions CI
- Neon Object Storage (payment-proof screenshots) · Sentry (error monitoring,
  inert without a DSN) · optional Upstash Redis (rate limiting)

## Getting started

```bash
npm install
cp .env.example .env.local        # fill in NEXTAUTH_SECRET at minimum
# DATABASE_URL / DATABASE_URL_UNPOOLED come from `neon` CLI into .env
npx prisma generate
npm run dev                        # http://localhost:3000
```

Everything optional in `.env.example` (email, storage, Redis, Sentry, staging
gate) is nullable — the app runs without it and logs/degrades gracefully.

## Scripts

| command | what |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | `prisma generate && next build` |
| `npm run lint` | ESLint — **run before every push**, `next build` does not lint |
| `npm test` | Vitest (hits the Neon `test` branch — needs `.env.test`) |
| `npm run test:watch` | Vitest watch |
| `npm run admin:recover -- --email … --password …` | break-glass: set a password + force `role: ADMIN` |
| `npm run admin:super -- --email … [--revoke\|--list]` | grant/revoke the protected super-admin flag (DB only) |
| `npm run shots` / `npm run a11y` | Playwright screenshots / axe pass |

## Project structure

```
src/
  app/                     Next.js App Router
    (auth)/                login, register, forgot/reset password
    (marketing)/           public site — home, courses, pricing, privacy, terms
    dashboard/admin/       admin dashboard (real folder, not a route group)
    dashboard/student/     student dashboard
    api/                   route handlers
    certificates/[serial]/ public certificate render + verify
  components/
    admin/  auth/  course/  dashboard/  ledger-academy/  tools/  ui/
  lib/                     server + shared logic (auth, db, authz, notify,
                           delete-user / delete-course cascades, validators/, …)
  i18n/                    cookie-based ar/en (config, messages/*.json, provider)
  middleware.ts            staging-password gate + NextAuth /dashboard guard
  instrumentation*.ts,     Sentry init (must live in src/ for Next to load them)
  sentry.*.config.ts
prisma/                    schema.prisma + committed migrations/
tests/                     Vitest — api/ (route tests) + helpers/fixtures.ts
scripts/                   admin recovery, super-admin, screenshots, a11y
docs/                      PROJECT_STATE.md (history), DEPLOYMENT.md, archive/
```

## Testing

`npm test` runs against a **dedicated Neon branch** whose connection string
lives in `.env.test` (gitignored); `tests/setup.ts` refuses to run against any
other host. Routes are imported and invoked directly with a mocked
`getServerSession`. Create/tear down data only via `tests/helpers/fixtures.ts`.

## Deployment

Vercel. `vercel.json`'s build command runs `prisma migrate deploy` before the
Next build, so committed migrations self-apply on every deploy. See
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Conventions & invariants

[`CLAUDE.md`](CLAUDE.md) is the source of truth for the rules that keep this
codebase correct — security invariants (enrolment, delete cascades, admin
scopes), the i18n approach, the Prisma Migrate workflow, pricing/payment rules,
and more. Read the relevant section before changing those areas.
