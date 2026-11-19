import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../apps/web/proxy';
import { isProductionDeployment, localizedAlternates, siteUrl } from '../apps/web/lib/seo';

const env = process.env as Record<string, string | undefined>;

test('canonical origin ignores deployment URL and translated alternatives match available content', () => {
  assert.equal(siteUrl, 'https://tiladys.com');
  const alternatives = localizedAlternates('de', 'portfolio/example', ['de', 'fr']);
  assert.equal(alternatives.canonical, 'https://tiladys.com/de/portfolio/example');
  assert.deepEqual(alternatives.languages, { de: 'https://tiladys.com/de/portfolio/example', fr: 'https://tiladys.com/fr/portfolio/example' });
});

test('only production redirects known aliases, retaining path and query', () => {
  const previousNode = env.NODE_ENV;
  const previousVercel = env.VERCEL_ENV;
  try {
    env.NODE_ENV = 'production'; env.VERCEL_ENV = 'production';
    assert.equal(isProductionDeployment(), true);
    for (const host of ['www.tiladys.com', 'tiladys-public.vercel.app']) {
      const response = proxy(new NextRequest(`https://${host}/fr/contact?service=websites`));
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('location'), 'https://tiladys.com/fr/contact?service=websites');
      const proxied = proxy(new NextRequest('http://127.0.0.1:3001/fr/contact?service=websites', { headers: { host } }));
      assert.equal(proxied.status, 308);
      assert.equal(proxied.headers.get('location'), 'https://tiladys.com/fr/contact?service=websites');
    }
    assert.equal(proxy(new NextRequest('https://untrusted.example/fr/contact')).headers.get('location'), null);
    assert.equal(proxy(new NextRequest('https://tiladys.com/fr/contact')).headers.get('location'), null);
    env.VERCEL_ENV = 'preview';
    assert.equal(isProductionDeployment(), false);
    assert.equal(proxy(new NextRequest('https://tiladys-public.vercel.app/fr/contact')).headers.get('location'), null);
    delete env.VERCEL_ENV;
    assert.equal(isProductionDeployment(), false);
  } finally {
    if (previousNode === undefined) delete env.NODE_ENV; else env.NODE_ENV = previousNode;
    if (previousVercel === undefined) delete env.VERCEL_ENV; else env.VERCEL_ENV = previousVercel;
  }
});
