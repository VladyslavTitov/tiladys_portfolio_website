export type IssueRequirement = { code: string; field: string; message: string; settings?: boolean };
type IssueInvoice = { billingRecipientType?: string; recipientCompany?: string | null; recipientName: string; recipientStreet: string; recipientPostalCode: string; recipientCity: string; issueDate: Date | string | null; lines: Array<{ taxTreatment: string }> };
type IssueSettings = { settingsConfirmedAt: Date | string | null; taxMode: string; taxNumber: string | null; vatId: string | null; taxStatement: string | null };
const blank = (value: string | null | undefined) => !value?.trim();

/** Shared by the editor and final server validation; no optional billing fields are blockers. */
export function invoiceIssuanceRequirements(invoice: IssueInvoice, settings: IssueSettings): IssueRequirement[] {
  const requirements: IssueRequirement[] = [];
  const add = (code: string, field: string, message: string, billing = false) => requirements.push({ code, field, message, ...(billing ? { settings: true } : {}) });
  if (invoice.billingRecipientType === 'LEGACY') add('INVALID_BILLING_RECIPIENT', 'invoice-billingRecipientType', 'Choose an explicit billing recipient for this legacy draft.');
  if (settings.taxMode === 'UNCONFIRMED') add('BILLING_SETTINGS_UNCONFIRMED', 'billing-taxMode', 'Choose the business tax treatment.', true);
  if (!settings.settingsConfirmedAt) add('BILLING_SETTINGS_UNCONFIRMED', 'billing-confirmSettings', 'Confirm and save the business billing settings.', true);
  if (blank(settings.taxNumber) && blank(settings.vatId)) add('TAX_IDENTIFIER_REQUIRED', 'billing-taxNumber', 'Enter a tax number or VAT ID.', true);
  const company = invoice.billingRecipientType === 'COMPANY';
  if (blank(company ? invoice.recipientCompany : invoice.recipientName)) add('INVOICE_DETAILS_INCOMPLETE', company ? 'invoice-recipientCompany' : 'invoice-recipientName', company ? 'Enter the billing company name.' : 'Enter the recipient name.');
  for (const [field, label] of [['recipientStreet', 'street'], ['recipientPostalCode', 'postal code'], ['recipientCity', 'city']] as const) {
    if (blank(invoice[field])) add('INVOICE_DETAILS_INCOMPLETE', `invoice-${field}`, `Enter the recipient ${label}.`);
  }
  if (!invoice.issueDate || Number.isNaN(new Date(invoice.issueDate).getTime())) add('INVOICE_DETAILS_INCOMPLETE', 'invoice-issueDate', 'Enter the invoice issue date.');
  if (!invoice.lines.length) add('INVOICE_TAX_INCOMPLETE', 'invoice-add-line', 'Add at least one invoice line.');
  invoice.lines.forEach((line, index) => {
    if (line.taxTreatment === 'UNCONFIRMED') add('INVOICE_TAX_INCOMPLETE', `invoice-lines.${index}.taxTreatment`, `Confirm the tax treatment for line ${index + 1}.`);
    else if ((settings.taxMode === 'VAT' && line.taxTreatment === 'KLEINUNTERNEHMER') || (settings.taxMode === 'KLEINUNTERNEHMER' && line.taxTreatment !== 'KLEINUNTERNEHMER')) {
      add('INVOICE_TAX_MISMATCH', `invoice-lines.${index}.taxTreatment`, `Match line ${index + 1} to the confirmed business tax treatment.`);
    }
  });
  if (settings.taxMode === 'KLEINUNTERNEHMER' && blank(settings.taxStatement)) add('TAX_STATEMENT_REQUIRED', 'billing-taxStatement', 'Enter the required tax statement.', true);
  return requirements;
}
