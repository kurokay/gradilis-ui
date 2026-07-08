/**
 * @gradilis/ui — design system Gradilis Pépinière.
 *
 * Vendoring du socle `gradilis_magasin` (plan Chantier M, DM-7) : thème
 * re-tokenisé Pépinière (rampes GUIDELINES §3.2, primaire `gradilisGreen`) +
 * primitives (`Num`, `PageBreadcrumb`, `FittedDataTable`, `notify`,
 * `openConfirm`, hooks tables, `useSaveShortcut`). Règles d'usage : DESIGN.md.
 * App-canon : export séparé `@gradilis/ui/canon` (M.2), packaging final (M.5).
 */
export const GRADILIS_UI_VERSION = '0.1.0';

export { gradilisTheme, gradilisCssVars } from './theme.js';
export {
  gradilisGreen,
  gradilisLime,
  gradilisBrown,
  gradilisGray,
  semSuccess,
  semWarning,
  semError,
  semInfo,
} from './colors.js';

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
