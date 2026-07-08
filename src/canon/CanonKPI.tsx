/**
 * CanonKPI — cartes de statistiques de référence (§9) : chiffres en mono +
 * `tabular-nums` (`<Num>`), format FR centralisé (M.3), badges sémantiques,
 * et un graphe @mantine/charts trivial (série = token du thème, jamais d'hex).
 */
import { Badge, Card, Paper, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core';
import { BarChart } from '@mantine/charts';

import { Num } from '../components/Num.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { formatPourcent, formatQuantite } from '../format/index.js';

const KPIS = [
  {
    libelle: 'Arbres en stock',
    valeur: formatQuantite(48250),
    badge: { texte: `+${formatPourcent(0.032, 1)} vs N-1`, couleur: 'succes' },
  },
  {
    libelle: 'Commandes à préparer',
    valeur: formatQuantite(37),
    badge: { texte: 'à traiter', couleur: 'alerte' },
  },
  {
    libelle: 'Occupation des frigos',
    valeur: formatPourcent(0.815, 1),
    badge: { texte: 'stable', couleur: 'info' },
  },
] as const;

const EXPEDITIONS_MENSUELLES = [
  { mois: 'Nov.', arbres: 4200 },
  { mois: 'Déc.', arbres: 6800 },
  { mois: 'Janv.', arbres: 9350 },
  { mois: 'Févr.', arbres: 11200 },
  { mois: 'Mars', arbres: 7600 },
  { mois: 'Avr.', arbres: 2100 },
];

export function CanonKPI() {
  const theme = useMantineTheme();
  return (
    <Stack gap="sm">
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'KPI & graphe' }]} />
      <Text c="dimmed" size="sm">
        Cartes de stats : valeur en mono/tabular-nums, libellé dimmed, badge sémantique. Série du
        graphe = primaire du thème (idx 6, identité) — agnostique de marque.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {KPIS.map((kpi) => (
          <Card key={kpi.libelle} withBorder radius="md" padding="lg" shadow="sm">
            <Text size="sm" c="dimmed">
              {kpi.libelle}
            </Text>
            <Num fz={28} fw={600} ff="monospace">
              {kpi.valeur}
            </Num>
            <Badge color={kpi.badge.couleur} variant="light" mt="xs">
              {kpi.badge.texte}
            </Badge>
          </Card>
        ))}
      </SimpleGrid>
      <Paper withBorder radius="md" p="md" shadow="sm">
        <Text size="sm" c="dimmed" mb="xs">
          Arbres expédiés par mois (saison 2025-2026)
        </Text>
        <div role="img" aria-label="Graphique en barres : arbres expédiés par mois, de novembre à avril">
          <BarChart
            h={220}
            data={EXPEDITIONS_MENSUELLES}
            dataKey="mois"
            series={[{ name: 'arbres', label: 'Arbres expédiés', color: `${theme.primaryColor}.6` }]}
            valueFormatter={formatQuantite}
          />
        </div>
      </Paper>
    </Stack>
  );
}
