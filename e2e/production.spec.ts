import { expect, test } from "@playwright/test";

test("creates a synthetic appointment through the production UI", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ENTER SAFE DEMO" }).click();
  await page.getByPlaceholder("Patient A-104").fill(`E2E-${Date.now()}`);
  const future = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  await page.locator('input[type="datetime-local"]').fill(future);
  await page.getByRole("button", { name: "SAVE REQUEST" }).click();
  await expect(page.getByText("Synthetic appointment request saved.")).toBeVisible();
});
