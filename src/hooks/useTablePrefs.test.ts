// @vitest-environment jsdom
/**
 * useTablePrefs — options additives (`sortValues`, `revalidateKey`, `fit.enabled`)
 * apparues lors de la réconciliation avec la copie applicative. Le tri par
 * accessor simple et la pagination client restent couverts par
 * `components/primitives.test.tsx`.
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTablePrefs } from './useTablePrefs.js';

interface Ligne {
  id: number;
  total: { amount: number };
}

describe('useTablePrefs — sortValues (tri dérivé)', () => {
  const LIGNES: Ligne[] = [
    { id: 1, total: { amount: 30 } },
    { id: 2, total: { amount: 5 } },
    { id: 3, total: { amount: 120 } },
  ];
  // Constante de module (cf. avertissement du hook sur l'identité).
  const SORT_VALUES = { total: (row: Ligne) => row.total.amount };

  it('trie sur la valeur DÉRIVÉE quand le champ n’a aucun chemin accessible sur la ligne', () => {
    const { result } = renderHook(() =>
      useTablePrefs<Ligne>('test-sortvalues-1', { sortValues: SORT_VALUES }),
    );
    act(() => result.current.setSortStatus({ columnAccessor: 'total', direction: 'asc' }));
    expect(result.current.sortRecords(LIGNES).map((l) => l.id)).toEqual([2, 1, 3]);
  });

  it('sans sortValues déclaré pour l’accessor, le tri par chemin reste inchangé (option additive)', () => {
    // `total` n'a pas de valeur comparable par chemin direct (c'est un objet) :
    // sans `sortValues`, le tri dégénère (toutes les lignes égales) — attendu,
    // et ça prouve que l'option n'est pas silencieusement toujours active.
    const { result } = renderHook(() => useTablePrefs<Ligne>('test-sortvalues-2'));
    act(() => result.current.setSortStatus({ columnAccessor: 'total', direction: 'asc' }));
    expect(result.current.sortRecords(LIGNES).map((l) => l.id)).toEqual([1, 2, 3]);
  });
});

describe('useTablePrefs — fit.enabled reflète l’option autoFit', () => {
  it('autoFit absent/false : fit.enabled=false', () => {
    const { result } = renderHook(() => useTablePrefs('test-fit-enabled-1'));
    expect(result.current.fit.enabled).toBe(false);
  });

  it('autoFit=true : fit.enabled=true', () => {
    const { result } = renderHook(() => useTablePrefs('test-fit-enabled-2', { autoFit: true }));
    expect(result.current.fit.enabled).toBe(true);
  });
});

describe('useTablePrefs — revalidateKey (option additive, transmise sans planter)', () => {
  it('accepte un revalidateKey qui change entre deux rendus', () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: unknown }) =>
        useTablePrefs('test-revalidate-key', { autoFit: true, revalidateKey: key }),
      { initialProps: { key: 1 } },
    );
    expect(result.current.fit.enabled).toBe(true);
    expect(() => rerender({ key: 2 })).not.toThrow();
  });
});
