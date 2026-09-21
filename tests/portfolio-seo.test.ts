import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectMetadata } from '../apps/web/lib/project-seo';
import { localizedMetadata, siteUrl } from '../apps/web/lib/seo';
import { serviceAreaCopy, pcServiceArea, nrwCities } from '../apps/web/lib/service-area';
import { organizationStructuredData, jsonLd } from '../apps/web/lib/business';
import { projectPayloadSchema, locales } from '../packages/shared/src/index';
import { reserveProjectSlug, validateSocialImage } from '../apps/control/lib/project-slugs';
import type { Prisma } from '@prisma/client';

const project = { slug: 'windows-fedora', title: { en: 'Windows 11 and Fedora dual boot setup', de: 'Windows 11 und Fedora im Dual-Boot' }, summary: { en: 'Synthetic project summary', de: 'Deutsche Beschreibung' }, seoTitle: { en: 'Custom search title' }, socialTitle: { de: 'Teilen' }, socialImageId: 'second', images: [{ id: 'first', url: 'https://example.test/cover.webp' }, { id: 'second', url: 'https://example.test/second.webp', alt: { de: 'Vorschau' } }] };

test('project metadata localizes fallbacks, canonical, all alternates and selected social image', () => {
  const result = projectMetadata(project, 'de');
  assert.equal(result.title, project.title.de);
  assert.equal(result.description, project.summary.de);
  assert.equal(result.alternates?.canonical, `${siteUrl}/de/portfolio/windows-fedora`);
  for (const locale of locales) assert.equal(result.alternates?.languages?.[locale], `${siteUrl}/${locale}/portfolio/windows-fedora`);
  assert.equal(result.alternates?.languages?.['x-default'], `${siteUrl}/en/portfolio/windows-fedora`);
  assert.equal(result.openGraph?.title, 'Teilen');
  assert.equal(result.openGraph?.description, project.summary.de);
  assert.deepEqual(result.openGraph?.images, [{ url: 'https://example.test/second.webp', alt: 'Vorschau' }]);
  assert.equal(projectMetadata(project, 'en').title, 'Custom search title');
  assert.deepEqual(result.twitter?.images, result.openGraph?.images);
});
test('deleted/unowned preview selection falls back to the cover and never creates arbitrary image URLs', () => {
  const result = projectMetadata({ ...project, socialImageId: 'not-owned' }, 'de');
  assert.deepEqual(result.openGraph?.images, [{ url: 'https://example.test/cover.webp', alt: project.title.de }]);
  const external = projectMetadata({ ...project, images: [], coverImage: '/approved-cover.png' }, 'en');
  assert.deepEqual(external.openGraph?.images, [{ url: `${siteUrl}/approved-cover.png`, alt: project.title.en }]);
});
test('service metadata has absolute canonicals, social images and reciprocal language links', () => {
  const result = localizedMetadata({ locale: 'de', pathname: 'services/websites', title: 'Websites', description: 'Webentwicklung', image: '/services/tiladys-service-website-creation.png' });
  assert.equal(result.alternates?.canonical, `${siteUrl}/de/services/websites`);
  assert.ok(result.openGraph?.images);
  assert.ok(result.twitter);
});
test('all six PC service-area translations include the confirmed NRW cities', () => {
  for (const locale of locales) for (const city of nrwCities) assert.ok(serviceAreaCopy(locale).text.includes(city));
  assert.equal(pcServiceArea.length, nrwCities.length + 1);
  assert.equal(organizationStructuredData.founder.name, 'Vladyslav Titov');
  assert.equal(organizationStructuredData.address.addressLocality, 'Mülheim an der Ruhr');
  assert.equal('areaServed' in organizationStructuredData, false);
  assert.equal('department' in organizationStructuredData, false);
  assert.equal(jsonLd({ text: '</script>' }).includes('<'), false);
  assert.equal(JSON.parse(jsonLd({ text: '</script>' })).text, '</script>');
});
test('SEO inputs are bounded and removed featured data is not accepted into parsed output', () => {
  const payload = { slug: 'fixture', category: 'pc-support', status: 'PUBLISHED', sortOrder: 0, title: { en: 'Title' }, summary: { en: 'Summary' }, coverImage: '', featured: true };
  assert.equal('featured' in projectPayloadSchema.parse(payload), false);
  assert.equal(projectPayloadSchema.safeParse({ ...payload, seoTitle: { en: 'x'.repeat(201) } }).success, false);
  assert.equal(projectPayloadSchema.safeParse({ ...payload, seoTitle: { invalidLocale: 'Title' } }).success, false);
});

test('slug namespace prevents cross-project aliases, supports rename-back and retains direct history', async () => {
  const projects = new Map([['a', 'first'], ['b', 'other']]);
  const aliases = new Map([['old-first', 'a'], ['reserved', 'b']]);
  let locked = false;
  const tx = {
    $executeRaw: async () => { locked = true; },
    project: {
      findUnique: async ({ where }: { where: { slug: string } }) => { assert.ok(locked); const row = [...projects].find(([, slug]) => slug === where.slug); return row ? { id: row[0] } : null; },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => ({ slug: projects.get(where.id) }),
    },
    projectSlugAlias: {
      findUnique: async ({ where }: { where: { slug: string } }) => aliases.has(where.slug) ? { projectId: aliases.get(where.slug) } : null,
      upsert: async ({ create }: { create: { slug: string; projectId: string } }) => { aliases.set(create.slug, create.projectId); },
      deleteMany: async ({ where }: { where: { slug: string } }) => { aliases.delete(where.slug); },
    },
    projectImage: { findFirst: async ({ where }: { where: { id: string; projectId: string } }) => where.id === 'owned' && where.projectId === 'a' ? { id: 'owned' } : null },
  } as unknown as Prisma.TransactionClient;
  await assert.rejects(reserveProjectSlug(tx, 'reserved', 'a'), /PROJECT_SLUG_EXISTS/);
  await assert.rejects(reserveProjectSlug(tx, 'other', 'a'), /PROJECT_SLUG_EXISTS/);
  await assert.rejects(reserveProjectSlug(tx, 'old-first'), /PROJECT_SLUG_EXISTS/);
  await reserveProjectSlug(tx, 'old-first', 'a');
  assert.equal(aliases.get('first'), 'a');
  assert.equal(aliases.has('old-first'), false);
  await validateSocialImage(tx, 'owned', 'a');
  await assert.rejects(validateSocialImage(tx, 'owned', 'b'), /INVALID_SOCIAL_IMAGE/);
  await assert.rejects(validateSocialImage(tx, 'owned'), /INVALID_SOCIAL_IMAGE/);
});
test('featured migration is one isolated forward-only column drop', () => {
  const sql = readFileSync(new URL('../packages/db/prisma/migrations/20260921100000_remove_project_featured/migration.sql', import.meta.url), 'utf8').replace(/--[^\n]*/g, '').trim();
  assert.equal(sql, 'ALTER TABLE "Project" DROP COLUMN "featured";');
  const additive = readFileSync(new URL('../packages/db/prisma/migrations/20260921101000_project_seo_and_slug_history/migration.sql', import.meta.url), 'utf8');
  assert.doesNotMatch(additive, /\b(DROP|TRUNCATE|DELETE FROM|UPDATE "Project")\b/i);
});
