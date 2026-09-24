// @vitest-environment jsdom
/**
 * Tests des composants d'état d'écran (lot L3) : rendu, sémantique a11y
 * (vitest-axe) et respect du contrat d'injection de libellés
 * (`GradilisLabelsProvider`). Environnement jsdom, patron `primitives.test.tsx`.
 */
import { cleanup, render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

// Contraste non calculable en jsdom (pas de canvas) — garanti par ailleurs (§3.2/§3.7).
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

import { gradilisTheme } from '../theme.js';
import { GradilisLabelsProvider } from '../lib/labels.js';
import { EmptyState } from './EmptyState.js';
import { ErrorState } from './ErrorState.js';
import { StatusScreen } from './StatusScreen.js';
import { PageSkeleton } from './PageSkeleton.js';

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

function renderAvecProviders(ui: React.ReactNode) {
  return render(
    <MantineProvider theme={gradilisTheme} forceColorScheme="light">
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

describe('EmptyState', () => {
  it('rend titre, description et action ; jamais de titre sémantique h*', () => {
    const { getByText, container } = renderAvecProviders(
      <EmptyState title="Aucune facture" description="Rien à afficher." action={<button>Créer</button>} />,
    );
    getByText('Aucune facture');
    getByText('Rien à afficher.');
    getByText('Créer');
    expect(container.querySelector('h1,h2,h3,h4,h5,h6')).toBeNull();
  });

  it('sans action ni description, ne les rend pas', () => {
    const { queryByText, container } = renderAvecProviders(<EmptyState title="Vide" />);
    expect(queryByText('Vide')).not.toBeNull();
    expect(container.querySelectorAll('button').length).toBe(0);
  });

  it('passe axe', async () => {
    const { container } = renderAvecProviders(
      <EmptyState title="Aucun lot" description="Créez-en un." action={<button>Nouveau</button>} />,
    );
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('ErrorState', () => {
  it('affiche les défauts FR injectés (titre, rappel, bouton) + le motif serveur', () => {
    const onRetry = vi.fn();
    const { getByText } = renderAvecProviders(<ErrorState message="Réseau indisponible." onRetry={onRetry} />);
    getByText('Lecture impossible');
    getByText((_, node) => node?.textContent === "Ces données n'ont pas pu être lues : ce n'est pas une liste vide. Réseau indisponible.");
    getByText('Réessayer').click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('sans message, garde le rappel générique seul', () => {
    const { getByText } = renderAvecProviders(<ErrorState onRetry={() => {}} />);
    getByText((_, node) => node?.textContent === "Ces données n'ont pas pu être lues : ce n'est pas une liste vide.");
  });

  it('title surcharge le défaut', () => {
    const { getByText } = renderAvecProviders(<ErrorState title="Erreur de chargement" onRetry={() => {}} />);
    getByText('Erreur de chargement');
  });

  it('announce=true (défaut) pose role="alert" ; announce=false ne le pose pas', () => {
    const { container: withAlert } = renderAvecProviders(<ErrorState onRetry={() => {}} />);
    expect(withAlert.querySelector('[role="alert"]')).not.toBeNull();

    cleanup();
    const { container: withoutAlert } = renderAvecProviders(<ErrorState onRetry={() => {}} announce={false} />);
    expect(withoutAlert.querySelector('[role="alert"]')).toBeNull();
  });

  it('respecte un libellé surchargé via GradilisLabelsProvider', () => {
    const { getByText } = render(
      <MantineProvider theme={gradilisTheme} forceColorScheme="light">
        <MemoryRouter>
          <GradilisLabelsProvider value={{ states: { errorTitle: 'Oups' } }}>
            <ErrorState onRetry={() => {}} />
          </GradilisLabelsProvider>
        </MemoryRouter>
      </MantineProvider>,
    );
    getByText('Oups');
    // La surcharge est PARTIELLE : `retry` doit rester le défaut (fusion par section).
    getByText('Réessayer');
  });

  it('passe axe', async () => {
    const { container } = renderAvecProviders(<ErrorState message="Panne." onRetry={() => {}} />);
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('StatusScreen', () => {
  it('rend icône, titre, description et le bouton de retour par défaut', () => {
    const { getByText } = renderAvecProviders(
      <StatusScreen icon={<span>icône</span>} title="Accès refusé" description="Réservé aux admins." />,
    );
    getByText('Accès refusé');
    getByText('Réservé aux admins.');
    getByText("Retour à l'accueil");
  });

  it('action personnalisée remplace le bouton par défaut', () => {
    const { getByText, queryByText } = renderAvecProviders(
      <StatusScreen
        icon={<span>icône</span>}
        title="Module non activé"
        description="—"
        action={<button>Activer</button>}
      />,
    );
    getByText('Activer');
    expect(queryByText("Retour à l'accueil")).toBeNull();
  });

  it('passe axe', async () => {
    const { container } = renderAvecProviders(
      <StatusScreen icon={<span>icône</span>} title="Accès refusé" description="—" mih={200} />,
    );
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('PageSkeleton', () => {
  it('porte role="status" + aria-busy (jamais aria-label seul sur un div sans rôle)', () => {
    const { container } = renderAvecProviders(<PageSkeleton />);
    const region = container.querySelector('[role="status"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(region?.getAttribute('aria-label')).toBe('Chargement de la page');
  });

  it('étale les props supplémentaires sur le conteneur', () => {
    const { container } = renderAvecProviders(<PageSkeleton data-page-skeleton="" />);
    expect(container.querySelector('[data-page-skeleton]')).not.toBeNull();
  });

  it('passe axe', async () => {
    const { container } = renderAvecProviders(<PageSkeleton />);
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});
