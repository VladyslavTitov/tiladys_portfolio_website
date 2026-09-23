import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

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
  const loadFont = async (filename: string) => { for (const root of [process.cwd(), join(process.cwd(), '..', '..')]) { try { return await readFile(join(root, 'node_modules', 'dejavu-fonts-ttf', 'ttf', filename)); } catch {} } throw new Error(`INVOICE_FONT_NOT_FOUND:${filename}`); };
  // These are complete, licensed TTFs rather than Fontsource Unicode-range
  // web subsets. A single embedded face therefore maps both Latin Extended
  // and Cyrillic text through fontkit without fallback or manual recoding.
  const regularBytes = await loadFont('DejaVuSans.ttf');
  const boldBytes = await loadFont('DejaVuSans-Bold.ttf');
  const font = await pdf.embedFont(regularBytes, { subset: true }); const bold = await pdf.embedFont(boldBytes, { subset: true });
  const left = PAGE.margin, right = PAGE.width - PAGE.margin, width = right - left;
  const bottom = 66;
  const lineHeight = Math.ceil(Math.max(font.heightAtSize(9), bold.heightAtSize(9))) + 3;
  let page!: PDFPage; let y = 0;
  const draw = (value: string, x: number, baseline: number, size = 9, face = font, color = navy) => {
    page.drawText(value, { x, y: baseline, size, font: face, color });
  };
  const rightText = (value: string, edge: number, baseline: number, size = 9, face = font, maxWidth = 100) => {
    const fitted = Math.min(size, size * maxWidth / Math.max(1, face.widthOfTextAtSize(value, size)));
    draw(value, edge - face.widthOfTextAtSize(value, fitted), baseline, fitted, face);
  };
  const addPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin;
    if (pdf.getPageCount() > 1) { draw(invoice.invoiceNumber ?? 'Invoice', left, y, 10, bold); y -= 28; }
    if (invoice.status === 'DRAFT') draw('Draft', right - 28, PAGE.height - PAGE.margin, 8, font, slate);
  };
  const ensure = (height: number) => { if (y - height < bottom) addPage(); };
  const block = (value: string, x = left, available = width, size = 9, face = font, color = navy) => {
    for (const line of wrap(face, value, size, available)) { ensure(size + 5); draw(line, x, y, size, face, color); y -= size + 5; }
  };
  const label = (value: string) => { ensure(32); draw(value, left, y, 8, bold, slate); y -= 18; };
  addPage();
  // Reuse the actual brand mark; only the logo is rasterized, all invoice text stays searchable.
  let logoBytes: Buffer | undefined;
  for (const root of [process.cwd(), join(process.cwd(), 'apps', 'control')]) {
    try { logoBytes = await sharp(await readFile(join(root, 'public', 'brand', 'logo.svg'))).resize(392).png().toBuffer(); break; } catch {}
  }
  if (!logoBytes) throw new Error('INVOICE_LOGO_NOT_FOUND');
  const logo = await pdf.embedPng(logoBytes);
  page.drawRectangle({ x: left - 5, y: y - 57, width: 80, height: 62, color: navy });
  page.drawImage(logo, { x: left, y: y - 52, width: 70, height: 52 });
  draw('TiLADYS', left + 84, y - 17, 22, bold);
  draw('DIGITAL SERVICES', left + 85, y - 35, 8, font, slate);
  y -= 85;
  draw('INVOICE', left, y, 22, bold); y -= 23;
  block(invoice.invoiceNumber ?? 'Number assigned on issue', left, width, 10, bold);
  y -= 8;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: cyan }); y -= 23;
  const addressTop = y;
  const address = (heading: string, lines: string[], x: number) => {
    y = addressTop; draw(heading, x, y, 8, bold, slate); y -= 18;
    lines.filter(Boolean).forEach((line, index) => block(line, x, 233, 9, index === 0 ? bold : font));
    return y;
  };
  const recipientBottom = address('BILL TO', [invoice.recipientCompany ?? '', invoice.recipientName, invoice.recipientStreet, `${invoice.recipientPostalCode} ${invoice.recipientCity}`, invoice.recipientCountry, invoice.recipientEmail ?? ''], left);
  const sellerBottom = address('SELLER', [invoice.sellerLegalName, invoice.sellerStreet, `${invoice.sellerPostalCode} ${invoice.sellerCity}`, invoice.sellerCountry, invoice.sellerEmail, invoice.sellerPhone], left + 269);
  y = Math.min(recipientBottom, sellerBottom) - 16;
  label('INVOICE INFORMATION');
  block(`Invoice date: ${formattedDate(invoice.issueDate)}    ·    Due date: ${formattedDate(invoice.dueDate)}`);
  block(`Service date/period: ${formattedDate(invoice.serviceDateFrom)}${invoice.serviceDateTo && invoice.serviceDateTo.getTime() !== invoice.serviceDateFrom?.getTime() ? ` – ${formattedDate(invoice.serviceDateTo)}` : ''}`);
  if (invoice.customerReference) block(`Reference: ${invoice.customerReference}`);
  y -= 12;
  const tableHeader = () => {
    page.drawRectangle({ x: left, y: y - 22, width, height: 26, color: navy });
    draw('Description', left + 8, y - 13, 8, bold, rgb(1, 1, 1));
    for (const [value, edge] of [['Qty / unit', 383], ['Unit price', 463], ['Total', right - 8]] as const) {
      draw(value, edge - bold.widthOfTextAtSize(value, 8), y - 13, 8, bold, rgb(1, 1, 1));
    }
    y -= 34;
  };
  const firstLine = invoice.lines[0];
  const firstHeight = firstLine ? Math.max(44, (wrap(bold, firstLine.serviceName, 9, 253).length + (firstLine.description ? wrap(font, firstLine.description, 8.5, 253).length : 0)) * lineHeight + 16) : 44;
  ensure((firstHeight <= 620 ? firstHeight : 44) + 34); tableHeader();
  for (const line of invoice.lines) {
    const parts = [...wrap(bold, line.serviceName, 9, 253).map(text => ({ text, face: bold })), ...((line.description ? wrap(font, line.description, 8.5, 253) : []).map(text => ({ text, face: font })))];
    const quantity = wrap(font, `${line.quantity.toString()} ${line.unit}`, 8, 58);
    let offset = 0;
    while (offset < parts.length) {
      // Keep ordinary rows together; split exceptionally long descriptions across pages.
      const fullHeight = Math.max(parts.length * lineHeight + 16, quantity.length * lineHeight + 16, 44);
      if (offset === 0 && y - (fullHeight <= 620 ? fullHeight : 44) < bottom) { addPage(); tableHeader(); }
      const capacity = Math.max(1, Math.floor((y - bottom - 16) / lineHeight));
      const segment = parts.slice(offset, offset + capacity);
      const height = Math.max(segment.length * lineHeight + 16, offset === 0 ? quantity.length * lineHeight + 16 : 0, 44);
      page.drawRectangle({ x: left, y: y - height + 6, width, height, color: pale });
      segment.forEach((part, i) => draw(part.text, left + 8, y - 8 - i * lineHeight, part.face === bold ? 9 : 8.5, part.face));
      if (offset === 0) {
        quantity.forEach((part, i) => rightText(part, 383, y - 8 - i * lineHeight, 8, font, 58));
        rightText(euro(line.unitPrice), 463, y - 8, 8, font, 72);
        rightText(euro(line.total), right - 8, y - 8, 8, bold, 72);
        rightText(line.taxRate ? `${line.taxRate.toString()}% tax` : 'Tax: see below', 463, y - 22, 7, font, 72);
      }
      offset += segment.length; y -= height + 6;
      if (offset < parts.length) { addPage(); tableHeader(); }
    }
  }
  ensure(105); y -= 14;
  for (const [title, amount, isTotal] of [['Subtotal', euro(invoice.subtotal), false], ['Tax', invoice.taxTotal ? euro(invoice.taxTotal) : 'Not confirmed', false], ['Total', euro(invoice.total), true]] as const) {
    if (isTotal) { page.drawLine({ start: { x: 315, y: y + 10 }, end: { x: right, y: y + 10 }, thickness: 1, color: cyan }); y -= 8; }
    draw(title, 315, y, isTotal ? 12 : 9, isTotal ? bold : font);
    rightText(amount, right - 8, y, isTotal ? 12 : 9, isTotal ? bold : font, 163); y -= 23;
  }
  y -= 10;
  const taxDetails = [invoice.sellerTaxNumber ? `Tax number: ${invoice.sellerTaxNumber}` : '', invoice.sellerVatId ? `VAT ID: ${invoice.sellerVatId}` : '', invoice.sellerTaxStatement ?? ''].filter(Boolean).join('\n');
  if (taxDetails) { block(taxDetails, left, width, 8); y -= 10; }
  const payment = [invoice.sellerBankAccountHolder, invoice.sellerBankName, invoice.sellerIban ? `IBAN: ${invoice.sellerIban}` : '', invoice.sellerBic ? `BIC: ${invoice.sellerBic}` : '', invoice.paymentInstructions].filter(Boolean).join('\n');
  label('PAYMENT INFORMATION');
  block(payment || 'Payment details have not yet been provided.', left, width, 8);
  if (invoice.invoiceNumber) block(`Payment reference: ${invoice.invoiceNumber}`, left, width, 8);
  if (invoice.notes) { y -= 12; label('NOTES'); block(invoice.notes, left, width, 8); }
  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    page = item;
    page.drawLine({ start: { x: left, y: 47 }, end: { x: right, y: 47 }, thickness: 0.5, color: slate });
    const footer = wrap(font, `${invoice.sellerLegalName} · ${invoice.sellerEmail}`, 7, 390).slice(0, 2);
    footer.forEach((line, i) => draw(line, left, 33 - i * 10, 7, font, slate));
    rightText(`Page ${index + 1} / ${pages.length}`, right, 33, 7);
  });
  pdf.setTitle(`Invoice ${invoice.invoiceNumber ?? 'Draft'}`); pdf.setAuthor(invoice.sellerLegalName); pdf.setCreator('TiLADYS Business Control');
  return Buffer.from(await pdf.save());
}
