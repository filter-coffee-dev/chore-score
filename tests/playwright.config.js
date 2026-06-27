const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    // Mobile viewport — app is designed for mobile
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
});
