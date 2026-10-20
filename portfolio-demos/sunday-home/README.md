# sunday — HOME CLEANING

Independent Next.js portfolio project for a fictional business in Denver, CO.

## Быстрый запуск на домашнем компьютере

Требуется Node.js 22.13+ (рекомендуется Node.js 24 LTS) и интернет для установки пакетов. Распакуйте ZIP, откройте терминал в папке проекта:

```bash
npm ci
npm run admin:setup
npm run dev
```

Откройте http://localhost:3000. Панель: http://localhost:3000/admin. Пароль задаёте сами; готового публичного пароля нет. SQLite автоматически создаст файл `data/demo.sqlite`. Отдельный сервер базы не нужен. При первом запуске база пустая — реальные отзывы не выдуманы и не добавлены.

Если порт занят: `npm run dev -- -p 3001`. Для пяти проектов используйте разные порты. После изменения `.env.local` перезапустите приложение.

## Production locally

```bash
npm test
npm run build
npm start
```

Для автономной проверки серверной части отдельно: `npm run db:migrate`. Нельзя открывать проект простым двойным щелчком по HTML — формы и база требуют запущенного Node.js.

## What is implemented

- Responsive English-language business site; separate service pages and an editorial guide.
- Distinct cleaning visual direction, packaged photos, system fonts and CSS perspective effects.
- Three.js scene loaded only on request, capped pixel ratio, manual rotation, opt-in animation, visibility pause and GPU cleanup. Graceful message when WebGL is unavailable.
- Appointment form: validation, privacy consent, honeypot, database-backed throttling and stored reference.
- Real SQLite persistence locally; Neon Postgres driver when DATABASE_URL is configured. No silent volatile-disk fallback on Vercel.
- Administrator login using scrypt password hashes, opaque server-side sessions, HTTP-only SameSite cookies, login throttling and origin checks.
- Dashboard: request filtering, status updates, review publication/hiding/deletion.
- Reviews are saved as pending; no fabricated customer reviews or ratings.
- Canonicals, metadata, Open Graph, sitemap.xml, robots.txt, article structured data, local intent in service content, meaningful internal links, 404 and error states.

## SEO and fictional-demo mode

`DEMO_MODE=true` is the default. Fictional businesses are labeled as portfolio concepts and excluded from indexing. Technical SEO is implemented, but search rankings and indexing cannot be guaranteed. To adapt for a real client, replace the business details, photos and prices, set a real `SITE_URL`, review the legal copy, then set `DEMO_MODE=false` and rebuild. Real mode adds appropriate local-business structured data without fake ratings or invented street addresses.

## Deploying from GitHub to Vercel

Create a separate Vercel project linked to the repository/branch containing this directory. Select this project directory as Root Directory. Framework: Next.js; install command: `npm ci`; build command: `npm run build`; Node.js 24.x. Do not use static export: it removes the required server behavior.

Set these environment variables:

- `DATABASE_URL`: a dedicated Neon Postgres database connection string, kept secret.
- `SITE_URL`: the final https://... origin for this project.
- `DEMO_MODE=true`: keep the fictional portfolio mode enabled.
- `ADMIN_PASSWORD_HASH`: copy only this hash value from the `.env.local` created by `npm run admin:setup`. Never upload the password or environment file to GitHub.

Schema initialization is idempotent on the first request. For a managed release, apply it explicitly with `npm run db:migrate` using the intended database environment, verify it, and deploy. Give each site an isolated database and a least-privilege runtime role. Never use local SQLite on Vercel: its writable filesystem is ephemeral.

## Data and operational limits

This is a working demonstration, not a medical advice or emergency service. Booking creates a request, not a confirmed slot. No email/SMS dispatch, payment provider, live calendar, file uploads, customer accounts or automated data-retention jobs are integrated. Email sending needs a separately configured provider. Demo data should be fictional; do not enter personal medical or payment data. Lists show the latest 200 admin records and latest 30 public reviews.

Before a real launch: configure the actual operator and contact channels, privacy terms and retention, database backups, a production runtime role restricted to its own database, spam protection suitable for real traffic, monitoring and human review. The present global throttles suit low-traffic demonstrations and can be exhausted by abuse.

## Assets

Photos are included locally, sourced from Unsplash photo IDs. No external font, analytics or image request is required for normal page display. `ASSETS.md` records sources. The same service infrastructure is intentionally shared across the independent projects; the content, branding, page presentation, imagery and 3D objects differ.

## Verification

See `VERIFICATION.md` for the checks actually performed and remaining limits. No claim of zero bugs or guaranteed SEO position is made.
