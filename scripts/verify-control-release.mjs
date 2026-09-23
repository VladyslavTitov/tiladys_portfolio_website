import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const origin = new URL(process.env.CONTROL_RELEASE_URL || 'https://tiladys-control.vercel.app').origin;
const browser = process.env.AGENT_BROWSER_BIN || 'agent-browser';
const session = process.env.CONTROL_BROWSER_SESSION || 'production-recovery';
const customerId = process.env.CONTROL_CHECK_CUSTOMER_ID;
const companyId = process.env.CONTROL_CHECK_COMPANY_ID;
assert.ok(customerId && companyId, 'Exact customer and company profile IDs are required');
const command = (...args) => {
  const result = JSON.parse(execFileSync(browser, ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000 }));
  assert.ok(result.success, 'Browser command failed');
  return result.data;
};
const evaluate = (expression) => command('eval', expression).result;
// Some browser CLI versions retain errors across navigation; compare this run's additions.
const initialErrorCount = command('errors').errors.length;
const paths = ['/dashboard', '/dashboard/customers', `/dashboard/customers/${encodeURIComponent(customerId)}`,
  '/dashboard/messages', '/dashboard/projects', '/dashboard/companies', `/dashboard/companies/${encodeURIComponent(companyId)}`, '/dashboard/service-jobs', '/dashboard/invoices'];
for (const path of paths) {
  command('open', origin + path);
  const state = evaluate(`({path:location.pathname,heading:!!document.querySelector('h1'),navigation:!!document.querySelector('nav'),error:/Application error|server-side exception|client-side exception/.test(document.body.innerText),login:location.pathname.includes('/login')})`);
  assert.equal(state.path, path, `Unexpected navigation: ${path}`);
  assert.ok(state.heading && state.navigation && !state.error && !state.login, `Failed authenticated page: ${path}`);
  console.log(`PASS authenticated browser ${path}`);
}
// Exercise authenticated JSON reads and saved jobs/lines, then the actual PDF endpoint.
const data = evaluate(`(async()=>{const jobs=await fetch('/api/admin/service-jobs');const invoices=await fetch('/api/admin/invoices');return {jobStatus:jobs.status,invoiceStatus:invoices.status,jobs:await jobs.json(),invoices:await invoices.json()}})()`);
assert.equal(data.jobStatus, 200); assert.equal(data.invoiceStatus, 200);
assert.ok(Array.isArray(data.jobs) && Array.isArray(data.invoices));
const job = data.jobs.find((job) => job.customerId === customerId && job.lineItems?.length);
assert.ok(job, 'A saved job with line items belonging to the checked customer is required');
command('open', `${origin}/dashboard/service-jobs?jobId=${encodeURIComponent(job.id)}`);
command('wait', '--fn', `document.body.innerText.includes(${JSON.stringify(job.lineItems[0].serviceName)}) || [...document.querySelectorAll('input,textarea')].some(el => el.value === ${JSON.stringify(job.lineItems[0].serviceName)})`);
console.log('PASS saved job and line items');
const draft = data.invoices.find((invoice) => invoice.customerId === customerId && invoice.status === 'DRAFT');
assert.ok(draft, 'A draft belonging to the checked customer is required');
command('open', `${origin}/dashboard/invoices?invoiceId=${encodeURIComponent(draft.id)}`);
const pdf = evaluate(`fetch('/api/admin/invoices/${encodeURIComponent(draft.id)}/pdf?preview=1').then(async r=>({status:r.status,type:r.headers.get('content-type'),disposition:r.headers.get('content-disposition'),magic:String.fromCharCode(...new Uint8Array(await r.arrayBuffer()).slice(0,4))}))`);
assert.equal(pdf.status, 200); assert.equal(pdf.type, 'application/pdf'); assert.match(pdf.disposition, /^inline/); assert.equal(pdf.magic, '%PDF');
console.log('PASS authenticated draft PDF preview');
for (const [path, expected] of [[`/dashboard/customers/${encodeURIComponent(customerId)}`, data.invoices.filter(i => i.customerId === customerId)], [`/dashboard/companies/${encodeURIComponent(companyId)}`, data.invoices.filter(i => i.billingCompanyId === companyId)]]) {
  command('open', origin + path);
  const hrefs = evaluate(`[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))`);
  for (const invoice of data.invoices) {
    const visible = hrefs.some(href => href.includes(`invoiceId=${invoice.id}`));
    assert.equal(visible, expected.some(item => item.id === invoice.id), `Incorrect invoice visibility on ${path}`);
  }
  console.log(`PASS invoice ownership ${path}`);
}
// Allow late hydration errors to arrive before accepting the candidate.
evaluate('new Promise(resolve => setTimeout(() => resolve(true), 800))');
const errors = command('errors').errors.slice(initialErrorCount);
assert.equal(errors.length, 0, `Browser exceptions: ${errors.map(error => error.text.split('\n')[0]).join('; ')}`);
console.log('PASS release browser verification (rendered pages and zero browser exceptions)');
