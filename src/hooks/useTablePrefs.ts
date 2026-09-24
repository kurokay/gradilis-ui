/**
 * useTablePrefs — préférences partagées des DataTable en mode CLIENT (le mode
 * serveur, pour les gros volumes, vit côté application consommatrice).
 *
 * Fournit la pagination (page + taille de page persistée en localStorage) et
 * le tri client générique pour les `<DataTable>` métier.
 *
 * - `pageSize` est persisté sous la clé `tbl:<storageKey>:size`.
 * - `sortStatus` suit le contrat de `mantine-datatable` ; `sortRecords` applique
 *   un tri client stable, sans muter l'entrée.
 */
import { useState, useCallback } from 'react';
import type { DataTableSortStatus } from 'mantine-datatable';
import { useTableAutoFit, type TableAutoFit } from './useTableAutoFit.js';

interface UseTablePrefsOptions<T> {
  /** Taille de page par défaut (avant lecture du localStorage). */
  defaultPageSize?: number;
  /**
   * Active l'auto-fit : la taille de page s'ajuste pour que la table se termine
   * en bas du viewport. `fit` (à passer à `<FittedDataTable>`) est alors renseigné.
   */
  autoFit?: boolean;
  /**
   * Signal de re-mesure de l'auto-fit — à bouger quand un bloc AU-DESSUS de la table
   * se replie/déplie. Voir `useTableAutoFit` : sans lui, le repli ne libère que du blanc.
   */
  revalidateKey?: unknown;
  /**
   * Clés de tri **DÉRIVÉES** — `{ <accessor> : (ligne) => valeur comparable }`.
   *
   * ⚠️⚠️ **Elle existe parce qu'une colonne peut n'avoir AUCUN chemin triable sur la
   * ligne**, et que le défaut correspondant est SILENCIEUX : `getByAccessor` rend alors
   * l'objet lui-même, `compareValues` retombe sur `String(a).localeCompare(String(b))`,
   * soit `"[object Object]"` de part et d'autre — toutes les lignes égales, tri stable,
   * ordre INCHANGÉ. La colonne porte une flèche, se clique, et ne trie rien. Un tri qui
   * ne trie pas et ne le dit pas est pire qu'une colonne non triable.
   *
   * ⚠️ **Le sens de lecture est celui de `sortRecords`** : la clé cherchée est
   * `sortStatus.sortKey ?? columnAccessor`, donc un `sortKey` posé sur la colonne
   * fonctionne aussi. Absente de la table → `getByAccessor` comme avant, à l'identique :
   * l'option est strictement ADDITIVE.
   *
   * ⚠️⚠️ **Passer une CONSTANTE DE MODULE, jamais un objet littéral construit au rendu** :
   * la table entre dans les dépendances de `sortRecords`, donc un littéral en changerait
   * l'identité à chaque rendu — inoffensif si l'appel est direct, destructeur pour
   * tout écran qui mettrait `sortRecords` dans un `useMemo`/`useEffect`.
   *
   * ⚠️ Une valeur `null`/`undefined`/`''` rendue par le getter suit la règle commune :
   * **en fin de liste, dans les DEUX sens**.
   */
  sortValues?: Record<string, (row: T) => unknown>;
}

interface UseTablePrefsResult<T> {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sortStatus: DataTableSortStatus<T>;
  setSortStatus: (status: DataTableSortStatus<T>) => void;
  /** Tri client stable selon `sortStatus` ; ne mute pas `rows`. */
  sortRecords: (rows: T[]) => T[];
  /** Bundle auto-fit (ref/height/Auto) pour `<FittedDataTable>`. */
  fit: TableAutoFit['fit'];
}

/** Lecture d'une valeur via un accessor pouvant être imbriqué ("a.b.c"). */
function getByAccessor(row: unknown, accessor: string): unknown {
  if (!accessor.includes('.')) {
    return (row as Record<string, unknown> | null | undefined)?.[accessor];
  }
  return accessor.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, row);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/;

function isNil(v: unknown): boolean {
  return v == null || v === '';
}

/** Compare deux valeurs non-nulles : nombres, booléens, dates ISO/Date, sinon localeCompare FR. */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  if (a instanceof Date || b instanceof Date) {
    const ta = a instanceof Date ? a.getTime() : new Date(a as string).getTime();
    const tb = b instanceof Date ? b.getTime() : new Date(b as string).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    if (ISO_DATE_RE.test(a) && ISO_DATE_RE.test(b)) {
      const ta = new Date(a).getTime();
      const tb = new Date(b).getTime();
      if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
    }
    return a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });
  }

  return String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' });
}

export function useTablePrefs<T = Record<string, unknown>>(
  storageKey: string,
  opts?: UseTablePrefsOptions<T>,
): UseTablePrefsResult<T> {
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, fit } = useTableAutoFit(storageKey, {
    enabled: opts?.autoFit ?? false,
    defaultPageSize: opts?.defaultPageSize ?? 20,
    revalidateKey: opts?.revalidateKey,
  });
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>({
    columnAccessor: '',
    direction: 'asc',
  });

  const sortValues = opts?.sortValues;

  const sortRecords = useCallback(
    (rows: T[]): T[] => {
      const accessor = (sortStatus.sortKey ?? sortStatus.columnAccessor) as string;
      if (!accessor) return rows;
      const dir = sortStatus.direction === 'desc' ? -1 : 1;
      // Clé DÉRIVÉE si l'écran en a déclaré une pour cet accessor, sinon lecture par
      // chemin — le comportement historique, inchangé (cf. `sortValues` ci-dessus).
      const lire = sortValues?.[accessor];
      const valeur = lire ?? ((row: T) => getByAccessor(row, accessor));
      // Tri stable : index secondaire pour préserver l'ordre des égalités.
      return rows
        .map((row, index) => ({ row, index }))
        .sort((x, y) => {
          const va = valeur(x.row);
          const vb = valeur(y.row);
          const aNil = isNil(va);
          const bNil = isNil(vb);
          // null/undefined/'' toujours en dernier, quelle que soit la direction.
          if (aNil || bNil) {
            if (aNil && bNil) return x.index - y.index;
            return aNil ? 1 : -1;
          }
          const cmp = compareValues(va, vb);
          if (cmp !== 0) return cmp * dir;
          return x.index - y.index;
        })
        .map((entry) => entry.row);
    },
    [sortStatus, sortValues],
  );

  return { page, setPage, pageSize, setPageSize, sortStatus, setSortStatus, sortRecords, fit };
}
