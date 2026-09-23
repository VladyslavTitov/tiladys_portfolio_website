import Link from 'next/link';

export type ProfileInvoice = {
  id: string; invoiceNumber: string | null; status: string; issueDate: string | null; dueDate: string | null;
  total: string; paidTotal: string; outstanding: string; paymentStatus: string;
  serviceJob: { id?: string; jobNumber: string; title: string } | null; serviceJobId: string | null;
  recipientName: string; billingRecipientType: string;
};
const money = (value: string) => Number(value).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('de-DE') : '—';
export function ProfileInvoices({ invoices }: { invoices: ProfileInvoice[] }) {
  return <section className="panel profile-invoices"><h2>Invoices</h2>{invoices.length ? <div className="profile-invoice-grid">{invoices.map(invoice => <article className="profile-invoice" key={invoice.id}>
    <div className="profile-invoice-heading"><Link href={`/dashboard/invoices?invoiceId=${invoice.id}`}><strong>{invoice.invoiceNumber ?? 'Draft'}</strong></Link><span className="status-pill">{invoice.status}</span><span className="status-pill">{invoice.paymentStatus}</span></div>
    <p>Contact: {invoice.recipientName || 'No named billing contact'}</p>
    {invoice.serviceJob ? <Link href={`/dashboard/service-jobs?jobId=${invoice.serviceJobId}`}>{invoice.serviceJob.jobNumber} · {invoice.serviceJob.title}</Link> : <p>No linked job</p>}
    <dl className="profile-invoice-facts"><div><dt>Invoice date</dt><dd>{date(invoice.issueDate)}</dd></div><div><dt>Due date</dt><dd>{date(invoice.dueDate)}</dd></div><div><dt>Total</dt><dd>{money(invoice.total)}</dd></div><div><dt>Paid</dt><dd>{money(invoice.paidTotal)}</dd></div><div><dt>Outstanding</dt><dd>{money(invoice.outstanding)}</dd></div></dl>
    {invoice.billingRecipientType === 'LEGACY' ? <p>Legacy billing relationship: review the saved recipient. Company ownership has not been inferred.</p> : null}
    <div className="profile-actions"><Link className="admin-secondary" href={`/dashboard/invoices?invoiceId=${invoice.id}`}>Open</Link><a className="admin-secondary" href={`/api/admin/invoices/${invoice.id}/pdf?preview=1`} target="_blank" rel="noreferrer">Preview</a><a download className="admin-secondary" href={`/api/admin/invoices/${invoice.id}/pdf`}>Download</a></div>
  </article>)}</div> : <p>No invoices yet. Open a service job to create a draft.</p>}</section>;
}
