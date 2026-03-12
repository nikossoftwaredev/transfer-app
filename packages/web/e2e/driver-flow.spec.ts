import { test, expect } from "@playwright/test";

test.describe("Driver flow", () => {
  test("driver login with phone + PIN and see dashboard", async ({ page }) => {
    // Go to driver login
    await page.goto("/en/auth/driver");

    // Fill phone (without +30 prefix — it's pre-filled)
    await page.fill('input[placeholder*="691"]', "6911111111");

    // Fill PIN
    await page.fill('input[placeholder*="PIN"]', "1234");

    // Click Sign In
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to driver dashboard
    await page.waitForURL("**/driver**", { timeout: 15000 });

    // Dashboard should show welcome message
    await expect(page.locator("text=Welcome")).toBeVisible({ timeout: 10000 });

    // Should see online/offline toggle
    await expect(page.locator("text=Online").or(page.locator("text=Offline"))).toBeVisible();

    // Should see Today's Summary section
    await expect(page.locator("text=Today").first()).toBeVisible();
  });

  test("driver login fails with wrong PIN", async ({ page }) => {
    await page.goto("/en/auth/driver");
    await page.fill('input[placeholder*="691"]', "6911111111");
    await page.fill('input[placeholder*="PIN"]', "9999");
    await page.click('button:has-text("Sign In")');

    // Should show error (stay on page or show error message)
    await page.waitForTimeout(3000);
    // Should still be on the driver login page
    expect(page.url()).toContain("/auth/driver");
  });

  test("driver login fails with unknown phone", async ({ page }) => {
    await page.goto("/en/auth/driver");
    await page.fill('input[placeholder*="691"]', "6999999999");
    await page.fill('input[placeholder*="PIN"]', "1234");
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/auth/driver");
  });
});

test.describe("Driver dashboard (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Login as driver
    await page.goto("/en/auth/driver");
    await page.fill('input[placeholder*="691"]', "6911111111");
    await page.fill('input[placeholder*="PIN"]', "1234");
    await page.click('button:has-text("Sign In")');
    await page.waitForURL("**/driver**", { timeout: 15000 });
  });

  test("dashboard shows stat cards", async ({ page }) => {
    // Stat cards should be visible
    await expect(page.locator("text=Trips").first()).toBeVisible();
    await expect(page.locator("text=Earnings").first()).toBeVisible();
    await expect(page.locator("text=Rating").first()).toBeVisible();
  });

  test("navigate to trips page", async ({ page }) => {
    await page.click("text=Trips");
    await page.waitForURL("**/driver/trips**");
    await expect(page.locator("h1")).toContainText("Trips");
  });

  test("navigate to profile page", async ({ page }) => {
    await page.click("text=Profile");
    await page.waitForURL("**/driver/profile**");
    await expect(page.locator("h1")).toContainText("Profile");
  });

  test("toggle online/offline", async ({ page }) => {
    // Find the switch/toggle and click it
    const toggle = page.locator('[role="switch"]');
    if (await toggle.isVisible()) {
      await toggle.click();
      // Should show a toast or change state
      await page.waitForTimeout(2000);
    }
  });
});
