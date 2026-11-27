/**
 * Shared bounded pagination for Spring Boot Page responses.
 *
 * Pages are fetched sequentially so the storefront never launches an
 * unbounded fan-out of catalogue requests.
 */

/**
 * @template T
 * @param {(page: number, pageSize: number) => Promise<
 *   | { ok: true, status: number, data: { content: T[], totalPages?: number, totalElements?: number, size?: number } }
 *   | { ok: false, status: number, message: string, errorCode?: string }
 * >} fetchPage
 * @param {{ pageSize?: number, maxPages?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<
 *   | { ok: true, status: number, items: T[] }
 *   | { ok: false, status: number, message: string, errorCode?: string }
 * >}
 */
export async function fetchAllPages(
  fetchPage,
  { pageSize = 100, maxPages = 1000, signal } = {},
) {
  const items = [];
  let lastStatus = 200;

  for (let page = 0; page < maxPages; page += 1) {
    if (signal?.aborted) {
      return {
        ok: false,
        status: 0,
        message: "The catalogue request was cancelled.",
        errorCode: "REQUEST_ABORTED",
      };
    }

    let result;
    try {
      result = await fetchPage(page, pageSize);
    } catch (error) {
      return {
        ok: false,
        status: 0,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch a catalogue page.",
        errorCode: "PRODUCT_PAGE_REQUEST_FAILED",
      };
    }

    if (!result.ok) {
      return result;
    }

    lastStatus = result.status;

    if (!result.data || !Array.isArray(result.data.content)) {
      return {
        ok: false,
        status: 500,
        message: "Backend returned an invalid product page.",
        errorCode: "PRODUCT_PAGE_INVALID_PAYLOAD",
      };
    }

    items.push(...result.data.content);

    const reportedTotalPages =
      Number.isInteger(result.data.totalPages) &&
      result.data.totalPages >= 0
        ? result.data.totalPages
        : undefined;

    const reportedTotalElements =
      Number.isInteger(result.data.totalElements) &&
      result.data.totalElements >= 0
        ? result.data.totalElements
        : undefined;

    const actualPageSize =
      Number.isInteger(result.data.size) && result.data.size > 0
        ? result.data.size
        : pageSize;

    const totalPages =
      reportedTotalPages ??
      (reportedTotalElements !== undefined
        ? Math.ceil(reportedTotalElements / actualPageSize)
        : undefined);

    if (totalPages !== undefined) {
      if (totalPages > maxPages) {
        return {
          ok: false,
          status: 500,
          message: `Catalogue exceeds the safe pagination limit of ${maxPages} pages.`,
          errorCode: "PRODUCT_PAGINATION_LIMIT_EXCEEDED",
        };
      }

      if (page + 1 >= totalPages) {
        return { ok: true, status: lastStatus, items };
      }
    } else if (result.data.content.length < pageSize) {
      return { ok: true, status: lastStatus, items };
    }
  }

  return {
    ok: false,
    status: 500,
    message: `Catalogue exceeds the safe pagination limit of ${maxPages} pages.`,
    errorCode: "PRODUCT_PAGINATION_LIMIT_EXCEEDED",
  };
}

/**
 * @template {{ id: string | number }} T
 * @param {T[]} products
 * @returns {T[]}
 */
export function dedupeProductsById(products) {
  return Array.from(
    new Map(products.map((product) => [String(product.id), product])).values(),
  );
}
