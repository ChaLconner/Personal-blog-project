import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  verifyImageMagicBytes,
} from "../routes/uploadSupabase.js";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "ci-placeholder-anon-key";
process.env.SUPABASE_SERVICE_KEY ??= "ci-placeholder-service-role-key";

const readSource = async (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("public post queries enforce published status", async () => {
  const source = await readSource("../config/database.js");
  const matches = source.match(/\.eq\(\s*["']status_id["']\s*,\s*2\s*\)/g) || [];
  assert.ok(matches.length >= 4, `expected four published filters, got ${matches.length}`);
});

test("admin post writes persist verified author identity", async () => {
  const source = await readSource("../routes/admin.js");
  assert.match(source, /author_id:\s*req\.userId/);
  assert.match(source, /updateData\.author_id\s*=\s*req\.userId/);
});

test("notification type stats use supported PostgREST aggregates", async () => {
  const source = await readSource("../routes/notifications.js");
  assert.doesNotMatch(source, /\.group\(/);
  assert.match(source, /count:id\.count\(\)/);
  assert.match(source, /NODE_ENV\s*===\s*['"]development['"][\s\S]*router\.get\(['"]\/test['"]/);
});

test("notification index targets the real read column", async () => {
  const source = await readSource("../migrations/add_indexes.sql");
  assert.doesNotMatch(source, /\bis_read\b/);
  assert.match(source, /notifications\(user_id,\s*read,\s*created_at DESC\)/);
});

test("both upload paths verify image signatures", async () => {
  const source = await readSource("../routes/uploadSupabase.js");
  const calls = source.match(/verifyImageMagicBytes\(req\.file\.buffer/g) || [];
  assert.equal(calls.length, 2);
  assert.match(source, /buffer\.toString\([^)]*8,\s*12\)[\s\S]*WEBP/);
  assert.match(source, /IMAGE_EXTENSIONS\[file\.mimetype\]/);
  assert.match(source, /error\.status\s*=\s*400/);
});

test("server upload limit matches the five megabyte client contract", async () => {
  const source = await readSource("../routes/uploadSupabase.js");
  const appSource = await readSource("../app.js");

  assert.equal(MAX_IMAGE_SIZE_MB, 5);
  assert.equal(MAX_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
  assert.match(source, /fileSize:\s*MAX_IMAGE_SIZE_BYTES/);
  assert.doesNotMatch(source, /Maximum size is 3MB/);
  assert.match(appSource, /Maximum size is \$\{MAX_IMAGE_SIZE_MB\}MB/);
});

test("production CORS excludes local development origins", async () => {
  const source = await readSource("../app.js");

  assert.match(source, /const developmentOrigins\s*=\s*\[[\s\S]*localhost:5173/);
  assert.match(
    source,
    /process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\?\s*developmentOrigins\s*:\s*\[\]/,
  );
  assert.doesNotMatch(
    source,
    /allowedOrigins\.includes\(origin\)\s*\|\|[\s\S]*origin\.includes\(['"]localhost['"]\)/,
  );
});

test("production runtime rejects localhost CORS origins", async (t) => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousClientUrl = process.env.CLIENT_URL;
  process.env.NODE_ENV = "production";
  process.env.CLIENT_URL = "https://frontend.example.com";

  const { default: productionApp } = await import(
    `../app.js?cors-test=${Date.now()}`
  );

  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  if (previousClientUrl === undefined) delete process.env.CLIENT_URL;
  else process.env.CLIENT_URL = previousClientUrl;

  const server = await new Promise((resolve) => {
    const listeningServer = productionApp.listen(
      0,
      "127.0.0.1",
      () => resolve(listeningServer),
    );
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const { port } = server.address();
  const localResponse = await fetch(`http://127.0.0.1:${port}/missing`, {
    headers: { origin: "http://localhost:5173" },
  });
  const configuredResponse = await fetch(`http://127.0.0.1:${port}/missing`, {
    headers: { origin: "https://frontend.example.com" },
  });

  assert.equal(localResponse.status, 403);
  assert.equal(localResponse.headers.get("access-control-allow-origin"), null);
  assert.equal(configuredResponse.status, 404);
  assert.equal(
    configuredResponse.headers.get("access-control-allow-origin"),
    "https://frontend.example.com",
  );
});

test("image signature validation matches the declared MIME type", () => {
  const webp = Buffer.alloc(12);
  webp.write("RIFF", 0, "ascii");
  webp.write("WEBP", 8, "ascii");
  const riffOnly = Buffer.from("RIFF00000000", "ascii");
  const png = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
  ]);

  assert.equal(verifyImageMagicBytes(webp, "image/webp"), true);
  assert.equal(verifyImageMagicBytes(riffOnly, "image/webp"), false);
  assert.equal(verifyImageMagicBytes(png, "image/png"), true);
  assert.equal(verifyImageMagicBytes(png, "image/jpeg"), false);
});

test("malformed JSON is classified as a bad request", async () => {
  const source = await readSource("../app.js");
  assert.match(source, /entity\.parse\.failed[\s\S]*400|400[\s\S]*entity\.parse\.failed/);
  assert.doesNotMatch(source, /Global error handler:',\s*error\)/);
});

test("malformed JSON returns HTTP 400 at runtime", async (t) => {
  const { default: app } = await import("../app.js");
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"broken":',
  });

  assert.equal(response.status, 400);
});
