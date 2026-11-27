import { test, expect } from "@playwright/test";

const customerRoutes = [
  { name: "Homepage", path: "/" },
  { name: "Products", path: "/products" },
  { name: "Login", path: "/login" },
  { name: "Search", path: "/search?q=havlook" },
  { name: "Cart", path: "/cart" },
  { name: "Wishlist", path: "/wishlist" },
];

for (const route of customerRoutes) {
  test(`${route.name} route loads successfully`, async ({ page }) => {
    const response = await page.goto(route.path);

    expect(response, `${route.path} returned no document response`)
      .not.toBeNull();

    expect(response!.status(), `${route.path} HTTP status`)
      .toBe(200);

    await expect(page.locator("body")).toBeVisible();
  });
}

test("Homepage has correct document title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/HavLook/i);
});

test("Homepage has no uncaught browser exceptions", async ({ page }) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});

test("Customer homepage has no horizontal overflow", async ({ page }) => {
  const widths = [360, 375, 390, 440, 768, 1024, 1440];

  for (const width of widths) {
    await page.setViewportSize({
      width,
      height: 900,
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));

    expect(
      dimensions.document,
      `Document overflow at ${width}px: ${JSON.stringify(dimensions)}`
    ).toBeLessThanOrEqual(width + 1);

    expect(
      dimensions.body,
      `Body overflow at ${width}px: ${JSON.stringify(dimensions)}`
    ).toBeLessThanOrEqual(width + 1);
  }
});
