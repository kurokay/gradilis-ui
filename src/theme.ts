import { createTheme, rem, type CSSVariablesResolver } from '@mantine/core';
import {
  gradilisGreen,
  gradilisLime,
  gradilisBrown,
  gradilisGray,
  semSuccess,
  semWarning,
  semError,
  semInfo,
} from './colors.js';

/**
 * Thème Gradilis Pépinière (GUIDELINES §3) — vendoring du thème
 * `gradilis_magasin/packages/ui` (DM-7), re-tokenisé avec les rampes §3.2.
 *
 * Source unique des tokens une fois ce package consommé. Valeurs chiffrées :
 * couleurs §3.2, typo §3.4, espacement/rayons §3.5 — toutes mesurées AA (§3.7).
 * Mode CLAIR uniquement (§3.3) : l'app passe `forceColorScheme="light"`.
 *
 * `autoContrast: true` : Mantine choisit automatiquement texte clair/foncé sur
 * les variantes pleines selon la luminance — garantit AA même sur les nuances
 * claires (sémantiques) tout en conservant le blanc sur le bouton primaire
 * vert (idx7 #00752D, 5,86:1).
 */
export const gradilisTheme = createTheme({
  primaryColor: 'gradilisGreen',
  // §3.2 : contrôles pleins (boutons) = idx 7 #00752D (blanc dessus = 5,86:1 ✓ AA).
  primaryShade: { light: 7, dark: 7 },
  autoContrast: true,
  luminanceThreshold: 0.3,
  // a11y : respecte `prefers-reduced-motion` (WCAG 2.3.3) — coupe les transitions
  // Mantine pour les utilisateurs sensibles au mouvement. `focusRing` reste au
  // défaut Mantine ('auto' : anneau visible au clavier via :focus-visible).
  respectReducedMotion: true,

  colors: {
    gradilisGreen,
    gradilisLime,
    gradilisBrown,
    gradilisGray,
    succes: semSuccess,
    alerte: semWarning,
    erreur: semError,
    info: semInfo,
  },
  white: '#ffffff',
  black: gradilisGray[9],

  // Typographie (§3.4). Inter en UI, JetBrains Mono pour chiffres/montants.
  // « Inter Variable » en tête : @fontsource-variable/inter (self-hosted,
  // importé dans main.tsx) enregistre la famille sous ce nom, pas « Inter ».
  fontFamily: '"Inter Variable", Inter, "IBM Plex Sans", system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  headings: {
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
    fontWeight: '600',
  },
  // Tailles en rem (via `rem()` → `calc(Xrem * var(--mantine-scale))`) plutôt qu'en
  // px : identique visuellement à la racine 16px, mais respecte le zoom texte du
  // navigateur (WCAG 1.4.4). Base métier dense = 14 px (`sm`, défaut composants §3.4).
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

  // Espacement / rayons — grille 4 px (§3.5).
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

  // Ombres — usage minimal, sm (cartes/menus) et md (modales) seulement, pas de
  // glow (§3.5). Teinte = gradilisGray[9] #201F1F.
  shadows: {
    sm: '0 1px 3px rgba(32, 31, 31, 0.08), 0 1px 2px rgba(32, 31, 31, 0.06)',
    md: '0 4px 12px rgba(32, 31, 31, 0.10)',
  },
});

/**
 * Tokens sémantiques CSS — à passer en `cssVariablesResolver` sur
 * `<MantineProvider>`. Vendoré du magasin (DM-7), re-tokenisé Pépinière et
 * réduit aux tokens génériques (les tokens métier magasin — disponibilité,
 * saison — ne sont pas repris). Valeurs dark : palette Mantine `dark`
 * standard, conservées par parité de structure avec le magasin bien que le
 * mode sombre soit hors périmètre (§3.3, `forceColorScheme="light"`).
 */
export const gradilisCssVars: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    // `c="dimmed"` : le défaut Mantine (#868E96) ne donne que 3,3:1 sur blanc
    // (< AA 4,5:1 §3.7) — constaté en passe C-7 sur tous les textes secondaires,
    // app-canon compris. Ré-ancré sur la rampe neutre mesurée : gradilisGray[6]
    // #5C5B5A = 6,69:1 sur blanc, 6,3:1 sur zébrure de table (#F8F9FA).
    '--mantine-color-dimmed':  gradilisGray[6],
    '--gradilis-bg-subtle':    gradilisGray[0],  // #EFEDED — fond neutre de section
    '--gradilis-bg-brand':     gradilisGreen[0], // #EDF7F1 — fond teinté vert
    '--gradilis-bg-danger':    semError[0],      // #ffefe9 — fond teinté erreur
    '--gradilis-bg-warning':   semWarning[0],    // #fff6e3 — fond teinté ambre
    '--gradilis-bg-info':      semInfo[0],       // #f3f5f6 — fond teinté ardoise
    '--gradilis-border':       gradilisGray[2],  // #D4D3D2 — séparateurs standard
    '--gradilis-border-muted': gradilisGray[1],  // #E5E4E3 — séparateurs discrets
    '--gradilis-icon-muted':   gradilisGray[4],  // #969494 — icônes/accents discrets
  },
  dark: {
    '--gradilis-bg-subtle':    '#25262b',        // dark[6] — fond neutre sombre
    '--gradilis-bg-brand':     '#2C2E33',        // dark[5] — fond teinté (vert→sombre)
    '--gradilis-bg-danger':    '#2C2E33',        // dark[5] — fond erreur sombre
    '--gradilis-bg-warning':   '#2C2E33',        // dark[5] — fond alerte sombre
    '--gradilis-bg-info':      '#25262b',        // dark[6] — fond info sombre
    '--gradilis-border':       '#373A40',        // dark[4] — séparateurs sombres
    '--gradilis-border-muted': '#373A40',        // dark[4] — séparateurs discrets sombres
    '--gradilis-icon-muted':   gradilisGray[6],  // #5C5B5A — icônes sur fond sombre
  },
});
