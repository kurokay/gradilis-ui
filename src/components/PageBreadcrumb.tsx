/**
 * PageBreadcrumb — fil d'Ariane de page (convention playbook §4 : jamais
 * re-hardcoder `<Breadcrumbs>` Mantine dans les écrans).
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/PageBreadcrumb.tsx`
 * (DM-7). Adaptation Pépinière : suppression de l'assertion non-nulle
 * (`parent.to!`) interdite par typescript-eslint strict — repli explicite '/'.
 */
import { Breadcrumbs, Anchor, Text, Group } from '@mantine/core';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useGradilisLabels } from '../lib/labels.js';

export interface Crumb {
  label: string;
  to?: string; // présent → lien cliquable ; absent → segment courant (non cliquable)
}

/**
 * « Accueil » (→ '/') est ajouté automatiquement en tête ; `items` ne contient
 * donc que les segments SOUS l'accueil. Le dernier segment est typiquement sans
 * `to` (page courante, affichée en dimmed).
 *
 * - Landmark `<nav aria-label>` + `aria-current="page"` + séparateurs `aria-hidden` (a11y).
 * - Sur < 768px : repli tactile « ← Parent » (l'ancêtre cliquable le plus proche) au lieu
 *   de la piste complète réempilée sur plusieurs lignes.
 */
export function PageBreadcrumb({ items, actions }: { items: Crumb[]; actions?: ReactNode }) {
  // ⚠️ Le segment racine et le nom du landmark sont INJECTABLES (`GradilisLabelsProvider`),
  // défauts FR identiques à l'historique. Sans ça, une app traduite affichait « Accueil »
  // sous une navigation en « Inicio » — cas réel relevé en recette côté magasin.
  const labels = useGradilisLabels().breadcrumb;
  const home: Crumb = { label: labels.home, to: '/' };
  const all: Crumb[] = [home, ...items];
  const isSmall = useMediaQuery('(max-width: 768px)') ?? false;

  // ⚠️ Backport 2026-08-01 — slot `actions` : un rang « fil ↔ actions », rendu
  // UNIQUEMENT si l'appelant en fournit (sinon markup strictement INCHANGÉ, ce
  // qui est la condition de non-régression pour Pépinière).
  // Le socle expose un SLOT, pas la fonctionnalité : le magasin y place son
  // bouton d'aide contextuelle `<PageHelp>`, qui dépend de son moteur de tours —
  // lequel n'a rien à faire ici. Un socle offre l'emplacement, pas le moteur.
  const withActions = (nav: ReactNode): ReactNode =>
    actions ? (
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        {nav}
        {actions}
      </Group>
    ) : (
      nav
    );

  if (isSmall) {
    // Ancêtre cliquable le plus proche (hors segment courant), sinon retour à l'accueil.
    const parent = [...all.slice(0, -1)].reverse().find((c) => c.to) ?? home;
    return withActions(
      <nav aria-label={labels.landmark}>
        <Anchor component={Link} to={parent.to ?? '/'} size="sm" mb="xs" display="inline-block">
          <Group gap={4} wrap="nowrap">
            <IconChevronLeft size={14} />
            {parent.label}
          </Group>
        </Anchor>
      </nav>,
    );
  }

  return withActions(
    <nav aria-label={labels.landmark}>
      <Breadcrumbs mb="xs" separator={<span aria-hidden="true">/</span>}>
        {all.map((c, i) => {
          // `aria-current="page"` doit désigner UN SEUL élément : le segment courant
          // (le dernier). Les intermédiaires non cliquables (sections sans page
          // d'atterrissage) restent dimmed mais sans aria-current.
          const isLast = i === all.length - 1;
          return c.to ? (
            <Anchor key={i} component={Link} to={c.to} size="sm">{c.label}</Anchor>
          ) : (
            <Text key={i} size="sm" c="dimmed" aria-current={isLast ? 'page' : undefined}>{c.label}</Text>
          );
        })}
      </Breadcrumbs>
    </nav>,
  );
}
