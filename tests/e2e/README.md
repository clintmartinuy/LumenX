# E2E smoke tests

These need a live Supabase project (migrations + `seed.sql` applied) and a real staff
account — they can't run against the placeholder credentials used during development.

```bash
PLAYWRIGHT_STAFF_EMAIL=owner@example.com \
PLAYWRIGHT_STAFF_PASSWORD=your-password \
pnpm test:e2e
```

- `browse-book.spec.ts` — browse the catalog, book an installation, land on the
  confirmation screen with a reference. Read-only against seed data, no auth needed.
- `login-pos-sale.spec.ts` — log in, ring up a sale in POS, confirm the product's on-hand
  quantity decreased by the sold amount. Needs `PLAYWRIGHT_STAFF_EMAIL`/`_PASSWORD` for an
  account with at least `staff` role.

If those env vars aren't set, `login-pos-sale.spec.ts` skips itself rather than failing.
