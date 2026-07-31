import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  gradilisGray,
  semError,
  semInfo,
  semSuccess,
  semWarning,
} from './colors.js';
import { gradilisBrown, gradilisGreen, gradilisLime } from './tokens/pepiniere.js';
import { gradilisTheme } from './theme.js';

/**
 * Contrôle diff automatisé des rampes §3.2 : les 4 rampes de marque de
 * `colors.ts` doivent être IDENTIQUES aux littéraux du bloc de code de
 * `GUIDELINES UI-UX GRADILIS.md` §3.2 (source de vérité, plan Chantier M §3).
 */
const GUIDELINES_PATH = fileURLToPath(
  new URL('../../../../GUIDELINES UI-UX GRADILIS.md', import.meta.url),
);

function rampeDesGuidelines(nom: string): string[] {
  const doc = readFileSync(GUIDELINES_PATH, 'utf-8');
  const ligne = doc
    .split('\n')
    .find((l) => l.trimStart().startsWith(nom) && l.includes('['));
  if (!ligne) throw new Error(`Rampe ${nom} introuvable dans les guidelines §3.2`);
  const hexes = ligne.match(/#[0-9A-Fa-f]{6}/g);
  if (!hexes || hexes.length !== 10) {
    throw new Error(`Rampe ${nom} : 10 hex attendus, ${hexes?.length ?? 0} trouvés`);
  }
  return hexes;
}

describe('rampes §3.2 (recopie littérale, contrôle diff contre les guidelines)', () => {
  it.each([
    ['gradilisGreen', gradilisGreen],
    ['gradilisLime', gradilisLime],
    ['gradilisBrown', gradilisBrown],
    ['gradilisGray', gradilisGray],
  ])('%s est identique au bloc §3.2', (nom, rampe) => {
    expect([...rampe]).toEqual(rampeDesGuidelines(nom));
  });
});

describe('gradilisTheme', () => {
  // ⚠️ Ce fichier est EXCLU de vitest (cf. `vitest.config.ts`) depuis le
  // bootstrap du socle : il n'a jamais tourné. L'assertion ci-dessous affirmait
  // encore `dark: 7` alors que la valeur a changé le 2026-07-31 — elle serait
  // passée au rouge si elle avait été exécutée. Les invariants qui comptent
  // vraiment (contraste) vivent désormais dans `contrast.test.ts`, lui EXÉCUTÉ.
  it('bouton primaire = gradilisGreen (clair idx 7 · sombre idx 3)', () => {
    expect(gradilisTheme.primaryColor).toBe('gradilisGreen');
    expect(gradilisTheme.primaryShade).toEqual({ light: 7, dark: 7 });
    expect(gradilisTheme.colors?.gradilisGreen?.[7]).toBe('#00752D');
    expect(gradilisTheme.colors?.gradilisGreen?.[3]).toBe('#77C293');
  });

  it('expose les 4 rampes de marque et les 4 rampes sémantiques', () => {
    expect(gradilisTheme.colors?.gradilisGreen).toEqual(gradilisGreen);
    expect(gradilisTheme.colors?.gradilisLime).toEqual(gradilisLime);
    expect(gradilisTheme.colors?.gradilisBrown).toEqual(gradilisBrown);
    expect(gradilisTheme.colors?.gradilisGray).toEqual(gradilisGray);
    expect(gradilisTheme.colors?.succes).toEqual(semSuccess);
    expect(gradilisTheme.colors?.alerte).toEqual(semWarning);
    expect(gradilisTheme.colors?.erreur).toEqual(semError);
    expect(gradilisTheme.colors?.info).toEqual(semInfo);
  });

  it('ancres sémantiques §3.2 présentes dans les rampes', () => {
    expect(gradilisTheme.colors?.alerte?.[7]).toBe('#e8930c');
    expect(gradilisTheme.colors?.erreur?.[7]).toBe('#ba492c');
    expect(gradilisTheme.colors?.info?.[9]).toBe('#4c5763');
  });

  it('acquis a11y du thème magasin conservés (DM-7)', () => {
    expect(gradilisTheme.autoContrast).toBe(true);
    expect(gradilisTheme.luminanceThreshold).toBe(0.3);
    expect(gradilisTheme.respectReducedMotion).toBe(true);
  });
});
