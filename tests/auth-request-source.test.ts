import assert from 'node:assert/strict';
import test from 'node:test';
import { requestSource } from '../apps/control/lib/request-source.ts';

test('unconfigured or unsupported forwarding headers cannot choose a login bucket', () => {
  for (const ip of ['198.51.100.1', '198.51.100.2', '2001:db8::1']) {
    const headers = new Headers({ 'x-forwarded-for': ip, 'x-real-ip': ip });
    assert.equal(requestSource(headers), 'unknown');
    assert.equal(requestSource(headers, 'forwarded'), 'unknown');
    assert.equal(requestSource(headers, 'host'), 'unknown');
  }
});
test('a configured ingress header accepts only its first valid IP', () => {
  assert.equal(requestSource(new Headers({ 'x-forwarded-for': '198.51.100.8, 10.0.0.1' }), 'x-forwarded-for'), '198.51.100.8');
  assert.equal(requestSource(new Headers({ 'x-real-ip': '2001:DB8::1' }), 'x-real-ip'), '2001:db8::1');
  assert.equal(requestSource(new Headers({ 'x-vercel-forwarded-for': '203.0.113.3', 'x-forwarded-for': '198.51.100.9' }), 'x-vercel-forwarded-for'), '203.0.113.3');
  for (const invalid of ['', 'unknown', 'not-an-ip', '198.51.100.1:80', 'invalid, 198.51.100.1']) {
    assert.equal(requestSource(new Headers({ 'x-real-ip': invalid }), 'x-real-ip'), 'unknown');
  }
});
