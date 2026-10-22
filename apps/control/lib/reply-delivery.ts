export async function deliverReply(send: () => Promise<void>, record: () => Promise<unknown>) {
  try { await send(); } catch { return 'delivery-failed' as const; }
  try { await record(); } catch { return 'record-failed' as const; }
  return 'sent' as const;
}
