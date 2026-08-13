import { test, expect } from "@playwright/test";

const EMAIL = process.env.PLAYWRIGHT_STAFF_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_STAFF_PASSWORD;

test.skip(!EMAIL || !PASSWORD, "Set PLAYWRIGHT_STAFF_EMAIL/PLAYWRIGHT_STAFF_PASSWORD to run this test.");

// §13 Phase 9: "log in -> POS sale -> verify stock decrement".
test("staff logs in, rings up a POS sale, and stock decrements", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL!);
  await page.getByLabel("Password").fill(PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });

  await page.goto("/admin/pos");
  const firstProductTile = page.locator("main button").filter({ hasText: /on hand/ }).first();
  await expect(firstProductTile).toBeVisible({ timeout: 15_000 });
  const productName = (await firstProductTile.locator("p").first().textContent())?.trim();

  const onHandText = await firstProductTile.getByText(/on hand/).textContent();
  const onHandBefore = Number(onHandText?.match(/\d+/)?.[0] ?? "0");

  await firstProductTile.click();
  await page.getByPlaceholder("Amount tendered (PHP)").fill("100000");
  await page.getByRole("button", { name: /^Charge/ }).click();

  await expect(page.getByRole("heading", { name: "Sale completed" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/admin/inventory");
  await page.getByPlaceholder("Search SKU or name...").fill(productName ?? "");
  const row = page.locator("tr", { hasText: productName ?? "" }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  const onHandAfterText = await row.locator("td").nth(2).textContent();
  const onHandAfter = Number(onHandAfterText?.trim() ?? "0");

  expect(onHandAfter).toBe(onHandBefore - 1);
});
