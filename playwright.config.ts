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
      // Les deux réglages gardent des rôles DISTINCTS, pas une seule marge :
      //   - `threshold` (delta de couleur pixel-à-pixel, formule YIQ de
      //     pixelmatch) absorbe un décalage de TEINTE étalé sur beaucoup de
      //     pixels — exactement la forme d'une régression de nuance sémantique.
      //     Trop haut, il la masque : mesuré à `threshold: 0` (aucune marge),
      //     `maxDiffPixels: 24` conservé, deux runs consécutifs identiques
      //     restent VERTS sur cette machine (bruit de teinte nul) — ce n'est
      //     donc pas un confort accordé à du bruit constaté. Fixé à `0.01`
      //     (pas `0.05`, essayé puis rejeté : masquait un décalage de ~8
      //     valeurs RGB sur un FOND de badge en schéma sombre — voir la
      //     contre-épreuve `succes[9]` du rapport de livraison, qui échoue
      //     bien aux DEUX schémas à `0.01`, clair ET sombre, le `light`
      //     variant lisant `succes[9]` des deux côtés : texte en clair,
      //     fond assombri en sombre — `get-css-color-variables.mjs`).
      //   - `maxDiffPixels` absorbe un ÉCART LOCALISÉ sur peu de pixels —
      //     l'antialiasing d'un bord, pas une régression de fond.
      maxDiffPixels: 24,
      threshold: 0.01,
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
