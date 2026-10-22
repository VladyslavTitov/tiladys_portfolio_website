import { cache } from 'react';
import { db } from '@tiladys/db';

// Layout and page share these values only within the current server render.
export const dashboardCounts = cache(async () => {
  const [unread, due, mailAttention] = await Promise.all([
    db.contactMessage.count({ where: { status: 'UNREAD' } }),
    db.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] }, dueAt: { lte: new Date() } } }),
    db.emailOutbox.count({ where: { state: { in: ['UNKNOWN', 'RECORD_FAILED'] } } }),
  ]);
  return { unread, due, mailAttention };
});
