/**
 * CanonStates — les 4 états ingrats obligatoires (§3.1/§9), côte à côte :
 * vide AVEC action, chargement (skeleton), erreur (avec relance), succès.
 * Plus les retours d'action : toasts `notify.*` et confirmation destructrice
 * `openConfirm` (focus sûr côté Annuler).
 */
import { Alert, Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconMoodEmpty,
  IconPlus,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';

import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { openConfirm } from '../lib/confirmModal.js';
import { notify } from '../lib/notify.js';

export function CanonStates() {
  const confirmerSuppression = () => {
    openConfirm({
      title: 'Supprimer le lot ?',
      children: <Text size="sm">Cette action est irréversible (démonstration).</Text>,
      labels: { confirm: 'Supprimer', cancel: 'Annuler' },
      confirmProps: { color: 'erreur' },
      onConfirm: () => notify.success('Lot supprimé (démonstration).'),
    });
  };

  return (
    <Stack gap="sm">
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'États ingrats' }]} />
      <Text c="dimmed" size="sm">
        Les 4 états obligatoires de tout écran : vide (avec action), chargement (skeleton),
        erreur (avec relance), succès. L'icône double toujours la couleur (WCAG 1.4.1).
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {/* 1. Vide — toujours avec une action de sortie. */}
        <Paper withBorder radius="md" p="lg">
          <Stack align="center" gap="xs">
            <ThemeIcon variant="light" color="gray" size={48} radius="xl">
              <IconMoodEmpty size={28} />
            </ThemeIcon>
            <Text fw={500}>Aucun lot pour cette saison</Text>
            <Text size="sm" c="dimmed" ta="center">
              Commencez par créer un lot pour suivre le stock.
            </Text>
            <Button size="xs" leftSection={<IconPlus size={16} />}>
              Nouveau lot
            </Button>
          </Stack>
        </Paper>

        {/* 2. Chargement — skeleton, jamais un écran blanc. `role="status"` :
            région d'attente annoncée poliment (aria-label seul serait interdit
            sur un div sans rôle — axe aria-prohibited-attr). */}
        <Paper withBorder radius="md" p="lg" role="status" aria-busy="true" aria-label="Chargement en cours">
          <Stack>
            <Skeleton height={32} radius="sm" />
            <Skeleton height={32} radius="sm" width="80%" />
            <Skeleton height={32} radius="sm" width="60%" />
          </Stack>
        </Paper>

        {/* 3. Erreur — expliquée, avec relance. */}
        <Alert color="erreur" variant="light" icon={<IconAlertTriangle size={18} />} title="Erreur de chargement">
          <Stack gap="xs" align="flex-start">
            <Text size="sm">Impossible de récupérer les lots. Vérifier la connexion puis réessayer.</Text>
            <Button size="xs" variant="light" color="erreur" leftSection={<IconRefresh size={16} />}>
              Réessayer
            </Button>
          </Stack>
        </Alert>

        {/* 4. Succès — confirmation persistante en contexte (le toast, lui, est éphémère). */}
        <Alert color="succes" variant="light" icon={<IconCircleCheck size={18} />} title="Inventaire enregistré">
          Les 14 lots ont été mis à jour. Le bilan journalier reflétera ces quantités ce soir.
        </Alert>
      </SimpleGrid>

      <Text fw={600} mt="sm">
        Retours d'action (toasts et confirmation)
      </Text>
      <Group>
        <Button onClick={() => notify.success('Action réalisée.', { title: 'Succès' })}>
          Toast succès
        </Button>
        <Button
          variant="light"
          color="erreur"
          onClick={() => notify.error('Quelque chose a échoué.')}
        >
          Toast erreur
        </Button>
        <Button variant="light" color="alerte" onClick={() => notify.warning('Stock presque épuisé.')}>
          Toast avertissement
        </Button>
        <Button
          variant="outline"
          color="erreur"
          leftSection={<IconTrash size={18} />}
          onClick={confirmerSuppression}
        >
          Confirmation destructrice
        </Button>
      </Group>
    </Stack>
  );
}
