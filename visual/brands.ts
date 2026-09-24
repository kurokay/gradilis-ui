/**
 * Les deux marques du banc de rendu visuel — jamais publiées (voir README).
 *
 * Polices : le socle réfère par défaut Inter (`DEFAULT_FONTS` de `../src/theme.ts`),
 * absente de cette machine (ni police système, ni `@fontsource` en dépendance —
 * `fc-list` et `node_modules/@fontsource` vérifiés vides). La pile par défaut
 * retomberait donc sur `system-ui`, dont le rendu dépend de la machine de CI/dev.
 * On fixe ici une pile EXPLICITE et INSTALLÉE (Liberation, famille métrique-
 * compatible d'Arial/Courier, présente via `fontconfig` sur cette machine) pour
 * que les captures soient reproductibles d'un run à l'autre ICI — mais **les
 * références PNG restent dépendantes des polices installées sur la machine qui
 * les régénère** (voir README § « Tests visuels du canon »).
 */
import type { MantineColorsTuple } from '@mantine/core';
import { createGradilisTheme, type GradilisThemeTokens } from '../src/theme.js';
import { gradilisGreen, gradilisLime, gradilisBrown } from '../src/tokens/pepiniere.js';

const FONTS_DETERMINISTES = {
  body: '"Liberation Sans", Arial, sans-serif',
  monospace: '"Liberation Mono", "Courier New", monospace',
  headings: '"Liberation Sans", Arial, sans-serif',
} as const;

/** Marque « Pépinière » — la vraie identité du socle (`tokens/pepiniere.ts`). */
const tokensPepiniere: GradilisThemeTokens = {
  primaryColor: 'gradilisGreen',
  brandRamps: { gradilisGreen, gradilisLime, gradilisBrown },
  fonts: FONTS_DETERMINISTES,
};

/**
 * Marque « factice » — rampe olive INVENTÉE pour ce banc (mêmes valeurs que
 * `themeOlive` de `src/canon/canon.test.tsx`, patron déjà éprouvé côté tests
 * unitaires), sous un nom NEUTRE (`brandFactice`, pas `ampOlive`) : `CanonColors`
 * affiche la clé de la primaire à l'écran, donc dans les PNG — un nom d'app
 * réelle n'a rien à y faire, même fictif-le-nom-d'une-vraie-app.
 */
const oliveFactice: MantineColorsTuple = [
  '#f6f6f1', '#e9e7d8', '#d7d3b8', '#c6c3b2', '#b4af8d',
  '#a29b68', '#8f8750', '#555232', '#43401f', '#302e12',
];

const tokensFactice: GradilisThemeTokens = {
  primaryColor: 'brandFactice',
  brandRamps: { brandFactice: oliveFactice },
  fonts: FONTS_DETERMINISTES,
};

export const THEMES = {
  pepiniere: createGradilisTheme(tokensPepiniere),
  factice: createGradilisTheme(tokensFactice),
} as const;

export type MarqueId = keyof typeof THEMES;
