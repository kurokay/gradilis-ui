/**
 * useTablePrefs — préférences partagées des DataTable en mode CLIENT
 * (convention playbook §4 : mode client par défaut ; le mode serveur —
 * `useServerTable` du magasin — sera vendoré au premier besoin, Chantier C).
 *
 * Vendoré de `gradilis_magasin/frontend/src/hooks/useTablePrefs.ts` (DM-7), inchangé.
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

interface UseTablePrefsOptions {
  /** Taille de page par défaut (avant lecture du localStorage). */
  defaultPageSize?: number;
  /**
   * Active l'auto-fit : la taille de page s'ajuste pour que la table se termine
   * en bas du viewport. `fit` (à passer à `<FittedDataTable>`) est alors renseigné.
   */
  autoFit?: boolean;
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
  opts?: UseTablePrefsOptions,
): UseTablePrefsResult<T> {
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, fit } = useTableAutoFit(storageKey, {
    enabled: opts?.autoFit ?? false,
    defaultPageSize: opts?.defaultPageSize ?? 20,
  });
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>({
    columnAccessor: '',
    direction: 'asc',
  });

  const sortRecords = useCallback(
    (rows: T[]): T[] => {
      const accessor = (sortStatus.sortKey ?? sortStatus.columnAccessor) as string;
      if (!accessor) return rows;
      const dir = sortStatus.direction === 'desc' ? -1 : 1;
      // Tri stable : index secondaire pour préserver l'ordre des égalités.
      return rows
        .map((row, index) => ({ row, index }))
        .sort((x, y) => {
          const va = getByAccessor(x.row, accessor);
          const vb = getByAccessor(y.row, accessor);
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
    [sortStatus],
  );

  return { page, setPage, pageSize, setPageSize, sortStatus, setSortStatus, sortRecords, fit };
}
