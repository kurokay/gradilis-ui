/**
 * CanonStates — les 4 états ingrats obligatoires (§3.1/§9), côte à côte :
 * vide AVEC action, chargement (skeleton), erreur (avec relance), succès.
 * Plus les retours d'action : toasts `notify.*` et confirmation destructrice
 * `openConfirm` (focus sûr côté Annuler).
 */
import { Alert, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import {
  IconCircleCheck,
  IconMoodEmpty,
  IconPlus,
  IconShieldOff,
  IconTrash,
} from '@tabler/icons-react';

import { EmptyState } from '../components/EmptyState.js';
import { ErrorState } from '../components/ErrorState.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { PageSkeleton } from '../components/PageSkeleton.js';
import { StatusScreen } from '../components/StatusScreen.js';
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
        {/* 1. Vide — toujours avec une action de sortie. Composant du socle : `EmptyState`. */}
        <Paper withBorder radius="md" p="lg">
          <EmptyState
            icon={<IconMoodEmpty size={28} />}
            title="Aucun lot pour cette saison"
            description="Commencez par créer un lot pour suivre le stock."
            action={
              <Button size="xs" leftSection={<IconPlus size={16} />}>
                Nouveau lot
              </Button>
            }
          />
        </Paper>

        {/* 2. Chargement — skeleton, jamais un écran blanc. Composant du socle :
            `PageSkeleton` (fallback de `<Suspense>` en usage réel ; ici cadré
            dans une carte pour tenir la grille de démonstration). */}
        <Paper withBorder radius="md" p="lg" style={{ overflow: 'hidden' }}>
          <PageSkeleton />
        </Paper>

        {/* 3. Erreur — expliquée, avec relance. Composant du socle : `ErrorState`
            (titre et motif surchargés pour coller à la mise en scène du canon ;
            le rappel « ce n'est pas une liste vide » vient du défaut injecté). */}
        <Paper withBorder radius="md" p="lg">
          <ErrorState
            title="Erreur de chargement"
            message="Impossible de récupérer les lots. Vérifier la connexion puis réessayer."
            onRetry={() => notify.info('Nouvelle tentative (démonstration).')}
          />
        </Paper>

        {/* 4. Succès — confirmation persistante en contexte (le toast, lui, est éphémère). */}
        <Alert color="succes" variant="light" icon={<IconCircleCheck size={18} />} title="Inventaire enregistré">
          Les 14 lots ont été mis à jour. Le bilan journalier reflétera ces quantités ce soir.
        </Alert>
      </SimpleGrid>

      <Text fw={600} mt="sm">
        Écran d'état plein-cadre (composant du socle : `StatusScreen`)
      </Text>
      <Paper withBorder radius="md">
        <StatusScreen
          mih={240}
          icon={<IconShieldOff size={32} />}
          title="Accès refusé"
          description={
            <>
              Cette section est réservée aux rôles : <strong>admin, superadmin</strong>.
            </>
          }
        />
      </Paper>

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
