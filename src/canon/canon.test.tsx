// @vitest-environment jsdom
/**
 * Tests de l'app-canon (M.2) : rendu des sections sans dépendance réseau et
 * contrôle a11y automatisable (vitest-axe — le contraste, non calculable en
 * jsdom, est garanti par les ratios mesurés du thème §3.2/§3.7).
 */
import { cleanup, render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { gradilisTheme } from '../theme.js';
import { gradilisGreen, gradilisLime } from '../tokens/pepiniere.js';
import { CanonColors } from './CanonColors.js';
import { CanonStates } from './CanonStates.js';

const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

beforeAll(() => {
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

function renderCanon(ui: React.ReactNode) {
  return render(
    <MantineProvider theme={gradilisTheme} forceColorScheme="light">
      <ModalsProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ModalsProvider>
    </MantineProvider>,
  );
}

describe('CanonStates', () => {
  it('rend les 4 états ingrats et passe axe', async () => {
    const { container, getByText } = renderCanon(<CanonStates />);
    getByText('Aucun lot pour cette saison'); // vide avec action
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull(); // chargement
    getByText('Erreur de chargement'); // erreur avec relance
    getByText('Inventaire enregistré'); // succès
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('CanonColors', () => {
  it('affiche les hex du thème à l’exécution (aucun littéral dans le canon)', () => {
    const { getAllByText } = renderCanon(<CanonColors />);
    // idx 7 du vert (bouton plein) et idx 5 du lime (l'interdit à connaître) —
    // valeurs lues depuis colors.ts, source unique, et rendues par le thème.
    expect(getAllByText(gradilisGreen[7].toUpperCase()).length).toBeGreaterThan(0);
    expect(getAllByText(gradilisLime[5].toUpperCase()).length).toBeGreaterThan(0);
  });

  it('rend les 8 rampes avec leurs 10 index et passe axe', async () => {
    const { container, getByText } = renderCanon(<CanonColors />);
    for (const cle of [
      'gradilisGreen',
      'gradilisLime',
      'gradilisBrown',
      'gradilisGray',
      'succes',
      'alerte',
      'erreur',
      'info',
    ]) {
      getByText(cle);
    }
    // 8 rampes × 10 nuances = 80 pastilles.
    expect(container.querySelectorAll('.mantine-ColorSwatch-root').length).toBe(80);
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});
