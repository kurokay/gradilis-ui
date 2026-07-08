/**
 * App-canon Gradilis Pépinière (M.2, DM-2) — référence visuelle inspectable de
 * la charte (GUIDELINES §9). Monté par la SPA sous `/app/canon` : CanonAppShell
 * est la route layout, les autres sections se rendent dans son Outlet.
 * « Comparer à l'app-canon » = ouvrir `/app/canon` et confronter, pas deviner.
 *
 * Adapté de `gradilis_magasin/frontend/src/pages/Canon.tsx` (DM-7), re-tokenisé
 * Pépinière et éclaté en sections routées (le canon démontre aussi l'AppShell).
 * Section « Plateau spatial » ajoutée en K-4 (châssis `@gradilis/ui/spatial`).
 */
export { CanonAppShell } from './CanonAppShell.js';
export { CanonTable } from './CanonTable.js';
export { CanonForm } from './CanonForm.js';
export { CanonKPI } from './CanonKPI.js';
export { CanonStates } from './CanonStates.js';
export { CanonColors, type RampeDoc, type CanonColorsProps } from './CanonColors.js';
export { CanonSpatial } from './CanonSpatial.js';
