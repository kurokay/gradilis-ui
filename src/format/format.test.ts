import { describe, expect, it } from 'vitest';

import {
  PLACEHOLDER,
  dataTableTextesFR,
  formatDate,
  formatEUR,
  formatEURArrondi,
  formatNumber,
  formatPourcent,
  formatPrixUnitaire,
  formatQuantite,
  formatQuantiteLibre,
  setupLocale,
} from './index.js';

// Séparateurs Intl fr-FR : milliers = espace fine insécable, avant %/€ = insécable.
const NNBSP = ' ';
const NBSP = ' ';

describe('formatDate', () => {
  it('court par défaut, depuis une chaîne ISO', () => {
    expect(formatDate('2026-07-07T14:30:00')).toBe('07/07/2026');
  });
  it('long', () => {
    expect(formatDate(new Date(2026, 6, 7), 'long')).toBe('7 juillet 2026');
  });
  it('datetime', () => {
    expect(formatDate('2026-07-07T14:30:00', 'datetime')).toBe('07/07/2026 14:30');
  });
  it('nullish et date invalide → placeholder', () => {
    expect(formatDate(null)).toBe(PLACEHOLDER);
    expect(formatDate(undefined)).toBe(PLACEHOLDER);
    expect(formatDate('pas-une-date')).toBe(PLACEHOLDER);
  });
});

describe('formatNumber', () => {
  it('zéro', () => {
    expect(formatNumber(0)).toBe('0');
  });
  it('négatif avec séparateurs FR', () => {
    expect(formatNumber(-1234.56)).toBe(`-1${NNBSP}234,56`);
  });
  it('décimales fixes avec arrondi', () => {
    expect(formatNumber(1234.567, 2)).toBe(`1${NNBSP}234,57`);
    expect(formatNumber(2, 2)).toBe('2,00');
  });
  it('nullish/NaN → placeholder', () => {
    expect(formatNumber(null)).toBe(PLACEHOLDER);
    expect(formatNumber(Number.NaN)).toBe(PLACEHOLDER);
  });
});

describe('formatEUR', () => {
  it('zéro', () => {
    expect(formatEUR(0)).toBe(`0,00${NBSP}€`);
  });
  it('négatif', () => {
    expect(formatEUR(-1234.5)).toBe(`-1${NNBSP}234,50${NBSP}€`);
  });
  it('arrondi à 2 décimales', () => {
    expect(formatEUR(19.999)).toBe(`20,00${NBSP}€`);
  });
  it('nullish → placeholder', () => {
    expect(formatEUR(undefined)).toBe(PLACEHOLDER);
  });
});

describe('formatQuantite', () => {
  it('zéro', () => {
    expect(formatQuantite(0)).toBe('0');
  });
  it('entier avec séparateur de milliers (espace fine)', () => {
    expect(formatQuantite(1234567)).toBe(`1${NNBSP}234${NNBSP}567`);
  });
  it('arrondit les décimales', () => {
    expect(formatQuantite(1499.6)).toBe(`1${NNBSP}500`);
  });
  it('négatif', () => {
    expect(formatQuantite(-2500)).toBe(`-2${NNBSP}500`);
  });
  it('nullish → placeholder', () => {
    expect(formatQuantite(null)).toBe(PLACEHOLDER);
  });
});

describe('formatPourcent', () => {
  it('ratio [0,1] → pourcentage entier par défaut', () => {
    expect(formatPourcent(0.42)).toBe(`42${NBSP}%`);
  });
  it('zéro', () => {
    expect(formatPourcent(0)).toBe(`0${NBSP}%`);
  });
  it('décimales + arrondi', () => {
    expect(formatPourcent(0.4256, 1)).toBe(`42,6${NBSP}%`);
  });
  it('négatif', () => {
    expect(formatPourcent(-0.05)).toBe(`-5${NBSP}%`);
  });
  it('nullish → placeholder', () => {
    expect(formatPourcent(undefined)).toBe(PLACEHOLDER);
  });
});

describe('formatQuantiteLibre', () => {
  it('entier — aucun zéro forcé (compat magasin fmtQty)', () => {
    expect(formatQuantiteLibre(70)).toBe('70');
  });
  it('au plus 3 décimales par défaut, avec arrondi — jamais un compte FIXE de décimales', () => {
    expect(formatQuantiteLibre(1234.5)).toBe(`1${NNBSP}234,5`);
    expect(formatQuantiteLibre(1234.56789)).toBe(`1${NNBSP}234,568`);
  });
  it('maxDecimales personnalisé', () => {
    expect(formatQuantiteLibre(-2.5, 1)).toBe('-2,5');
    expect(formatQuantiteLibre(1.9999, 2)).toBe('2');
  });
  it('zéro', () => {
    expect(formatQuantiteLibre(0)).toBe('0');
  });
  it('nullish/NaN → placeholder', () => {
    expect(formatQuantiteLibre(null)).toBe(PLACEHOLDER);
    expect(formatQuantiteLibre(undefined)).toBe(PLACEHOLDER);
    expect(formatQuantiteLibre(Number.NaN)).toBe(PLACEHOLDER);
  });
});

describe('formatEURArrondi', () => {
  it('arrondit à l’euro entier', () => {
    expect(formatEURArrondi(1234.6)).toBe(`1${NNBSP}235${NBSP}€`);
  });
  it('zéro', () => {
    expect(formatEURArrondi(0)).toBe(`0${NBSP}€`);
  });
  it('un négatif qui arrondit à zéro ne s’affiche jamais « -0 € »', () => {
    expect(formatEURArrondi(-0.3)).toBe(`0${NBSP}€`);
    expect(formatEURArrondi(-0)).toBe(`0${NBSP}€`);
  });
  it('le seuil est 0,5 (half-expand) — -0,5 s’éloigne bien de zéro', () => {
    expect(formatEURArrondi(-0.5)).toBe(`-1${NBSP}€`);
    expect(formatEURArrondi(0.5)).toBe(`1${NBSP}€`);
  });
  it('nullish/NaN → placeholder', () => {
    expect(formatEURArrondi(null)).toBe(PLACEHOLDER);
    expect(formatEURArrondi(Number.NaN)).toBe(PLACEHOLDER);
  });
});

describe('formatPrixUnitaire', () => {
  it('conserve jusqu’à 4 décimales quand la valeur le demande', () => {
    expect(formatPrixUnitaire(12.3457)).toBe(`12,3457${NBSP}€`);
  });
  it('ne force pas au-delà de 2 décimales quand elles suffisent', () => {
    expect(formatPrixUnitaire(12.3)).toBe(`12,30${NBSP}€`);
  });
  it('diffère de formatEUR sur une valeur à échelle fine', () => {
    expect(formatPrixUnitaire(12.3457)).not.toBe(formatEUR(12.3457));
  });
  it('zéro et négatif', () => {
    expect(formatPrixUnitaire(0)).toBe(`0,00${NBSP}€`);
    expect(formatPrixUnitaire(-5.12345)).toBe(`-5,1235${NBSP}€`);
  });
  it('nullish/NaN → placeholder', () => {
    expect(formatPrixUnitaire(undefined)).toBe(PLACEHOLDER);
    expect(formatPrixUnitaire(Number.NaN)).toBe(PLACEHOLDER);
  });
});

describe('dataTableTextesFR', () => {
  it('fournit les textes FR de mantine-datatable', () => {
    expect(dataTableTextesFR.noRecordsText).toBe('Aucun enregistrement');
    expect(dataTableTextesFR.recordsPerPageLabel).toBe('Lignes par page');
    expect(dataTableTextesFR.paginationText({ from: 1, to: 25, totalRecords: 80 })).toBe(
      '1–25 sur 80',
    );
  });
});

describe('setupLocale', () => {
  it('pose la locale dayjs fr (idempotent)', async () => {
    setupLocale();
    setupLocale();
    const { default: dayjs } = await import('dayjs');
    expect(dayjs.locale()).toBe('fr');
    expect(dayjs('2026-07-07').format('LL')).toBe('7 juillet 2026');
    expect(dayjs('07/07/2026', 'DD/MM/YYYY').isValid()).toBe(true);
  });
});
