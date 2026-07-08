/**
 * CanonAppShell — layout de référence de l'app-canon (GUIDELINES §4/§9) :
 * AppShell v8 (`header={{height}}`, `navbar={{width,breakpoint,collapsed}}`),
 * sidebar `AppShell.Section` (grow scrollable + section fixe en bas), `NavLink`
 * actifs pilotés par le router, `Burger` responsive via `useDisclosure`.
 *
 * Monté par la SPA comme route layout sous `/canon` (plan M.2/DM-2) : les
 * sections du canon se rendent dans l'`Outlet`. Adapté du `Canon.tsx` du
 * magasin (page unique à ancres) vers un vrai AppShell — le canon Pépinière
 * démontre AUSSI le layout cible, pas seulement les composants.
 */
import { AppShell, Burger, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconChartBar,
  IconForms,
  IconPalette,
  IconTable,
  IconZoomScan,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const SECTIONS = [
  { path: 'tableau', label: 'Tableau métier', icone: IconTable },
  { path: 'formulaire', label: 'Formulaire', icone: IconForms },
  { path: 'kpi', label: 'KPI & graphe', icone: IconChartBar },
  { path: 'etats', label: 'États ingrats', icone: IconAlertCircle },
  { path: 'couleurs', label: 'Couleurs', icone: IconPalette },
  { path: 'spatial', label: 'Plateau spatial', icone: IconZoomScan },
] as const;

export function CanonAppShell() {
  const [ouvert, { toggle, close }] = useDisclosure(false);
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !ouvert } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger
            opened={ouvert}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Ouvrir ou fermer la navigation"
          />
          {/* Titres en brun idx 7 (#654E45, 7,70:1) — neutre chaud §3.2. */}
          <Title order={4} c="gradilisBrown.7">
            Gradilis Pépinière — app-canon
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          {SECTIONS.map(({ path, label, icone: Icone }) => (
            <NavLink
              key={path}
              component={Link}
              to={path}
              label={label}
              // Icônes : Tabler outline, 18–20 px en ligne (§3.6).
              leftSection={<Icone size={18} stroke={1.75} />}
              active={pathname.endsWith(`/${path}`)}
              onClick={close}
            />
          ))}
        </AppShell.Section>
        <AppShell.Section pt="sm">
          <Text size="xs" c="dimmed">
            Référence charte §9 — « comparer à l'app-canon » = rendre cette page et confronter.
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* `id="main-content"` : ancre de mesure de useAutoPageSize (auto-fit des
          tables) — même convention que le layout magasin. */}
      <AppShell.Main id="main-content">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
