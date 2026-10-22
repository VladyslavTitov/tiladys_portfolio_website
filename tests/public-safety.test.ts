import test from 'node:test';
import assert from 'node:assert/strict';
import { publicProject, publicProjectSelect } from '../apps/control/lib/public-projects.ts';
import { deliverReply } from '../apps/control/lib/reply-delivery.ts';

test('public project output does not expose private or future database fields', () => {
  const source = {
    id: 'fixture', slug: 'fixture', category: 'web-development', seoTitle: null, seoDescription: null, socialTitle: null, socialDescription: null, socialImageId: null,
    title: { en: 'Fixture' }, summary: { en: 'Synthetic test project' }, description: null,
    type: null, role: null, workItems: null, projectDate: null, websiteUrl: null, githubUrl: null,
    coverImage: null, technologies: null, clientName: 'PRIVATE_TEST_FIELD', results: { internal: true },
    status: 'PUBLISHED', futurePrivateField: 'not public', images: [{ id: 'image', alt: null, sortOrder: 0, data: 'not public' }],
  };
  const output = publicProject(source, 'https://example.test');
  assert.equal('clientName' in output, false);
  assert.equal('results' in output, false);
  assert.equal('futurePrivateField' in output, false);
  assert.equal('data' in output.images[0], false);
  assert.equal('clientName' in publicProjectSelect, false);
  assert.equal(output.images[0].url, 'https://example.test/api/public/media/image?v=2');
});
test('SMTP failure never records a successful reply and can be retried', async () => {
  let writes = 0;
  const record = async () => { writes++; };
  assert.equal(await deliverReply(async () => { throw new Error('SMTP unavailable'); }, record), 'delivery-failed');
  assert.equal(writes, 0);
  assert.equal(await deliverReply(async () => {}, record), 'sent');
  assert.equal(writes, 1);
});
test('database failure after SMTP acceptance is reported separately', async () => {
  const calls: string[] = [];
  assert.equal(await deliverReply(async () => { calls.push('smtp'); }, async () => { calls.push('database'); throw new Error(); }), 'record-failed');
  assert.deepEqual(calls, ['smtp', 'database']);
});
