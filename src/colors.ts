import type { MantineColorsTuple } from '@mantine/core';

/**
 * Rampes de couleur — Gradilis Pépinière (GUIDELINES UI-UX GRADILIS §3.2).
 *
 * Index 0 (clair) → 9 (foncé). Les 4 rampes de marque sont recopiées
 * LITTÉRALEMENT depuis les guidelines §3.2 (source de vérité — contrôle diff
 * manuel à chaque modification, ne jamais régénérer sans mettre à jour le doc).
 * Les rampes sémantiques sont vendorées du socle `gradilis_magasin/packages/ui`
 * (DM-7) : leurs ancres coïncident avec celles du §3.2.
 *
 * Seul ce fichier (avec `theme.ts`) est autorisé à contenir des hex (lint M.4).
 * Contrastes WCAG cible : AA — texte normal ≥ 4,5:1 ; large/composants ≥ 3:1 (§3.7).
 */

/** Primaire / action. Identité idx6 (#008D36) ; bouton plein idx7 (#00752D, blanc dessus = 5,86:1 ✓ AA). */
export const gradilisGreen: MantineColorsTuple = [
  '#EDF7F1', '#C6E5D2', '#9ED4B3', '#77C293', '#4FB074',
  '#289F55', '#008D36', '#00752D', '#005C23', '#00441A',
];

/** Accent / signature. Highlights, séries de graphes, déco — JAMAIS texte ni fond de bouton (idx5 sur blanc = 2,09:1). */
export const gradilisLime: MantineColorsTuple = [
  '#F8FBF0', '#E4EFC9', '#D1E4A2', '#BDD97A', '#AACD53',
  '#96C22C', '#82A926', '#6F9021', '#5C761B', '#485D15',
];

/** Neutre chaud. Titres, libellés (idx7 sur blanc = 7,70:1 ✓). */
export const gradilisBrown: MantineColorsTuple = [
  '#F4F3F2', '#E0DBD9', '#CBC4C1', '#B7ACA8', '#A2958F',
  '#8E7D76', '#79665E', '#654E45', '#4B3A33', '#302521',
];

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
