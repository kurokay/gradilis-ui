import { describe, it, expect } from 'vitest';
import type { MantineColorsTuple } from '@mantine/core';
import { createGradilisTheme, makeCssVars, type GradilisThemeTokens } from './theme.js';
import { pepiniereTokens } from './tokens/pepiniere.js';

/**
 * Garde-fou de CONTRASTE du socle (WCAG 2.1 AA).
 *
 * Pourquoi ce fichier existe : un audit du 2026-07-31 a mesuré **3 160** défauts
 * de contraste en mode sombre contre **249** en clair sur les 61 routes de l'app
 * magasin (× 12,7). La cause n'était pas une erreur ponctuelle mais une ASYMÉTRIE
 * de méthode : le mode clair avait été mesuré et corrigé, le mode sombre avait
 * hérité de la structure sans que le même travail soit refait.
 *
 * ⚠️ Un thème ne dérive pas d'un coup, il dérive d'un token à la fois. Le seul
 * garde-fou qui tienne est donc NUMÉRIQUE et appliqué aux DEUX schémas : on ne
 * vérifie pas qu'une valeur est « la bonne », on vérifie qu'elle satisfait le
 * seuil qu'elle doit satisfaire. Changer une couleur reste libre — la faire
 * passer sous le seuil ne l'est pas.
 *
 * ⚠️ `src/theme.test.ts` est exclu de vitest depuis le bootstrap du socle et
 * n'a JAMAIS tourné : son assertion `primaryShade` affirmait encore une valeur
 * périmée. Ne pas ajouter d'invariant là-bas en croyant qu'il protège.
 */

/* -------------------------------------------------------------------------- */
/* Outillage WCAG — luminance relative et ratio de contraste (WCAG 2.1 §1.4.3) */
/* -------------------------------------------------------------------------- */

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* -------------------------------------------------------------------------- */
/* Surfaces de référence — valeurs RÉSOLUES par Mantine v9, pas supposées.     */
/* Source : MantineProvider/MantineCssVariables/default-css-variables-resolver */
/* -------------------------------------------------------------------------- */

/** `--mantine-color-body` en sombre = `dark-7`. */
const DARK_BODY = '#242424';
/** Surface d'une carte/Paper en sombre = `dark-6`. Le cas le PLUS défavorable. */
const DARK_CARD = '#2e2e2e';
/** `--mantine-color-text` en sombre = `dark-0`. */
const DARK_TEXT = '#C9C9C9';
const LIGHT_BODY = '#ffffff';

/** Seuils WCAG 2.1 AA. */
const AA_TEXT = 4.5; // 1.4.3 — corps courant
const AA_NON_TEXT = 3; // 1.4.11 — formes et éléments d'interface porteurs de sens

/**
 * Tokens de marque MAGASIN (Au Mas Paysan), recopiés depuis
 * `gradilis_magasin/frontend/src/theme/tokens.ts`.
 *
 * ⚠️ Le socle est agnostique et ne connaît pas cette marque — mais un invariant
 * de contraste vérifié sur UNE seule marque ne vérifie rien : les rampes ont des
 * profils de luminance différents (l'olive est très peu chromatique, le vert
 * pépinière beaucoup plus). C'est précisément sur l'olive que `primaryShade.dark`
 * s'était effondré à 1,95:1. On teste donc les deux.
 */
const ampOlive: MantineColorsTuple = [
  '#f6f6f1', '#dedcd1', '#c6c3b2', '#aeab94', '#979377',
  '#807c5b', '#6a6640', '#555232', '#423f25', '#2f2d18',
];
const magasinTokens: GradilisThemeTokens = {
  primaryColor: 'ampOlive',
  brandRamps: { ampOlive },
};

const MARQUES: [string, GradilisThemeTokens][] = [
  ['magasin (ampOlive)', magasinTokens],
  ['pépinière (gradilisGreen)', pepiniereTokens],
];

/** Résout le bloc de variables d'un schéma pour un jeu de tokens donné. */
function vars(tokens: GradilisThemeTokens, scheme: 'light' | 'dark'): Record<string, string> {
  // `makeCssVars` rend un résolveur qui ignore son argument (valeurs littérales).
  const resolver = makeCssVars(tokens);
  return resolver({} as never)[scheme] as Record<string, string>;
}

describe.each(MARQUES)('contraste — %s', (_nom, tokens) => {
  const dark = vars(tokens, 'dark');
  const light = vars(tokens, 'light');
  const brand = tokens.brandRamps[tokens.primaryColor];

  describe('mode sombre', () => {
    it('`dimmed` tient AA sur la page ET sur une carte', () => {
      // 84 % des défauts mesurés venaient de ce seul token : il porte tout le
      // texte secondaire (libellés, unités, légendes, sous-titres).
      expect(contrast(dark['--mantine-color-dimmed'], DARK_BODY)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(dark['--mantine-color-dimmed'], DARK_CARD)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('les liens tiennent AA sur une carte', () => {
      // Le défaut Mantine (`primary-4`) donnait 4,37:1 — échec de peu, mais sur
      // CHAQUE lien de l'application.
      expect(contrast(dark['--mantine-color-anchor'], DARK_CARD)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('le token de titre tient AA sur la page ET sur une carte', () => {
      // Un indice de marque figé (`brand[8]`) tombait à 1,46:1 / 1,27:1.
      expect(contrast(dark['--gradilis-title'], DARK_BODY)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(dark['--gradilis-title'], DARK_CARD)).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('`bg-subtle` se distingue réellement du fond de page', () => {
      // Était à 1,03:1 : la surface existait dans le code, pas à l'écran.
      expect(contrast(dark['--gradilis-bg-subtle'], DARK_BODY)).toBeGreaterThan(1.15);
    });

    it('les 5 fonds sémantiques sont DISTINCTS deux à deux', () => {
      // Ils s'écrasaient sur 2 valeurs (brand == danger == warning) : toute
      // l'information portée par la couleur de fond disparaissait en sombre.
      const cles = ['subtle', 'brand', 'danger', 'warning', 'info'] as const;
      const valeurs = cles.map((k) => dark[`--gradilis-bg-${k}`]);
      expect(new Set(valeurs).size).toBe(cles.length);
    });

    it('le texte reste lisible sur CHAQUE fond sémantique', () => {
      for (const k of ['subtle', 'brand', 'danger', 'warning', 'info']) {
        const fond = dark[`--gradilis-bg-${k}`];
        expect(contrast(DARK_TEXT, fond), `texte sur bg-${k}`).toBeGreaterThanOrEqual(AA_TEXT);
        expect(
          contrast(dark['--mantine-color-dimmed'], fond),
          `dimmed sur bg-${k}`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      }
    });

    it('les bordures se voient, et `border` domine `border-muted`', () => {
      const b = contrast(dark['--gradilis-border'], DARK_BODY);
      const m = contrast(dark['--gradilis-border-muted'], DARK_BODY);
      expect(b).toBeGreaterThan(1.3);
      expect(b).toBeGreaterThan(m);
    });

    it('`icon-muted` tient le seuil des éléments non textuels', () => {
      expect(contrast(dark['--gradilis-icon-muted'], DARK_BODY)).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });

    it('aucun token sombre ne réintroduit une surface CLAIRE', () => {
      // Une couleur d'indice 0/1 posée comme surface en sombre produit du texte
      // clair sur fond clair (mesuré jusqu'à 1,33:1) — le pire défaut de l'audit.
      for (const [nom, valeur] of Object.entries(dark)) {
        if (!nom.startsWith('--gradilis-bg') && !nom.includes('border')) continue;
        expect(luminance(valeur), `${nom} est une surface claire`).toBeLessThan(0.3);
      }
    });
  });

  describe('bouton primaire plein', () => {
    const theme = createGradilisTheme(tokens);
    const shade = theme.primaryShade as { light: number; dark: number };

    it.each([
      ['clair', shade.light, LIGHT_BODY],
      ['sombre', shade.dark, DARK_BODY],
    ])('en %s : la FORME se détache et le LIBELLÉ tient AA', (_s, idx, fond) => {
      const fill = brand[idx];
      // `autoContrast` + `luminanceThreshold: 0.3` : au-dessus du seuil le
      // libellé bascule en noir, en dessous il reste blanc.
      const libelle = luminance(fill) > 0.3 ? '#000000' : '#ffffff';
      expect(contrast(fill, fond), 'forme vs fond de page').toBeGreaterThanOrEqual(AA_NON_TEXT);
      expect(contrast(fill, libelle), 'libellé vs remplissage').toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('mode clair (non-régression)', () => {
    it('`dimmed` et le token de titre tiennent AA sur blanc', () => {
      expect(contrast(light['--mantine-color-dimmed'], LIGHT_BODY)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrast(light['--gradilis-title'], LIGHT_BODY)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });
});
