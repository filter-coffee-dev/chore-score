const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('sign-up to sign-in back link works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });

    await page.getByText('Already have an account? Sign in →').click();
    await expect(page.getByText('Welcome back! 👋').first()).toBeVisible({ timeout: 5000 });
  });

  test('sign-in to sign-up ← Back works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText('← Back')).toBeVisible({ timeout: 5000 });
    await page.getByText('← Back').click();
    await expect(page.getByText('Welcome back! 👋').first()).toBeVisible({ timeout: 5000 });
  });

  test('bottom tab bar tabs are all present after sign-in', async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) return test.skip();

    await page.goto('/');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByText("Let's Go! 🚀").click();

    await expect(page.getByText('Home').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Chores')).toBeVisible();
    await expect(page.getByText('History')).toBeVisible();
    await expect(page.getByText('Badges')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });
});
