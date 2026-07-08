/**
 * Num — texte à chiffres tabulaires (tabular-nums), pour aligner les montants
 * et quantités (GUIDELINES §3.1 : « tabular-nums dans les tableaux »).
 * Conserve la police proportionnelle ; ajoute seulement font-variant-numeric.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/Num.tsx` (DM-7), inchangé.
 */
import { Text, type TextProps, type ElementProps } from '@mantine/core';

type NumProps = TextProps & ElementProps<'span', keyof TextProps>;

export function Num({ style, ...props }: NumProps) {
  return <Text component="span" {...props} style={[{ fontVariantNumeric: 'tabular-nums' }, style]} />;
}
