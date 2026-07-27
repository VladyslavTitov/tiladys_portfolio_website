# TiLADYS platform

Production-oriented monorepo with a public multilingual website and a separately deployable control panel/API.

## Applications

- `apps/web` — public Next.js **16.2.11** website, default port `3000`
- `apps/control` — protected dashboard and REST API, default port `3001`
- `packages/db` — Prisma/PostgreSQL data layer
- `packages/shared` — shared validation schemas and locale definitions

The public website supports six locales: English (`en`), German (`de`), Ukrainian (`uk`), Russian (`ru`), Slovak (`sk`) and French (`fr`).

## First local run

1. Copy `.env.example` to `.env` and replace every placeholder.
2. Install dependencies: `npm install`
3. Generate Prisma Client: `npm run db:generate`
4. Create/update the local database: `npm run db:migrate`
5. Load the complete six-language price catalog: `npm run db:seed`
6. Create the first administrator: `npm run setup:admin`
7. Start both applications: `npm run dev`

Credentials are not hard-coded. The setup command hashes the password and secret phrase with Argon2id before storing them.

## Applying this update to an existing deployment

After deploying the updated code, run:

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
npm run build
```

`db:deploy` applies the portfolio image migration. `db:seed` updates the existing price sections and services with the complete six-language catalog; it does not create duplicate service codes.

## Public website changes

### Contact

The Contact page contains the visual hero, direct contact cards, validated message form, benefits section and final contact call-to-action. The form still posts to the protected control/API application; the update changes the presentation without replacing the existing message-storage workflow.

### Prices

The Prices page now provides:

- category filters;
- responsive desktop tables and mobile cards;
- all service names, notes, section titles and subtitles in all six languages;
- a **Get Help** action for every service that opens the localized Contact page and preselects that service;
- a static catalog fallback if the control API is temporarily unavailable.

All prices are edited from one spreadsheet-style screen at `apps/control/app/dashboard/prices`. Use the six language tabs, edit rows, add or remove services/sections, and choose **Save all changes**. The public page reads the saved database values immediately.

### Portfolio

The Portfolio page now provides category filters for web development, PC support, design, Linux/server work and digital projects. Published projects are loaded from the control API.

The project editor at `apps/control/app/dashboard/projects` supports:

- localized title, summary, full description, project type, role and work list;
- category, status, featured flag and display order;
- completion date;
- website and GitHub links;
- technologies/tools;
- optional external cover URL;
- 1–10 uploaded JPG, PNG, WebP or AVIF images, maximum 4 MB per image;
- later editing, image removal, adding more images, archiving and deletion.

Images are uploaded one at a time after project metadata is saved, which avoids aggregate serverless request-size failures. The first uploaded image is used as the project cover. Image files are stored in PostgreSQL `BYTEA`; use reliable managed-database backups. For a very large future portfolio, object storage can replace database image storage without changing the public page structure.

## Editing public text

- Shared Header, Footer and Home-page copy: `apps/web/lib/i18n.ts`
- Additional Home-page copy: `apps/web/lib/home-page-copy.ts`
- Contact, Prices, Portfolio, project-detail and legal-page copy: `apps/web/lib/page-copy.ts`
- About page only: `apps/web/content/about.json`
- Complete price catalog seed: `packages/db/prisma/price-data.json`

Keep all existing JSON keys and all six locale entries when editing localized content.

## Security model

- Separate public and control deployments
- Argon2id credential hashes; signed, HTTP-only, SameSite=Strict session cookies
- Login throttling, account lockout, audit log, CSRF/origin checks and schema validation
- Security headers including CSP, frame denial, nosniff, referrer and permissions policies
- Upload MIME allow-list, per-file size limits and ten-image project limit
- Prisma parameterization and PostgreSQL relations with cascading image deletion
- Login email alerts and dashboard audit trail

Deploy `apps/web` and `apps/control` as separate services. Protect the control app with a private network, VPN, Cloudflare Access or an IP allow-list in addition to its login. Never expose Prisma Studio publicly.

## Verification

Run the complete local verification sequence after dependency installation:

```bash
npm test
npm run db:generate
npm run typecheck
npm run lint
npm run build
```

The footer legal routes still contain explicit placeholders. Replace them with legally reviewed Terms, Privacy and Impressum content before treating those pages as final legal documents.
