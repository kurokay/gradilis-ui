/**
 * Formatage localisé — fr-FR centralisé (GUIDELINES §5).
 *
 * Vendoré du `format.ts` de `gradilis_magasin/packages/ui` (DM-7), signatures
 * figées par le plan Chantier M §5.
 * ⚠️ **`gradilis_magasin/packages/ui` N'EXISTE PLUS** (répertoire supprimé de ce
 * dépôt). Le pointeur ci-dessus est une origine HISTORIQUE, à ne pas suivre : il
 * n'y a plus rien à y comparer. Contrairement aux autres briques vendorées, ce
 * module n'a pas de jumeau vivant côté magasin — celui-ci importe bel et bien
 * `formatDate`/`formatEUR`/… d'ici (~50 fichiers chacun), donc **cette copie est
 * la source unique**, pas un double.
 * Source unique des helpers `Intl` : aucun formatage FR ne doit être
 * réimplémenté ailleurs (§10 — la règle lint M.4 interdit `new Intl.` hors de
 * ce module). Les montants
 * utilisent la police mono + `tabular-nums` côté CSS ; ces helpers ne
 * produisent que la chaîne localisée.
 */

export { setupLocale } from './locale.js';

const LOCALE = 'fr-FR';

/** Valeur affichée pour un nombre/date absent (nullish). */
export const PLACEHOLDER = '—';

type Nullable<T> = T | null | undefined;

// Instances Intl singleton module-level (création coûteuse — plan §5).
const nombreParDecimales = new Map<number, Intl.NumberFormat>();
const nombreLibre = new Intl.NumberFormat(LOCALE);
const quantiteFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const eurFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pourcentParDecimales = new Map<number, Intl.NumberFormat>();
const quantiteLibreParDecimales = new Map<number, Intl.NumberFormat>();
const eurArrondiFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const prixUnitaireFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const dateCourtFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dateLongFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toDate(value: Nullable<Date | string>): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Date localisée. `court` : 07/07/2026 · `long` : 7 juillet 2026 ·
 * `datetime` : 07/07/2026 14:30. Accepte `Date` ou chaîne ISO.
 */
export function formatDate(
  d: Nullable<Date | string>,
  style: 'court' | 'long' | 'datetime' = 'court',
): string {
  const date = toDate(d);
  if (!date) return PLACEHOLDER;
  if (style === 'long') return dateLongFmt.format(date);
  if (style === 'datetime') return dateTimeFmt.format(date);
  return dateCourtFmt.format(date);
}

/**
 * Nombre décimal localisé (séparateurs FR, `tabular-nums` côté CSS).
 * Second argument polymorphe :
 *   - absent  → formatage libre Intl ;
 *   - `number` → nombre fixe de décimales (min = max) ;
 *   - `Intl.NumberFormatOptions` → options passées telles quelles (compat magasin).
 */
export function formatNumber(
  n: Nullable<number>,
  arg?: number | Intl.NumberFormatOptions,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  if (arg === undefined) return nombreLibre.format(n);
  if (typeof arg === 'number') {
    let fmt = nombreParDecimales.get(arg);
    if (!fmt) {
      fmt = new Intl.NumberFormat(LOCALE, {
        minimumFractionDigits: arg,
        maximumFractionDigits: arg,
      });
      nombreParDecimales.set(arg, fmt);
    }
    return fmt.format(n);
  }
  return new Intl.NumberFormat(LOCALE, arg).format(n);
}

/** Entier localisé (sans décimales) — alias sémantique de `formatQuantite` (compat magasin). */
export function formatInteger(n: Nullable<number>): string {
  return formatQuantite(n);
}

/** Date + heure « JJ/MM/AAAA HH:MM » — raccourci de `formatDate(d, 'datetime')` (compat magasin). */
export function formatDateTime(d: Nullable<Date | string>): string {
  return formatDate(d, 'datetime');
}

/** Montant en euros (« 1 234,56 € »). */
export function formatEUR(n: Nullable<number>): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  return eurFmt.format(n);
}

/** Quantité entière (arrondi), séparateur de milliers FR (espace fine insécable). */
export function formatQuantite(n: Nullable<number>): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  return quantiteFmt.format(n);
}

/**
 * Quantité SANS zéros forcés (compatible avec le `fmtQty` de l'app de référence) : au plus
 * `maxDecimales` décimales, ZÉRO au minimum — `70` pièces ne s'affiche jamais
 * « 70,000 ». Distinct de `formatQuantite` (toujours 0 décimale, un ENTIER
 * arrondi) et de `formatNumber(n, decimales)` (décimales FIXES, imposées).
 */
export function formatQuantiteLibre(n: Nullable<number>, maxDecimales = 3): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  let fmt = quantiteLibreParDecimales.get(maxDecimales);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxDecimales });
    quantiteLibreParDecimales.set(maxDecimales, fmt);
  }
  return fmt.format(n);
}

/**
 * Montant en euros ARRONDI à l'unité (0 décimale) — compat magasin
 * `fmtCurrencyRounded`. Distinct de `formatEUR` (toujours 2 décimales) : réservé
 * aux affichages qui font explicitement le choix de l'euro entier (un total
 * gros-grain), jamais un remplacement général de `formatEUR`.
 *
 * Neutralise le signe du seul cas où le montant arrondit à zéro : sans ça,
 * un montant tel que -0,3 s'affiche « -0 € », qui n'existe pas en comptabilité
 * (l'arrondi *half-expand* d'`Intl` n'entre en jeu qu'à partir de 0,5).
 */
export function formatEURArrondi(n: Nullable<number>): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  const sansMoinsZero = Math.abs(n) < 0.5 ? 0 : n;
  return eurArrondiFmt.format(sansMoinsZero);
}

/**
 * Prix UNITAIRE en euros : 2 décimales au minimum, 4 au maximum, sans zéros
 * forcés au-delà de 2 — compat magasin `fmtUnitPrice`. Distinct de `formatEUR`
 * (toujours exactement 2 décimales) : réservé à un prix unitaire dont la
 * saisie porte une échelle plus fine que le centime (ex. un prix d'achat à 4
 * décimales) — un MONTANT (total, facture) reste sur `formatEUR`, au centime.
 */
export function formatPrixUnitaire(n: Nullable<number>): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  return prixUnitaireFmt.format(n);
}

/** Pourcentage — `n` est un ratio ∈ [0,1] (0,42 → « 42 % »). */
export function formatPourcent(n: Nullable<number>, decimales = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return PLACEHOLDER;
  let fmt = pourcentParDecimales.get(decimales);
  if (!fmt) {
    fmt = new Intl.NumberFormat(LOCALE, {
      style: 'percent',
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
    pourcentParDecimales.set(decimales, fmt);
  }
  return fmt.format(n);
}

/**
 * Textes FR pour `<DataTable>` (mantine-datatable) — objet à spreader :
 * `<DataTable {...dataTableTextesFR} … />`. Typé structurellement pour ne pas
 * coupler `@gradilis/ui` à la lib de table.
 *
 * NB (hérité du magasin) : `loadingText`, `recordsPerPageLabel` et
 * `paginationText` appartiennent à l'union « table paginée » de
 * mantine-datatable — spreader cet objet sur une table NON paginée fera
 * exiger les props de pagination par TypeScript ; n'y reprendre alors que
 * `noRecordsText`.
 */
export const dataTableTextesFR = {
  noRecordsText: 'Aucun enregistrement',
  loadingText: 'Chargement…',
  recordsPerPageLabel: 'Lignes par page',
  paginationText: ({ from, to, totalRecords }: { from: number; to: number; totalRecords: number }) =>
    `${from}–${to} sur ${totalRecords}`,
} as const;

/**
 * Variante SCINDÉE (compat magasin) — `dataTableFr` porte le texte toujours sûr
 * (table non paginée), `dataTableFrPagination` les labels de l'union pagination.
 * Spreader `dataTableFrPagination` UNIQUEMENT sur une table paginée (sinon
 * TypeScript exige les props page/totalRecords…). Cf. `dataTableTextesFR` pour
 * l'objet fusionné utilisé côté pépinière.
 */
export const dataTableFr = {
  noRecordsText: 'Aucun enregistrement',
} as const;

export const dataTableFrPagination = {
  loadingText: 'Chargement…',
  recordsPerPageLabel: 'Lignes par page',
  paginationText: ({ from, to, totalRecords }: { from: number; to: number; totalRecords: number }) =>
    `${from}–${to} sur ${totalRecords}`,
} as const;
