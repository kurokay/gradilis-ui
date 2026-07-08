import { describe, expect, it } from 'vitest';

import {
  PLACEHOLDER,
  dataTableTextesFR,
  formatDate,
  formatEUR,
  formatNumber,
  formatPourcent,
  formatQuantite,
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
