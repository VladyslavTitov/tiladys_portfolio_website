import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { boundedBody, prepareContactImages } from '../apps/web/lib/contact-images.ts';

const image = async () => sharp({ create: { width: 48, height: 32, channels: 3, background: '#071837' } }).png().withMetadata().toBuffer();
test('contact without attachments remains supported', async () => { assert.deepEqual(await prepareContactImages([]), []); });
test('contact images are re-encoded and metadata and original filenames are discarded', async () => {
  const results = await prepareContactImages([new File([new Uint8Array(await image())], 'private-name.png', { type: 'image/png' })]);
  assert.equal(results[0].filename, 'inquiry-image-1.webp');
  assert.equal(results[0].mimeType, 'image/webp');
  const metadata = await sharp(results[0].data).metadata();
  assert.equal(metadata.width, 48); assert.equal(metadata.height, 32);
  assert.equal(metadata.exif, undefined); assert.equal(metadata.icc, undefined);
});
test('rejects spoofed signatures, unsafe types, too many or oversized files', async () => {
  const valid = new File([new Uint8Array(await image())], 'image.png', { type: 'image/png' });
  for (const files of [
    [new File(['<svg></svg>'], 'x.png', { type: 'image/png' })],
    [new File(['<svg></svg>'], 'x.svg', { type: 'image/svg+xml' })],
    [new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' })],
    [valid, valid, valid],
  ]) await assert.rejects(() => prepareContactImages(files));
});
test('rejects images outside dimension limits before re-encoding', async () => {
  const bytes = await sharp({ create: { width: 4097, height: 2, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(() => prepareContactImages([new File([new Uint8Array(bytes)], 'wide.png', { type: 'image/png' })]), /IMAGE_DIMENSIONS/);
});
test('bounded reader rejects oversized streamed bodies without trusting content-length', async () => {
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(40)); controller.enqueue(new Uint8Array(40)); controller.close(); } });
  const request = new Request('http://localhost/contact', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
  await assert.rejects(() => boundedBody(request, 60), /REQUEST_SIZE/);
  const small = new Request('http://localhost/contact', { method: 'POST', body: 'hello' });
  assert.equal(new TextDecoder().decode(await boundedBody(small, 60)), 'hello');
});
