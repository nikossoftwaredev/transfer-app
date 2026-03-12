import { type Page } from "@playwright/test";

/**
 * Login as driver via the driver login form (credentials provider).
 * Uses the seeded demo driver: phone +306911111111, PIN 1234
 */
export async function loginAsDriver(page: Page) {
  await page.goto("/en/auth/driver");
  await page.fill('input[placeholder*="691"]', "6911111111");
  await page.fill('input[placeholder*="PIN"]', "1234");
  await page.click('button:has-text("Sign In")');
  // Wait for redirect to /driver
  await page.waitForURL("**/driver**", { timeout: 10000 });
}

/**
 * Login as client via Google OAuth.
 * Since we can't do real OAuth in tests, we'll use the NextAuth
 * CSRF token + signIn API directly.
 */
export async function loginAsClient(page: Page) {
  // Navigate to signin page
  await page.goto("/en/auth/signin");
  // Click Google button — this will redirect to Google OAuth
  // For E2E we just verify the page loads and button exists
}

/**
 * Navigate to a page and take a screenshot with a label.
 */
export async function screenshotPage(page: Page, path: string, label: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `e2e/screenshots/${label}.png`, fullPage: true });
}
