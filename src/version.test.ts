/**
 * Garde-fou : `GRADILIS_UI_VERSION` doit égaler la version du `package.json`.
 *
 * Pourquoi ce test existe. La constante était figée à `'0.4.0'` alors que le
 * paquet était publié en `0.6.4` : DEUX versions de retard, et personne ne l'a
 * vu parce que rien ne la vérifiait. C'est le seul export dont la valeur ment
 * sans casser quoi que ce soit — un consommateur qui journalise la version de la
 * lib pour diagnostiquer un bug se fait envoyer sur la mauvaise piste, et une
 * fiche de dette écrite en face a repris l'erreur telle quelle.
 *
 * ⚠️ Pourquoi une CONSTANTE plutôt qu'un `import pkg from '../package.json'` :
 * `tsconfig.build.json` pose `rootDir: "src"`, donc importer un fichier situé à
 * la RACINE casse l'émission (`dist/` gagnerait un niveau `src/`). La constante
 * reste donc écrite à la main — et c'est précisément pour ça qu'il faut ce test.
 * Les `*.test.ts` sont exclus du build (`tsconfig.build.json`), lire `node:fs`
 * ici n'a donc aucun effet sur le paquet publié.
 *
 * ⚠️ À la moindre montée de version : `npm version` ne touche QUE le
 * `package.json`. Ce test rougit alors, et c'est son travail.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GRADILIS_UI_VERSION } from './index.js';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'),
) as { version: string };

describe('GRADILIS_UI_VERSION', () => {
  it('correspond à la version du package.json', () => {
    expect(
      GRADILIS_UI_VERSION,
      `La constante exportée (${GRADILIS_UI_VERSION}) ne correspond plus à la version publiée `
        + `(${pkg.version}). Mettre à jour \`GRADILIS_UI_VERSION\` dans \`src/index.ts\`.`,
    ).toBe(pkg.version);
  });

  /**
   * Contrôle de non-vacuité : sans lui, un `package.json` illisible ou une
   * version absente rendrait `undefined === undefined` et le test passerait
   * au vert en ne vérifiant plus rien.
   */
  it('lit une version non vide dans le package.json', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
