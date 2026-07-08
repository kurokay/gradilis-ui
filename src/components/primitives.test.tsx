// @vitest-environment jsdom
/**
 * Tests des primitives vendorées (M.2) : rendu, sémantique a11y (vitest-axe)
 * et tri client de `useTablePrefs`. Environnement jsdom (docblock ci-dessus) —
 * les autres suites du package restent en environnement node.
 */
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

// Le contraste de couleur ne peut pas être calculé en jsdom (pas de canvas) —
// il est vérifié par les ratios mesurés du thème (§3.2/§3.7), pas par axe.
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

import { gradilisTheme } from '../theme.js';
import { Num } from './Num.js';
import { PageBreadcrumb } from './PageBreadcrumb.js';
import { useTablePrefs } from '../hooks/useTablePrefs.js';

beforeAll(() => {
  // Stubs des APIs navigateur absentes de jsdom, requises par Mantine.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(cleanup);

function renderAvecProviders(ui: React.ReactNode) {
  return render(
    <MantineProvider theme={gradilisTheme} forceColorScheme="light">
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

describe('Num', () => {
  it('rend un span en tabular-nums (chiffres alignés, §3.1)', () => {
    const { container } = renderAvecProviders(<Num>1 234</Num>);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.style.fontVariantNumeric).toBe('tabular-nums');
    expect(span?.textContent).toBe('1 234');
  });
});

describe('PageBreadcrumb', () => {
  it("préfixe Accueil, lie les segments et pose aria-current sur le courant", async () => {
    const { container, getByRole } = renderAvecProviders(
      <PageBreadcrumb items={[{ label: 'Commandes', to: '/commandes' }, { label: 'CMD-042' }]} />,
    );
    const nav = getByRole('navigation', { name: "Fil d'Ariane" });
    const liens = nav.querySelectorAll('a');
    expect([...liens].map((a) => a.textContent)).toEqual(['Accueil', 'Commandes']);
    const courant = nav.querySelector('[aria-current="page"]');
    expect(courant?.textContent).toBe('CMD-042');
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('useTablePrefs — tri client', () => {
  interface Ligne {
    nom: string | null;
    quantite: number;
  }
  const LIGNES: Ligne[] = [
    { nom: 'Épine-vinette', quantite: 30 },
    { nom: null, quantite: 99 },
    { nom: 'abricotier', quantite: 120 },
    { nom: 'Cerisier', quantite: 5 },
  ];

  it('trie les chaînes en locale FR (accents, casse) et met les nuls en dernier', () => {
    const { result } = renderHook(() => useTablePrefs<Ligne>('test-tri'));
    act(() => result.current.setSortStatus({ columnAccessor: 'nom', direction: 'asc' }));
    const noms = result.current.sortRecords(LIGNES).map((l) => l.nom);
    expect(noms).toEqual(['abricotier', 'Cerisier', 'Épine-vinette', null]);
  });

  it('trie les nombres numériquement, sens desc, sans muter l’entrée', () => {
    const copie = [...LIGNES];
    const { result } = renderHook(() => useTablePrefs<Ligne>('test-tri'));
    act(() => result.current.setSortStatus({ columnAccessor: 'quantite', direction: 'desc' }));
    const quantites = result.current.sortRecords(LIGNES).map((l) => l.quantite);
    expect(quantites).toEqual([120, 99, 30, 5]);
    expect(LIGNES).toEqual(copie);
  });
});
