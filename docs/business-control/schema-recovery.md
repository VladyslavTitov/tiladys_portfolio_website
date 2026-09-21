# Production schema mismatch: diagnosis and proposed recovery

The supplied production log findings establish two schema incompatibilities: project queries fail with P2022 for `Project.seoTitle`, and the dashboard unread count fails with PostgreSQL 22P02 for `MessageStatus.UNREAD`. The deployments are production deployments built from `feature/services-redesign`; a feature branch name does not make their database a preview database.

No production database was connected to or inspected during this work. The actual production migration ledger and complete column inventory remain unverified. The tests described below use only synthetic data in disposable local PostgreSQL.

## Project schema

The public list API explicitly selects all five columns added by `20260921101000_project_seo_and_slug_history`:

| Column | PostgreSQL type | Existing-row value after migration |
| --- | --- | --- |
| `seoTitle` | JSONB, nullable | NULL |
| `seoDescription` | JSONB, nullable | NULL |
| `socialTitle` | JSONB, nullable | NULL |
| `socialDescription` | JSONB, nullable | NULL |
| `socialImageId` | TEXT, nullable | NULL |

The logs prove `seoTitle` is missing. If this migration is entirely unapplied, all five are missing; a first-column P2022 alone cannot prove the other four are absent. Verify all five before rollout. The same migration adds the social-image foreign key, `ProjectSlugAlias` table, its foreign key and index. Detail/rename routes require that table too. Do not repair just `seoTitle` with ad hoc SQL.

The admin portfolio page `/dashboard/projects` also reads project scalar fields using Prisma. The public page `/[locale]/portfolio` calls control `/api/public/projects`; it previously converted any failed request into an empty array. Thus the reported empty portfolio was a masked upstream error, not evidence of deleted or unpublished projects. No publication status should be changed to fix this failure.

## Message status decision

The initial migration defines `NEW`, `READ`, `REPLIED`, `ARCHIVED`, `SPAM`, with `NEW` as the default. `NEW` has the same meaning as unread. The existing forward migration `20260904120000_rename_new_message_status_to_unread` contains:

```sql
ALTER TYPE "MessageStatus" RENAME VALUE 'NEW' TO 'UNREAD';
```

Use this existing migration if it is pending and the database still has the original enum. Do not add a second unread enum value, and do not change only the dashboard to `NEW`. Contact creation, message actions, the messages UI and the Prisma default already use `UNREAD`; a dashboard-only fallback would leave those paths incompatible.

The rename preserves the enum member's identity and the meaning of existing unread records; their displayed status label becomes `UNREAD`. Existing `READ`, `REPLIED`, `ARCHIVED`, `SPAM` and project publication statuses remain unchanged. It does not reset statuses, delete messages or rewrite message bodies. If the enum already contains both labels or neither label, or the migration ledger says the rename was applied despite `NEW` still being present, stop: that is a different drift scenario needing review, not a reason to blindly add/rename values or mark a migration applied.

No new schema migration or Prisma enum change is needed for the ordinary pending-migrations case. Historical migrations are unchanged.

## Checked-in migration order

1. `20260725212133_init`
2. `20260727160000_portfolio_images_and_fields`
3. `20260904120000_rename_new_message_status_to_unread`
4. `20260920120000_private_contact_attachments`
5. `20260921100000_remove_project_featured`
6. `20260921101000_project_seo_and_slug_history`

`migrate deploy` applies only pending migrations in that order. It also applies pending contact tables and the isolated obsolete-featured-column removal; it is not a command to add just one missing SEO column. None of these migrations deletes project, image or message rows. Back up before the featured-column removal because the obsolete flag itself cannot be recovered from the new schema.

## Safe rollout order — owner/operator actions, not executed here

**Push/deployment checkpoint (before step 1):** GitHub commit status for `1db593f` reports successful deployments from both [tiladys-public](https://vercel.com/tiladys/tiladys-public/FgpEknsa5V1b8DeX6sS8uNTELwDm) and [tiladys-control](https://vercel.com/tiladys/tiladys-control/73PJwu1CQs5YdFbyF96eo7hB9hRD). The supplied logs identify production deployments from this branch. There is no checked-in Vercel configuration or GitHub Actions workflow restricting deployment. These facts establish that both apps deploy this commit, but do not prove the next push's trigger/promotion settings. Verify Production Branch, Root Directory, Git-trigger enablement/ignored-build settings and automatic production promotion for both Vercel projects before pushing. Expected roots are `apps/web` and `apps/control`; verify rather than assume. Treat a push as a potential production release until confirmed otherwise. Local staging/committing does not itself push to Vercel.

Prepare the local commit with the portfolio state change, its tests and this runbook. Suggested commit message: `fix(portfolio): distinguish API failures and document schema recovery`. Do not push merely to see what happens. If publishing the commit before database recovery is necessary, first have the operator confirm that both projects' deployment/promotion paths are deliberately held. Otherwise retain the commit locally until the migration and version-transition plan permits a release.

1. **Verify the target privately.** Obtain the connection through the failing **control project's Production** environment, using the provider's intended direct migration connection to the same database/schema when required. Supply that connection securely as `DATABASE_URL` to the migration runner. Do not derive the target from the Git branch or use an unrelated local/Preview environment. Verify web's `CONTROL_API_URL` targets the intended control production deployment; its fallback is `NEXT_PUBLIC_CONTROL_API_URL`. Because web currently stores contacts server-side, its `DATABASE_URL` must refer to the same canonical database/schema. Never print these values or pass credentials in command-line arguments. The exact production connection cannot be identified from the log summary alone.
2. **Review schema and ledger.** An authorized operator should check the relevant column/enum inventory and `_prisma_migrations` in that verified schema. Read-only example SQL is below. If a migration is recorded as complete but its objects are absent, is partially applied/failed, or history is unbaselined, stop for a specific recovery plan. Do not use `migrate resolve`, reset, seed or blanket `IF NOT EXISTS` repair to conceal drift.
3. **Back up and rehearse.** Verify a recoverable backup including binary media. Rehearse against a safe staging copy with the same migration history. Compare project/message status counts and media sizes before/after.
4. **Quiesce writers and coordinate versions.** Pause public contact submissions and admin writes; prevent old control instances from querying the removed `featured` field or writing `NEW` during the transition. Both web and control use the message enum. Prepare the reviewed code revision and install locked dependencies before the maintenance window. Do not introduce unrelated schema changes into this release.
5. **Apply the existing chain from the repository root**, only after steps 1–4 and with the verified production migration connection securely injected as `DATABASE_URL`:

   ```bash
   npm run db:deploy
   ```

   This expands to `npm --workspace @tiladys/db run deploy`, which runs `prisma migrate deploy` against `packages/db/prisma/schema.prisma`. That schema reads `DATABASE_URL`. Do not use `db:migrate` (`migrate dev`), `db:seed`, `db push` or reset. `SHADOW_DATABASE_URL` is not the migration target and deploy does not require a shadow database. Do not invent another database just to satisfy this command. Stop on migration errors rather than retrying with manual changes.
6. **Verify schema, then build/release matching code.** Confirm the five columns, alias table and enum label, successful migration records and preserved counts. Generate the matching Prisma client and build using `npm run db:generate` and `npm run build`; release the matching control and web versions through the normal separately authorized deployment process. A build/prebuild only generates Prisma Client: it does not apply migrations. Redeploying code alone cannot fix these errors.
7. **Smoke-test before resuming writes.** Confirm `/dashboard`, `/dashboard/projects`, public `/api/public/projects`, a published detail API/page, old-slug redirects and media. The list should return HTTP 200 and the expected published records; drafts/archived records must stay excluded. Check the new portfolio error/retry behavior with a controlled non-production outage. Resume writes and monitor P2022/22P02. No seed or production data edits are part of recovery.

Do not blindly roll old code back after the enum rename/featured-column drop: old clients may require the previous schema. Restore or compatibility recovery requires an explicit coordinated plan.

### Operator checkpoints and recovery evidence

Share confirmations and sanitized results only; no credentials, session cookies, private message bodies or database URL values are needed.

| Checkpoint | Evidence required | Current state |
| --- | --- | --- |
| Deployment triggers | Both projects' Production Branch, Root Directory, Git trigger and production-promotion settings | Awaiting operator confirmation |
| Correct database | Provider identified; control Production migration target confirmed; web/control resolve to the same canonical database/schema | Awaiting operator confirmation |
| Backup | Completed backup/restore-point timestamp with timezone, coverage including binary media and contact attachments, recovery procedure and restore-rehearsal result | Awaiting operator confirmation |
| Pre-migration baseline | Sanitized migration ledger; project/message counts grouped by status; media row counts and byte totals | Not collected from production |
| Migration | Successful deployment of the reviewed pending chain; expected enum/columns/table present | Not applied to production |
| Release identity | Production deployment IDs and commit SHA for both apps, with correct project/domain mapping | Recovery release not deployed |
| Admin | Authenticated `/dashboard`, `/dashboard/projects`, `/dashboard/messages` load without server errors; session guards remain active | Not verified after rollout |
| Project API | `/api/public/projects` returns HTTP 200 and an array matching published baseline IDs/count; distinguish HTTP failure, empty response and real records | Not verified after rollout |
| Grid/carousel | Published records remain in the grid and are eligible for the 15-second carousel; previous/next/pause work; drafts/archived records excluded | Not verified after rollout |
| Details/media | Representative localized published detail pages load; canonical/social metadata and old-slug redirects work; existing images load; private routes/media remain unavailable | Not verified after rollout |
| Preservation | Compare project IDs/statuses, message counts/statuses (only NEW→UNREAD), media/attachment counts and byte totals with baseline; inspect representative existing records privately | Not verified after rollout |
| Runtime logs | No new P2022/22P02 for the exercised routes during a recorded post-release observation window | Not verified after rollout |

Public HTTP/browser checks require the exact production web/control origins after rollout. The operator should authenticate normally for admin checks; do not send credentials or session cookies in chat. Counts alone cannot prove all record contents were preserved: retain the backup and compare baseline identifiers/checksums privately where available. A successful push, build or Vercel deployment status is not evidence that any recovery verification row passed.

### Read-only preflight SQL for an authorized operator

Run in the same schema/search path as the configured Prisma datasource. These queries deliberately return no credentials, connection URLs or message/project content. They were not run against production by this agent.

```sql
BEGIN READ ONLY;
SELECT migration_name, finished_at IS NOT NULL AS finished,
       rolled_back_at IS NOT NULL AS rolled_back
FROM "_prisma_migrations" ORDER BY migration_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = current_schema() AND table_name = 'Project'
  AND column_name IN ('featured', 'seoTitle', 'seoDescription',
                     'socialTitle', 'socialDescription', 'socialImageId');

SELECT e.enumlabel
FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = current_schema() AND t.typname = 'MessageStatus'
ORDER BY e.enumsortorder;

SELECT table_name FROM information_schema.tables
WHERE table_schema = current_schema()
  AND table_name IN ('ProjectSlugAlias', 'ContactAttachment', 'ContactRateLimit');

SELECT status::text, count(*) FROM "Project" GROUP BY status;
SELECT status::text, count(*) FROM "ContactMessage" GROUP BY status;
SELECT count(*), sum(octet_length(data)) FROM "ProjectImage";
COMMIT;
```

## Application change and tests

The portfolio now streams a localized accessible loading state while waiting for the API, limits the fetch to ten seconds, and shows a localized error with a retry link on HTTP/network/timeout failure or a non-array response. A successful empty array alone produces the existing empty state. Raw upstream errors, connection strings and Prisma details are not exposed. A fixed server log marker records the failure without sensitive details.

Changed files: `apps/web/app/[locale]/portfolio/page.tsx`, new `apps/web/lib/portfolio-state.ts`, `tests/portfolio-seo.test.ts`, `tests/phase1-browser.mjs`, new `tests/schema-recovery.test.ts`, and this report. No Prisma schema/migration, status-handling or production environment files were changed.

The disposable recovery test creates a fresh isolated schema, uses actual Prisma `migrate deploy` to install only the two original migrations, inserts synthetic published/draft/archived projects, an image and a message in every original status, and reproduces the missing-column and invalid-enum errors. It then stages the remaining checked-in migrations and runs deploy again. It checks row/content/media preservation, `NEW` → `UNREAD` semantic continuity, every other status, published filtering, migration ledger completeness, an empty Prisma schema diff and a repeat deploy that changes nothing. Connection output from the Prisma CLI is suppressed. The test removes only its owned disposable schema afterward.

Repeat with `SCHEMA_RECOVERY_DATABASE_URL` securely set to the dedicated disposable loopback database named `tiladys_schema_recovery` on test port 55433:

```bash
node --import tsx --test tests/schema-recovery.test.ts
```

The test rejects any other host/database/port and skips when the variable is absent. It is not a production migration tool.

## Verification results

- Disposable PostgreSQL 16: reproduced both failures; actual forward `migrate deploy`, migration-history checks, data/status preservation, published filtering, schema comparison and repeat-deploy no-op all passed. The test container was stopped and removed afterward.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`: passed. Builds used intentionally unavailable loopback API/database targets, not production.
- `npm run test:browser`: passed against local production builds and synthetic API responses. HTTP 500 displays the localized error and no empty-state message; retry recovers published projects; a three-second API delay displays the accessible loading state. Existing portfolio, SEO, private-route, desktop/mobile and login checks also passed, with no browser exceptions.
- `git diff --check`: passed. Generated tracked build files were restored to their pre-task versions. Existing Prisma schema and migration files are unchanged.
- Production remains untouched and has not been verified as recovered. No deployment, production migration, seeding, reset or commit was performed.
