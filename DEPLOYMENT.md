# Deploying HACCP-Builder: GitHub → Render

This walks through pushing the project to GitHub and running it on Render,
using Render's own managed Postgres for the database (Render's app
filesystem is ephemeral — this project's `prisma/schema.prisma` is already
set to `postgresql`, so no schema change is needed before you start).

Total time: 30–45 minutes for a first deploy.

## 0. What you'll need

- A free [GitHub](https://github.com) account
- A free [Render](https://render.com) account (can sign up with GitHub)
- Node 20+ installed locally (to generate a `NEXTAUTH_SECRET` and, if you
  want, to test the Postgres connection before deploying). Node 20 is what CI
  and the recommended Render `NODE_VERSION` use; newer LTS releases also work.

## 1. Put the project on GitHub

> Already on GitHub? (This is normally `github.com/billy-zhouj/HACCP-Builder`,
> branch `main`.) Skip to step 2 — the steps below are only for pushing a
> fresh copy for the first time.

1. Unzip this project locally if you haven't already (`haccp-builder/`).
2. In that folder, initialize git and make the first commit:

   ```bash
   cd haccp-builder
   git init
   git add .
   git commit -m "Initial commit"
   ```

   The included `.gitignore` already excludes `node_modules`, `.next`,
   `.env`, and any local `dev.db` — double check `git status` doesn't show
   any of those before committing.
3. Create a new repository on GitHub (no README/license — you already have
   files): go to github.com → **New repository** → name it e.g.
   `haccp-builder` → **Create repository**.
4. Push:

   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/haccp-builder.git
   git push -u origin main
   ```

## 2. Create the Postgres database on Render

1. Log into [Render](https://dashboard.render.com).
2. **New** → **PostgreSQL**.
3. Name it e.g. `haccp-builder-db`, pick a region, leave the free plan
   selected for testing (upgrade later for production — the free Postgres
   tier is deleted after 30 days of inactivity/expiry).
4. Click **Create Database**. Wait for it to become "Available."
5. On the database's page, copy the **Internal Database URL** (for the web
   service, same region) or the **External Database URL** (to run
   migrations from your own machine, or open Prisma Studio). Keep this tab
   open; you'll need the value in step 4.

## 3. Create the web service on Render

1. **New** → **Web Service**.
2. Connect your GitHub account if you haven't, then select the
   `haccp-builder` repo.
3. Fill in:
   - **Name:** `haccp-builder` (this becomes part of your default URL:
     `haccp-builder.onrender.com`)
   - **Region:** same region you picked for the database
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
     (`migrate deploy` applies your Prisma migrations to the production
     database non-interactively — safe to run on every deploy. The repo
     already ships the full `prisma/migrations/` folder, so this works from
     the very first deploy — no manual migration step is required; see §5.)
   - **Start Command:** `npm run start`
   - **Instance Type:** Free is fine to confirm everything works; move to a
     paid instance before relying on this for real customers (the free
     tier spins down after 15 minutes of inactivity).
4. Don't click Create yet — add environment variables first (next step).

## 4. Set environment variables

Still on the web service creation screen, scroll to **Environment
Variables** and add:

**Core:**

| Key | Value |
|---|---|
| `DATABASE_URL` | The Internal Database URL you copied in step 2 |
| `NEXTAUTH_URL` | `https://haccp-builder.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | Same as `NEXTAUTH_URL` — drives SEO metadata, the sitemap, and robots.txt |
| `NEXTAUTH_SECRET` | A long random string — generate one locally with `openssl rand -base64 32` |
| `NODE_VERSION` | `20` — matches CI; Render's Node runtime version picker reads this |
| `DEFAULT_RETENTION_DAYS` | `90` |
| `MAX_EXPORT_HAZARDS` | `1500` — per-plan hazard cap for the Word export; beyond it the export is refused with 413 (raise cautiously, lower on small instances) |
| `ALLOW_FREE_UNLOCK` | `true` while testing pre-launch; **remove entirely once Stripe is live** |
| `CRON_SECRET` | A long random string — protects the scheduled retention-purge endpoint (see §"Retention purge" below). Leave blank to disable the endpoint (it returns 501) |
| `RETENTION_PURGE_BATCH` | `500` — max plans purged per cron run |

**Stripe (billing):** leave blank to run in dev-mode-unlock; set all four
when going live (see §7).

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Real or test-mode Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint (see §7) |
| `STRIPE_PRICE_ID_ONE_TIME` | Price ID of the one-time plan-unlock price |
| `STRIPE_PRICE_ID_STORAGE_SUBSCRIPTION` | Price ID of the recurring storage-subscription price |

**国内支付订单（支付宝 / 微信扫码，人工订单流程）:** 以下变量用于支付宝 /
微信人工扫码订单流程，取值来自你的收款账户（权威说明见 `.env.example`
中对应注释）。

| Key | Value |
|---|---|
| `PLAN_UNLOCK_PRICE_CNY` | `99` — 解锁单个计划的价格（元） |
| `ALIPAY_ACCOUNT_NAME` | 支付宝收款账户显示名称 |
| `ALIPAY_ACCOUNT` | 支付宝收款账号 |
| `ALIPAY_QR_CODE_URL` | 支付宝收款码图片 URL（留空则支付宝订单走人工收款流程） |
| `WECHAT_MERCHANT_ID` | 微信商户号（未接入时留空） |
| `WECHAT_QR_CODE_URL` | 微信收款码图片 URL（留空则微信订单走人工收款流程） |

Click **Create Web Service**. Render will pull the repo, run the build
command, and start it — watch the **Logs** tab for progress.

## 5. Migrations are already in the repo

`prisma/migrations/` is committed, so **you don't need to create an
initial migration** — the first deploy's `npx prisma migrate deploy` applies
the existing migration history to your fresh production database
automatically.

**Schema changes later:** whenever you change `prisma/schema.prisma`, run
`npx prisma migrate dev --name <description>` locally (against a dev
database), commit the new migration folder, and push; the build command
applies it on the next deploy via `migrate deploy`.

**Note on local development:** local dev needs a Postgres database too
(SQLite isn't used here). Easiest options: point your local `.env` at the
same Render database temporarily (fine while you're the only user), spin up a
free database on [Neon](https://neon.tech) or
[Supabase](https://supabase.com) for local dev, or run Postgres in Docker.

## 6. Verify

1. Once the deploy finishes (Logs tab shows the app listening), visit your
   Render URL (`https://haccp-builder.onrender.com` by default).
2. Register an account, create a plan, walk through the wizard.
3. On Review & Export, since `STRIPE_SECRET_KEY` is blank, you'll see a
   "(Dev mode) Simulate unlock" button — use it to confirm the `.docx`
   export works end-to-end in production.
4. Sanity-check the public routes return 200: `/`, `/robots.txt`,
   `/sitemap.xml`, `/opengraph-image`, `/icon` (the last two run the
   OG-image/favicon generator — they fail on plain Windows dev but should be
   fine on Render's Linux; verify once here).
5. Confirm the guard rails: `/api/plans` without a session returns 401, and
   `POST /api/cron/retention-purge` without the right header returns 501/401
   (see §"Retention purge").

## 7. Going live with billing (when ready)

1. Create a [Stripe](https://stripe.com) account and create the two Prices:
   one one-time (the plan unlock fee) and one recurring (the storage
   subscription).
2. In Render's environment variables, set `STRIPE_SECRET_KEY`,
   `STRIPE_PRICE_ID_ONE_TIME`, and `STRIPE_PRICE_ID_STORAGE_SUBSCRIPTION`.
3. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://<your-render-url>/api/billing/webhook`, and **subscribe it to
   `checkout.session.completed` only** — that is the single event the app
   currently processes (both the one-time unlock and the initial
   subscription purchase arrive as this event type). Copy the resulting
   signing secret into `STRIPE_WEBHOOK_SECRET` on Render. Test it end-to-end
   in **test mode** (`sk_test_…`) first, e.g. with
   `stripe listen --forward-to https://<your-render-url>/api/billing/webhook`,
   before switching to live keys.
4. Render redeploys automatically when you save environment variable
   changes. The dev-mode "Simulate unlock" button disappears automatically
   once `STRIPE_SECRET_KEY` is set, and real Stripe Checkout takes over.

### ⚠️ Before enabling the recurring subscription price (known gap)

The webhook currently handles `checkout.session.completed` **only**. Stripe
sends recurring subscription renewals as **`invoice.paid`** /
**`customer.subscription.updated`**, which are **not handled yet** — so a
subscriber's `storageSubscriptionEnd` will **not** renew automatically, and
their plans would be re-anchored and then purged 90 days after the first
period ends. Do **not** activate the storage-subscription price in
production until the webhook is extended to process renewal events (tracked
as a code change; update this note once shipped). The one-time plan-unlock
price is unaffected.

## SEO

What's already wired up in the code:

- **Metadata** (`src/lib/seo.ts`, used from `src/app/layout.tsx`): page
  titles, meta description, keywords, canonical URLs, and Open Graph/
  Twitter card tags — all driven off `NEXT_PUBLIC_SITE_URL`.
- **`/robots.txt`** (`src/app/robots.ts`) — allows crawling of the public
  marketing pages, explicitly blocks `/dashboard`, `/plans`, and `/api`.
- **`/sitemap.xml`** (`src/app/sitemap.ts`) — lists the public pages only.
- **JSON-LD structured data** (in `layout.tsx`) — a `SoftwareApplication`
  schema block.
- **Auto-generated OG image and favicon** (`src/app/opengraph-image.tsx`,
  `src/app/icon.tsx`) — swap in real branded assets whenever you have them.

## Ongoing workflow

From here on, deploying is just: commit, push to `main`, Render auto-builds
and redeploys. Any schema change needs a migration generated locally
(`npx prisma migrate dev --name ...`) and committed alongside the code
change, same as step 5.

Every push to `main` and every pull request also runs CI
(`.github/workflows/ci.yml`): `npm ci` → `prisma generate` → TypeScript
check → the 171 template×parser contract tests (Node 20). CI does **not**
gate Render's auto-deploy — it is advisory, so check the run has gone green
before relying on a push to `main`.

## Retention purge

Plan data on the free / one-time-unlock tier is retained for
`DEFAULT_RETENTION_DAYS` (90) and then purged, unless the owner has an active
storage subscription (in which case `retentionExpiresAt` is null and the plan
is kept indefinitely). The purge itself runs via an authenticated cron
endpoint:

```
POST /api/cron/retention-purge
Authorization: Bearer <CRON_SECRET>
```

It (1) re-anchors plans whose owner's subscription has lapsed — giving them a
fresh 90-day window — and (2) deletes plans whose `retentionExpiresAt` is in
the past (cascading to all child rows). It is idempotent and safe to re-run.
The endpoint refuses to run (501) if `CRON_SECRET` is unset, and returns 401
if the bearer token doesn't match.

Schedule it to run **daily** (e.g. 03:00 UTC). Options:

- **Render Cron Job:** create a Cron Job service (New → Cron Job), schedule
  `0 3 * * *`, build command `npm install`, command:
  ```
  curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://<your-render-url>/api/cron/retention-purge
  ```
  (set `CRON_SECRET` as an env var on the cron job, matching the web service).
- **External monitor:** [cron-job.org](https://cron-job.org) or
  [UptimeRobot](https://uptimerobot.com) with a daily schedule hitting the URL
  with the `Authorization` header.
- **GitHub Action:** a scheduled workflow using `actions/curl` or a `fetch`
  step against the endpoint.

If you'd rather not run the purge as HTTP, the core logic is in
`src/lib/retention.ts` (`purgeExpiredPlans`) and can be called from a
standalone `tsx` script run by any scheduler.
