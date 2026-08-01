// @vitest-environment jsdom
/**
 * Garde-fous des points d'injection de niveau MODULE (`configureNum`,
 * `configureNotify`) et du slot `actions` de `PageBreadcrumb`.
 *
 * ⚠️ Ce que ces tests protègent avant tout : **le comportement PAR DÉFAUT**.
 * Toute la promesse de ce chantier est qu'une app qui ne configure rien ne voit
 * aucun changement — c'est ce qui permet de faire évoluer le socle sans toucher
 * à `gradilis_pepiniere_app`, qui est en pause. Un défaut qui dérive casserait
 * une application que personne ne regarde en ce moment.
 *
 * ⚠️ `configureNum` et `configureNotify` écrivent un état de MODULE, partagé
 * entre les tests d'un même fichier. D'où la remise à zéro systématique en
 * `afterEach` : sans elle, l'ordre d'exécution deviendrait significatif et un
 * test pourrait passer au vert grâce à la configuration posée par son voisin.
 */
import { afterEach, beforeAll, describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Num, configureNum } from '../components/Num.js';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { configureNotify, getNotifyColors } from './notify.js';

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
});

afterEach(() => {
  cleanup();
  configureNum({});
  configureNotify({});
});

function monter(ui: React.ReactNode) {
  return render(
    <MantineProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

describe('configureNum — classe marqueur', () => {
  /**
   * ⚠️ On vérifie l'absence du MARQUEUR, pas l'absence de tout `class` : le
   * `<Text>` de Mantine pose toujours les siennes (`mantine-focus-auto`, hash de
   * module…). Une première version assertait `class === null` et rougissait sur
   * une prémisse fausse — le composant, lui, était correct.
   */
  it('par défaut : aucune classe marqueur ajoutée', () => {
    const { container } = monter(<Num>12,50</Num>);
    const cls = container.querySelector('span')?.className ?? '';
    expect(cls).not.toContain('confidential-value');
    expect(cls).not.toContain('marqueur');
  });

  it('configurée : la classe est posée sur chaque instance', () => {
    configureNum({ markerClass: 'confidential-value' });
    const { container } = monter(<Num>12,50</Num>);
    expect(container.querySelector('span')?.className).toContain('confidential-value');
  });

  /** ⚠️ La classe marqueur ne doit pas ÉCRASER celle de l'appelant. */
  it('se combine avec un className fourni par l’appelant', () => {
    configureNum({ markerClass: 'marqueur' });
    const { container } = monter(<Num className="a-moi">12,50</Num>);
    const cls = container.querySelector('span')?.className ?? '';
    expect(cls).toContain('marqueur');
    expect(cls).toContain('a-moi');
  });
});

describe('configureNotify — couleurs', () => {
  it('par défaut : les noms canoniques du socle', () => {
    expect(getNotifyColors()).toEqual({
      success: 'succes',
      error: 'erreur',
      info: 'info',
      warning: 'alerte',
    });
  });

  /** ⚠️ Surcharge PARTIELLE : ne fournir que `error` ne doit pas vider le reste. */
  it('surcharge partielle : les autres couleurs gardent leur défaut', () => {
    configureNotify({ colors: { error: 'ampBrique' } });
    const c = getNotifyColors();
    expect(c.error).toBe('ampBrique');
    expect(c.success).toBe('succes');
    expect(c.warning).toBe('alerte');
    expect(c.info).toBe('info');
  });

  it('remise à zéro : `configureNotify({})` restaure les défauts', () => {
    configureNotify({ colors: { error: 'ampBrique' } });
    configureNotify({});
    expect(getNotifyColors().error).toBe('erreur');
  });
});

describe('PageBreadcrumb — slot `actions`', () => {
  /**
   * ⚠️ Le test de non-régression : sans `actions`, le markup ne doit gagner
   * AUCUN conteneur. C'est ce qui garantit que l'ajout du slot ne déplace rien
   * chez le consommateur actuel.
   */
  it('sans actions : le <nav> n’est pas enveloppé', () => {
    const { getByRole } = monter(<PageBreadcrumb items={[{ label: 'Commandes' }]} />);
    const nav = getByRole('navigation');
    // Le parent direct est le conteneur de rendu, pas un Group ajouté par nous.
    expect(nav.parentElement?.getAttribute('class') ?? '').not.toMatch(/mantine-Group/);
  });

  it('avec actions : le contenu fourni est rendu à côté du fil', () => {
    const { getByRole, getByText } = monter(
      <PageBreadcrumb items={[{ label: 'Commandes' }]} actions={<button type="button">Aide</button>} />,
    );
    expect(getByText('Aide')).toBeTruthy();
    expect(getByRole('navigation')).toBeTruthy();
  });
});
