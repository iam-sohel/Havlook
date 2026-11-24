/**
 * Bounded LRU cache for successful asynchronous lookups.
 * In-flight calls are deduplicated; null results and failures are retryable.
 */
export function createBoundedAsyncCache(maxEntries = 200) {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError("maxEntries must be a positive integer.");
  }

  const entries = new Map();
  const inFlight = new Set();

  function trim() {
    while (entries.size > maxEntries) {
      const oldestSettledKey = Array.from(entries.keys()).find(
        (key) => !inFlight.has(key),
      );
      if (oldestSettledKey === undefined) return;
      entries.delete(oldestSettledKey);
    }
  }

  return {
    getOrLoad(key, loader) {
      if (entries.has(key)) {
        const existing = entries.get(key);
        entries.delete(key);
        entries.set(key, existing);
        return existing;
      }

      const request = Promise.resolve()
        .then(loader)
        .then((value) => {
          inFlight.delete(key);
          if (value === null || value === undefined) {
            if (entries.get(key) === request) entries.delete(key);
            return value;
          }
          trim();
          return value;
        })
        .catch((error) => {
          inFlight.delete(key);
          if (entries.get(key) === request) entries.delete(key);
          throw error;
        });

      entries.set(key, request);
      inFlight.add(key);
      trim();
      return request;
    },
  };
}
