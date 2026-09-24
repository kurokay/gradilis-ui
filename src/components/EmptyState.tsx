/**
 * EmptyState — bloc générique pour un écran/section rendu à vide : icône,
 * titre, description optionnelle, action optionnelle, centrés verticalement.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/EmptyState.tsx` (lot L3).
 * Volontairement construit sur les primitives Mantine (`Stack`/`ThemeIcon`/`Text`)
 * plutôt que sur un composant `EmptyState` propre à `@mantine/core` : le peer
 * range du socle couvre `>=9.5.0`, et rien ne garantit qu'un tel composant
 * existe déjà à ce plancher — pour ne pas lier le socle à une mineure Mantine
 * récente, on reste sur les primitives déjà utilisées ailleurs dans le socle.
 *
 * Ni `Paper` ni bordure : l'appelant choisit son propre conteneur (une carte,
 * une cellule de grille, une section pleine largeur…) — imposer un cadre ici
 * doublerait celui d'un appelant qui en a déjà un.
 *
 * `title` n'est jamais rendu comme titre sémantique (`h*`) : par défaut un
 * `<Text>`, pour ne pas déplacer la hiérarchie de titres de la page appelante.
 *
 * @example
 * <EmptyState
 *   icon={<IconReceipt size={26} />}
 *   title="Aucune facture"
 *   description="Les factures de ce fournisseur apparaîtront ici."
 *   action={<Button leftSection={<IconPlus size={16} />}>Nouvelle facture</Button>}
 * />
 */
import { Stack, Text, ThemeIcon } from '@mantine/core';
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
    <Stack align="center" gap="xs" py="xl">
      {icon && (
        <ThemeIcon variant="light" color={color} size={48} radius="xl">
          {icon}
        </ThemeIcon>
      )}
      <Text fw={500} ta="center">
        {title}
      </Text>
      {description && (
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
      )}
      {action}
    </Stack>
  );
}
