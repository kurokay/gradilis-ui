/**
 * @gradilis/ui — design system Gradilis, socle AGNOSTIQUE de marque.
 *
 * Thème via factory `createGradilisTheme(tokens)` + `makeCssVars(tokens, extras)`
 * (chaque app injecte ses rampes de marque et polices). Rampes socle : neutre
 * `gradilisGray` + sémantiques `succes/alerte/erreur/info`. Primitives : `Num`,
 * `PageBreadcrumb`, `FittedDataTable`, `notify`, `openConfirm`, hooks tables,
 * `useSaveShortcut`. Subpaths : `/format`, `/canon`, `/spatial`. Règles : DESIGN.md.
 */
/**
 * ⚠️ À TENIR À JOUR avec le `package.json` — `npm version` ne touche PAS ce
 * fichier. Elle était restée à `'0.4.0'` jusqu'à la `0.6.4`, soit deux versions
 * de retard, sans que rien ne le signale ; un consommateur qui journalise la
 * version pour diagnostiquer se serait fait envoyer sur la mauvaise piste.
 * Défendu depuis par `src/version.test.ts` (y lire pourquoi ce n'est pas un
 * `import` du `package.json` : `rootDir: "src"` casserait l'émission).
 */
export const GRADILIS_UI_VERSION = '0.6.4';

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

// Format FR — aussi disponible via le subpath `@gradilis/ui/format`. Ré-exporté
// ici pour les consommateurs qui importent le formatage depuis le barrel (magasin).
export {
  PLACEHOLDER,
  formatDate,
  formatDateTime,
  formatNumber,
  formatInteger,
  formatEUR,
  formatQuantite,
  formatPourcent,
  dataTableFr,
  dataTableFrPagination,
  dataTableTextesFR,
  setupLocale,
} from './format/index.js';

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
