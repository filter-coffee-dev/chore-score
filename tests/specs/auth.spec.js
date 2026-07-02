const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('shows splash screen on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Make chores fun.').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Create an Account')).toBeVisible();
    await expect(page.getByText('Sign in')).toBeVisible();
  });

  test('navigates to sign-up screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Let's Do This! 💪")).toBeVisible();
  });

  test('sign-up form validates required fields with alert', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText("Let's Do This! 💪")).toBeVisible({ timeout: 5000 });

    // Register handler BEFORE click — alert fires synchronously, blocking the CDP click response.
    let dialogMessage = '';
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByText("Let's Do This! 💪").click();
    expect(dialogMessage).toMatch(/fill/i);
  });

  test('shows error alert on bad credentials', async ({ page }) => {
    await page.goto('/');
    // Tap "Sign in" link to reveal the form
    await page.getByText('Sign in').click();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('you@example.com').fill('nobody@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByText('Sign In').click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  test('sign-up back button returns to sign-in', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });
    await page.getByText('← Back').click();
    await expect(page.getByText('Make chores fun.').first()).toBeVisible({ timeout: 5000 });
  });

  test('sign-in back button returns to splash', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sign in').click();
    await expect(page.getByText('Welcome back!')).toBeVisible({ timeout: 5000 });
    await page.getByText('← Back').click();
    await expect(page.getByText('Make chores fun.').first()).toBeVisible({ timeout: 5000 });
  });

  test('sign-up with valid data navigates to confirm screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create an Account').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('What should we call you?').fill('Test Person');
    await page.getByPlaceholder('you@example.com').fill(`test+${Date.now()}@mailinator.com`);
    await page.getByPlaceholder('8+ characters').fill('TestPass123');

    await page.getByText("Let's Do This! 💪").click();
    await expect(page.getByText(/confirm|verification|check your|code/i).first()).toBeVisible({ timeout: 15000 });
  });
});
