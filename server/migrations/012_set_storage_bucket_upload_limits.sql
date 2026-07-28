-- Enforce the same five-megabyte limit at the Storage layer as the API.

BEGIN;

UPDATE storage.buckets
SET file_size_limit = 5 * 1024 * 1024
WHERE id IN ('profile-pictures', 'article-images');

COMMIT;
