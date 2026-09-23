import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import { generateInvoicePdf } from '../apps/control/lib/invoice-pdf';

const value = (text: string) => ({ toString: () => text });
const unicodeLines = [
  'Ä Ö Ü ä ö ü ß · €45,00',
  'Українська: І і Ї ї Є є Ґ ґ',
  'Русский: Проверка счёта',
  'Slovensky: ľ š č ť ž ý á í é ô ä',
  'Français: é è ê ë ç œ',
];

function fixture(lineCount = 1) {
  return {
    status: 'DRAFT', invoiceNumber: null, issueDate: new Date('2026-09-22T12:00:00Z'), dueDate: null, serviceDateFrom: new Date('2026-09-22T12:00:00Z'), serviceDateTo: null,
    sellerLegalName: 'TiLADYS – Vladyslav Titov', sellerStreet: 'Kronenstraße 19', sellerPostalCode: '45479', sellerCity: 'Mülheim an der Ruhr', sellerCountry: 'Germany', sellerEmail: 'contact@tiladys.com', sellerPhone: '+49 163 7235608',
    sellerTaxMode: 'UNCONFIRMED', sellerTaxNumber: null, sellerVatId: null, sellerTaxStatement: null, sellerBankAccountHolder: null, sellerIban: null, sellerBic: null, sellerBankName: null, paymentInstructions: null,
    recipientName: 'Unicode Test', recipientCompany: null, recipientEmail: null, recipientStreet: 'Kronenstraße 19', recipientPostalCode: '45479', recipientCity: 'Mülheim an der Ruhr', recipientCountry: 'DE', customerReference: 'Unicode extraction test', notes: unicodeLines.join('\n'),
    subtotal: value(String(45 * lineCount)), taxTotal: null, total: value(String(45 * lineCount)),
    lines: Array.from({ length: lineCount }, (_, index) => ({ serviceName: index ? `TiLADYS multilingual service ${index + 1}` : 'TiLADYS – Vladyslav Titov', description: unicodeLines.join('\n'), quantity: value('1'), unit: 'item', unitPrice: value('45'), taxRate: null, subtotal: value('45'), taxAmount: null, total: value('45'), taxTreatment: 'UNCONFIRMED' })),
  };
}

test('invoice PDF embeds full Unicode fonts, extracts exact text, and paginates using embedded metrics', async () => {
  const short = await generateInvoicePdf(fixture());
  const long = await generateInvoicePdf(fixture(70));
  mkdirSync('docs/business-control/samples', { recursive: true });
  writeFileSync('docs/business-control/samples/invoice-unicode-sample.pdf', short);
  writeFileSync('/tmp/tiladys-invoice-unicode-multipage.pdf', long);
  assert.equal((await PDFDocument.load(short)).getPageCount(), 1);
  assert.ok((await PDFDocument.load(long)).getPageCount() > 1);

  const fonts = spawnSync('pdffonts', ['docs/business-control/samples/invoice-unicode-sample.pdf'], { encoding: 'utf8' });
  assert.equal(fonts.status, 0, fonts.stderr);
  assert.match(fonts.stdout, /DejaVuSans/);
  assert.match(fonts.stdout, /DejaVuSans-Bold/);
  for (const row of fonts.stdout.split('\n').filter((line) => line.includes('DejaVuSans'))) assert.match(row, /yes\s+(?:yes|no)\s+yes/);

  const extracted = spawnSync('pdftotext', ['-layout', 'docs/business-control/samples/invoice-unicode-sample.pdf', '-'], { encoding: 'utf8' });
  assert.equal(extracted.status, 0, extracted.stderr);
  const text = extracted.stdout.normalize('NFC');
  for (const expected of ['Draft', 'TiLADYS – Vladyslav Titov', 'Kronenstraße 19', '45479 Mülheim an der Ruhr', ...unicodeLines]) assert.ok(text.includes(expected.normalize('NFC')), `Missing extracted text: ${expected}`);
});

test('draft/final layout, repeated headers, oversized descriptions and footer bounds', async () => {
  const stress = fixture(12);
  stress.recipientName = 'Олена Коваль · François Müller · ľščťž '.repeat(6).trim();
  stress.recipientStreet = 'Kronenstraße · вулиця Незалежності '.repeat(5).trim();
  stress.recipientCity = 'Mülheim an der Ruhr / Bratislava / Київ';
  stress.lines[0].description = ('Long customer-facing description: English, Deutsch, Українська, Русский, Slovensky, Français. ').repeat(50);
  stress.lines[0].unit = 'a deliberately long unit of measurement';
  const directory = 'docs/business-control/samples/crm-workflow'; mkdirSync(directory, { recursive: true });
  for (const status of ['DRAFT', 'ISSUED']) {
    const path = `${directory}/multilingual-${status.toLowerCase()}.pdf`;
    const bytes = await generateInvoicePdf({ ...stress, status, invoiceNumber: status === 'ISSUED' ? 'INV-SAMPLE-2026' : null });
    writeFileSync(path, bytes);
    const text = spawnSync('pdftotext', ['-layout', path, '-'], { encoding: 'utf8' }); assert.equal(text.status, 0);
    assert.equal(text.stdout.includes('Draft'), status === 'DRAFT'); assert.ok(!text.stdout.includes('DRAFT'));
    const pages = text.stdout.split('\f').filter(p => p.trim()); assert.ok(pages.length > 2);
    pages.forEach((page, index) => { assert.match(page, new RegExp(`Page ${index + 1} / ${pages.length}`)); if (page.includes('multilingual service') || page.includes('Long customer-facing')) assert.match(page, /Description\s+Qty \/ unit\s+Unit price\s+Total/); });
    assert.equal((text.stdout.match(/TOTAL:/g) ?? []).length, 0);
    // Bounding boxes verify selectable glyphs remain inside the A4 page and above reserved footer space.
    const bbox = spawnSync('pdftotext', ['-bbox', path, '-'], { encoding: 'utf8' }); assert.equal(bbox.status, 0);
    for (const match of bbox.stdout.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)) {
      const [, x1, y1, x2, y2] = match;
      assert.ok(Number(x1) >= 40 && Number(x2) <= 555, `Horizontal clipping: ${match[0]}`);
      assert.ok(Number(y1) >= 30 && Number(y2) <= 832, `Vertical clipping: ${match[0]}`);
      assert.ok(Number(y2) < 785 || Number(y1) > 800, `Text collides with footer separator: ${match[0]}`);
    }
    assert.ok(text.stdout.includes('Français')); assert.ok(text.stdout.includes('Українська'));
  }
});
