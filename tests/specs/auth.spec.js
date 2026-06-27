const { test, expect } = require('@playwright/test');

test.describe('Authentication', () => {
  test('shows sign-in screen on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome back! 👋').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Join the chaos →')).toBeVisible();
  });

  test('navigates to sign-up screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Let's Do This! 💪")).toBeVisible();
  });

  test('sign-up form validates required fields with alert', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText("Let's Do This! 💪")).toBeVisible({ timeout: 5000 });

    // Register handler BEFORE click — alert fires synchronously, blocking the CDP click response.
    // page.once('dialog') auto-dismisses during the frozen click so the action can complete.
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
    await page.getByPlaceholder('Email').fill('nobody@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByText("Let's Go! 🚀").click();
    const dialog = await dialogPromise;
    // Title is "Wrong email or password" or "Oops!" — message has Cognito detail
    expect(dialog.message()).toBeTruthy();
    await dialog.dismiss();
  });

  test('sign-up back button returns to sign-in', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });
    await page.getByText('← Back').click();
    // Use first() — React Navigation on web keeps prior screens mounted
    await expect(page.getByText('Welcome back! 👋').first()).toBeVisible({ timeout: 5000 });
  });

  test('sign-up with valid data navigates to confirm screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join the chaos →').click();
    await expect(page.getByText('Create Account')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('What should we call you?').fill('Test Person');
    await page.getByPlaceholder('you@example.com').fill(`test+${Date.now()}@mailinator.com`);
    await page.getByPlaceholder('8+ characters').fill('TestPass123');

    await page.getByText("Let's Do This! 💪").click();
    // Should navigate to confirm email screen
    await expect(page.getByText(/confirm|verification|check your|code/i).first()).toBeVisible({ timeout: 15000 });
  });
});
