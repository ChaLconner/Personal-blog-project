import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSafeImageUrl } from "../src/utils/imageUrl.js";

test("client image sanitizer blocks mixed-content and local-network URLs", () => {
  const options = {
    pageOrigin: "https://blog.example.com",
    uploadsBaseUrl: "https://api.example.com",
    fallback: "/default-avatar.png",
  };

  assert.equal(
    getSafeImageUrl("http://example.com/avatar.jpg", options),
    "/default-avatar.png",
  );
  assert.equal(
    getSafeImageUrl("http://localhost:5000/avatar.jpg", options),
    "/default-avatar.png",
  );
  assert.equal(
    getSafeImageUrl("https://127.0.0.1/avatar.jpg", options),
    "/default-avatar.png",
  );
  assert.equal(
    getSafeImageUrl("https://cdn.example.com/avatar.jpg", options),
    "https://cdn.example.com/avatar.jpg",
  );
  assert.equal(
    getSafeImageUrl("/uploads/profiles/avatar.jpg", options),
    "https://api.example.com/uploads/profiles/avatar.jpg",
  );
  assert.equal(
    getSafeImageUrl("/default-avatar.png", options),
    "/default-avatar.png",
  );
  assert.equal(
    getSafeImageUrl("data:image/jpeg;base64,AAAA", options),
    "data:image/jpeg;base64,AAAA",
  );
  assert.equal(
    getSafeImageUrl("data:text/html;base64,AAAA", options),
    "/default-avatar.png",
  );
});

test("avatar and post renderers use the shared image sanitizer", async () => {
  const avatarSource = await readFile(
    new URL("../src/components/common/UserAvatar.jsx", import.meta.url),
    "utf8",
  );
  const blogCardSource = await readFile(
    new URL("../src/components/blog/BlogCard.jsx", import.meta.url),
    "utf8",
  );
  const viewPostSource = await readFile(
    new URL("../src/components/blog/ViewPost.jsx", import.meta.url),
    "utf8",
  );

  assert.match(avatarSource, /getSafeImageUrl/);
  assert.match(blogCardSource, /getSafeImageUrl/);
  assert.match(viewPostSource, /getSafeImageUrl/);
});
