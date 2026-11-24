import test from "node:test";
import assert from "node:assert/strict";

import { fetchAllPages } from "../services/pagination.js";

test("fetches every page reported by the backend", async () => {
  const requested = [];
  const pages = [
    { content: [{ id: 1 }, { id: 2 }], totalPages: 3, totalElements: 5, size: 2 },
    { content: [{ id: 3 }, { id: 4 }], totalPages: 3, totalElements: 5, size: 2 },
    { content: [{ id: 5 }], totalPages: 3, totalElements: 5, size: 2 },
  ];

  const result = await fetchAllPages(async (page, size) => {
    requested.push([page, size]);
    return { ok: true, status: 200, data: pages[page] };
  }, { pageSize: 2 });

  assert.equal(result.ok, true);
  assert.deepEqual(result.items.map((item) => item.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(requested, [[0, 2], [1, 2], [2, 2]]);
});

test("does not return partial data when a later page fails", async () => {
  const result = await fetchAllPages(async (page) => {
    if (page === 1) {
      return {
        ok: false,
        status: 503,
        message: "Page unavailable",
        errorCode: "UPSTREAM_UNAVAILABLE",
      };
    }

    return {
      ok: true,
      status: 200,
      data: { content: [{ id: 1 }], totalPages: 2, size: 1 },
    };
  }, { pageSize: 1 });

  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
  assert.equal(result.errorCode, "UPSTREAM_UNAVAILABLE");
});

test("stops when metadata is absent and a short page is received", async () => {
  const requested = [];
  const result = await fetchAllPages(async (page) => {
    requested.push(page);
    return {
      ok: true,
      status: 200,
      data: { content: page === 0 ? [{ id: 1 }] : [] },
    };
  }, { pageSize: 2 });

  assert.equal(result.ok, true);
  assert.deepEqual(requested, [0]);
  assert.deepEqual(result.items, [{ id: 1 }]);
});

test("honours cancellation before starting the next page", async () => {
  const controller = new AbortController();
  const requested = [];

  const result = await fetchAllPages(async (page) => {
    requested.push(page);
    controller.abort();
    return {
      ok: true,
      status: 200,
      data: { content: [{ id: 1 }], totalPages: 2, size: 1 },
    };
  }, { pageSize: 1, signal: controller.signal });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "REQUEST_ABORTED");
  assert.deepEqual(requested, [0]);
});

test("returns an empty result for an empty catalogue", async () => {
  const result = await fetchAllPages(async () => ({
    ok: true,
    status: 200,
    data: { content: [], totalPages: 0, totalElements: 0, size: 100 },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.items, []);
});
