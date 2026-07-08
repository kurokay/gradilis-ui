// @vitest-environment jsdom
/**
 * Tests du châssis spatial (K.0, plan Chantier K §4/§10) : rendu de chaque
 * primitive, calques on/off, callback de recentrage de la minimap, axe sans
 * violation. Le drag dnd-kit n'est PAS testé ici (piège jsdom documenté au
 * plan §10 — dnd-kit est seulement installé en K-4, consommé en K.2).
 * Stubs jsdom : même pattern que canon.test.tsx / test-utils de l'app.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { gradilisTheme } from '../theme.js';
import { CanonSpatial } from '../canon/CanonSpatial.js';
import { HUDCoordonnees } from './HUDCoordonnees.js';
import { LayersPanel } from './LayersPanel.js';
import { Minimap } from './Minimap.js';

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
  // jsdom n'implémente pas PointerEvent : sans ce stub, fireEvent.pointerDown
  // retombe sur un Event nu SANS clientX/clientY (piège jsdom — à reprendre
  // dans les écrans K.2/K.3). MouseEvent porte les coordonnées ; pointerId
  // est ajouté pour la capture de pointeur.
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerId: number;
      constructor(type: string, props: MouseEventInit & { pointerId?: number } = {}) {
        super(type, props);
        this.pointerId = props.pointerId ?? 1;
      }
    },
  );
});

afterEach(cleanup);

function renderUi(ui: React.ReactNode) {
  return render(
    <MantineProvider theme={gradilisTheme} forceColorScheme="light">
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

describe('HUDCoordonnees', () => {
  it('affiche les coordonnées en mono dans une région status, et passe axe', async () => {
    const { container, getByText } = renderUi(
      <HUDCoordonnees coordonnees="col 4 · rang 2" message="Emplacement libre" tonalite="succes" />,
    );
    const coords = getByText('col 4 · rang 2');
    expect(coords.style.fontFamily).toMatch(/monospace/);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    getByText('Emplacement libre');
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });

  it('double toujours la tonalité d’une icône (jamais la couleur seule)', () => {
    const { container } = renderUi(
      <HUDCoordonnees coordonnees="col 5 · rang 1" message="Structure : pilier" tonalite="erreur" />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
    // Tonalité neutre : pas d'icône (le message n'est pas un état).
    const { container: neutre } = renderUi(
      <HUDCoordonnees coordonnees="col 1 · rang 1" message="Palette n° 57" />,
    );
    expect(neutre.querySelector('svg')).toBeNull();
  });
});

describe('LayersPanel', () => {
  const CALQUES = [
    { id: 'zones', label: 'Zones / travées', actif: true },
    { id: 'bloquees', label: 'Cellules bloquées', actif: false },
  ];

  it('liste les calques dans un popover et remonte onChange(id, actif)', async () => {
    const onChange = vi.fn();
    renderUi(<LayersPanel calques={CALQUES} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Calques' }));

    const zones = await screen.findByLabelText<HTMLInputElement>('Zones / travées');
    const bloquees = screen.getByLabelText<HTMLInputElement>('Cellules bloquées');
    // L'état vient de la liste déclarative (possédé par l'appelant).
    expect(zones.checked).toBe(true);
    expect(bloquees.checked).toBe(false);

    fireEvent.click(zones);
    expect(onChange).toHaveBeenCalledWith('zones', false);
    fireEvent.click(bloquees);
    expect(onChange).toHaveBeenCalledWith('bloquees', true);
  });

  it('passe axe, popover ouvert', async () => {
    const { container } = renderUi(<LayersPanel calques={CALQUES} onChange={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Calques' }));
    await screen.findByLabelText('Zones / travées');
    expect((await axe(document.body, AXE_OPTIONS)).violations).toEqual([]);
    expect(container).toBeDefined();
  });
});

describe('Minimap', () => {
  const viewport = { x: 40, y: 20, largeur: 200, hauteur: 100, echelle: 2 };

  function renderMinimap(onCentrer = vi.fn()) {
    const rendu = renderUi(
      <Minimap
        largeurMonde={400}
        hauteurMonde={200}
        largeur={200}
        viewport={viewport}
        onCentrer={onCentrer}
        contenu={(echelle) => <span data-testid="mini-contenu">{echelle}</span>}
      />,
    );
    return { onCentrer, ...rendu };
  }

  it('appelle le render-prop avec l’échelle réduite et dessine le rectangle de viewport', () => {
    const { container } = renderMinimap();
    // 200 px de minimap pour 400 px de monde → échelle 0.5.
    expect(screen.getByTestId('mini-contenu').textContent).toBe('0.5');
    const rect = container.querySelector<HTMLElement>('[data-minimap-viewport]');
    expect(rect).not.toBeNull();
    expect(rect?.style.left).toBe('20px'); // 40 × 0.5
    expect(rect?.style.top).toBe('10px');
    expect(rect?.style.width).toBe('100px'); // 200 × 0.5
    expect(rect?.style.height).toBe('50px');
  });

  it('recentre au clic puis pendant le drag (coordonnées monde)', () => {
    const { container, onCentrer } = renderMinimap();
    const carte = container.querySelector('[role="img"]');
    expect(carte).not.toBeNull();
    if (!carte) return;
    // jsdom : rect = (0,0) → clic (50, 25) px minimap = (100, 50) monde.
    fireEvent.pointerDown(carte, { clientX: 50, clientY: 25, pointerId: 1 });
    expect(onCentrer).toHaveBeenLastCalledWith(100, 50);
    fireEvent.pointerMove(carte, { clientX: 60, clientY: 30, pointerId: 1 });
    expect(onCentrer).toHaveBeenLastCalledWith(120, 60);
    fireEvent.pointerUp(carte, { pointerId: 1 });
    fireEvent.pointerMove(carte, { clientX: 80, clientY: 40, pointerId: 1 });
    expect(onCentrer).toHaveBeenCalledTimes(2); // plus rien après le relâcher
  });

  it('passe axe', async () => {
    const { container } = renderMinimap();
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('CanonSpatial (section « Plateau spatial » de l’app-canon)', () => {
  it('rend le plateau factice — zones, palettes étiquetées, commandes zoom — et passe axe', async () => {
    const { container, getByText, getAllByText } = renderUi(<CanonSpatial />);
    getByText('N-12'); // étiquette de zone
    getByText('57'); // numéro de palette
    expect(getAllByText('Golden').length).toBeGreaterThan(0); // étiquettes variété
    screen.getByRole('img', { name: 'Minimap du plateau' });
    // Les commandes du châssis sont là et ne jettent pas en jsdom.
    fireEvent.click(screen.getByRole('button', { name: 'Zoom avant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom arrière' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajuster à la vue' }));
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });

  it('les calques pilotent le rendu (état possédé par la section)', async () => {
    renderUi(<CanonSpatial />);
    fireEvent.click(screen.getByRole('button', { name: 'Calques' }));

    fireEvent.click(await screen.findByLabelText('Zones / travées'));
    expect(screen.queryByText('N-12')).toBeNull();

    fireEvent.click(screen.getByLabelText('Étiquettes'));
    expect(screen.queryByText('57')).toBeNull();

    fireEvent.click(screen.getByLabelText('Zones / travées'));
    expect(screen.queryByText('N-12')).not.toBeNull();
  });
});
