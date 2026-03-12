import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("landing page loads with hero and nav", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/TransferGR/i);

    // Hero text
    await expect(page.locator("text=Premium Transfer Services")).toBeVisible();

    // Nav items
    await expect(page.locator("text=Book Now").first()).toBeVisible();

    // Book Your Transfer CTA
    await expect(page.locator("text=Book Your Transfer").first()).toBeVisible();
  });

  test("landing page in Greek locale", async ({ page }) => {
    await page.goto("/el");
    await page.waitForLoadState("networkidle");
    // Should load without error
    expect(page.url()).toContain("/el");
  });

  test("signin page shows Google OAuth button and driver login link", async ({ page }) => {
    await page.goto("/en/auth/signin");

    // Google button
    await expect(page.locator("text=Continue with Google")).toBeVisible();

    // Driver login link
    await expect(page.locator("text=Sign in as Driver")).toBeVisible();

    // Terms text
    await expect(page.locator("text=Terms of Service")).toBeVisible();
  });

  test("clicking 'Sign in as Driver' navigates to driver login", async ({ page }) => {
    await page.goto("/en/auth/signin");
    await page.click("text=Sign in as Driver");
    await page.waitForURL("**/auth/driver**");

    // Phone input
    await expect(page.locator("text=Phone Number").first()).toBeVisible();

    // PIN input
    await expect(page.locator("text=PIN").first()).toBeVisible();

    // Sign In button
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

    // Back link
    await expect(page.locator("text=Back to main login")).toBeVisible();
  });

  test("driver login page has +30 prefix", async ({ page }) => {
    await page.goto("/en/auth/driver");
    await expect(page.locator("text=+30")).toBeVisible();
  });

  test("book page redirects to signin when not logged in", async ({ page }) => {
    await page.goto("/en/book");
    // Should redirect to signin
    await page.waitForURL("**/auth/signin**", { timeout: 10000 });
  });

  test("driver page redirects to signin when not logged in", async ({ page }) => {
    await page.goto("/en/driver");
    // Should redirect to signin
    await page.waitForURL("**/auth/signin**", { timeout: 10000 });
  });

  test("admin page redirects to signin when not logged in", async ({ page }) => {
    await page.goto("/en/admin");
    // Should redirect to signin
    await page.waitForURL("**/auth/signin**", { timeout: 10000 });
  });

  test("org page redirects to signin when not logged in", async ({ page }) => {
    await page.goto("/en/org");
    // Should redirect to signin
    await page.waitForURL("**/auth/signin**", { timeout: 10000 });
  });
});
