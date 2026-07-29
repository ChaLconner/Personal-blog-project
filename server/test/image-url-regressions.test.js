import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { isSafePublicImageUrl } from "../utils/imageUrl.js";

const readSource = async (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

test("public image URLs require HTTPS and reject local networks", () => {
  assert.equal(
    isSafePublicImageUrl(
      "https://example.supabase.co/storage/v1/object/public/profile-pictures/user/avatar.jpg",
    ),
    true,
  );
  assert.equal(isSafePublicImageUrl("http://example.com/avatar.jpg"), false);
  assert.equal(isSafePublicImageUrl("http://localhost:5000/avatar.jpg"), false);
  assert.equal(isSafePublicImageUrl("https://127.0.0.1/avatar.jpg"), false);
  assert.equal(isSafePublicImageUrl("https://192.168.1.10/avatar.jpg"), false);
  assert.equal(isSafePublicImageUrl("data:image/jpeg;base64,AAAA"), false);
  assert.equal(isSafePublicImageUrl(""), false);
});

test("storage upload failures cannot fall back to local files", async () => {
  const source = await readSource("../routes/uploadSupabase.js");

  assert.doesNotMatch(source, /fs\.writeFile/);
  assert.doesNotMatch(source, /storage\.createBucket/);
  assert.doesNotMatch(source, /uploaded locally \(fallback\)/);
  assert.match(source, /res\.status\(502\)/);
});

test("profile, article, and comment writes validate image URLs", async () => {
  const authSource = await readSource("../controllers/authController.js");
  const adminSource = await readSource("../routes/admin.js");
  const commentsSource = await readSource("../controllers/commentsController.js");

  assert.match(authSource, /isSafePublicImageUrl\(pic\)/);
  assert.ok(
    (adminSource.match(/isSafePublicImageUrl\(image\)/g) || []).length >= 2,
  );
  assert.match(commentsSource, /isSafePublicImageUrl\(image\)/);
});
