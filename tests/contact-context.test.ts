import test from 'node:test';
import assert from 'node:assert/strict';
import { contactContext } from '../apps/web/lib/contact-context';

const aliases = { websites: 'websites', 'pc-laptop': 'pc-laptop', 'pc-cleaning-upgrades': 'pc-laptop', '3d-printing': '3d-printing' };

test('cached contact shell keeps service links and query prefills', () => {
  assert.deepEqual(contactContext(new URLSearchParams('service=pc-cleaning-upgrades&mode=local&detail=pc-cleaning&project=engine-model'), aliases), {
    initialService: 'pc-laptop', initialMode: 'local', initialDetail: 'pc-cleaning', publicReference: 'engine-model',
  });
  assert.equal(contactContext(new URLSearchParams('service=websites&service=pc-laptop&product=template-one'), aliases).initialService, 'websites');
  assert.equal(contactContext(new URLSearchParams('product=template-one'), aliases).publicReference, 'template-one');
});

test('untrusted query values cannot become service or hidden request context', () => {
  for (const value of ['__proto__', 'constructor', 'unknown', 'x'.repeat(121)]) {
    assert.equal(contactContext(new URLSearchParams({ service: value }), aliases).initialService, '');
  }
  assert.deepEqual(contactContext(new URLSearchParams('service=unknown&mode=invalid&detail=invalid&project=https://other.test'), aliases), {
    initialService: '', initialMode: '', initialDetail: '', publicReference: '',
  });
});
