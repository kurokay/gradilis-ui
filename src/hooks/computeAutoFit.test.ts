/** `computeAutoFit` — cœur pur de l'auto-fit : taille de page et hauteur imposée. */
import { describe, expect, it } from 'vitest';
import { computeAutoFit } from './useAutoPageSize';

const base = { innerHeight: 1000, top: 200, padBottom: 0, headerH: 40, footerH: 60, rowH: 50, minRows: 5 };

describe('computeAutoFit', () => {
  it('assez de place : autant de lignes que possible, hauteur jusqu’en bas', () => {
    const { size, height } = computeAutoFit(base);
    expect(size).toBeGreaterThan(5);
    expect(height).toBeGreaterThanOrEqual(40 + 60 + size * 50);
  });

  it('exactement le plancher qui tient : hauteur imposée', () => {
    // available ≈ innerHeight - top - marge ; on place juste 5 lignes.
    const r = computeAutoFit({ ...base, innerHeight: 200 + 40 + 60 + 5 * 50 + 20 });
    expect(r.size).toBe(5);
    expect(r.height).toBeGreaterThan(0);
  });

  it('au PLANCHER (place insuffisante) : size = minRows et AUCUNE hauteur imposée', () => {
    // Téléphone : en-tête empilé, il ne tient que 2 lignes. Forcer 5 × rowH (rowH de la
    // 1re ligne, plus haute) laissait un vide sous les lignes réelles.
    const r = computeAutoFit({ ...base, innerHeight: 780, top: 600 });
    expect(r.size).toBe(5);
    expect(r.height).toBe(0);
  });
});
