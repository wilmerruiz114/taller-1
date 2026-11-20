const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:8790',
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: 'node tests/serve.mjs',
    url: 'http://127.0.0.1:8790',
    reuseExistingServer: false,
  },
});
