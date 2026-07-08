/**
 * CanonForm — formulaire de référence (§5/§9) : `@mantine/form` + `zodResolver`
 * (le schéma Zod est la source de vérité de la validation), messages d'erreur
 * FR, `data-autofocus` sur le premier champ, raccourci `Ctrl+S`/`Ctrl+Entrée`
 * (`useSaveShortcut`), soumission avec `notify.success`/`notify.error`, remise
 * à zéro confirmée par `openConfirm` (focus sûr côté Annuler).
 */
import { Button, Group, NumberInput, Paper, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconRotateClockwise } from '@tabler/icons-react';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';

import { Num } from '../components/Num.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { openConfirm } from '../lib/confirmModal.js';
import { notify } from '../lib/notify.js';
import { useSaveShortcut } from '../hooks/useSaveShortcut.js';

const ESPECES = ['Pommier', 'Poirier', 'Cerisier', 'Prunier', 'Abricotier', 'Pêcher'];

// Source de vérité de la validation (§5) — messages en français.
const schemaLot = z.object({
  nom: z.string().trim().min(3, 'Le nom du lot doit faire au moins 3 caractères'),
  espece: z.string().min(1, 'Choisir une espèce'),
  quantite: z
    .number({ invalid_type_error: 'Indiquer une quantité' })
    .int('La quantité doit être un nombre entier')
    .positive('La quantité doit être supérieure à zéro'),
  commentaire: z.string().max(200, '200 caractères maximum'),
});

type ValeursLot = z.infer<typeof schemaLot>;

const VALEURS_INITIALES: ValeursLot = { nom: '', espece: '', quantite: 0, commentaire: '' };

export function CanonForm() {
  const form = useForm<ValeursLot>({
    mode: 'uncontrolled',
    initialValues: VALEURS_INITIALES,
    validate: zodResolver(schemaLot),
  });

  const soumettre = form.onSubmit(
    (valeurs) => {
      // Démonstration : en réel, mutation TanStack Query vers /api (jamais
      // d'URL en dur — instance axios @/lib/api, playbook §4).
      notify.success(`Lot « ${valeurs.nom} » enregistré (démonstration).`, { title: 'Succès' });
      form.reset();
    },
    () => {
      notify.error('Le formulaire contient des erreurs — corriger les champs signalés.');
    },
  );

  // Ctrl+S / Ctrl+Entrée = enregistrer, même en pleine saisie dans un champ.
  useSaveShortcut(() => {
    soumettre();
  });

  const reinitialiser = () => {
    openConfirm({
      title: 'Réinitialiser le formulaire ?',
      children: <Text size="sm">Les valeurs saisies seront perdues.</Text>,
      labels: { confirm: 'Réinitialiser', cancel: 'Annuler' },
      confirmProps: { color: 'erreur' },
      onConfirm: () => {
        form.reset();
        notify.info('Formulaire réinitialisé.');
      },
    });
  };

  return (
    <Stack gap="sm" maw={560}>
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'Formulaire' }]} />
      <Text c="dimmed" size="sm">
        @mantine/form + zodResolver (erreurs FR), <Num inherit>Ctrl+S</Num> /{' '}
        <Num inherit>Ctrl+Entrée</Num> pour enregistrer, data-autofocus sur le premier champ,
        réinitialisation confirmée (openConfirm, focus sur Annuler).
      </Text>
      <Paper withBorder radius="md" p="lg" shadow="sm">
        <form onSubmit={soumettre}>
          <Stack gap="md">
            <TextInput
              label="Nom du lot"
              placeholder="Gala automne 2026"
              withAsterisk
              data-autofocus
              key={form.key('nom')}
              {...form.getInputProps('nom')}
            />
            <Select
              label="Espèce"
              placeholder="Choisir une espèce"
              withAsterisk
              data={ESPECES}
              key={form.key('espece')}
              {...form.getInputProps('espece')}
            />
            <NumberInput
              label="Quantité (arbres)"
              placeholder="0"
              withAsterisk
              min={0}
              thousandSeparator=" "
              key={form.key('quantite')}
              {...form.getInputProps('quantite')}
            />
            <Textarea
              label="Commentaire"
              placeholder="Observations (facultatif)"
              autosize
              minRows={2}
              key={form.key('commentaire')}
              {...form.getInputProps('commentaire')}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                leftSection={<IconRotateClockwise size={18} />}
                onClick={reinitialiser}
              >
                Réinitialiser
              </Button>
              <Button type="submit" leftSection={<IconDeviceFloppy size={18} />}>
                Enregistrer
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
