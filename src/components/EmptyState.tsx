/**
 * EmptyState — bloc générique pour un écran/section rendu à vide : icône,
 * titre, description optionnelle, action optionnelle, centrés verticalement.
 *
 * Repris de l'app de référence (backport), dans sa version Mantine 9.6 : construit
 * sur le composant `EmptyState` de `@mantine/core` (taille `md`, variante `light`) —
 * médaillon de 96 px, icône portée à 48 px par la feuille de Mantine (`> svg { 1em }`,
 * quelle que soit la `size` passée à l'icône), titre 600 à la taille `lg`.
 * ⚠️ Jusqu'à v0.9.0, le socle évitait ce composant parce que ses peers admettaient
 * Mantine 9.5, où il n'est pas garanti ; les peers exigent `>=9.6.0` depuis v0.9.0,
 * la raison est tombée — et la version « primitives » (médaillon 48 px, titre 500/md)
 * divergeait visiblement de l'app de référence.
 *
 * Ni `Paper` ni bordure : l'appelant choisit son propre conteneur (une carte,
 * une cellule de grille, une section pleine largeur…) — imposer un cadre ici
 * doublerait celui d'un appelant qui en a déjà un.
 *
 * `title` n'est jamais rendu comme titre sémantique (`h*`) : Mantine le rend en
 * `div` (pas de prop `order`), pour ne pas déplacer la hiérarchie de titres de la page appelante.
 *
 * @example
 * <EmptyState
 *   icon={<IconReceipt size={26} />}
 *   title="Aucune facture"
 *   description="Les factures de ce fournisseur apparaîtront ici."
 *   action={<Button leftSection={<IconPlus size={16} />}>Nouvelle facture</Button>}
 * />
 */
import { EmptyState as MantineEmptyState } from '@mantine/core';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Le plus souvent un bouton de sortie (§5 — « Vide » exige une action). */
  action?: ReactNode;
  /**
   * Couleur sémantique du médaillon d'icône (clé du thème). `gray` par
   * défaut (vide neutre) ; `ErrorState` passe `erreur`.
   */
  color?: string;
}

export function EmptyState({ icon, title, description, action, color = 'gray' }: EmptyStateProps) {
  return (
    // ⚠️ Pas de prop `order` : Mantine rend alors le titre en `div`, jamais en `h*` —
    // un état vide ne doit pas déplacer la hiérarchie de titres de la page appelante.
    <MantineEmptyState icon={icon} title={title} description={description} variant="light" color={color} py="xl">
      {action && <MantineEmptyState.Actions>{action}</MantineEmptyState.Actions>}
    </MantineEmptyState>
  );
}
