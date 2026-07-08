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
    // Contrôles pleins (boutons) = idx 7 (blanc dessus ≥ AA, cf. GUIDELINES §3.2).
    primaryShade: { light: 7, dark: 7 },
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
    dark: {
      '--gradilis-bg-subtle': '#25262b',
      '--gradilis-bg-brand': '#2C2E33',
      '--gradilis-bg-danger': '#2C2E33',
      '--gradilis-bg-warning': '#2C2E33',
      '--gradilis-bg-info': '#25262b',
      '--gradilis-border': '#373A40',
      '--gradilis-border-muted': '#373A40',
      '--gradilis-icon-muted': gradilisGray[6],
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
