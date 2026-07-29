import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getNotificationPresentation } from "../src/utils/notificationFormatter.js";

const readSource = async (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("notification fetch accepts HTTP 304", async () => {
  const source = await readSource("../src/services/api.js");
  assert.match(source, /validateStatus[\s\S]*status\s*===\s*304/);
});

test("login exposes resend verification after an unverified login", async () => {
  const source = await readSource("../src/pages/LoginPage.jsx");
  assert.match(source, /setRequiresVerification/);
  assert.match(source, /result\??\.requiresVerification/);
  assert.match(source, /Email Verification Required/);
});

test("auth callback does not persist unused raw Supabase tokens", async () => {
  const source = await readSource("../src/pages/AuthCallbackPage.jsx");
  assert.doesNotMatch(source, /supabase\.auth\.(?:token|refresh_token)/);
});

test("post list timeout and abort signal are request options, not query params", async () => {
  const source = await readSource(
    "../src/components/blog/ArticleSection.jsx",
  );
  assert.match(source, /blogApi\.getPosts\(\s*\{[\s\S]*?\}\s*,\s*\{/);
});

test("article initial load does not issue a duplicate posts prefetch", async () => {
  const source = await readSource(
    "../src/components/blog/ArticleSection.jsx",
  );
  assert.doesNotMatch(source, /Prefetch on first load|firstLoadRef/);
});

test("API instance does not force JSON content type on GET requests", async () => {
  const source = await readSource("../src/services/api.js");
  const instanceConfig = source.match(
    /axios\.create\(\{([\s\S]*?)\}\);/,
  )?.[1];

  assert.ok(instanceConfig);
  assert.doesNotMatch(instanceConfig, /Content-Type/);
});

test("missing posts navigate to a stable 404 URL", async () => {
  const source = await readSource("../src/components/blog/ViewPost.jsx");
  assert.doesNotMatch(source, /navigate\(\s*["']\*["']\s*\)/);
  assert.match(source, /navigate\(\s*["']\/404["']/);
});

test("notification presentation uses the notification type, not message presence", () => {
  assert.deepEqual(getNotificationPresentation("new_article"), {
    actionText: "published a new article:",
    showMessage: false,
  });
  assert.deepEqual(getNotificationPresentation("new_comment"), {
    actionText: "Commented on your article:",
    showMessage: true,
  });
  assert.deepEqual(getNotificationPresentation("like"), {
    actionText: "liked your article:",
    showMessage: false,
  });
});
