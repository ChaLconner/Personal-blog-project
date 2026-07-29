import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import { prepareImageForStorage } from '../utils/imageProcessing.js';

test('profile images are resized and encoded as WebP', async () => {
  const input = await sharp({
    create: {
      width: 1000,
      height: 800,
      channels: 3,
      background: '#336699',
    },
  })
    .jpeg()
    .toBuffer();

  const result = await prepareImageForStorage(input, 'image/jpeg', 'profile');
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(result.contentType, 'image/webp');
  assert.equal(result.extension, '.webp');
  assert.equal(result.optimized, true);
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 410);
});

test('article images are never enlarged past their source dimensions', async () => {
  const input = await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 4,
      background: '#112233ff',
    },
  })
    .png()
    .toBuffer();

  const result = await prepareImageForStorage(input, 'image/png', 'article');
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 360);
});

test('large article images are bounded to the article preset', async () => {
  const input = await sharp({
    create: {
      width: 3000,
      height: 1200,
      channels: 3,
      background: '#663399',
    },
  })
    .jpeg()
    .toBuffer();

  const result = await prepareImageForStorage(input, 'image/jpeg', 'article');
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(metadata.width, 1920);
  assert.equal(metadata.height, 768);
});

test('animated GIF uploads remain GIF files', async () => {
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    'base64',
  );

  const result = await prepareImageForStorage(gif, 'image/gif', 'article');

  assert.equal(result.contentType, 'image/gif');
  assert.equal(result.extension, '.gif');
  assert.equal(result.optimized, false);
  assert.strictEqual(result.buffer, gif);
});

test('malformed image data is rejected as a bad request', async () => {
  await assert.rejects(
    prepareImageForStorage(Buffer.from('not-an-image'), 'image/jpeg', 'profile'),
    (error) => {
      assert.equal(error.status, 400);
      assert.match(error.message, /could not be processed/);
      return true;
    },
  );
});

test('upload routes store the prepared buffer and MIME type', async () => {
  const source = await readFile(
    new URL('../routes/uploadSupabase.js', import.meta.url),
    'utf8',
  );

  assert.equal((source.match(/await prepareImageForStorage\(/g) || []).length, 2);
  assert.equal(
    (source.match(/\.upload\(fileName, preparedImage\.buffer/g) || []).length,
    2,
  );
  assert.equal(
    (source.match(/contentType: preparedImage\.contentType/g) || []).length,
    2,
  );
  assert.doesNotMatch(source, /\.upload\(fileName, file\.buffer/);
});
