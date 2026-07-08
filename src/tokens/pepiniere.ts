import type { MantineColorsTuple } from '@mantine/core';
import type { GradilisThemeTokens } from '../theme.js';

/**
 * Tokens de MARQUE — Gradilis Pépinière (GUIDELINES §3.2).
 *
 * ⚠️ Résident TRANSITOIRE du socle. Ces rampes d'identité sont spécifiques à
 * l'app pépinière ; elles vivent ici le temps de l'extraction pour que le thème
 * de compat (`gradilisTheme`) et l'app-canon restent verts. À l'Étape 4, elles
 * seront relocalisées dans l'app pépinière, qui appellera `createGradilisTheme`
 * avec ses propres tokens — et ce fichier disparaîtra du socle.
 *
 * Index 0 (clair) → 9 (foncé). Recopiées LITTÉRALEMENT des guidelines §3.2.
 */

/** Primaire / action. Identité idx6 (#008D36) ; bouton plein idx7 (#00752D, blanc = 5,86:1 ✓ AA). */
export const gradilisGreen: MantineColorsTuple = [
  '#EDF7F1', '#C6E5D2', '#9ED4B3', '#77C293', '#4FB074',
  '#289F55', '#008D36', '#00752D', '#005C23', '#00441A',
];

/** Accent / signature. Highlights, séries de graphes, déco — JAMAIS texte ni fond de bouton (idx5 = 2,09:1). */
export const gradilisLime: MantineColorsTuple = [
  '#F8FBF0', '#E4EFC9', '#D1E4A2', '#BDD97A', '#AACD53',
  '#96C22C', '#82A926', '#6F9021', '#5C761B', '#485D15',
];

/** Neutre chaud. Titres, libellés (idx7 sur blanc = 7,70:1 ✓). */
export const gradilisBrown: MantineColorsTuple = [
  '#F4F3F2', '#E0DBD9', '#CBC4C1', '#B7ACA8', '#A2958F',
  '#8E7D76', '#79665E', '#654E45', '#4B3A33', '#302521',
];

/** Jeu de tokens pépinière prêt pour `createGradilisTheme` / `makeCssVars`. */
export const pepiniereTokens: GradilisThemeTokens = {
  primaryColor: 'gradilisGreen',
  brandRamps: { gradilisGreen, gradilisLime, gradilisBrown },
  fonts: {
    body: '"Inter Variable", Inter, "IBM Plex Sans", system-ui, -apple-system, sans-serif',
    monospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    headings: '"Inter Variable", Inter, system-ui, sans-serif',
  },
};
