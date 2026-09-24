import { expect, test } from '@playwright/test';

/**
 * Non-régression visuelle du canon (`src/canon/`) — voir README.md racine
 * § « Tests visuels du canon ». Une capture par section × marque × schéma
 * (patron du banc : `App.tsx`). Référence commitée sous
 * `visual/__screenshots__/canon.spec.ts/`.
 */
const SECTIONS = ['appshell', 'tableau', 'formulaire', 'kpi', 'etats', 'couleurs', 'spatial'] as const;
const MARQUES = ['pepiniere', 'factice'] as const;
const SCHEMAS = ['clair', 'sombre'] as const;

for (const section of SECTIONS) {
  for (const marque of MARQUES) {
    for (const schema of SCHEMAS) {
      test(`canon ${section} — ${marque} — ${schema}`, async ({ page }) => {
        await page.goto(`/?section=${section}&marque=${marque}&schema=${schema}`);
        // Le thème pose `forceColorScheme` lui-même ; on aligne aussi l'émulation
        // du navigateur pour que les `prefers-color-scheme` CSS hors thème (s'il
        // en existe) suivent la même valeur que la capture attendue.
        await page.emulateMedia({ colorScheme: schema === 'sombre' ? 'dark' : 'light' });
        await page.waitForSelector('body[data-ready="1"]', { state: 'attached', timeout: 15_000 });

        await expect(page).toHaveScreenshot(`${section}--${marque}--${schema}.png`, {
          fullPage: true,
        });
      });
    }
  }
}
