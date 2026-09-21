import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '@tiladys/db';
import { NextRequest } from 'next/server';
import { GET as list } from '../apps/control/app/api/public/projects/route';
import { GET as detail } from '../apps/control/app/api/public/projects/[slug]/route';
import { GET as media } from '../apps/control/app/api/public/media/[id]/route';

// Exercise the actual route handlers with an in-memory repository. Never connect to a database.
const rows = ['PUBLISHED', 'DRAFT', 'ARCHIVED'].map((status) => ({ id: status, status, slug: status.toLowerCase(), title: { en: status }, summary: { en: status }, category: 'pc-support', images: [], clientName: 'PRIVATE' }));

test('public list, alias/detail and media handlers require publication on each request', async () => {
  const findMany = db.project.findMany;
  const findFirst = db.project.findFirst;
  const imageFirst = db.projectImage.findFirst;
  try {
    db.project.findMany = (async (args: { where: { status: string } }) => {
      assert.equal(args.where.status, 'PUBLISHED');
      return rows.filter((row) => row.status === args.where.status);
    }) as typeof db.project.findMany;
    db.project.findFirst = (async (args: { where: { status: string; OR: Array<{ slug?: string; slugAliases?: { some: { slug: string } } }> } }) => {
      assert.equal(args.where.status, 'PUBLISHED');
      const slug = args.where.OR[0].slug!;
      assert.equal(args.where.OR[1].slugAliases?.some.slug, slug);
      return rows.find((row) => row.status === args.where.status && (row.slug === slug || `old-${row.slug}` === slug)) ?? null;
    }) as typeof db.project.findFirst;
    db.projectImage.findFirst = (async (args: { where: { id: string; project: { status: string } } }) => {
      assert.equal(args.where.project.status, 'PUBLISHED');
      return rows.some((row) => row.status === args.where.project.status && row.id === args.where.id) ? { data: new Uint8Array([1]), mimeType: 'image/png' } : null;
    }) as typeof db.projectImage.findFirst;
    const request = new NextRequest('http://localhost/api/public/projects');
    const output = await (await list(request)).json();
    assert.deepEqual(output.map((row: { slug: string }) => row.slug), ['published']);
    assert.equal('clientName' in output[0], false);
    assert.equal('featured' in output[0], false);
    for (const row of rows) {
      for (const slug of [row.slug, `old-${row.slug}`]) {
        const response = await detail(request, { params: Promise.resolve({ slug }) });
        assert.equal(response.status, row.status === 'PUBLISHED' ? 200 : 404);
        if (response.ok) assert.equal((await response.json()).slug, 'published');
      }
      const response = await media(request, { params: Promise.resolve({ id: row.id }) });
      assert.equal(response.status, row.status === 'PUBLISHED' ? 200 : 404);
      assert.match(response.headers.get('Cache-Control')!, /no-store/);
    }
  } finally {
    db.project.findMany = findMany;
    db.project.findFirst = findFirst;
    db.projectImage.findFirst = imageFirst;
    await db.$disconnect();
  }
});
