// @vitest-environment jsdom
/**
 * `notify` — nom accessible du bouton de fermeture des toasts.
 *
 * ⚠️ Défaut réel, mesuré au navigateur par la pépinière (axe `button-name`,
 * CRITIQUE) : le `CloseButton` de `Notification` (Mantine) ne rend qu'une icône
 * SVG, sans texte ni `aria-label`. Chaque toast affiché ajoutait donc un bouton
 * sans nom à la page, et une app ne peut pas le corriger de son côté sans
 * renoncer au helper.
 *
 * Contrairement à `notify.test.ts` (espion sur la charge), on REND ici le
 * provider `<Notifications>` réel : c'est le DOM que lit un lecteur d'écran, et
 * c'est lui que axe audite. Toutes les variantes qui ont un bouton de fermeture
 * sont couvertes, y compris l'erreur construite depuis une exception et les
 * trois issues de `resolve`.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications, notifications } from '@mantine/notifications';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { gradilisTheme } from '../theme.js';
import { NOTIFICATIONS_PROVIDER_PROPS, notify } from './notify.js';

// Contraste non calculable en jsdom (pas de canvas) — garanti par ailleurs (§3.2/§3.7).
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

const NOM = 'Fermer la notification';

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

afterEach(() => {
  // Le store de `@mantine/notifications` est GLOBAL : sans remise à zéro, les
  // toasts d'un test resteraient affichés dans le suivant.
  act(() => notifications.clean());
  cleanup();
});

/** Monte le provider réel (mêmes props que l'app) et affiche un toast. */
function afficher(montrer: () => void) {
  render(
    <MantineProvider theme={gradilisTheme} forceColorScheme="light">
      <Notifications {...NOTIFICATIONS_PROVIDER_PROPS} />
    </MantineProvider>,
  );
  act(montrer);
}

const VARIANTES: Array<[string, () => void]> = [
  ['success', () => notify.success('Enregistré')],
  ['error (chaîne)', () => notify.error('Refusé')],
  ['error (exception API)', () => notify.error({ response: { data: { error: 'Boom' } } })],
  ['error (exception sans message → repli)', () => notify.error(new Error('interne'))],
  ['warning', () => notify.warning('Partiel')],
  ['info', () => notify.info('Pour info')],
  ['resolve(true)', () => notify.resolve(notify.loading('…'), true, 'Fini')],
  ['resolve(false)', () => notify.resolve(notify.loading('…'), false, 'Échec')],
  ["resolve('warning')", () => notify.resolve(notify.loading('…'), 'warning', '2 en échec')],
  // `notifications.update` FUSIONNE avec le toast existant : les trois cas
  // ci-dessus héritent du nom posé par `loading`. Ce cas-ci prouve que `resolve`
  // le pose lui-même (toast de chargement créé hors du helper).
  ['resolve d’un toast posé hors helper', () => {
    notifications.show({ id: 'externe', message: '…', loading: true, withCloseButton: false });
    notify.resolve('externe', true, 'Fini');
  }],
  // Et réciproquement : `loading` nomme sa croix si l'appelant la rétablit.
  ['loading avec croix rétablie', () => notify.loading('…', { withCloseButton: true })],
];

describe('notify — bouton de fermeture nommé', () => {
  it.each(VARIANTES)('%s : un seul bouton, nommé « Fermer la notification »', (_, montrer) => {
    afficher(montrer);
    const boutons = screen.getAllByRole('button');
    expect(boutons).toHaveLength(1);
    expect(boutons[0]!.getAttribute('aria-label')).toBe(NOM);
    screen.getByRole('button', { name: NOM });
  });

  it.each(VARIANTES)('%s : passe axe (button-name compris)', async (_, montrer) => {
    afficher(montrer);
    // Contrôle de non-vacuité : axe sur un DOM sans toast passerait au vert.
    expect(screen.getAllByRole('button')).toHaveLength(1);
    // Sous `act` : les transitions d'entrée du toast se terminent PENDANT l'audit
    // (asynchrone) ; hors `act`, React le signale en avertissement.
    let violations: unknown[] = [];
    await act(async () => {
      violations = (await axe(document.body, AXE_OPTIONS)).violations;
    });
    expect(violations).toEqual([]);
  });

  it('loading : toujours sans bouton de fermeture (inchangé)', () => {
    afficher(() => notify.loading('Chargement'));
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('un `closeButtonProps` de l’appelant COMPLÈTE le nom, et son `aria-label` prime', () => {
    afficher(() => {
      notify.info('a', { closeButtonProps: { 'data-testid': 'croix' } });
      notify.info('b', { closeButtonProps: { 'aria-label': 'Masquer' } });
    });
    expect(screen.getByTestId('croix').getAttribute('aria-label')).toBe(NOM);
    screen.getByRole('button', { name: 'Masquer' });
  });
});
