// @vitest-environment jsdom
/**
 * Tests de l'app-canon (M.2) : rendu des sections sans dépendance réseau et
 * contrôle a11y automatisable (vitest-axe — le contraste, non calculable en
 * jsdom, est garanti par les ratios mesurés du thème §3.2/§3.7).
 */
import { cleanup, render } from '@testing-library/react';
import { MantineProvider, type MantineColorsTuple } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { createGradilisTheme, gradilisTheme } from '../theme.js';
import { gradilisGreen } from '../tokens/pepiniere.js';
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
    // idx 7 de la primaire (bouton plein) — lu depuis le thème, source unique.
    expect(getAllByText(gradilisGreen[7].toUpperCase()).length).toBeGreaterThan(0);
  });

  it('rend le défaut agnostique : primaire + rampes socle, et passe axe', async () => {
    const { container, getByText } = renderCanon(<CanonColors />);
    // Défaut = primaire du thème (gradilisGreen ici) + neutre + 4 sémantiques.
    for (const cle of ['gradilisGreen', 'gradilisGray', 'succes', 'alerte', 'erreur', 'info']) {
      getByText(cle);
    }
    // 6 rampes × 10 nuances = 60 pastilles.
    expect(container.querySelectorAll('.mantine-ColorSwatch-root').length).toBe(60);
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });

  it('point d’extension : une liste `rampes` personnalisée est rendue', () => {
    const { getByText } = renderCanon(
      <CanonColors rampes={[{ cle: 'gradilisGray', role: 'Neutres', regle: 'Surfaces et bordures.' }]} />,
    );
    getByText('Surfaces et bordures.');
  });

  it('agnostique : monté sous une marque NON-verte, montre sa propre primaire', () => {
    // Marque factice « olive » (façon magasin) — prouve le découplage Étape 4bis.
    const olive: MantineColorsTuple = [
      '#f6f6f1', '#e9e7d8', '#d7d3b8', '#c6c3b2', '#b4af8d',
      '#a29b68', '#8f8750', '#555232', '#43401f', '#302e12',
    ];
    const themeOlive = createGradilisTheme({ primaryColor: 'ampOlive', brandRamps: { ampOlive: olive } });
    const { getByText, getAllByText } = render(
      <MantineProvider theme={themeOlive} forceColorScheme="light">
        <ModalsProvider>
          <MemoryRouter>
            <CanonColors />
          </MemoryRouter>
        </ModalsProvider>
      </MantineProvider>,
    );
    getByText('ampOlive'); // la primaire de la marque, pas gradilisGreen
    expect(getAllByText(olive[7].toUpperCase()).length).toBeGreaterThan(0);
  });
});
