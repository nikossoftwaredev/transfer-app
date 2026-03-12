import { test } from "@playwright/test";

test.describe("Screenshot all driver screens", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/driver");
    await page.fill('input[placeholder*="691"]', "6911111111");
    await page.fill('input[placeholder*="PIN"]', "1234");
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/driver**", { timeout: 15000 });
  });

  test("screenshot driver dashboard", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/driver-dashboard.png", fullPage: true });
  });

  test("screenshot driver trips", async ({ page }) => {
    await page.click("text=Trips");
    await page.waitForURL("**/driver/trips**");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/driver-trips.png", fullPage: true });
  });

  test("screenshot driver profile", async ({ page }) => {
    await page.click("text=Profile");
    await page.waitForURL("**/driver/profile**");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/driver-profile.png", fullPage: true });
  });
});
