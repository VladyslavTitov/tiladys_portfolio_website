import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isTrustedAdminOrigin, trustedAdminOrigins } from '../apps/control/lib/trusted-origins';
const config = { CONTROL_URL: 'https://tiladys-control.vercel.app', CONTROL_ALLOWED_ORIGINS: 'https://tiladys-control-tiladys.vercel.app', VERCEL: '1', VERCEL_URL: 'tiladys-control-exact-build.vercel.app' };
test('only configured exact origins and this deployment hostname are trusted', () => {
  for (const origin of trustedAdminOrigins(config)) assert.equal(isTrustedAdminOrigin(origin, config), true);
  for (const origin of [null,'null','https://untrusted.example','https://other.vercel.app','https://tiladys-control.vercel.app.attacker.example','https://tiladys-control.vercel.app@attacker.example','http://tiladys-control.vercel.app','https://tiladys-control.vercel.app:8443','https://tiladys-control.vercel.app/path']) assert.equal(isTrustedAdminOrigin(origin,config),false,origin??'missing');
});
test('Production does not trust Preview branch aliases or request Host headers', () => {
  assert.equal(isTrustedAdminOrigin('https://tiladys-control-git-feature-services-redesign-tiladys.vercel.app',config),false);
  assert.deepEqual([...trustedAdminOrigins({VERCEL:'1'})],[]);
  assert.equal(isTrustedAdminOrigin('http://localhost:3001',{}),true);
  assert.equal(isTrustedAdminOrigin('https://attacker.example',{CONTROL_ALLOWED_ORIGINS:'*, https://*.vercel.app'}),false);
});
