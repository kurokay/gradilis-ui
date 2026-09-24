/**
 * FittedDataTable — `<DataTable>` (mantine-datatable) qui se termine proprement en
 * bas du viewport : la taille de page est calculée en amont (voir
 * {@link useTableAutoFit}) et la hauteur est fixée pour ancrer le footer en bas,
 * sans scroll du document. On navigue via les boutons de pagination.
 *
 * Usage : remplacer `<DataTable ... />` par `<FittedDataTable fit={fit} ... />`, où
 * `fit` provient de `useTablePrefs(key, { autoFit: true })` ou
 * `useServerTable({ ..., autoFit: true })`. Les autres props sont inchangées.
 *
 * Détails :
 * - Hauteur fixée UNIQUEMENT si la pagination est réellement nécessaire
 *   (`totalRecords > recordsPerPage`) : une liste courte reste en hauteur naturelle,
 *   pas de table à moitié vide.
 * - Libellés (état vide/chargement/pagination) INJECTABLES via
 *   `GradilisLabelsProvider` (`lib/labels.tsx`, section `dataTable`) — défauts FR
 *   historiques hors provider.
 * - ⚠️ **Le chrome de pagination appartient au wrapper** : `loadingText`,
 *   `recordsPerPageLabel` et `paginationText` passés par un appelant sont IGNORÉS.
 *   Sans ce verrou, un `{...unTexteDeChromeCopié}` étalé par réflexe sur une table
 *   NUE (le geste canonique sur `<DataTable>`) rebasculerait la pagination sur une
 *   valeur figée là où l'app injecte ses propres libellés (i18n, autre langue).
 *   Aucun appelant légitime n'a besoin de surcharger ces trois clés : elles ne
 *   sont pas des messages métier, seulement du chrome de table.
 * - ⚠️ `noRecordsText` reste surchargeable — un appelant y met typiquement une
 *   phrase MÉTIER (« Aucune vente enregistrée sur cette période. »), qu'un
 *   libellé générique dégraderait. Seule la valeur GÉNÉRIQUE par défaut
 *   (`DEFAULT_LABELS.dataTable.noRecordsText`, comparaison PAR VALEUR) est
 *   neutralisée : la reconnaître, c'est distinguer « on a écrit un message » de
 *   « on a étalé la constante par défaut ». Hors provider, les deux chaînes sont
 *   identiques (rien ne bouge) ; avec un provider qui traduit, l'injection
 *   l'emporte. Le garde ne se contourne ni par le spread, ni en retapant la
 *   chaîne à la main.
 * - Affordance « Auto » : en mode auto le sélecteur natif affiche la taille calculée ;
 *   un bouton « Auto » permet de revenir au calcul automatique après un choix manuel.
 *   Rendu via `renderPagination` en réutilisant les contrôles natifs
 *   (`Controls.Text` / `Controls.Pagination`) → dérive visuelle minimale.
 *   ⚠️ Émis UNIQUEMENT si `fit.enabled` : sur une table sans auto-fit, `resetToAuto` est
 *   un no-op et le bouton serait mort (sans même un retour `aria-pressed`).
 */
import { useEffect } from 'react';
import { Button, Group, Tooltip } from '@mantine/core';
import { IconArrowAutofitHeight } from '@tabler/icons-react';
import {
  DataTable,
  type DataTableProps,
  type DataTablePaginationRenderContext,
} from 'mantine-datatable';
import { DEFAULT_LABELS, useGradilisLabels } from '../lib/labels.js';
import type { TableAutoFit } from '../hooks/useTableAutoFit.js';

/**
 * Chrome de pagination : propriété du wrapper, jamais de l'appelant (cf. en-tête).
 * Retirées de `tableRest` AVANT l'assemblage — pas « écrasées après », pour qu'il
 * n'existe aucun ordre de spread qui les fasse repasser.
 */
const CHROME_LABEL_KEYS = ['loadingText', 'recordsPerPageLabel', 'paginationText'];

/**
 * ⚠️ Les clés de `CHROME_LABEL_KEYS` sont RETIRÉES du type : le wrapper les ignore,
 * et un appelant qui les passerait doit le voir à la compilation plutôt que de
 * perdre son texte en silence. Pour les changer, passer par `GradilisLabelsProvider`.
 */
type FittedDataTableProps<T> = Omit<
  DataTableProps<T>,
  'loadingText' | 'recordsPerPageLabel' | 'paginationText'
> & {
  /** Bundle renvoyé par `useTablePrefs`/`useServerTable` (option `autoFit`). */
  fit: TableAutoFit['fit'];
  /**
   * Attributs `data-*` (ex. ancre de tour) — posés sur le `<div>` RACINE, pas
   * passés à `<DataTable>` (qui ne les réémet pas sur son conteneur).
   */
  [key: `data-${string}`]: string | undefined;
};

function AutoButton({ active, onActivate }: { active: boolean; onActivate: () => void }) {
  // ⚠️ Libellés INJECTABLES (`GradilisLabelsProvider`), défauts FR historiques.
  const labels = useGradilisLabels().autoFit;
  return (
    <Tooltip label={labels.tooltip} withArrow>
      <Button
        size="compact-xs"
        radius="xl"
        // ⚠️ PAS de `color` nommée : le bouton suit `theme.primaryColor`, donc la
        // marque de CHAQUE application. Une couleur en dur (ex. une rampe propre
        // à une seule marque) serait absente du thème des autres, et Mantine ne
        // rejette pas un nom de couleur inconnu — `parseThemeColor` le renvoie
        // tel quel comme valeur CSS, donc une déclaration invalide, silencieusement
        // ignorée : le bouton perdrait sa couleur sans la moindre erreur.
        variant={active ? 'light' : 'default'}
        onClick={onActivate}
        leftSection={<IconArrowAutofitHeight size={14} />}
        aria-label={labels.ariaLabel}
        aria-pressed={active}
      >
        {labels.label}
      </Button>
    </Tooltip>
  );
}

export function FittedDataTable<T>(props: FittedDataTableProps<T>) {
  const labels = useGradilisLabels();
  const dataTableLabels = labels.dataTable;
  const {
    fit,
    totalRecords,
    recordsPerPage,
    recordsPerPageOptions,
    minHeight,
    // On maîtrise `height`/`renderPagination` : ignorés s'ils sont passés.
    height: _ignoredHeight,
    renderPagination: _ignoredRenderPagination,
    ...rest
  } = props;

  // Sépare les attributs `data-*` : ils vont sur le div racine (ancre de tour), pas dans
  // les props de `<DataTable>`. Le chrome de pagination est retenu par le wrapper (cf.
  // en-tête). Les autres props sont réémises telles quelles à la table.
  const dataAttrs: Record<string, string> = {};
  const tableRest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (k.startsWith('data-')) {
      if (v != null) dataAttrs[k] = v as string;
    } else if (CHROME_LABEL_KEYS.includes(k)) {
      // Ignoré : le chrome de pagination est localisé par le wrapper.
    } else if (k === 'noRecordsText' && v === DEFAULT_LABELS.dataTable.noRecordsText) {
      // Ignoré : c'est la constante générique par défaut, pas un message métier.
    } else {
      tableRest[k] = v;
    }
  }

  // Fixe la hauteur seulement quand la pagination sert (sinon hauteur naturelle).
  // ⚠️ Ce `paginationNeeded` sert À LA HAUTEUR SEULE — surtout ne pas le réintroduire
  // dans la garde du clamp ci-dessous : ce sont deux questions différentes (« la table
  // doit-elle finir en bas du viewport ? » vs « le curseur pointe-t-il dans le vide ? »),
  // et c'est précisément leur confusion qui avait rendu le clamp inopérant.
  const paginationNeeded =
    typeof totalRecords === 'number' &&
    typeof recordsPerPage === 'number' &&
    totalRecords > recordsPerPage;
  const applyHeight = fit.ready && fit.height > 0 && paginationNeeded;

  // Recale `page` dès qu'il sort des bornes. Deux causes réelles :
  //  - la taille de page GRANDIT (auto-fit, agrandissement de fenêtre en page 2+) ;
  //  - le JEU DE RÉSULTATS RÉTRÉCIT (filtre/recherche) au point de tenir sur UNE page
  //    alors que `page` vaut encore 3 → `slice(30, 45)` = `[]` : l'écran affichait
  //    « Aucun … » PAR-DESSUS des lignes qui correspondent, avec un pied de page qui se
  //    contredisait (« 31–30 sur 10 »).
  // ⚠️ Ce second cas est celui pour lequel le clamp existe, et c'est exactement celui
  // qu'une garde `totalRecords > recordsPerPage` excluait : quand le résultat tient sur
  // une page, la pagination n'est PAS « nécessaire » — mais le curseur, lui, est faux.
  // ⚠️ Pas de boucle de rendu : l'appel amène `page` À `maxPage`, et au rendu suivant
  // `maxPage > maxPage` est faux → un seul appel, quelle que soit l'identité de
  // `onPageChange` (une identité qui change à chaque rendu ne fait que ré-exécuter un
  // effet dont le corps est un no-op). En mode serveur le backend clampe déjà : le
  // recalage y est idempotent.
  const page = (rest as { page?: number }).page;
  const onPageChange = (rest as { onPageChange?: (p: number) => void }).onPageChange;
  useEffect(() => {
    if (
      typeof page !== 'number' ||
      typeof onPageChange !== 'function' ||
      typeof totalRecords !== 'number' ||
      typeof recordsPerPage !== 'number' ||
      recordsPerPage <= 0 ||
      // ⚠️ Pas de recalage tant que le total n'est pas CONNU : pendant un chargement,
      // l'appelant passe souvent 0 (données absentes), et une page restaurée depuis
      // l'URL ou les préférences serait ramenée à 1 avant l'arrivée des données.
      totalRecords <= 0 ||
      (rest as { fetching?: boolean }).fetching === true
    ) {
      return;
    }
    const maxPage = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
    if (page > maxPage) onPageChange(maxPage);
  }, [page, onPageChange, totalRecords, recordsPerPage, (rest as { fetching?: boolean }).fetching]);

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
        {/*
          ⚠️ Bouton « Auto » émis UNIQUEMENT si l'auto-fit est réellement actif :
          `resetToAuto` est un no-op quand `enabled` vaut false (`useTableAutoFit`),
          et `aria-pressed` resterait figé à false — un bouton qui ne fait rien et ne
          répond rien. La décision se prend ici, pas chez l'appelant : lui ne fait
          que ne pas passer `autoFit`.
        */}
        {fit.enabled !== false && <AutoButton active={fit.isAuto} onActivate={fit.resetToAuto} />}
      </Group>
      <Controls.Pagination />
    </>
  );

  // Assemblage puis cast unique : `DataTableProps<T>` est une union discriminée que
  // le spread + surcharges ne peut pas satisfaire structurellement ; le wrapper ne
  // fait que réémettre des props déjà valides fournies par l'appelant.
  const tableProps = {
    ...dataTableLabels,
    ...tableRest,
    totalRecords,
    recordsPerPage,
    recordsPerPageOptions: options,
    minHeight: minHeight ?? 200,
    height: applyHeight ? fit.height : undefined,
    renderPagination,
  } as unknown as DataTableProps<T>;

  return (
    <div ref={fit.ref} {...dataAttrs}>
      <DataTable<T> {...tableProps} />
    </div>
  );
}
