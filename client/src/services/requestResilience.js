const createAbortError = () => {
  const error = new Error("Request canceled");
  error.name = "AbortError";
  error.code = "ERR_CANCELED";
  return error;
};

const throwIfAborted = (signal) => {
  if (signal?.aborted) {
    throw createAbortError();
  }
};

const waitForSharedResult = (promise, signal) => {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(createAbortError());

  return new Promise((resolve, reject) => {
    const handleAbort = () => reject(createAbortError());
    signal.addEventListener("abort", handleAbort, { once: true });

    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", handleAbort);
    });
  });
};

export const createRequestCoordinator = () => {
  const requests = new Map();

  return {
    run(key, factory, { signal } = {}) {
      let request = requests.get(key);
      if (!request) {
        request = Promise.resolve()
          .then(factory)
          .finally(() => {
            if (requests.get(key) === request) {
              requests.delete(key);
            }
          });
        requests.set(key, request);
      }

      return waitForSharedResult(request, signal);
    },

    clear() {
      requests.clear();
    },

    get size() {
      return requests.size;
    },
  };
};

export const createPersistentCache = ({
  storage,
  prefix,
  maxAgeMs,
  now = Date.now,
}) => {
  const storageKey = (key) => `${prefix}${key}`;

  return {
    read(key) {
      if (!storage) return null;

      try {
        const fullKey = storageKey(key);
        const raw = storage.getItem(fullKey);
        if (!raw) return null;

        const entry = JSON.parse(raw);
        if (
          typeof entry?.timestamp !== "number" ||
          now() - entry.timestamp > maxAgeMs
        ) {
          storage.removeItem(fullKey);
          return null;
        }

        return entry.data ?? null;
      } catch {
        return null;
      }
    },

    write(key, data) {
      if (!storage) return;

      try {
        storage.setItem(
          storageKey(key),
          JSON.stringify({ data, timestamp: now() }),
        );
      } catch {
        // Storage can be unavailable or full. Memory caching still works.
      }
    },

    remove(key) {
      if (!storage) return;

      try {
        storage.removeItem(storageKey(key));
      } catch {
        // Ignore unavailable browser storage.
      }
    },
  };
};

const defaultSleep = (duration, signal) =>
  new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    };
    const timeoutId = setTimeout(finish, duration);
    const handleAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener("abort", handleAbort, { once: true });
    }
  });

export class ServiceWakeTimeoutError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "ServiceWakeTimeoutError";
    this.code = "SERVICE_WAKE_TIMEOUT";
  }
}

export const waitForServiceReady = async (
  check,
  {
    timeoutMs,
    checkTimeoutMs,
    intervalMs,
    signal,
    isReady = (value) => value?.status === "OK",
    onAttempt,
    now = Date.now,
    sleep = defaultSleep,
  },
) => {
  const deadline = now() + timeoutMs;
  let attempt = 0;
  let lastError;

  while (now() < deadline) {
    throwIfAborted(signal);
    attempt += 1;
    onAttempt?.(attempt);

    const remainingMs = deadline - now();
    try {
      const result = await check({
        timeoutMs: Math.max(1, Math.min(checkTimeoutMs, remainingMs)),
        signal,
      });
      if (isReady(result)) {
        return result;
      }
      lastError = new Error("Service is not ready");
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        error?.name === "CanceledError" ||
        error?.code === "ERR_CANCELED"
      ) {
        throw error;
      }
      lastError = error;
    }

    const delayMs = Math.min(intervalMs, Math.max(0, deadline - now()));
    if (delayMs > 0) {
      await sleep(delayMs, signal);
    }
  }

  throw new ServiceWakeTimeoutError(
    "Server did not become ready before the wake-up deadline",
    { cause: lastError },
  );
};
