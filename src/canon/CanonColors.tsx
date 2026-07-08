/**
 * CanonColors — nuanciers des 8 rampes du thème avec index (aide au contrôle
 * AA, §3.2/§3.7). Les hex affichés viennent du THÈME À L'EXÉCUTION
 * (`useMantineTheme()`), jamais de littéraux : ce fichier passe le lint
 * anti-hex sans exception — ce que l'on voit est ce que le thème sert.
 */
import {
  Badge,
  ColorSwatch,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
  type MantineColorsTuple,
} from '@mantine/core';

import { Num } from '../components/Num.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';

const RAMPES: { cle: string; role: string; regle: string }[] = [
  {
    cle: 'gradilisGreen',
    role: 'Primaire / action',
    regle: 'Boutons pleins = idx 7 (blanc dessus 5,86:1 AA) ; identité = idx 6 (texte large/gras seulement).',
  },
  {
    cle: 'gradilisLime',
    role: 'Accent / signature',
    regle: 'Highlights, séries de graphes, déco — JAMAIS en texte ni fond de bouton (idx 5 sur blanc = 2,09:1).',
  },
  {
    cle: 'gradilisBrown',
    role: 'Neutre chaud',
    regle: 'Titres et libellés en idx 7 (7,70:1 sur blanc).',
  },
  {
    cle: 'gradilisGray',
    role: 'Neutres',
    regle: 'Surfaces, textes secondaires, bordures.',
  },
  {
    cle: 'succes',
    role: 'Sémantique succès',
    regle: 'Ancre §3.2 assombrie en idx 9 (AA) — divergence consignée dans DESIGN.md.',
  },
  {
    cle: 'alerte',
    role: 'Sémantique alerte',
    regle: 'Ambre — texte foncé requis sur fond plein (autoContrast s’en charge).',
  },
  {
    cle: 'erreur',
    role: 'Sémantique erreur',
    regle: 'Terracotta (pont Au Mas Paysan) — idx 7, blanc dessus 5,15:1.',
  },
  {
    cle: 'info',
    role: 'Sémantique info',
    regle: 'Ardoise — idx 9, 7,37:1.',
  },
];

export function CanonColors() {
  const theme = useMantineTheme();
  // Les rampes custom ne sont pas déclarées via augmentation de module (choix
  // M.1) : on élargit le type d'indexation, les clés de RAMPES sont celles du
  // thème (theme.ts).
  const couleurs = theme.colors as Record<string, MantineColorsTuple | undefined>;

  return (
    <Stack gap="sm">
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'Couleurs' }]} />
      <Text c="dimmed" size="sm">
        Les 8 rampes du thème, index 0 (clair) → 9 (foncé). Hex lus dans le thème à l'exécution —
        source unique : @gradilis/ui (colors.ts/theme.ts), seuls fichiers autorisés à contenir des hex.
      </Text>
      {RAMPES.map(({ cle, role, regle }) => {
        const rampe = couleurs[cle] ?? [];
        return (
          <Paper key={cle} withBorder radius="md" p="md">
            <Group gap="xs" mb="xs">
              <Title order={4} c="gradilisBrown.7">
                {cle}
              </Title>
              <Badge variant="light" color="gradilisGray">
                {role}
              </Badge>
            </Group>
            <Group gap="xs" align="flex-start">
              {rampe.map((hex, index) => (
                <Stack key={index} gap={2} align="center">
                  <ColorSwatch color={hex} size={40} radius="sm" withShadow={false} />
                  <Num size="xs" fw={600}>
                    {index}
                  </Num>
                  <Num size="xs" c="dimmed" ff="monospace">
                    {hex.toUpperCase()}
                  </Num>
                </Stack>
              ))}
            </Group>
            <Text size="sm" c="dimmed" mt="xs">
              {regle}
            </Text>
          </Paper>
        );
      })}
    </Stack>
  );
}
