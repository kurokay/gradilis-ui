/**
 * Libellés du socle — point d'injection unique (Chantier « dé-brandification », étape 1).
 *
 * ## Le problème que ça résout
 *
 * Les primitives du socle (`PageBreadcrumb`, `FittedDataTable`) portaient leurs
 * textes EN DUR en français. Tant qu'une seule application les consommait, ça ne
 * se voyait pas. Dès qu'une seconde les adopte, c'est une régression garantie :
 * dans `gradilis_magasin`, le fil d'Ariane est traduit en 4 langues et un cas
 * réel a été relevé en recette — la navigation disait « Inicio » et le fil
 * « Accueil » juste en dessous. Un socle qui impose sa langue n'est pas un socle.
 *
 * ## Le contrat
 *
 * Sans `GradilisLabelsProvider`, les composants rendent EXACTEMENT les mêmes
 * chaînes qu'avant : les défauts ci-dessous sont les valeurs historiques, au
 * caractère près. ⚠️ **C'est délibéré et c'est la condition de non-régression** :
 * l'application Pépinière, qui consomme déjà ces primitives, n'a rien à faire et
 * ne change pas d'un pixel. L'injection est un OPT-IN.
 *
 * ⚠️ Ne pas « nettoyer » les défauts en les vidant ou en les passant en anglais :
 * ce serait casser en silence le seul consommateur actuel.
 *
 * ## Portée : les LIBELLÉS, pas les couleurs
 *
 * Les couleurs sémantiques n'ont PAS besoin d'injection et c'est une propriété
 * du socle, pas un oubli : `createGradilisTheme` enregistre les rampes
 * `succes`/`alerte`/`erreur`/`info` dans le thème de TOUTE application qui passe
 * par la factory. Un composant qui écrit `color="erreur"` est donc portable par
 * construction. Le seul écart réel était `color="gradilisGreen"` dans
 * `FittedDataTable` — une rampe de MARQUE, absente du thème du magasin — remplacé
 * par la primaire du thème (voir le commentaire sur place).
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface GradilisLabels {
  /** `PageBreadcrumb`. */
  breadcrumb: {
    /** Libellé du segment racine, ajouté automatiquement en tête. */
    home: string;
    /** `aria-label` du landmark `<nav>`. */
    landmark: string;
  };
  /** Bouton « ajuster à la hauteur » de `FittedDataTable`. */
  autoFit: {
    label: string;
    tooltip: string;
    ariaLabel: string;
  };
}

/**
 * Défauts = les chaînes historiques du socle, à l'identique.
 * ⚠️ Toute modification ici change le rendu de Pépinière SANS qu'elle ait rien
 * demandé. Pour changer les textes d'une app, passer par le provider.
 */
export const DEFAULT_LABELS: GradilisLabels = {
  breadcrumb: {
    home: 'Accueil',
    landmark: "Fil d'Ariane",
  },
  autoFit: {
    label: 'Auto',
    tooltip: "Ajuster le nombre de lignes à la hauteur de l'écran",
    ariaLabel: 'Ajuster automatiquement le nombre de lignes',
  },
};

/**
 * Surcharge PARTIELLE, section par section : une app qui ne veut traduire que le
 * fil d'Ariane n'a pas à réécrire les libellés de table.
 */
export type GradilisLabelsOverride = {
  [K in keyof GradilisLabels]?: Partial<GradilisLabels[K]>;
};

const LabelsContext = createContext<GradilisLabels>(DEFAULT_LABELS);

/**
 * ⚠️ Fusion par SECTION (deux niveaux), pas un `{...defaults, ...value}` plat :
 * un spread plat remplacerait `breadcrumb` en entier, donc surcharger `home`
 * seul FERAIT DISPARAÎTRE `landmark` — un `aria-label` vide sur un landmark,
 * c'est-à-dire une régression d'accessibilité invisible à l'écran.
 */
export function GradilisLabelsProvider({
  value,
  children,
}: {
  value: GradilisLabelsOverride;
  children: ReactNode;
}) {
  const merged = useMemo<GradilisLabels>(
    () => ({
      breadcrumb: { ...DEFAULT_LABELS.breadcrumb, ...value.breadcrumb },
      autoFit: { ...DEFAULT_LABELS.autoFit, ...value.autoFit },
    }),
    [value],
  );
  return <LabelsContext.Provider value={merged}>{children}</LabelsContext.Provider>;
}

/**
 * Libellés courants. Hors provider, rend les défauts — les primitives restent
 * donc utilisables telles quelles, sans montage particulier (et les tests
 * existants n'ont rien à changer).
 */
export function useGradilisLabels(): GradilisLabels {
  return useContext(LabelsContext);
}
