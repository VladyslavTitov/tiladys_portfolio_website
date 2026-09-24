import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invoiceIssuanceRequirements } from '../apps/control/lib/invoice-issuance-requirements';
const settings = { settingsConfirmedAt: '2026-09-23T12:00:00Z', taxMode: 'VAT', taxNumber: 'SYNTHETIC', vatId: null, taxStatement: null };
const invoice = { billingRecipientType: 'INDIVIDUAL', recipientName: 'Synthetic Recipient', recipientCompany: null, recipientStreet: 'Test 1', recipientPostalCode: '00000', recipientCity: 'Test', issueDate: '2026-09-23', lines: [{ taxTreatment: 'VAT_STANDARD' }] };
test('ready invoice has no artificial optional-field requirements', () => {
  assert.deepEqual(invoiceIssuanceRequirements(invoice, settings), []);
  assert.deepEqual(invoiceIssuanceRequirements({ ...invoice, billingRecipientType: 'COMPANY', recipientCompany: 'Synthetic Ltd', recipientName: '' }, settings), []);
});
test('each actual missing requirement has a distinct actionable field', () => {
  const missing = invoiceIssuanceRequirements({ ...invoice, billingRecipientType: 'LEGACY', recipientStreet: '', recipientPostalCode: '', recipientCity: '', issueDate: null, lines: [{ taxTreatment: 'UNCONFIRMED' }] }, { ...settings, settingsConfirmedAt: null, taxMode: 'UNCONFIRMED', taxNumber: ' ' });
  assert.deepEqual(missing.map(r => r.field), ['invoice-billingRecipientType','billing-taxMode','billing-confirmSettings','billing-taxNumber','invoice-recipientStreet','invoice-recipientPostalCode','invoice-recipientCity','invoice-issueDate','invoice-lines.0.taxTreatment']);
  assert.ok(missing.every(r => r.message && r.code));
});
test('tax mismatch and legal wording track the selected business treatment', () => {
  const klein = { ...settings, taxMode: 'KLEINUNTERNEHMER' };
  assert.deepEqual(invoiceIssuanceRequirements(invoice, klein).map(r => r.code), ['INVOICE_TAX_MISMATCH','TAX_STATEMENT_REQUIRED']);
  assert.deepEqual(invoiceIssuanceRequirements({ ...invoice, lines: [{ taxTreatment: 'KLEINUNTERNEHMER' }] }, { ...klein, taxStatement: 'Synthetic test wording' }), []);
  assert.deepEqual(invoiceIssuanceRequirements({ ...invoice, lines: [] }, settings).map(r => r.field), ['invoice-add-line']);
});
