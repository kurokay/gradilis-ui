/**
 * PageSkeleton — squelette générique de page, pensé comme fallback de
 * `<Suspense>` pendant le chargement d'un chunk lazy. Reproduit la silhouette
 * d'une page type (en-tête titre + sous-titre + action, puis bloc de contenu)
 * pour une transition douce.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/PageSkeleton.tsx` (lot L3).
 * ⚠️ `role="status"` : un `aria-label` seul sur un `<div>` sans rôle est un
 * `aria-prohibited-attr` (règle axe) — même piège que documenté dans le canon
 * du socle (`CanonStates`). `aria-busy` complète le rôle (DESIGN.md §5, état 2).
 *
 * `rest` est étalé sur le conteneur : un consommateur qui a besoin d'un
 * marqueur applicatif (ex. pour synchroniser un moteur de visite guidée avec
 * la fin du chargement) le pose lui-même via une prop `data-*`, sans que le
 * socle en connaisse le nom.
 */
import { Skeleton, Stack, Group } from '@mantine/core';
import type { ComponentPropsWithoutRef } from 'react';
import { useGradilisLabels } from '../lib/labels.js';

/**
 * Props du conteneur `<div>` racine (`Stack` les étale) — ouvre la porte à un
 * marqueur applicatif (`data-*`) sans que le socle en connaisse le nom.
 */
export type PageSkeletonProps = ComponentPropsWithoutRef<'div'>;

export function PageSkeleton(props: PageSkeletonProps = {}) {
  const labels = useGradilisLabels().states;
  return (
    <Stack gap="lg" role="status" aria-busy="true" aria-label={labels.pageLoading} {...props}>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={8} style={{ flex: '1 1 240px', minWidth: 0 }}>
          <Skeleton height={30} maw={260} radius="sm" />
          <Skeleton height={16} maw={360} radius="sm" />
        </Stack>
        <Skeleton height={36} w={150} radius="sm" />
      </Group>
      <Stack gap="sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={52} radius="sm" />
        ))}
      </Stack>
    </Stack>
  );
}
