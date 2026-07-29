import assert from "node:assert/strict";
import test from "node:test";
import {
  ServiceWakeTimeoutError,
  createPersistentCache,
  createRequestCoordinator,
  waitForServiceReady,
} from "../src/services/requestResilience.js";

test("coalesces concurrent requests with the same cache key", async () => {
  const coordinator = createRequestCoordinator();
  let calls = 0;
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });

  const first = coordinator.run("posts", async () => {
    calls += 1;
    return request;
  });
  const second = coordinator.run("posts", async () => {
    calls += 1;
    return request;
  });

  resolveRequest({ success: true });

  assert.deepEqual(await first, { success: true });
  assert.deepEqual(await second, { success: true });
  assert.equal(calls, 1);
  assert.equal(coordinator.size, 0);
});

test("canceling one waiter does not cancel the shared request", async () => {
  const coordinator = createRequestCoordinator();
  const controller = new AbortController();
  let resolveRequest;
  const request = new Promise((resolve) => {
    resolveRequest = resolve;
  });

  const canceledWaiter = coordinator.run("categories", () => request, {
    signal: controller.signal,
  });
  const activeWaiter = coordinator.run("categories", () => request);

  controller.abort();
  await assert.rejects(canceledWaiter, { name: "AbortError" });

  resolveRequest(["General"]);
  assert.deepEqual(await activeWaiter, ["General"]);
});

test("persistent cache returns fresh data and rejects expired data", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  let now = 1_000;
  const cache = createPersistentCache({
    storage,
    prefix: "test:",
    maxAgeMs: 500,
    now: () => now,
  });

  cache.write("posts", [{ id: 1 }]);
  assert.deepEqual(cache.read("posts"), [{ id: 1 }]);

  now = 1_501;
  assert.equal(cache.read("posts"), null);
  assert.equal(values.size, 0);
});

test("readiness loop waits through cold-start failures and uses one overall deadline", async () => {
  let now = 0;
  let attempts = 0;
  const result = await waitForServiceReady(
    async ({ timeoutMs }) => {
      attempts += 1;
      assert.ok(timeoutMs <= 4_000);
      if (attempts < 3) throw new Error("service unavailable");
      return { status: "OK", database: "HEALTHY" };
    },
    {
      timeoutMs: 10_000,
      checkTimeoutMs: 4_000,
      intervalMs: 1_000,
      now: () => now,
      sleep: async (duration) => {
        now += duration;
      },
      isReady: (value) =>
        value?.status === "OK" && value?.database === "HEALTHY",
    },
  );

  assert.equal(attempts, 3);
  assert.equal(result.status, "OK");
  assert.equal(now, 2_000);
});

test("readiness loop reports a distinct wake timeout", async () => {
  let now = 0;

  await assert.rejects(
    waitForServiceReady(
      async () => {
        throw new Error("still asleep");
      },
      {
        timeoutMs: 2_000,
        checkTimeoutMs: 1_000,
        intervalMs: 1_000,
        now: () => now,
        sleep: async (duration) => {
          now += duration;
        },
      },
    ),
    (error) =>
      error instanceof ServiceWakeTimeoutError &&
      error.code === "SERVICE_WAKE_TIMEOUT",
  );
});
