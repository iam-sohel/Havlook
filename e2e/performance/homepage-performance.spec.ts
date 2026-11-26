import { test, expect } from "@playwright/test";

type HomepageVitals = {
  fcp: number | null;
  lcp: number | null;
  cls: number;
  ttfb: number | null;
};

test("Homepage records Core Web Vitals and catalogue network performance", async ({
  page,
}) => {
  const apiResponses: Array<{ url: string; status: number; durationMs: number }> = [];
  const failedApiRequests: string[] = [];
  const pageErrors: string[] = [];
  const apiStartedAt = new Map<string, number>();

  page.on("request", (request) => {
    if (request.url().includes("/api/")) {
      apiStartedAt.set(request.url(), Date.now());
    }
  });

  page.on("response", (response) => {
    if (!response.url().includes("/api/")) return;

    const startedAt = apiStartedAt.get(response.url());
    apiResponses.push({
      url: response.url(),
      status: response.status(),
      durationMs: startedAt === undefined ? -1 : Date.now() - startedAt,
    });
  });

  page.on("requestfailed", (request) => {
    if (request.url().includes("/api/")) {
      failedApiRequests.push(
        `${request.url()} — ${request.failure()?.errorText ?? "request failed"}`,
      );
    }
  });

  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    const metrics = {
      lcp: null as number | null,
      cls: 0,
    };

    (window as Window & { __havlookVitals?: typeof metrics }).__havlookVitals =
      metrics;

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
          };
          if (!layoutShift.hadRecentInput) {
            metrics.cls += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // Unsupported PerformanceObserver entry types are reported as null/zero.
    }
  });

  const response = await page.goto("/", { waitUntil: "load" });
  expect(response, "Homepage returned no document response").not.toBeNull();
  expect(response!.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();

  // Allow late-loading hero imagery and layout shifts to be observed.
  await page.waitForTimeout(1500);

  const vitals = await page.evaluate((): HomepageVitals => {
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    const fcpEntry = performance
      .getEntriesByName("first-contentful-paint")
      .at(0);
    const stored = (
      window as Window & {
        __havlookVitals?: { lcp: number | null; cls: number };
      }
    ).__havlookVitals;

    return {
      fcp: fcpEntry?.startTime ?? null,
      lcp: stored?.lcp ?? null,
      cls: stored?.cls ?? 0,
      ttfb: navigation
        ? navigation.responseStart - navigation.requestStart
        : null,
    };
  });

  console.info("[HAVLOOK_BROWSER_PERFORMANCE]", {
    url: page.url(),
    vitals,
    apiResponses,
    failedApiRequests,
    pageErrors,
  });

  expect(pageErrors, "Uncaught browser exceptions").toEqual([]);
  expect(failedApiRequests, "Failed API requests").toEqual([]);
  expect(
    apiResponses.filter((item) => item.status >= 500),
    "API responses with server errors",
  ).toEqual([]);

  // Broad regression guards; detailed timings are retained in the test output.
  expect(vitals.fcp, "FCP was not recorded").not.toBeNull();
  expect(vitals.lcp, "LCP was not recorded").not.toBeNull();
  expect(vitals.ttfb, "Navigation TTFB was not recorded").not.toBeNull();
  expect(vitals.cls, "CLS regression guard").toBeLessThanOrEqual(0.25);
  expect(vitals.lcp!, "LCP regression guard (5 seconds)").toBeLessThan(5000);
  expect(vitals.ttfb!, "TTFB regression guard (2 seconds)").toBeLessThan(2000);
});
