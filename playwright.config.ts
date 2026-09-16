import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '.env');

// The root file selects the local environment; CI receives its variables from the workflow.
dotenv.config({ path: rootEnvPath });

if (!process.env.CI) {
  const environmentName = process.env.PLAYWRIGHT_ENV?.trim();

  if (!environmentName || !/^[a-zA-Z0-9_-]+$/.test(environmentName)) {
    throw new Error('PLAYWRIGHT_ENV must contain a valid local environment name.');
  }

  const environmentPath = path.resolve(__dirname, 'environments', `${environmentName}.env`);

  if (!fs.existsSync(environmentPath)) {
    throw new Error(`Environment file not found: ${environmentPath}`);
  }

  dotenv.config({ path: environmentPath, override: true });
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({

  // Tempo máximo para cada teste completo (3o segundo é o padrão)
  timeout: 60_000,

  // Tempo máximo para assertions (toBeVisible(), toHaveText()) 5 segundos
  expect: {
    timeout: 5_000 // não vale a pena aumentar porque o teste pode ficar lento no tempo de execução, vale a pena usar o time explicito
  },


  testDir: './playwright/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    // Optional, enables native HTML upload
    ['html', { outputDir: './playwright-report' }],
    // Mandatory reporter for JSON results
    ['json', { outputFile: './playwright-report/report.json' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',

    // Tempo máximo para ações interativas como click(), fill()
    // Quando o valor é 0, herda o limite do timeout geral do teste
    actionTimeout: 5_000,

    // Tempo máximo para navegações como goto(), waitForURL()
    // Quando o valor é 0, herda o limite do timeout geral do teste
    navigationTimeout: 10_000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests outside CI */
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'yarn dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
        },
      }),
});
