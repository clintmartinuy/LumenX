# LumenX PH

Product catalog, booking, Messenger auto-reply, and ops console for LumenX PH. Built
against [`LUMENX-SPEC.md`](../LUMENX-SPEC.md) — all 9 phases are implemented.

## Setup

1. `pnpm install`
2. Create a Supabase project, then copy `.env.example` to `.env.local` and fill in the
   values (each has a comment on where to find it). A placeholder `.env.local` is
   committed so `pnpm dev` boots without a real project, but auth and any database access
   will fail until you connect one — pages that need data fall through to their
   `error.tsx` boundary rather than crashing.
3. Apply the migrations, **in filename order**, against your project — either:
   - `supabase link` then `supabase db push` (recommended), or
   - paste each file in `supabase/migrations/` into the Supabase SQL editor in order.
4. Run `supabase/seed.sql` the same way (SQL editor, or `supabase db reset` if using the
   Supabase CLI locally with Docker).
5. Create your first staff account (see below — not done by seed.sql).
6. `pnpm dev`.

### Bootstrapping the first staff account

`seed.sql` deliberately does not insert into `auth.users` — doing that outside Supabase's
Auth API is a known way to end up with accounts that can't actually log in (missing
`auth.identities` rows, wrong password-hash version, etc.), and it isn't portable to a
hosted project's SQL editor. Instead:

1. Supabase dashboard: Authentication → Users → Add user (or use the CLI/API) with a real
   email and password.
2. Copy that user's UUID, then run in the SQL editor:
   ```sql
   insert into staff_profiles (user_id, full_name, role)
   values ('<uuid-from-step-1>', 'Your Name', 'owner');
   ```
3. Log in at `/login`.

### Connecting Messenger (Phase 7)

Everything in `lib/messenger/` and `app/api/messenger/webhook` is built and unit-tested,
but Meta App/Page setup is inherently manual (§7.1) and can't be automated from here:

1. Create a Meta App at developers.facebook.com, add the Messenger product.
2. Connect the LumenX PH Facebook Page, generate a long-lived Page Access Token.
3. Set `META_APP_ID`, `META_APP_SECRET`, `MESSENGER_PAGE_ACCESS_TOKEN`, `MESSENGER_PAGE_ID`
   in `.env.local` / your deployment's env vars. `MESSENGER_VERIFY_TOKEN` is any random
   string you choose yourself.
4. In the Meta App dashboard, configure the webhook: URL = `<your-domain>/api/messenger/webhook`,
   verify token = the `MESSENGER_VERIFY_TOKEN` you set. Subscribe to the `messages` field.
5. In Settings → Messenger in the admin console, click "Configure greeting & menu" to run
   the one-time Messenger Profile API setup (greeting, Get Started, persistent menu), then
   "Send test message" to confirm delivery to your own PSID (works pre-App-Review since
   you're a Page admin/tester).
6. Request App Review for `pages_messaging` before messaging real customers — until then,
   the bot only works for Page admins/testers.

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build (also typechecks + lints)
pnpm test         # Vitest unit tests (59 tests across money/inventory/availability/
                   # matcher/messenger-verify/finance)
pnpm test:watch   # Vitest watch mode
pnpm test:e2e     # Playwright smoke tests — needs a live Supabase project, see
                   # tests/e2e/README.md
pnpm lint         # ESLint
```

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab, import into Vercel.
2. Set all env vars from `.env.example` in the Vercel project settings (Production +
   Preview).
3. Deploy. `NEXT_PUBLIC_SITE_URL` should be the deployed domain (used in sitemap.xml,
   robots.txt, JSON-LD, and Messenger's persistent menu links).
4. Point the Messenger webhook and Meta OAuth redirect (if applicable) at the deployed
   domain, not localhost.

## Architecture notes

- **Money** is stored as integer centavos (`bigint`) everywhere and only ever touched
  through `lib/money.ts`. `splitByWeight()` there (remainder-safe weighted split) backs
  both freight/landed-cost allocation (`lib/inventory.ts`) and partner profit-distribution
  splits (`lib/partners.ts`) — one tested implementation, two call sites.
- **`product_stock`** (quantity on hand + moving-average cost) is a Postgres view, not a
  maintained table — replays `stock_movements` chronologically via a recursive CTE. A view
  can't drift from the source data; revisit as a maintained table only if this proves
  measurably slow. `product_stock_status` is the public-safe (badge-only) projection.
- **Public-facing writes** (contact form, booking wizard, chat widget, Messenger webhook)
  go through Server Actions/Route Handlers using the service-role client
  (`lib/supabase/admin.ts`) — there's no anon RLS policy for `customers`/`inquiries`/
  `bookings` by design (no customer accounts). Zod validation at those boundaries is the
  security control there, not RLS.
- **Admin mutations** use the session-scoped client (`lib/supabase/server.ts`) instead, so
  RLS — not application code — is the real enforcement for role checks; the `requireRole`-
  style guards in Server Actions exist only to surface a clean error message before RLS
  would reject the write.
- **`create_sale`** (`supabase/migrations/00011_pos_rpc.sql`) is a single Postgres
  function covering sale + sale_items + stock_movements + payments + audit_log + booking
  linkage — the atomicity §13 Phase 4 asks for comes from a function body being one
  transaction, not from application-level orchestration.
- **The auto-reply matcher** (`lib/autoreply/matcher.ts`) is a pure function (no I/O),
  fully unit-tested. Confidence combines matched keyword weights as a probabilistic OR
  (`1 - Π(1 - weight)`), not a fraction of an intent's total keyword list — real chat
  messages rarely contain more than one trigger phrase, so requiring near-full coverage
  would escalate almost everything.
- **Reference numbers** (`PO-YYYYMM-####`, `INQ-YYYYMMDD-####`, `BK-YYYYMMDD-####`,
  `S-YYYYMMDD-####`) are generated by a `next_reference()` Postgres function via column
  defaults, not application code.

## Known scope trims (disclosed, not silent)

Given the size of this build, a few things were deliberately simplified rather than fully
built out. None of these block core functionality; all are reasonable follow-ups.

- **Admin bookings calendar** (§9.5) is a list view with status filtering, not the
  month/week/day drag-to-reschedule calendar the spec describes.
- **Canned responses** (§9.6/§9.10) reuse `autoreply_intents.response_template` rather than
  a dedicated `canned_responses` table — same `{{placeholder}}` templating, one fewer table.
- **Wattage/lumen band filters** on the catalog (§6.2) aren't implemented — category,
  vehicle fitment, price range, and in-stock filters are, and compose correctly together
  (the specific combination §13 Phase 2 tests).
- **Toast-per-mutation** (§10): most forms show inline success/error text next to the
  submit button rather than a `sonner` toast. The `<Toaster/>` is wired up globally, but
  most existing forms weren't retrofitted to call `toast()` — functionally equivalent
  feedback, different presentation than the spec's literal ask.
- **No refund/void workflow** for completed sales — `sales` has no cancellation status, so
  §9.8's "cancelled and refunded sales are excluded from all revenue and margin figures"
  has nothing to filter on yet. Out of scope for this MVP pass; would need a schema change.
- **Product images** are seeded with plausible storage paths but no actual files —
  `product-images`/`job-photos` buckets exist (migration `00010_storage.sql`), but nothing's
  been uploaded to them. Upload real photos via the product editor's image field.

## Two spec-internal ambiguities resolved (flagged for the owner)

1. **Partner data read access.** §9's role matrix implies `admin` has broad partner
   visibility ("everything except finalizing distributions and editing equity"), while
   §9.9 calls the whole `/admin/partners` section "Owner-only." Resolved as: admin+ read,
   owner-only write. See `supabase/migrations/00008_partners.sql`.
2. **Cost/margin visibility for `staff` vs `admin+`.** Postgres RLS can't hide specific
   *columns* from `staff` while showing the row, since staff and admin share the
   `authenticated` Postgres role. `suppliers`/`purchase_orders`/`expenses` are admin+-only
   tables (DB-enforced); hiding `unit_cost`/`cogs_total`/margin figures from plain `staff`
   on `stock_movements`/`sales` (which staff needs for day-to-day POS/inventory work) would
   need to happen in the admin UI's query layer — not implemented, since the admin UI as
   built doesn't yet differentiate `staff` vs `admin+` views of those pages.

## Assumptions (spec §16 — build against these, confirm with the owner)

1. Single physical location. No branch-level inventory.
2. Tax rate defaults to 0% (non-VAT). Configurable in Settings.
3. Inventory costing is moving weighted average, not FIFO or serial-level.
4. Partner profit split is by fixed equity percentage, no salaries or preferred returns.
5. Warranty is tracked per sale line; claim handling is manual, no RMA workflow.
6. Bookings are single-technician per slot unless `max_concurrent` is raised.
7. Auto-reply is rule-based only (no LLM calls), in English and light Taglish.

## Environment

See `.env.example`. Supabase keys are per-project; Meta/Messenger keys require the setup
in "Connecting Messenger" above.
