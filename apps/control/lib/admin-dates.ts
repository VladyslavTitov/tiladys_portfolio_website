// Admin activity uses the business timezone, regardless of server/browser locale.
export function adminDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
}

// Invoice/payment form dates are persisted as UTC calendar dates.
export function adminDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('de-DE', { timeZone: 'UTC' }) : '—';
}
