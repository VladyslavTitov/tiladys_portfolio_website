import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInvoiceLines } from '../apps/control/lib/invoices';
import { invoiceIssuanceRequirements } from '../apps/control/lib/invoice-issuance-requirements';
const line = { serviceName: 'Cleaning', serviceNameDe: 'Reinigung', quantity: '3', unit: 'item', unitPrice: '0.10', taxTreatment: 'VAT_STANDARD' };
test('decimal totals, agreed starting prices and ordered monthly periods are enforced on the server', () => {
  const result = calculateInvoiceLines([line])[0];
  assert.equal(result.subtotal.toString(), '0.3'); assert.equal(result.taxAmount?.toString(), '0.06'); assert.equal(result.total.toString(), '0.36');
  assert.throws(() => calculateInvoiceLines([{ ...line, priceMode: 'FROM' }]), /PRICE_CONFIRMATION_REQUIRED/);
  assert.equal(calculateInvoiceLines([{ ...line, priceMode: 'FROM', priceConfirmed: true }])[0].priceMode, 'FROM');
  assert.throws(() => calculateInvoiceLines([{ ...line, priceMode: 'MONTHLY' }]), /INVALID_BILLING_PERIOD/);
  assert.throws(() => calculateInvoiceLines([{ ...line, priceMode: 'MONTHLY', billingPeriodFrom: '2026-09-30', billingPeriodTo: '2026-09-01' }]), /INVALID_BILLING_PERIOD/);
  assert.equal(calculateInvoiceLines([{ ...line, priceMode: 'MONTHLY', billingPeriodFrom: '2026-09-01', billingPeriodTo: '2026-09-30' }])[0].billingPeriodTo, '2026-09-30');
});
test('VAT identifier never supplies missing explicit tax treatment', () => {
  const requirements = invoiceIssuanceRequirements({ recipientName: 'Synthetic', recipientStreet: 'Test 1', recipientPostalCode: '12345', recipientCity: 'Test', issueDate: new Date(), lines: [{ ...line, taxTreatment: 'UNCONFIRMED' }] }, { settingsConfirmedAt: new Date(), taxMode: 'VAT', taxNumber: null, vatId: 'SYNTHETIC', taxStatement: null });
  assert.ok(requirements.some(item => item.code === 'INVOICE_TAX_INCOMPLETE'));
});
