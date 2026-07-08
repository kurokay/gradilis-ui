import type { MantineColorsTuple } from '@mantine/core';

/**
 * Rampes de couleur SOCLE — agnostiques de marque (GUIDELINES §3.2).
 *
 * Ce fichier ne contient que les rampes partagées par TOUTES les marques : le
 * neutre `gradilisGray` et les 4 rampes SÉMANTIQUES (invariantes entre magasin
 * et pépinière — vérifié au diff). Les rampes d'identité (vert/lime/brun,
 * olive/terracotta/…) vivent dans les tokens de chaque app (`tokens/*.ts`).
 *
 * Index 0 (clair) → 9 (foncé). Seul ce fichier (avec `theme.ts` et `tokens/*`)
 * est autorisé à contenir des hex. Contraste WCAG cible : AA (§3.7).
 */

/** Neutres. Surfaces, textes secondaires, bordures. */
export const gradilisGray: MantineColorsTuple = [
  '#EFEDED', '#E5E4E3', '#D4D3D2', '#B7B6B6', '#969494',
  '#777575', '#5C5B5A', '#474545', '#31302F', '#201F1F',
];

/**
 * Sémantique succès — vert (ancre §3.2 #2B8A3E ; rampe vendorée du magasin,
 * ancre assombrie en idx9 #277A37 car #2B8A3E donnait 4,37:1 < AA).
 */
export const semSuccess: MantineColorsTuple = [
  '#f0faf2', '#dff2e3', '#bae5c2', '#92d89f', '#71cc81',
  '#5dc56e', '#51c263', '#42ab53', '#389848', '#277a37',
];

/** Sémantique alerte — ambre (ancre §3.2 #E8930C en idx7). Texte foncé requis (autoContrast). */
export const semWarning: MantineColorsTuple = [
  '#fff6e3', '#feeccf', '#fad7a0', '#f7c26d', '#f4af43',
  '#f3a328', '#f29d18', '#e8930c', '#c07902', '#a76700',
];

/**
 * Sémantique erreur — terracotta, pont Au Mas Paysan (ancre §3.2 #BA492C en
 * idx7, blanc dessus = 5,15:1 ✓). Rampe vendorée du magasin (`ampBrique`).
 */
export const semError: MantineColorsTuple = [
  '#ffefe9', '#f9ded7', '#ecbbaf', '#e09683', '#d7775e',
  '#d16246', '#cf5839', '#ba492c', '#a43f25', '#90331c',
];

/** Sémantique info — ardoise (ancre §3.2 #4C5763 en idx9, 7,37:1 ✓). */
export const semInfo: MantineColorsTuple = [
  '#f3f5f6', '#e7e7e7', '#cccccc', '#aeb0b3', '#95999e',
  '#848a91', '#7b838c', '#687079', '#5b646d', '#4c5763',
];
