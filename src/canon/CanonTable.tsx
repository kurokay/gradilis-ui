/**
 * CanonTable — tableau métier de référence (§5/§9) : mantine-datatable via
 * `FittedDataTable` (auto-fit), tri/recherche/pagination client via
 * `useTablePrefs`, textes FR (`dataTableTextesFR` spreadé par FittedDataTable),
 * chiffres `<Num>` + format FR (M.3), agrégats en pied FOURNIS PAR LES DONNÉES
 * (pattern Chantier C : ils viendront du backend, jamais recalculés par la lib).
 *
 * Données factices métier Pépinière : lots (espèce / variété / porte-greffe /
 * quantités).
 */
import { useMemo, useState } from 'react';
import { Badge, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { DataTableSortStatus } from 'mantine-datatable';

import { FittedDataTable } from '../components/FittedDataTable.js';
import { Num } from '../components/Num.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { formatDate, formatQuantite } from '../format/index.js';
import { useTablePrefs } from '../hooks/useTablePrefs.js';

interface LigneLot {
  id: number;
  espece: string;
  variete: string;
  porteGreffe: string;
  quantite: number;
  fagots: number;
  dateReception: string;
  statut: 'disponible' | 'reserve' | 'expedie';
}

const STATUTS: Record<LigneLot['statut'], { label: string; couleur: string }> = {
  disponible: { label: 'Disponible', couleur: 'succes' },
  reserve: { label: 'Réservé', couleur: 'alerte' },
  expedie: { label: 'Expédié', couleur: 'info' },
};

const LOTS: LigneLot[] = [
  { id: 1, espece: 'Pommier', variete: 'Gala', porteGreffe: 'MM106', quantite: 2400, fagots: 48, dateReception: '2025-11-12', statut: 'disponible' },
  { id: 2, espece: 'Pommier', variete: 'Golden Delicious', porteGreffe: 'PAJAM 2', quantite: 3150, fagots: 63, dateReception: '2025-11-14', statut: 'reserve' },
  { id: 3, espece: 'Poirier', variete: 'Conférence', porteGreffe: 'Cognassier BA29', quantite: 1800, fagots: 36, dateReception: '2025-11-18', statut: 'disponible' },
  { id: 4, espece: 'Cerisier', variete: 'Burlat', porteGreffe: 'Gisela 5', quantite: 950, fagots: 19, dateReception: '2025-11-21', statut: 'expedie' },
  { id: 5, espece: 'Prunier', variete: 'Reine-Claude dorée', porteGreffe: 'Myrobolan', quantite: 1200, fagots: 24, dateReception: '2025-11-25', statut: 'disponible' },
  { id: 6, espece: 'Abricotier', variete: 'Bergeron', porteGreffe: 'Montclar', quantite: 700, fagots: 14, dateReception: '2025-12-02', statut: 'reserve' },
  { id: 7, espece: 'Pêcher', variete: 'Redhaven', porteGreffe: 'GF305', quantite: 850, fagots: 17, dateReception: '2025-12-05', statut: 'disponible' },
  { id: 8, espece: 'Pommier', variete: 'Braeburn', porteGreffe: 'MM106', quantite: 2100, fagots: 42, dateReception: '2025-12-09', statut: 'disponible' },
  { id: 9, espece: 'Poirier', variete: 'Williams', porteGreffe: 'Cognassier Adams', quantite: 1600, fagots: 32, dateReception: '2025-12-11', statut: 'expedie' },
  { id: 10, espece: 'Cerisier', variete: 'Summit', porteGreffe: 'Colt', quantite: 1100, fagots: 22, dateReception: '2025-12-15', statut: 'reserve' },
  { id: 11, espece: 'Prunier', variete: 'Mirabelle de Nancy', porteGreffe: 'Saint-Julien', quantite: 1350, fagots: 27, dateReception: '2026-01-08', statut: 'disponible' },
  { id: 12, espece: 'Pommier', variete: 'Chantecler', porteGreffe: 'PAJAM 1', quantite: 1950, fagots: 39, dateReception: '2026-01-12', statut: 'disponible' },
  { id: 13, espece: 'Abricotier', variete: 'Orangé de Provence', porteGreffe: 'Myrobolan', quantite: 600, fagots: 12, dateReception: '2026-01-15', statut: 'expedie' },
  { id: 14, espece: 'Pêcher', variete: 'Sanguine de Savoie', porteGreffe: 'GF305', quantite: 450, fagots: 9, dateReception: '2026-01-20', statut: 'disponible' },
];

export function CanonTable() {
  const [recherche, setRecherche] = useState('');
  const { page, setPage, pageSize, setPageSize, sortStatus, setSortStatus, sortRecords, fit } =
    useTablePrefs<LigneLot>('canon-lots', { autoFit: true });

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return LOTS;
    return LOTS.filter((l) =>
      [l.espece, l.variete, l.porteGreffe].some((v) => v.toLowerCase().includes(q)),
    );
  }, [recherche]);

  const tries = sortRecords(filtres);
  const pageCourante = tries.slice((page - 1) * pageSize, page * pageSize);

  // Agrégats de pied « fournis par les données » : calculés sur le jeu filtré
  // complet (en réel : renvoyés par l'API), pas seulement la page affichée.
  const totalArbres = filtres.reduce((somme, l) => somme + l.quantite, 0);
  const totalFagots = filtres.reduce((somme, l) => somme + l.fagots, 0);

  const changerTri = (statut: DataTableSortStatus<LigneLot>) => {
    setSortStatus(statut);
    setPage(1);
  };

  return (
    <Stack gap="sm">
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'Tableau métier' }]} />
      <Text c="dimmed" size="sm">
        Tri, recherche et pagination client (useTablePrefs), auto-fit (bouton « Auto »), textes
        FR, chiffres tabulaires, agrégats en pied issus des données filtrées.
      </Text>
      <TextInput
        value={recherche}
        onChange={(e) => {
          setRecherche(e.currentTarget.value);
          setPage(1);
        }}
        placeholder="Rechercher (espèce, variété, porte-greffe)…"
        aria-label="Rechercher dans les lots"
        leftSection={<IconSearch size={18} />}
        maw={360}
      />
      <FittedDataTable<LigneLot>
        fit={fit}
        withTableBorder
        borderRadius="md"
        striped
        highlightOnHover
        records={pageCourante}
        idAccessor="id"
        sortStatus={sortStatus}
        onSortStatusChange={changerTri}
        totalRecords={filtres.length}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={setPage}
        recordsPerPageOptions={[5, 10, 20]}
        onRecordsPerPageChange={(taille) => {
          setPageSize(taille);
          setPage(1);
        }}
        columns={[
          {
            accessor: 'espece',
            title: 'Espèce',
            sortable: true,
            footer: <Text size="sm" fw={600}>{`Total (${formatQuantite(filtres.length)} lots)`}</Text>,
          },
          { accessor: 'variete', title: 'Variété', sortable: true },
          { accessor: 'porteGreffe', title: 'Porte-greffe', sortable: true },
          {
            accessor: 'quantite',
            title: 'Arbres',
            sortable: true,
            textAlign: 'right',
            render: (l) => <Num inherit>{formatQuantite(l.quantite)}</Num>,
            footer: <Num fw={600}>{formatQuantite(totalArbres)}</Num>,
          },
          {
            accessor: 'fagots',
            title: 'Fagots',
            sortable: true,
            textAlign: 'right',
            render: (l) => <Num inherit>{formatQuantite(l.fagots)}</Num>,
            footer: <Num fw={600}>{formatQuantite(totalFagots)}</Num>,
          },
          {
            accessor: 'dateReception',
            title: 'Réception',
            sortable: true,
            render: (l) => formatDate(l.dateReception),
          },
          {
            accessor: 'statut',
            title: 'Statut',
            render: (l) => (
              <Badge color={STATUTS[l.statut].couleur} variant="light">
                {STATUTS[l.statut].label}
              </Badge>
            ),
          },
        ]}
      />
    </Stack>
  );
}
