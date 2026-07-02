const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('sign-up to sign-in back link works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });

    await page.getByText(/already have an account/i).click();
    await expect(page.getByText('Make chores fun.').first()).toBeVisible({ timeout: 5000 });
  });

  test('sign-in to sign-up ← Back works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText('← Back')).toBeVisible({ timeout: 5000 });
    await page.getByText('← Back').click();
    await expect(page.getByText('Make chores fun.').first()).toBeVisible({ timeout: 5000 });
  });

  test('bottom tab bar tabs are all present after sign-in', async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (!email || !password) return test.skip();

    await page.goto('/');
    await page.getByText('Sign in').click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByText('Sign In').click();

    await expect(page.getByText('Home').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Chores')).toBeVisible();
    await expect(page.getByText('Stats')).toBeVisible();
    await expect(page.getByText('Badges')).toBeVisible();
    await expect(page.getByText('Us')).toBeVisible();
  });
});
