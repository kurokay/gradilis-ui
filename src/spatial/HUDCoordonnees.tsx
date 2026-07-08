/**
 * HUDCoordonnees — Paper d'affichage position + message contextuel du plateau
 * spatial (K.0). Coordonnées en JetBrains Mono (fonte mono du thème) ; le
 * message porte une tonalité sémantique (raison de refus en K.2, coordonnées
 * mètres en K.3) TOUJOURS doublée d'une icône (WCAG 1.4.1 — jamais la couleur
 * seule). Région `role="status"` : les changements de message sont annoncés.
 *
 * Le formatage des chaînes (`col 4 · rang 2`, `12,4 m`) appartient à
 * l'appelant — via `@gradilis/ui/format` si des nombres FR sont en jeu.
 * Positionnement (overlay du plateau) : à la charge de l'appelant.
 */
import { Group, Paper, Text } from '@mantine/core';
import { IconAlertTriangle, IconCircleCheck, IconForbid2 } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type HUDTonalite = 'neutre' | 'succes' | 'alerte' | 'erreur';

export interface HUDCoordonneesProps {
  /** Position courante, déjà formatée (ex. « col 4 · rang 2 »). */
  coordonnees?: string | null;
  /** Message contextuel (ex. « Structure : pilier »). */
  message?: string | null;
  /** Tonalité du message (défaut neutre). */
  tonalite?: HUDTonalite;
}

const TONS: Record<
  Exclude<HUDTonalite, 'neutre'>,
  { couleur: string; Icone: ComponentType<{ size?: number; stroke?: number }> }
> = {
  succes: { couleur: 'succes.9', Icone: IconCircleCheck },
  alerte: { couleur: 'alerte.9', Icone: IconAlertTriangle },
  erreur: { couleur: 'erreur.9', Icone: IconForbid2 },
};

export function HUDCoordonnees({ coordonnees, message, tonalite = 'neutre' }: HUDCoordonneesProps) {
  const ton = tonalite === 'neutre' ? null : TONS[tonalite];
  return (
    <Paper withBorder shadow="sm" radius="md" px="sm" py="xs" role="status">
      <Group gap="sm" wrap="nowrap">
        {coordonnees ? (
          <Text ff="monospace" size="sm" fw={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {coordonnees}
          </Text>
        ) : null}
        {message ? (
          <Group gap={4} wrap="nowrap" c={ton ? ton.couleur : 'dimmed'}>
            {ton ? <ton.Icone size={16} stroke={1.75} /> : null}
            <Text size="sm">{message}</Text>
          </Group>
        ) : null}
      </Group>
    </Paper>
  );
}
