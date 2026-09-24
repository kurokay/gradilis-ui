import { defineConfig } from '@playwright/test';

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
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
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
      // Seuil FAIBLE mais non nul — valeurs fixées APRÈS mesure, pas avant
      // (voir rapport de livraison pour le détail) : `maxDiffPixels: 0,
      // threshold: 0` sur deux runs consécutifs identiques est déjà VERT sur
      // cette machine (bruit d'antialiasing nul, mesuré). La marge ci-dessous
      // n'est donc PAS un confort accordé au bruit constaté ici — c'est une
      // tolérance de sécurité pour une machine de CI/dev moins déterministe
      // (police de secours différente, sous-pixel GPU logiciel) sans laisser
      // passer un changement sémantique (voir la mutation ciblée du rapport).
      maxDiffPixels: 24,
      threshold: 0.05,
      animations: 'disabled',
    },
  },
  projects: [
    // Pas de `devices['Desktop Chrome']` : son `use` (UA, viewport 1280×720…)
    // ÉCRASERAIT celui du bloc `use` ci-dessus (le `use` de projet prime sur le
    // `use` racine) — constaté : la capture rendait 1280×720, pas les 1280×900
    // déclarés. Un seul projet, la config racine suffit.
    { name: 'chromium' },
  ],
  webServer: {
    command: `npm run visual:dev -- --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
