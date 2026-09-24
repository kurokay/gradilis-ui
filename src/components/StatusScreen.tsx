/**
 * StatusScreen — écran d'état plein-cadre partagé par les gardes de route
 * (accès refusé, module non activé, etc.).
 *
 * Repris de l'app de référence (backport).
 * Une seule source de vérité pour l'icône ronde, le titre, le message et le
 * bouton de retour : un ajustement d'espacement/a11y/charte se fait ici et
 * profite à tous les écrans qui le consomment.
 *
 * Le lien de retour utilise `react-router` (`<Link>`) — dépendance déjà posée
 * par le socle (peer `react-router`, cf. `PageBreadcrumb`). Libellé injectable
 * via `GradilisLabelsProvider` (`labels.states.homeAction`).
 */
import { Link } from 'react-router';
import { Center, Stack, Text, ThemeIcon, Button } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useGradilisLabels } from '../lib/labels.js';

export interface StatusScreenProps {
  /** Icône (élément déjà instancié) posée dans le médaillon gris. */
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  /** Hauteur minimale du conteneur centré (défaut plein écran). */
  mih?: string | number;
  /** Cible du bouton de retour (défaut `/`). */
  homeTo?: string;
  /**
   * Remplace entièrement le bouton de retour par défaut (ex. deux actions,
   * ou aucune). Prioritaire sur `homeTo`.
   */
  action?: ReactNode;
}

export function StatusScreen({ icon, title, description, mih = '100vh', homeTo = '/', action }: StatusScreenProps) {
  const labels = useGradilisLabels().states;
  return (
    <Center mih={mih}>
      <Stack align="center" gap="md">
        <ThemeIcon variant="light" color="gray" size={64} radius="xl">
          {icon}
        </ThemeIcon>
        <div style={{ textAlign: 'center' }}>
          <Text fw={600} fz="lg">
            {title}
          </Text>
          <Text size="sm" c="dimmed" mt={4} maw={360}>
            {description}
          </Text>
        </div>
        {action ?? (
          <Button component={Link} to={homeTo} leftSection={<IconHome size={16} />}>
            {labels.homeAction}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
