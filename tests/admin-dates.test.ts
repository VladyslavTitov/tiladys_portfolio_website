import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adminDate, adminDateTime } from '../apps/control/lib/admin-dates';

test('admin timestamps and invoice dates match across server/browser timezones', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Europe/Amsterdam', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = zone;
      assert.equal(adminDateTime('2026-09-23T19:44:54Z'), '23.9.2026, 21:44:54');
      assert.equal(adminDateTime('2026-01-23T19:44:54Z'), '23.1.2026, 20:44:54');
      assert.equal(adminDate('2026-09-23T00:00:00Z'), '23.9.2026');
      assert.equal(adminDate(null), '—');
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
