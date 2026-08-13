import { test, expect } from "@playwright/test";

// §13 Phase 9: "browse -> book -> confirm". Read-only against seed data — no login needed.
test("browse catalog and complete a booking", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /high-wattage lighting/i })).toBeVisible();

  await page.goto("/products");
  await page.getByRole("link").filter({ hasText: /./ }).first().waitFor();

  await page.goto("/book");
  await expect(page.getByRole("heading", { name: "Book Installation" })).toBeVisible();

  // Step 1: service & parts.
  await page.locator('input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2: vehicle.
  await page.getByLabel("Make").fill("Toyota");
  await page.getByLabel("Model").fill("Vios");
  await page.getByLabel("Year").fill("2021");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3: schedule — wait for available dates to load, pick the first date and time.
  const dateButtons = page.locator("button").filter({ hasText: /^[A-Z][a-z]{2} \d/ });
  await expect(dateButtons.first()).toBeVisible({ timeout: 15_000 });
  await dateButtons.first().click();

  const timeButtons = page.locator("button").filter({ hasText: /^\d{1,2}:\d{2}/ });
  await expect(timeButtons.first()).toBeVisible({ timeout: 15_000 });
  await timeButtons.first().click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4: contact & confirm.
  await page.getByLabel("Name").fill("Playwright Test User");
  await page.getByLabel("Phone").fill("09171234567");
  await page.getByRole("button", { name: "Confirm booking" }).click();

  await expect(page.getByRole("heading", { name: "Booking confirmed" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^BK-\d{8}-\d{4}$/)).toBeVisible();
});
