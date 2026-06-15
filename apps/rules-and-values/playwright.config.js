// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// The app is a single static file with no build step. Tests load it via a
// file:// URL (see tests/civics.spec.js) and drive the OFFLINE engine, so the
// whole harness runs with no network and no server — exactly the graceful-
// degradation guarantee the app itself makes (SPEC / PLAN assertion 3).
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
