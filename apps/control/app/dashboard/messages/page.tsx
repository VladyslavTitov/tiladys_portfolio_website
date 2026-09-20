import { db } from '@tiladys/db';
import { MessageList } from './message-list';

export default async function MessagesPage() {
  const rows = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { attachments: { select: { id: true, filename: true, size: true, width: true, height: true } }, id: true, name: true, email: true, service: true, locale: true, message: true, status: true, createdAt: true },
  });

  return (
    <>
      <h1>Customer messages</h1>
      <p className="admin-intro">The newest 100 contact requests are shown first. Open a message to read its complete plain-text content.</p>
      <MessageList messages={rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))} />
    </>
  );
}
