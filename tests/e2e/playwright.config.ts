import { defineConfig } from '@playwright/test'
const launchOptions = process.env.C01_E2E_RUN_DIR ? require('./runner-policy.cjs').browserOptions(require('./run-monitor.cjs').readPolicy()) : undefined
export default defineConfig({
  captureGitInfo: { commit: false, diff: false },
  testDir: '.', testMatch: '**/*.spec.ts', globalSetup: './global-setup.ts',
  fullyParallel: false, workers: 1, retries: 0, maxFailures: 1,
  timeout: 45_000, reporter: [['./reporter.ts']], outputDir: '../../../aibeat-c01-e2e-artifacts',
  use: { launchOptions, baseURL: 'http://127.0.0.1:3101', browserName: 'chromium',
    serviceWorkers: 'block', trace: 'off', screenshot: 'off', video: 'off' },
  // No webServer: collecting cases must never launch Next or load application .env files.
})
