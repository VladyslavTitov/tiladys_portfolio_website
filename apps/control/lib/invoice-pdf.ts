import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

type PdfInvoice = {
  status: string; invoiceNumber: string | null; issueDate: Date | null; dueDate: Date | null; serviceDateFrom: Date | null; serviceDateTo: Date | null;
  sellerLegalName: string; sellerStreet: string; sellerPostalCode: string; sellerCity: string; sellerCountry: string; sellerEmail: string; sellerPhone: string;
  sellerTaxMode: string; sellerTaxNumber: string | null; sellerVatId: string | null; sellerTaxStatement: string | null;
  sellerBankAccountHolder: string | null; sellerIban: string | null; sellerBic: string | null; sellerBankName: string | null; paymentInstructions: string | null;
  recipientName: string; recipientCompany: string | null; recipientEmail: string | null; recipientStreet: string; recipientPostalCode: string; recipientCity: string; recipientCountry: string;
  customerReference: string | null; notes: string | null; subtotal: { toString(): string }; taxTotal: { toString(): string } | null; total: { toString(): string };
  lines: Array<{ serviceName: string; description: string | null; quantity: { toString(): string }; unit: string; unitPrice: { toString(): string }; taxRate: { toString(): string } | null; subtotal: { toString(): string }; taxAmount: { toString(): string } | null; total: { toString(): string }; taxTreatment: string }>;
};

const PAGE = { width: 595.28, height: 841.89, margin: 46 };
const navy = rgb(0.012, 0.102, 0.22); const cyan = rgb(0.02, 0.67, 0.85); const slate = rgb(0.31, 0.39, 0.48); const pale = rgb(0.94, 0.97, 0.98);
const euro = (value: { toString(): string }) => `${Number(value.toString()).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
const formattedDate = (value: Date | null) => value ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin' }).format(value) : '—';

function wrap(font: PDFFont, text: string, size: number, width: number) {
  const paragraphs = text.replace(/\r/g, '').split('\n'); const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean); let line = '';
    for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) lines.push(line); let rest = word; while (font.widthOfTextAtSize(rest, size) > width && rest.length > 1) { let cut = rest.length - 1; while (cut > 1 && font.widthOfTextAtSize(`${rest.slice(0, cut)}-`, size) > width) cut--; lines.push(`${rest.slice(0, cut)}-`); rest = rest.slice(cut); } line = rest; } }
    lines.push(line || '');
  }
  return lines;
}

export async function generateInvoicePdf(invoice: PdfInvoice) {
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const loadFont = async (filename: string) => { for (const root of [process.cwd(), join(process.cwd(), '..', '..')]) { try { return await readFile(join(root, 'node_modules', '@fontsource', 'noto-sans', 'files', filename)); } catch {} } throw new Error(`INVOICE_FONT_NOT_FOUND:${filename}`); };
  const regularBytes = await loadFont('noto-sans-cyrillic-400-normal.woff');
  const boldBytes = await loadFont('noto-sans-cyrillic-700-normal.woff');
  const font = await pdf.embedFont(regularBytes, { subset: true }); const bold = await pdf.embedFont(boldBytes, { subset: true });
  let page!: PDFPage; let y = 0;
  const addPage = () => { page = pdf.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; page.drawRectangle({ x: 0, y: PAGE.height - 24, width: PAGE.width, height: 24, color: navy }); page.drawRectangle({ x: 0, y: PAGE.height - 27, width: PAGE.width, height: 3, color: cyan }); if (invoice.status === 'DRAFT') page.drawText('DRAFT', { x: 115, y: 370, size: 76, font: bold, color: rgb(.88,.92,.95), rotate: degrees(35), opacity: .5 }); };
  const ensure = (height: number) => { if (y - height < 60) addPage(); };
  const text = (value: string, x: number, size = 9, usedFont = font, color = navy) => { page.drawText(value, { x, y, size, font: usedFont, color }); y -= size + 4; };
  const block = (value: string, x: number, width: number, size = 9, usedFont = font, color = navy) => { const lines = wrap(usedFont, value, size, width); ensure(lines.length * (size + 3)); for (const line of lines) text(line, x, size, usedFont, color); };
  addPage();
  text('TiLADYS', PAGE.margin, 25, bold, navy); text('DIGITAL SERVICES', PAGE.margin, 8, bold, cyan); y -= 8;
  const title = invoice.status === 'DRAFT' ? 'INVOICE DRAFT' : 'INVOICE'; text(title, PAGE.margin, 19, bold); text(invoice.invoiceNumber ?? 'Number assigned on issue', PAGE.margin, 11, bold, cyan);
  const metaY = PAGE.height - 72; page.drawText(`Issue date: ${formattedDate(invoice.issueDate)}`, { x: 365, y: metaY, size: 9, font, color: navy }); page.drawText(`Due date: ${formattedDate(invoice.dueDate)}`, { x: 365, y: metaY - 14, size: 9, font, color: navy });
  page.drawRectangle({ x: PAGE.margin, y: y - 2, width: PAGE.width - PAGE.margin * 2, height: 1, color: cyan }); y -= 24;
  const addressTop = y; text('BILL TO', PAGE.margin, 9, bold, cyan); block(invoice.recipientName, PAGE.margin, 215, 10, bold); if (invoice.recipientCompany) block(invoice.recipientCompany, PAGE.margin, 215); block(`${invoice.recipientStreet}\n${invoice.recipientPostalCode} ${invoice.recipientCity}\n${invoice.recipientCountry}`, PAGE.margin, 215); if (invoice.recipientEmail) block(invoice.recipientEmail, PAGE.margin, 215, 8, font, slate);
  y = addressTop; text('FROM', 330, 9, bold, cyan); block(invoice.sellerLegalName, 330, 218, 10, bold); block(`${invoice.sellerStreet}\n${invoice.sellerPostalCode} ${invoice.sellerCity}\n${invoice.sellerCountry}`, 330, 218); block(`${invoice.sellerEmail}\n${invoice.sellerPhone}`, 330, 218, 8, font, slate); y = Math.min(y, addressTop - 100); y -= 10;
  if (invoice.customerReference) block(`Reference: ${invoice.customerReference}`, PAGE.margin, 500, 9, bold);
  block(`Service date/period: ${formattedDate(invoice.serviceDateFrom)}${invoice.serviceDateTo && invoice.serviceDateTo.getTime() !== invoice.serviceDateFrom?.getTime() ? ` – ${formattedDate(invoice.serviceDateTo)}` : ''}`, PAGE.margin, 500, 9); y -= 8;
  ensure(34); page.drawRectangle({ x: PAGE.margin, y: y - 19, width: 503, height: 24, color: navy }); page.drawText('Description', { x: 52, y: y - 12, size: 8, font: bold, color: rgb(1,1,1) }); page.drawText('Qty', { x: 344, y: y - 12, size: 8, font: bold, color: rgb(1,1,1) }); page.drawText('Unit price', { x: 395, y: y - 12, size: 8, font: bold, color: rgb(1,1,1) }); page.drawText('Total', { x: 493, y: y - 12, size: 8, font: bold, color: rgb(1,1,1) }); y -= 30;
  for (const line of invoice.lines) {
    const description = [line.serviceName, line.description].filter(Boolean).join('\n'); const descriptionLines = wrap(font, description, 8, 275); const rowHeight = Math.max(28, descriptionLines.length * 11 + 8); ensure(rowHeight + 8);
    page.drawRectangle({ x: PAGE.margin, y: y - rowHeight + 5, width: 503, height: rowHeight, color: pale });
    let lineY = y - 7; descriptionLines.forEach((part, index) => { page.drawText(part, { x: 52, y: lineY, size: 8, font: index === 0 ? bold : font, color: navy }); lineY -= 11; });
    page.drawText(`${line.quantity.toString()} ${line.unit}`, { x: 344, y: y - 7, size: 8, font, color: navy }); page.drawText(euro(line.unitPrice), { x: 395, y: y - 7, size: 8, font, color: navy }); page.drawText(euro(line.total), { x: 493, y: y - 7, size: 8, font: bold, color: navy });
    const taxLabel = line.taxRate ? `${line.taxRate.toString()}% tax` : line.taxTreatment.replaceAll('_', ' '); page.drawText(taxLabel, { x: 395, y: y - 19, size: 7, font, color: slate }); y -= rowHeight + 5;
  }
  ensure(100); y -= 8; text(`Subtotal: ${euro(invoice.subtotal)}`, 375, 10, font); text(`Tax: ${invoice.taxTotal ? euro(invoice.taxTotal) : 'not confirmed'}`, 375, 10, font); page.drawRectangle({ x: 370, y: y + 5, width: 178, height: 1, color: cyan }); text(`TOTAL: ${euro(invoice.total)}`, 375, 13, bold, navy); y -= 12;
  const taxDetails = [invoice.sellerTaxNumber ? `Tax number: ${invoice.sellerTaxNumber}` : '', invoice.sellerVatId ? `VAT ID: ${invoice.sellerVatId}` : '', invoice.sellerTaxStatement ?? ''].filter(Boolean).join('\n'); if (taxDetails) block(taxDetails, PAGE.margin, 500, 8);
  const payment = [invoice.sellerBankAccountHolder, invoice.sellerBankName, invoice.sellerIban ? `IBAN: ${invoice.sellerIban}` : '', invoice.sellerBic ? `BIC: ${invoice.sellerBic}` : '', invoice.paymentInstructions].filter(Boolean).join(' · '); if (payment) { y -= 7; block(`Payment: ${payment}`, PAGE.margin, 500, 8); }
  if (invoice.notes) { y -= 7; block(invoice.notes, PAGE.margin, 500, 8); }
  const pages = pdf.getPages(); pages.forEach((item, index) => { item.drawText(`${invoice.sellerLegalName} · ${invoice.sellerEmail}`, { x: PAGE.margin, y: 28, size: 7, font, color: slate }); item.drawText(`Page ${index + 1} / ${pages.length}`, { x: 500, y: 28, size: 7, font, color: slate }); });
  pdf.setTitle(`${title} ${invoice.invoiceNumber ?? ''}`.trim()); pdf.setAuthor(invoice.sellerLegalName); pdf.setCreator('TiLADYS Business Control');
  return Buffer.from(await pdf.save());
}
