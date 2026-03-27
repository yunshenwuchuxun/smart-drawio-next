import { test, expect } from '@playwright/test';

test.describe('Smart Drawio Next', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Smart Draw/i);
  });

  test('chat input is visible', async ({ page }) => {
    await page.goto('/');
    const chatArea = page.locator('textarea').first();
    await expect(chatArea).toBeVisible();
  });

  test('code editor panel is visible', async ({ page }) => {
    await page.goto('/');
    const editorPanel = page.locator('.monaco-editor').first();
    await expect(editorPanel).toBeVisible({ timeout: 10000 });
  });

  test('can type in chat input', async ({ page }) => {
    await page.goto('/');
    const chatInput = page.locator('textarea').first();
    await chatInput.fill('测试流程图');
    await expect(chatInput).toHaveValue('测试流程图');
  });
});
