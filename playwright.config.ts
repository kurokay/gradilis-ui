import { defineConfig, devices } from '@playwright/test';

/**
 * Config des tests visuels du canon (`visual/canon.spec.ts`) — voir
 * README.md § « Tests visuels du canon ». Hors de `npm test` (vitest,
 * `include: src/**`) : lancé séparément via `npm run test:visual`.
 *
 * Environnement de cette machine (voir README § limites) :
 *   - Chromium téléchargé par Playwright absent, bac à sable Chrome cassé sous
 *     ce montage → Chrome SYSTÈME (`executablePath`), sandbox désactivé.
 *   - `workers: 1` : un seul serveur Vite, un seul navigateur — la
 *     reproductibilité prime sur la vitesse pour ce filet.
 */
const PORT = 5183;

export default defineConfig({
  testDir: './visual',
  testMatch: '**/*.spec.ts',
  snapshotDir: './visual/__screenshots__',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    launchOptions: {
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--force-prefers-reduced-motion'],
    },
  },
  expect: {
    toHaveScreenshot: {
      // Seuil FAIBLE mais non nul : un écart de rendu de sous-pixel entre deux
      // runs identiques (antialiasing) doit passer ; un changement sémantique
      // de teinte (quelques badges/alertes) ne doit PAS passer. Mesuré sur deux
      // runs consécutifs identiques avant de fixer ces valeurs (voir rapport de
      // livraison) : bruit nul sur cette machine, donc pas de marge accordée par
      // confort — seulement celle qui protège d'un faux rouge d'antialiasing.
      maxDiffPixels: 24,
      threshold: 0.05,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run visual:dev -- --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
