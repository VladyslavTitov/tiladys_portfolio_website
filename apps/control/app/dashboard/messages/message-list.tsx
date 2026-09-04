'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReplyForm } from './reply-form';

type MessageRow = {
  id: string;
  name: string;
  email: string;
  service: string | null;
  locale: string;
  message: string;
  status: string;
  createdAt: string;
};

export function MessageList({ messages }: { messages: MessageRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  async function setStatus(id: string, status: 'UNREAD' | 'READ') {
    if (pendingId) return;
    setPendingId(id);
    setFeedback('');
    try {
      const response = await fetch(`/api/admin/messages/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Request failed');
      setFeedback(`Message marked ${status.toLowerCase()}.`);
      router.refresh();
    } catch {
      setFeedback('Could not update the message status.');
    } finally {
      setPendingId(null);
    }
  }

  if (!messages.length) return <section className="panel"><p>No messages received yet.</p></section>;

  return (
    <section className="message-list" aria-label="Contact messages">
      <p className="admin-message" aria-live="polite">{feedback}</p>
      {messages.map((message) => {
        const isUnread = message.status === 'UNREAD';
        const preview = message.message.length > 180 ? `${message.message.slice(0, 180)}…` : message.message;
        return (
          <article className={`panel message message--${isUnread ? 'unread' : 'read'}`} key={message.id}>
            <header>
              <div><b>{message.name}</b><a href={`mailto:${message.email}`}>{message.email}</a></div>
              <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
              <span className={`message-status message-status--${isUnread ? 'unread' : 'read'}`}>{message.status}</span>
            </header>
            <div className="message-meta">
              {message.service ? <span>Service: {message.service}</span> : null}
              <span>Locale: {message.locale}</span>
            </div>
            <details>
              <summary>{preview}</summary>
              <p className="message-full-text">{message.message}</p>
            </details>
            <div className="message-actions">
              <button type="button" className="admin-secondary" disabled={pendingId === message.id || isUnread} onClick={() => setStatus(message.id, 'UNREAD')}>Mark unread</button>
              <button type="button" className="admin-primary" disabled={pendingId === message.id || message.status === 'READ'} onClick={() => setStatus(message.id, 'READ')}>Mark read</button>
            </div>
            <ReplyForm id={message.id} email={message.email} />
          </article>
        );
      })}
    </section>
  );
}
