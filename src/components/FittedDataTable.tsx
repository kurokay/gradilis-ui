/**
 * FittedDataTable — `<DataTable>` (mantine-datatable) qui se termine proprement en
 * bas du viewport : la taille de page est calculée en amont (voir
 * {@link useTableAutoFit}) et la hauteur est fixée pour ancrer le footer en bas,
 * sans scroll du document. On navigue via les boutons de pagination.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/FittedDataTable.tsx` (DM-7).
 * Adaptations Pépinière : textes FR via `dataTableTextesFR` (module @gradilis/ui/format,
 * M.3 — objet unique là où le magasin en avait deux) ; bouton « Auto » en
 * `gradilisGreen` (primaire §3.2) ; les props `height`/`renderPagination` de
 * l'appelant ne sont plus destructurées-ignorées (variables inutilisées sous
 * typescript-eslint strict) — elles sont simplement écrasées par les clés posées
 * APRÈS le spread de `rest` dans `tableProps`, même résultat.
 *
 * Usage : remplacer `<DataTable ... />` par `<FittedDataTable fit={fit} ... />`, où
 * `fit` provient de `useTablePrefs(key, { autoFit: true })`. Les autres props sont
 * inchangées.
 *
 * Détails :
 * - Hauteur fixée UNIQUEMENT si la pagination est réellement nécessaire
 *   (`totalRecords > recordsPerPage`) : une liste courte reste en hauteur naturelle,
 *   pas de table à moitié vide.
 * - Affordance « Auto » : en mode auto le sélecteur natif affiche la taille calculée ;
 *   un bouton « Auto » permet de revenir au calcul automatique après un choix manuel.
 *   Rendu via `renderPagination` en réutilisant les contrôles natifs
 *   (`Controls.Text` / `Controls.Pagination`) → dérive visuelle minimale.
 */
import { useEffect } from 'react';
import { Button, Group, Tooltip } from '@mantine/core';
import { IconArrowAutofitHeight } from '@tabler/icons-react';
import {
  DataTable,
  type DataTableProps,
  type DataTablePaginationRenderContext,
} from 'mantine-datatable';
import { dataTableTextesFR } from '../format/index.js';
import type { TableAutoFit } from '../hooks/useTableAutoFit.js';

type FittedDataTableProps<T> = DataTableProps<T> & {
  /** Bundle renvoyé par `useTablePrefs` (option `autoFit`). */
  fit: TableAutoFit['fit'];
};

function AutoButton({ active, onActivate }: { active: boolean; onActivate: () => void }) {
  return (
    <Tooltip label="Ajuster le nombre de lignes à la hauteur de l'écran" withArrow>
      <Button
        size="compact-xs"
        radius="xl"
        color="gradilisGreen"
        variant={active ? 'light' : 'default'}
        onClick={onActivate}
        leftSection={<IconArrowAutofitHeight size={14} />}
        aria-label="Ajuster automatiquement le nombre de lignes"
        aria-pressed={active}
      >
        Auto
      </Button>
    </Tooltip>
  );
}

export function FittedDataTable<T>(props: FittedDataTableProps<T>) {
  const { fit, totalRecords, recordsPerPage, recordsPerPageOptions, minHeight, ...rest } = props;

  // Fixe la hauteur seulement quand la pagination sert (sinon hauteur naturelle).
  const paginationNeeded =
    typeof totalRecords === 'number' &&
    typeof recordsPerPage === 'number' &&
    totalRecords > recordsPerPage;
  const applyHeight = fit.ready && fit.height > 0 && paginationNeeded;

  // Recale `page` si la taille auto GRANDIT au point de dépasser le total de pages
  // (ex. agrandissement de fenêtre alors qu'on est en page 2+) : en mode client, un
  // slice hors borne donnerait une table vide avec curseur fantôme.
  const page = (rest as { page?: number }).page;
  const onPageChange = (rest as { onPageChange?: (p: number) => void }).onPageChange;
  useEffect(() => {
    if (
      !paginationNeeded ||
      typeof page !== 'number' ||
      typeof onPageChange !== 'function' ||
      typeof totalRecords !== 'number' ||
      typeof recordsPerPage !== 'number'
    ) {
      return;
    }
    const maxPage = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
    if (page > maxPage) onPageChange(maxPage);
  }, [page, onPageChange, paginationNeeded, totalRecords, recordsPerPage]);

  // En mode auto, on injecte la taille calculée dans les options pour que le
  // sélecteur natif l'affiche comme valeur courante (il n'accepte que des nombres).
  const options =
    fit.isAuto && typeof recordsPerPage === 'number'
      ? Array.from(new Set([...(recordsPerPageOptions ?? []), recordsPerPage])).sort(
          (a, b) => a - b,
        )
      : recordsPerPageOptions;

  const renderPagination = ({ Controls }: DataTablePaginationRenderContext) => (
    <>
      <Controls.Text />
      <Group gap="xs" wrap="nowrap">
        <Controls.PageSizeSelector />
        <AutoButton active={fit.isAuto} onActivate={fit.resetToAuto} />
      </Group>
      <Controls.Pagination />
    </>
  );

  // Assemblage puis cast unique : `DataTableProps<T>` est une union discriminée que
  // le spread + surcharges ne peut pas satisfaire structurellement ; le wrapper ne
  // fait que réémettre des props déjà valides fournies par l'appelant. Les clés
  // posées après `...rest` (height, renderPagination…) écrasent celles de l'appelant.
  const tableProps = {
    ...dataTableTextesFR,
    ...rest,
    totalRecords,
    recordsPerPage,
    recordsPerPageOptions: options,
    minHeight: minHeight ?? 200,
    height: applyHeight ? fit.height : undefined,
    renderPagination,
  } as unknown as DataTableProps<T>;

  return (
    <div ref={fit.ref}>
      <DataTable<T> {...tableProps} />
    </div>
  );
}
