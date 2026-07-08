/**
 * @gradilis/ui — design system Gradilis, socle AGNOSTIQUE de marque.
 *
 * Thème via factory `createGradilisTheme(tokens)` + `makeCssVars(tokens, extras)`
 * (chaque app injecte ses rampes de marque et polices). Rampes socle : neutre
 * `gradilisGray` + sémantiques `succes/alerte/erreur/info`. Primitives : `Num`,
 * `PageBreadcrumb`, `FittedDataTable`, `notify`, `openConfirm`, hooks tables,
 * `useSaveShortcut`. Subpaths : `/format`, `/canon`, `/spatial`. Règles : DESIGN.md.
 */
export const GRADILIS_UI_VERSION = '0.2.0';

// Thème : factory agnostique (API cible).
export {
  createGradilisTheme,
  makeCssVars,
  type GradilisThemeTokens,
  type CssVarsExtras,
} from './theme.js';

// Rampes SOCLE (partagées par toutes les marques).
export {
  gradilisGray,
  semSuccess,
  semWarning,
  semError,
  semInfo,
} from './colors.js';

// Compat transitoire — thème pépinière prêt à l'emploi + rampes de marque.
// Relocalisés dans l'app pépinière à l'Étape 4 (cf. tokens/pepiniere.ts).
export {
  gradilisTheme,
  gradilisCssVars,
  gradilisGreen,
  gradilisLime,
  gradilisBrown,
} from './theme.js';

// Primitives vendorées du magasin (DM-7) — conventions playbook §4.
export { Num } from './components/Num.js';
export { PageBreadcrumb, type Crumb } from './components/PageBreadcrumb.js';
export { FittedDataTable } from './components/FittedDataTable.js';
export {
  notify,
  errorMessage,
  NOTIFICATIONS_PROVIDER_PROPS,
  type NotifyOptions,
} from './lib/notify.js';
export { openConfirm } from './lib/confirmModal.js';
export { useTablePrefs } from './hooks/useTablePrefs.js';
export { useTableAutoFit, type TableAutoFit } from './hooks/useTableAutoFit.js';
export { useAutoPageSize, computeAutoFit } from './hooks/useAutoPageSize.js';
export { useSaveShortcut } from './hooks/useSaveShortcut.js';
