# Observed baseline — 13 October 2026

- Checkout: `feature/services-redesign`, `e82bff04aac9915585b10cc853fe31c558a5964b`; matches the audit anchor. Initially only the owner-supplied ZIP was untracked. No repository AGENTS.md outside dependency directories.
- npm workspaces: Next.js 16.3.8 / React 19.1.1 public app (`apps/web`, port 3000), private Control (`apps/control`, port 3001), shared Zod validation and Prisma 6.13 database package. Existing custom Argon2/opaque hashed sessions retained.
- Local runtime Node 22.23.1 / npm 10.9.8. Audit reported hosted Node 24; hosting has not been changed. Existing lockfile retained.
- Original wordmark/circuit, genuine founder JPEG, live five-column footer, six locale codes and legal copy present. Existing project publication is status/sortOrder; Featured was deliberately removed.
- Invoice tables, frozen PDF/checksum fields, decimal arithmetic, invoice locks, sequence and partial active-draft index exist in source. New renderer currently English before German; payments have locks but no retry key.
- Missing core entities/routes: quotes, products, tasks, 3D printing. Existing contacts use obsolete two-image/1MiB limits and multipart submission.
- Existing `.env.local` in Control is preserved. Its credentials are not printed or used for development mutations. Production binding and hosted migration state are not established by local source.
- `npm test` and `npm run typecheck`: passed before edits. Docker server 29.7.2 available through sandbox escalation; isolated synthetic PostgreSQL setup pending. No customer records read, email sent, or production mutations performed.
- Reference archive extracted safely to `docs/tiladys-rebuild`, outside app assets. Raster boards are layout references, not factual evidence.

## Available commands

`npm run db:generate`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:web`, `npm run build:control`, `npm run test:pdf:unicode`, `npm run test:bilingual`, `npm run test:browser`, `npm run test:crm:workflow`, `npm run test:contact:integration`. Database/integration/browser scripts must first be inspected for safe target configuration; passing unit tests is not proof of database persistence.

## Platform evidence

Installed Next.js agent instructions and local page/route API documentation read. Current Vercel function request payload remains 4.5MB: https://vercel.com/docs/functions/limitations . Therefore 5MiB source photos require private direct upload; framework body-limit changes alone are insufficient.
