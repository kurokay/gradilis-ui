/**
 * CanonColors — nuanciers des rampes du thème avec index (aide au contrôle AA,
 * §3.2/§3.7). Les hex affichés viennent du THÈME À L'EXÉCUTION
 * (`useMantineTheme()`), jamais de littéraux.
 *
 * AGNOSTIQUE : par défaut, montre la primaire du thème + les rampes socle
 * (neutre + sémantiques). Chaque app passe sa propre liste `rampes` (avec ses
 * rampes de marque et sa prose §3.2) pour documenter sa charte complète.
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

/** Description d'une rampe pour le nuancier (fournie par l'app pour sa charte). */
export interface RampeDoc {
  /** Clé de la rampe dans `theme.colors`. */
  cle: string;
  /** Rôle affiché (badge). */
  role: string;
  /** Règle d'usage §3.2 (optionnelle). */
  regle?: string;
}

export interface CanonColorsProps {
  /** Rampes à documenter. Défaut : primaire du thème + rampes socle. */
  rampes?: RampeDoc[];
}

export function CanonColors({ rampes }: CanonColorsProps = {}) {
  const theme = useMantineTheme();
  // Les rampes custom ne sont pas déclarées via augmentation de module : on
  // élargit le type d'indexation, les clés visées sont celles du thème.
  const couleurs = theme.colors as Record<string, MantineColorsTuple | undefined>;

  // Défaut agnostique : la primaire (quelle que soit la marque) + le socle.
  const liste: RampeDoc[] = rampes ?? [
    { cle: theme.primaryColor, role: 'Primaire / action' },
    { cle: 'gradilisGray', role: 'Neutres' },
    { cle: 'succes', role: 'Sémantique succès' },
    { cle: 'alerte', role: 'Sémantique alerte' },
    { cle: 'erreur', role: 'Sémantique erreur' },
    { cle: 'info', role: 'Sémantique info' },
  ];

  return (
    <Stack gap="sm">
      <PageBreadcrumb items={[{ label: 'App-canon', to: '/canon' }, { label: 'Couleurs' }]} />
      <Text c="dimmed" size="sm">
        Rampes du thème, index 0 (clair) → 9 (foncé). Hex lus dans le thème à l'exécution —
        source unique : @gradilis/ui (tokens de marque + colors.ts socle).
      </Text>
      {liste.map(({ cle, role, regle }) => {
        const rampe = couleurs[cle] ?? [];
        return (
          <Paper key={cle} withBorder radius="md" p="md">
            <Group gap="xs" mb="xs">
              <Title order={4}>{cle}</Title>
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
            {regle ? (
              <Text size="sm" c="dimmed" mt="xs">
                {regle}
              </Text>
            ) : null}
          </Paper>
        );
      })}
    </Stack>
  );
}
