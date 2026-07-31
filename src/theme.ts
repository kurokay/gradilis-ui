import {
  createTheme,
  rem,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core';
import {
  gradilisGray,
  semSuccess,
  semWarning,
  semError,
  semInfo,
} from './colors.js';
import {
  gradilisGreen,
  gradilisLime,
  gradilisBrown,
} from './tokens/pepiniere.js';

/**
 * Socle de thème Gradilis — AGNOSTIQUE de marque.
 *
 * Deux couches (plan d'extraction, Étape 2) :
 *   1. FIGÉ dans le socle : structure (typo, espacement, rayons, ombres,
 *      `autoContrast`, `primaryShade`, `respectReducedMotion`) + le neutre
 *      `gradilisGray` + les rampes SÉMANTIQUES sous leurs noms canoniques FR
 *      `succes/alerte/erreur/info`. Ces rampes sont invariantes entre marques
 *      (vérifié : magasin et pépinière partagent les mêmes valeurs).
 *   2. INJECTÉ par l'app : rampes de MARQUE + nom de la primaire + polices.
 *
 * Les composants partagés (`canon`, primitives) référencent les sémantiques par
 * ces noms canoniques — d'où leur appartenance au socle, pas aux tokens.
 */

/** Tokens de marque fournis par l'app consommatrice. */
export interface GradilisThemeTokens {
  /** Nom de la rampe primaire (doit exister dans `brandRamps`). Ex. `'ampOlive'`. */
  primaryColor: string;
  /** Rampes d'identité de la marque (nombre/noms libres). Ex. olive+terracotta+brique+crème, ou vert+lime+brun. */
  brandRamps: Record<string, MantineColorsTuple>;
  /** Piles de polices (optionnel — défauts Inter / JetBrains Mono). */
  fonts?: {
    body?: string;
    monospace?: string;
    headings?: string;
  };
}

const DEFAULT_FONTS = {
  body: 'Inter, "IBM Plex Sans", system-ui, -apple-system, sans-serif',
  monospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  headings: 'Inter, system-ui, sans-serif',
} as const;

/** Rampes sémantiques FIGÉES du socle, sous les noms canoniques FR. */
const SEMANTIC_RAMPS = {
  succes: semSuccess,
  alerte: semWarning,
  erreur: semError,
  info: semInfo,
} as const;

/**
 * Fabrique le thème Mantine Gradilis à partir des tokens de marque.
 * La structure et les sémantiques viennent du socle ; l'app n'apporte que son
 * identité colorée et ses polices.
 */
export function createGradilisTheme(tokens: GradilisThemeTokens): MantineThemeOverride {
  const fonts = { ...DEFAULT_FONTS, ...tokens.fonts };
  return createTheme({
    primaryColor: tokens.primaryColor,
    // Contrôles pleins (boutons) — l'indice DIFFÈRE par schéma, et ce n'est pas
    // une préférence esthétique : un bouton plein doit satisfaire DEUX seuils à
    // la fois, son libellé (4,5:1, WCAG 1.4.3) ET sa propre forme contre le fond
    // de page (3:1, WCAG 1.4.11). Sur fond CLAIR l'idx 7 tient les deux ; sur
    // fond SOMBRE (#242424) il s'effondre à 1,95:1 de forme — le bouton devient
    // invisible en tant que forme, mesuré sur les deux marques :
    //     ampOlive[7]      #555232  forme 1,95:1  libellé blanc 7,96:1
    //     gradilisGreen[7] #00752D  forme 2,65:1  libellé blanc 5,86:1
    // ⚠️ Aucun indice SOMBRE de ces rampes ne satisfait les deux contraintes :
    // plus l'indice fonce, plus le libellé blanc gagne et plus la forme perd.
    // La sortie est de passer de l'autre côté du seuil `luminanceThreshold` —
    // idx 3 a une luminance > 0.3, donc `autoContrast` bascule le libellé en
    // NOIR, et les deux seuils passent largement :
    //     ampOlive[3]      #aeab94  forme 6,69:1  libellé noir 9,05:1
    //     gradilisGreen[3] #77C293  forme 7,33:1  libellé noir 9,92:1
    // C'est le patron standard du mode sombre (contrôle clair, libellé foncé).
    primaryShade: { light: 7, dark: 3 },
    autoContrast: true,
    luminanceThreshold: 0.3,
    // a11y : respecte `prefers-reduced-motion` (WCAG 2.3.3).
    respectReducedMotion: true,

    colors: {
      ...tokens.brandRamps,
      gradilisGray,
      ...SEMANTIC_RAMPS,
    },
    white: '#ffffff',
    black: gradilisGray[9],

    fontFamily: fonts.body,
    fontFamilyMonospace: fonts.monospace,
    headings: {
      fontFamily: fonts.headings,
      fontWeight: '600',
    },
    // Tailles en rem (`rem()` → `calc(Xrem * var(--mantine-scale))`) : respecte
    // le zoom texte du navigateur (WCAG 1.4.4). Base métier dense = 14 px (`sm`).
    fontSizes: {
      xs: rem(12),
      sm: rem(14),
      md: rem(16),
      lg: rem(18),
      xl: rem(22),
    },
    lineHeights: {
      xs: '1.4',
      sm: '1.45',
      md: '1.5',
      lg: '1.5',
      xl: '1.5',
    },
    // Espacement / rayons — grille 4 px (§3.5), en rem (zoom-safe).
    spacing: {
      xs: rem(8),
      sm: rem(12),
      md: rem(16),
      lg: rem(24),
      xl: rem(32),
    },
    radius: {
      xs: rem(4),
      sm: rem(6),
      md: rem(8),
      lg: rem(12),
      xl: rem(16),
    },
    defaultRadius: 'md',
    // Ombres — usage minimal (§3.5), teinte gradilisGray[9].
    shadows: {
      sm: '0 1px 3px rgba(32, 31, 31, 0.08), 0 1px 2px rgba(32, 31, 31, 0.06)',
      md: '0 4px 12px rgba(32, 31, 31, 0.10)',
    },
  });
}

/** Surcharges applicatives des variables CSS (tokens métier propres à une app). */
export interface CssVarsExtras {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

/**
 * Fabrique le `cssVariablesResolver` à passer à `<MantineProvider>`.
 *
 * Le socle pose les tokens génériques (dérivés des sémantiques figées + de la
 * primaire de marque pour `--gradilis-bg-brand`). Point d'extension `extras` :
 * l'app y ajoute ses tokens métier (ex. magasin `--gradilis-avail-*`,
 * `--gradilis-season-edge`) sans que le socle les connaisse.
 */
export function makeCssVars(
  tokens: GradilisThemeTokens,
  extras: CssVarsExtras = {},
): CSSVariablesResolver {
  const brand = tokens.brandRamps[tokens.primaryColor];
  return () => ({
    variables: {},
    light: {
      // `c="dimmed"` par défaut Mantine (#868E96) = 3,3:1 sur blanc (< AA).
      // Ré-ancré sur la neutre mesurée : gradilisGray[6] #5C5B5A = 6,69:1.
      '--mantine-color-dimmed': gradilisGray[6],
      // Titres de page / d'encart teintés marque. Existe parce que la valeur
      // NE PEUT PAS être un indice fixe : brand[8] donne 10,7:1 sur blanc mais
      // 1,46:1 sur le fond sombre (1,27:1 sur une carte) — invisible. Écrire
      // `c="<marque>.8"` en dur dans une page est donc toujours un bug latent ;
      // ce token est la seule forme correcte, et il évite de répéter un
      // `light-dark()` sur chaque titre.
      '--gradilis-title': brand[8],
      '--gradilis-bg-subtle': gradilisGray[0],
      '--gradilis-bg-brand': brand[0],
      '--gradilis-bg-danger': semError[0],
      '--gradilis-bg-warning': semWarning[0],
      '--gradilis-bg-info': semInfo[0],
      '--gradilis-border': gradilisGray[2],
      '--gradilis-border-muted': gradilisGray[1],
      '--gradilis-icon-muted': gradilisGray[4],
      ...extras.light,
    },
    // ⚠️⚠️ Bloc SOMBRE — ré-étalonné le 2026-07-31 après audit mesuré.
    //
    // L'ancien bloc portait des hex écrits en dur (#25262b / #2C2E33 / #373A40)
    // qui étaient les valeurs de la rampe `dark` de Mantine **v6/v7**, BLEUTÉES
    // (teinte 220–230°). Mantine v9 a basculé sa rampe sombre en gris neutre
    // (#242424, saturation 0 %) — les tokens n'ont pas suivi. Résultat : trois
    // températures sur le même écran (tokens bleutés + surfaces neutres + marque
    // chaude). C'est la cause de l'impression de « teintes fausses » en sombre.
    //
    // Trois défauts mesurés, corrigés ici :
    //   1. `bg-subtle` était à 1,03:1 du fond de page → littéralement invisible.
    //   2. Les CINQ fonds sémantiques s'écrasaient sur DEUX valeurs
    //      (brand == danger == warning, subtle == info) : toute l'information
    //      portée par la couleur de fond était perdue en sombre.
    //   3. `border` (1,36:1) était plus SOMBRE que la bordure par défaut de
    //      Mantine (dark-4, 1,54:1) → deux tons de bordure sur une même page.
    //
    // Méthode : mélange linéaire d'une teinte dans le fond de page #242424. La
    // luminance reste volontairement basse et PROCHE entre sémantiques (1,14 à
    // 1,53:1) — c'est la TEINTE qui porte le sens, pas la clarté, pour que le
    // texte posé dessus garde un contraste homogène (mesuré : 6,1 à 8,2:1 pour
    // `--mantine-color-text`, 5,0 à 6,7:1 pour `dimmed`).
    dark: {
      // Voir la note du bloc clair : même défaut, jamais corrigé côté sombre.
      // Défaut Mantine `dark-2` #828282 = 4,04:1 sur la page et 3,53:1 sur une
      // carte (< AA) — et c'était 84 % de tous les défauts mesurés, parce que
      // `dimmed` porte TOUT le texte secondaire (libellés, unités, légendes).
      // gradilisGray[3] #B7B6B6 = 7,67:1 sur la page, 6,71:1 sur carte.
      // ⚠️ gradilisGray[4] passerait tout juste (5,15 / 4,50) — écart trop
      // mince pour absorber un fond légèrement plus clair. Ne pas « affiner ».
      '--mantine-color-dimmed': gradilisGray[3],
      // Liens. Défaut Mantine en sombre = `primary-4`, soit ampOlive[4] pour le
      // magasin → 4,37:1 sur carte, sous les 4,5 requis. Échec de PEU mais
      // parfaitement systématique (chaque lien de l'app). brand[3] = 5,85:1.
      '--mantine-color-anchor': brand[3],
      '--gradilis-title': brand[3], // 6,69:1 page / 5,85:1 carte
      '--gradilis-bg-subtle': '#363636', // 1,28:1 (était 1,03 — invisible)
      '--gradilis-bg-brand': '#33322d', // olive 16 %  · 1,21:1
      '--gradilis-bg-danger': '#402e29', // terracotta 16 % · 1,21:1
      '--gradilis-bg-warning': '#4f3f25', // ambre 21 %  · 1,53:1
      '--gradilis-bg-info': '#333435', // ardoise 16 % · 1,24:1
      '--gradilis-border': '#3e3e3e', // 1,45:1 (aligné sur Mantine dark-4)
      '--gradilis-border-muted': '#313131', // 1,19:1
      // Était gradilisGray[6] → 2,29:1, sous le seuil 3:1 des éléments non
      // textuels porteurs de sens (WCAG 1.4.11). gradilisGray[4] = 5,15:1.
      '--gradilis-icon-muted': gradilisGray[4],
      ...extras.dark,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Compat transitoire — thème pépinière prêt à l'emploi.                       */
/* Les tokens de marque pépinière vivent encore dans le socle (tokens/         */
/* pepiniere.ts) ; ils seront relocalisés dans l'app pépinière à l'Étape 4,    */
/* où l'app appellera elle-même createGradilisTheme(sesTokens).                */
/* -------------------------------------------------------------------------- */
import { pepiniereTokens } from './tokens/pepiniere.js';

/** @deprecated Transitoire — l'app pépinière fabriquera son thème via `createGradilisTheme`. */
export const gradilisTheme = createGradilisTheme(pepiniereTokens);
/** @deprecated Transitoire — l'app pépinière fabriquera ses cssVars via `makeCssVars`. */
export const gradilisCssVars = makeCssVars(pepiniereTokens);

// Ré-exports pour compat des imports directs (le tree-shaking ignore l'inutilisé).
export { gradilisGreen, gradilisLime, gradilisBrown };
