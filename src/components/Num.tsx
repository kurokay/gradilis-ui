/**
 * Num — texte à chiffres tabulaires (tabular-nums), pour aligner les montants
 * et quantités (GUIDELINES §3.1 : « tabular-nums dans les tableaux »).
 * Conserve la police proportionnelle ; ajoute seulement font-variant-numeric.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/Num.tsx` (DM-7).
 *
 * ⚠️ Backport 2026-08-01 : le socle expose `configureNum({ markerClass })`, une
 * classe marqueur ajoutée à CHAQUE instance. Sans appel, rien ne change
 * (`undefined` par défaut) — aucune app n'en hérite sans l'avoir demandé.
 *
 * Le besoin qui l'a motivé (mode confidentiel de `gradilis_magasin`) : flouter
 * en CSS les ~266 montants d'un écran d'un seul geste, via une classe posée sur
 * `<html>`. ⚠️ Le point ENTIER est que les `<Num>` ne s'abonnent à AUCUN
 * contexte : un marqueur statique + une règle CSS, sinon basculer le mode
 * re-rendrait tout l'écran au lieu du seul bouton. Ne pas « améliorer » ça en y
 * branchant un contexte React.
 */
import { Text, type TextProps, type ElementProps } from '@mantine/core';

type NumProps = TextProps & ElementProps<'span', keyof TextProps>;

/** Classe marqueur ajoutée à chaque `<Num>`. `undefined` = comportement historique. */
let markerClass: string | undefined;

/**
 * Configure les `<Num>` de l'application. À appeler UNE fois au démarrage, avant
 * le premier rendu (typiquement `main.tsx`, à côté du `MantineProvider`).
 *
 * ⚠️ Réglage de MODULE et non contexte React, délibérément : un contexte ferait
 * s'abonner chaque `<Num>`, exactement ce que ce composant existe pour éviter.
 * Contrepartie assumée : la valeur est globale au bundle — pas deux
 * configurations simultanées dans une même page.
 */
export function configureNum(options: { markerClass?: string }): void {
  markerClass = options.markerClass;
}

export function Num({ style, className, ...props }: NumProps) {
  const classes = [markerClass, className].filter(Boolean).join(' ');
  return (
    <Text
      component="span"
      {...props}
      className={classes || undefined}
      style={[{ fontVariantNumeric: 'tabular-nums' }, style]}
    />
  );
}
