import test from "node:test";
import assert from "node:assert/strict";

import { createBoundedAsyncCache } from "../services/boundedAsyncCache.js";

test("shares concurrent requests for the same key", async () => {
  const cache = createBoundedAsyncCache(2);
  let calls = 0;
  let resolveRequest;
  const loader = () => {
    calls += 1;
    return new Promise((resolve) => { resolveRequest = resolve; });
  };

  const first = cache.getOrLoad("p1", loader);
  const second = cache.getOrLoad("p1", loader);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolveRequest({ id: "p1" });
  assert.deepEqual(await first, { id: "p1" });
  assert.deepEqual(await second, { id: "p1" });
});

test("does not cache null results and allows a later retry", async () => {
  const cache = createBoundedAsyncCache(2);
  let calls = 0;
  assert.equal(await cache.getOrLoad("p1", async () => { calls++; return null; }), null);
  assert.deepEqual(
    await cache.getOrLoad("p1", async () => { calls++; return { id: "p1" }; }),
    { id: "p1" },
  );
  assert.equal(calls, 2);
});

test("does not cache rejected requests and allows a later retry", async () => {
  const cache = createBoundedAsyncCache(2);
  let calls = 0;
  await assert.rejects(
    cache.getOrLoad("p1", async () => { calls++; throw new Error("temporary failure"); }),
    /temporary failure/,
  );
  assert.deepEqual(
    await cache.getOrLoad("p1", async () => { calls++; return { id: "p1" }; }),
    { id: "p1" },
  );
  assert.equal(calls, 2);
});

test("evicts the least recently used successful entry at the configured limit", async () => {
  const cache = createBoundedAsyncCache(2);
  let aCalls = 0;
  await cache.getOrLoad("a", async () => ({ id: "a", call: ++aCalls }));
  await cache.getOrLoad("b", async () => ({ id: "b" }));
  await cache.getOrLoad("a", async () => ({ id: "a", call: ++aCalls }));
  await cache.getOrLoad("c", async () => ({ id: "c" }));
  const a = await cache.getOrLoad("a", async () => ({ id: "a", call: ++aCalls }));
  const b = await cache.getOrLoad("b", async () => ({ id: "b", reloaded: true }));
  assert.equal(a.call, 1);
  assert.equal(b.reloaded, true);
  assert.equal(aCalls, 1);
});

test("rejects an invalid cache size", () => {
  assert.throws(() => createBoundedAsyncCache(0), RangeError);
});
