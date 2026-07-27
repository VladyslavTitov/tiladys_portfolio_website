import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'];

test('exact Next.js 16.2.11 version is pinned in both applications', () => {
  for (const app of ['apps/web/package.json', 'apps/control/package.json']) {
    assert.equal(JSON.parse(read(app)).dependencies.next, '16.2.11');
  }
});

test('Next.js 16 proxy convention and explicit ESLint flat config are used', () => {
  assert.ok(exists('apps/web/proxy.ts'));
  assert.ok(exists('apps/control/proxy.ts'));
  assert.ok(!exists('apps/web/middleware.ts'));
  assert.ok(!exists('apps/control/middleware.ts'));
  assert.match(read('apps/web/proxy.ts'), /export function proxy/);
  assert.match(read('eslint.config.mjs'), /eslint-config-next\/core-web-vitals/);
  assert.match(read('eslint.config.mjs'), /eslint-config-next\/typescript/);
});

test('all six public locales are configured', () => {
  const shared = read('packages/shared/src/index.ts');
  for (const locale of locales) assert.match(shared, new RegExp(`'${locale}'`));
  const webProxy = read('apps/web/proxy.ts');
  assert.match(webProxy, /accept-language/);
  assert.match(webProxy, /isLocale/);
});

test('about page JSON is complete for every public locale', () => {
  const content = JSON.parse(read('apps/web/content/about.json'));
  for (const locale of locales) {
    assert.ok(content[locale]);
    assert.ok(content[locale].hero.title.length > 3);
    assert.equal(content[locale].helpWith.items.length, 6);
    assert.equal(content[locale].benefits.length, 4);
  }
});

test('shared header and footer remain global public components', () => {
  const shell = read('apps/web/components/Shell.tsx');
  const header = read('apps/web/components/Header.tsx');
  const footer = read('apps/web/components/Footer.tsx');
  assert.match(shell, /<Header locale=\{locale\}/);
  assert.match(shell, /<Footer locale=\{locale\}/);
  assert.match(header, /language-menu__list/);
  assert.match(header, /site-header/);
  assert.match(footer, /site-footer__grid/);
});

test('home page keeps the requested five services and five process steps', () => {
  const content = read('apps/web/lib/i18n.ts');
  const home = read('apps/web/app/[locale]/page.tsx');
  assert.match(home, /serviceIcons = \[Globe2, Laptop, Store, Headphones, UsersRound\]/);
  assert.match(home, /processIcons = \[MessageSquareText, Search, ClipboardList, Wrench, ShieldCheck\]/);
  assert.match(content, /processSteps/);
  for (const locale of locales) assert.match(content, new RegExp(`\\b${locale}: \\{`));
});

test('contact redesign and existing message API integration are present', () => {
  const page = read('apps/web/app/[locale]/contact/page.tsx');
  const form = read('apps/web/components/ContactForm.tsx');
  const route = read('apps/control/app/api/public/contact/route.ts');
  assert.match(page, /contact-page-grid/);
  assert.match(page, /contact-channel-list/);
  assert.match(page, /contact-benefits/);
  assert.match(form, /NEXT_PUBLIC_CONTROL_API_URL/);
  assert.match(form, /contact-form--visual/);
  assert.match(route, /contactSchema/);
  assert.match(route, /Access-Control-Allow-Origin/);
});

test('price catalog has exactly 12 sections and 145 services', () => {
  const data = JSON.parse(read('packages/db/prisma/price-data.json'));
  assert.equal(data.length, 12);
  assert.equal(data.flatMap((section) => section.items).length, 145);
});

test('every price section and service has all six non-empty translations', () => {
  const data = JSON.parse(read('packages/db/prisma/price-data.json'));
  for (const section of data) {
    for (const locale of locales) {
      assert.ok(section.title[locale]?.trim(), `${section.number} title missing ${locale}`);
      assert.ok(section.subtitle[locale]?.trim(), `${section.number} subtitle missing ${locale}`);
    }
    for (const item of section.items) {
      for (const locale of locales) {
        assert.ok(item.name[locale]?.trim(), `${item.code} name missing ${locale}`);
        assert.ok(item.note[locale]?.trim(), `${item.code} note missing ${locale}`);
      }
    }
  }
});

test('non-Cyrillic price locales do not contain accidental Cyrillic source text', () => {
  const data = JSON.parse(read('packages/db/prisma/price-data.json'));
  const cyrillic = /[А-Яа-яЁёІіЇїЄє]/;
  for (const section of data) {
    for (const item of section.items) {
      for (const locale of ['en', 'de', 'sk', 'fr']) {
        assert.ok(!cyrillic.test(item.name[locale]), `${item.code} name contains Cyrillic in ${locale}`);
        assert.ok(!cyrillic.test(item.note[locale]), `${item.code} note contains Cyrillic in ${locale}`);
      }
    }
  }
});

test('price page includes filters, responsive table and per-service Get Help link', () => {
  const page = read('apps/web/components/PriceExplorer.tsx');
  assert.match(page, /price-filter/);
  assert.match(page, /sectionGroup/);
  assert.match(page, /price-table/);
  assert.match(page, /contact\?service=/);
  assert.match(page, /price-help-button/);
});

test('admin price editor supports six translation tabs and one bulk save endpoint', () => {
  const editor = read('apps/control/app/dashboard/prices/price-spreadsheet.tsx');
  const route = read('apps/control/app/api/admin/prices/route.ts');
  assert.match(editor, /Price translation language/);
  for (const locale of locales) assert.match(editor, new RegExp(`'${locale}'`));
  assert.match(editor, /Save all changes/);
  assert.match(route, /priceBulkSchema/);
  assert.match(route, /db\.\$transaction/);
  assert.match(route, /PRICE_BULK_UPDATE/);
});

test('portfolio page includes category filters and database-backed project cards', () => {
  const page = read('apps/web/components/PortfolioExplorer.tsx');
  const route = read('apps/control/app/api/public/projects/route.ts');
  assert.match(page, /portfolio-filter/);
  assert.match(page, /web-development/);
  assert.match(page, /pc-support/);
  assert.match(page, /linux-servers/);
  assert.match(route, /status: 'PUBLISHED'/);
  assert.match(route, /Cache-Control': 'no-store'/);
});

test('project detail page supports role, work list, tools, links and variable image gallery', () => {
  const page = read('apps/web/app/[locale]/portfolio/[slug]/page.tsx');
  assert.match(page, /project-detail-hero/);
  assert.match(page, /workItems/);
  assert.match(page, /websiteUrl/);
  assert.match(page, /githubUrl/);
  assert.match(page, /technologies/);
  assert.match(page, /images\.map/);
  assert.match(page, /project-gallery/);
});

test('admin portfolio editor supports full localized CRUD and 1–10 images', () => {
  const editor = read('apps/control/app/dashboard/projects/project-manager.tsx');
  const helper = read('apps/control/lib/projects.ts');
  const updateRoute = read('apps/control/app/api/admin/projects/[id]/route.ts');
  assert.match(editor, /New project/);
  assert.match(editor, /Full project description/);
  assert.match(editor, /Your role/);
  assert.match(editor, /What you did/);
  assert.match(editor, /Website URL/);
  assert.match(editor, /GitHub URL/);
  assert.match(editor, /Technologies & tools/);
  assert.match(helper, /MAX_PROJECT_IMAGES = 10/);
  assert.match(helper, /4 \* 1024 \* 1024/);
  assert.match(helper, /validImageSignature/);
  assert.match(helper, /INVALID_IMAGE_CONTENT/);
  assert.match(updateRoute, /removeImageIds/);
  assert.match(updateRoute, /PROJECT_DELETE/);
});

test('portfolio image storage model, migration and media endpoint are present', () => {
  const schema = read('packages/db/prisma/schema.prisma');
  const migration = read('packages/db/prisma/migrations/20260727160000_portfolio_images_and_fields/migration.sql');
  const media = read('apps/control/app/api/public/media/[id]/route.ts');
  assert.match(schema, /model ProjectImage/);
  assert.match(schema, /data\s+Bytes/);
  assert.match(schema, /images\s+ProjectImage\[\]/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ProjectImage"/);
  assert.match(media, /Content-Type/);
  assert.match(media, /immutable/);
  assert.match(media, /nosniff/);
});

test('optional localized admin fields can be blank while required fields stay validated', () => {
  const schemas = read('packages/shared/src/index.ts');
  assert.match(schemas, /localizedOptionalTextSchema/);
  assert.match(schemas, /title: localizedTextSchema/);
  assert.match(schemas, /summary: localizedTextSchema/);
  assert.match(schemas, /description: localizedOptionalTextSchema\.optional/);
  assert.match(schemas, /subtitle: localizedOptionalTextSchema\.optional/);
  assert.match(schemas, /note: localizedOptionalTextSchema\.optional/);
  assert.match(schemas, /Only HTTP and HTTPS URLs are allowed/);
  assert.match(schemas, /try \{/);
  assert.match(schemas, /catch \{/);
});

test('project save normalizes URLs and reports field-level validation errors', () => {
  const schemas = read('packages/shared/src/index.ts');
  const editor = read('apps/control/app/dashboard/projects/project-manager.tsx');
  const createRoute = read('apps/control/app/api/admin/projects/route.ts');
  assert.match(schemas, /normalizeOptionalUrl/);
  assert.match(schemas, /optionalCoverImageSchema/);
  assert.match(editor, /normalizeOptionalHttpUrl/);
  assert.match(editor, /projectApiError/);
  assert.match(editor, /details\.issues/);
  assert.match(createRoute, /PROJECT_SLUG_EXISTS/);
  assert.match(createRoute, /status: 500/);
});

test('production database migration and seed scripts are documented and available', () => {
  const rootPackage = JSON.parse(read('package.json'));
  const dbPackage = JSON.parse(read('packages/db/package.json'));
  assert.ok(rootPackage.scripts['db:deploy']);
  assert.equal(dbPackage.scripts.deploy, 'prisma migrate deploy');
  assert.match(read('README.md'), /npm run db:deploy/);
  assert.match(read('README.md'), /npm run db:seed/);
});

test('reference assets and all redesigned public routes are included', () => {
  for (const file of [
    'apps/web/public/contact/hero-visual.webp',
    'apps/web/public/prices/hero-visual.webp',
    'apps/web/public/portfolio/hero-visual.webp',
    'apps/web/app/[locale]/contact/page.tsx',
    'apps/web/app/[locale]/prices/page.tsx',
    'apps/web/app/[locale]/portfolio/page.tsx',
    'apps/web/app/[locale]/portfolio/[slug]/page.tsx',
  ]) assert.ok(exists(file), file);
});

test('CSS files have balanced braces and responsive rules', () => {
  for (const file of ['apps/web/app/globals.css', 'apps/control/app/globals.css']) {
    const css = read(file);
    assert.equal((css.match(/\{/g) ?? []).length, (css.match(/\}/g) ?? []).length, `${file} braces`);
    assert.match(css, /@media/);
  }
  const publicCss = read('apps/web/app/globals.css');
  assert.match(publicCss, /contact-page-grid/);
  assert.match(publicCss, /price-table/);
  assert.match(publicCss, /portfolio-grid/);
  assert.match(publicCss, /project-gallery/);
});

test('secrets are absent and local environment files are excluded from distributable archives', () => {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', '.git', '.next'].includes(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      entry.isDirectory() ? walk(fullPath) : files.push(fullPath);
    }
  }
  walk(root);

  const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.css', '.example', '.gitignore', '.sql']);
  const all = files
    .filter((file) => textExtensions.has(path.extname(file)) || path.basename(file) === '.env.example')
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  assert.ok(!all.includes('samara' + '77767'));
  assert.ok(!all.includes('pizda' + 'jebanaja'));
  assert.ok(!all.includes('Mrh5dezf653Z8YaggnKL1jIB' + '-B2_nblB'));

  const gitignore = read('.gitignore');
  assert.match(gitignore, /^\.env$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);

  const unexpectedEnvironmentFiles = files
    .map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .filter((file) => path.basename(file).startsWith('.env'))
    .filter((file) => path.basename(file) !== '.env.example')
    .filter((file) => process.env.CI === 'true');
  assert.deepEqual(unexpectedEnvironmentFiles, []);
});
