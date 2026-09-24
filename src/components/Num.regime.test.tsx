// @vitest-environment jsdom
/**
 * `<Num regime>` et garde d'exécution `assertRegimeOnMoney`.
 *
 * ⚠️ `configureNum` écrit un état de MODULE : remise à zéro en `afterEach`, sinon
 * un test passerait au vert grâce à la configuration de son voisin.
 * ⚠️ Le garde dédoublonne par TEXTE (état de module lui aussi) : chaque sonde
 * porte un texte unique.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { axe } from 'vitest-axe';
import {
  Num,
  assertRegimeOnMoney,
  configureNum,
  looksLikeMoney,
  regimeLabel,
  MONEY_MARKER,
} from './Num.js';

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
});

afterEach(() => {
  cleanup();
  configureNum({});
  vi.restoreAllMocks();
});

const monter = (ui: React.ReactNode) => render(<MantineProvider>{ui}</MantineProvider>);

describe('Num — marqueur de régime', () => {
  it('sans regime : aucun marqueur, un seul élément (rendu historique)', () => {
    const { container } = monter(<Num>12,500</Num>);
    expect(container.querySelector('[data-regime]')).toBeNull();
    expect(container.querySelectorAll('span').length).toBe(1);
  });

  it('regime="ht"/"ttc"/"tva" : marqueur FR par défaut, forme longue en `title`', () => {
    const { container } = monter(
      <>
        <Num regime="ht">12,00 €</Num>
        <Num regime="ttc">14,40 €</Num>
        <Num regime="tva">2,40 €</Num>
      </>,
    );
    const ht = container.querySelector('abbr[data-regime="ht"]')!;
    expect(ht.textContent).toBe('\u00A0HT');
    expect(ht.getAttribute('title')).toBe('hors taxes');
    expect(container.querySelector('[data-regime="ttc"]')!.getAttribute('title')).toBe(
      'toutes taxes comprises',
    );
    expect(container.querySelector('[data-regime="tva"]')!.textContent).toBe('\u00A0TVA');
  });

  it('⚠️ le marqueur est un FRÈRE du nombre, hors de l’élément à classe marqueur', () => {
    configureNum({ markerClass: 'confidential-value' });
    const { container } = monter(<Num regime="ttc">12,00 €</Num>);
    const value = container.querySelector('.confidential-value')!;
    expect(value.textContent).toBe('12,00 €');
    expect(value.querySelector('[data-regime]')).toBeNull();
    expect(value.nextElementSibling?.getAttribute('data-regime')).toBe('ttc');
  });

  it('la classe de l’appelant et `tabular-nums` survivent au marqueur', () => {
    const { container } = monter(
      <Num regime="ht" className="a-moi">
        9,00 €
      </Num>,
    );
    const value = container.querySelector('.a-moi') as HTMLElement;
    expect(value.style.fontVariantNumeric).toBe('tabular-nums');
  });

  it('libellés injectés : la fonction est lue À CHAQUE RENDU', () => {
    let langue = 'es';
    configureNum({
      regimeLabel: (r, form) => `${langue}:${r}:${form}`,
    });
    const { container, rerender } = monter(<Num regime="ht">1 €</Num>);
    const mark = () => container.querySelector('[data-regime]')!;
    expect(mark().textContent).toBe('\u00A0es:ht:short');
    expect(mark().getAttribute('title')).toBe('es:ht:long');
    langue = 'pt';
    rerender(
      <MantineProvider>
        <Num regime="ht">1 €</Num>
      </MantineProvider>,
    );
    expect(mark().textContent).toBe('\u00A0pt:ht:short');
    expect(regimeLabel('ttc')).toBe('pt:ttc:short');
  });

  it('`configureNum({})` restaure les libellés FR (remplacement complet)', () => {
    configureNum({ regimeLabel: () => 'x' });
    configureNum({});
    expect(regimeLabel('ht')).toBe('HT');
    expect(regimeLabel('ht', 'long')).toBe('hors taxes');
  });

  it('a11y : aucun défaut axe avec un marqueur', async () => {
    const { container } = monter(<Num regime="ttc">3,00 €</Num>);
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});

describe('garde d’exécution — un montant rendu sans régime crie', () => {
  it('reconnaît un montant dans les enfants primitifs, pas une quantité', () => {
    expect(MONEY_MARKER).toBe('€');
    expect(looksLikeMoney('1 234,56 €')).toBe(true);
    expect(looksLikeMoney(['CA ', '1 234,56 €'])).toBe(true);
    expect(looksLikeMoney('12,500 kg')).toBe(false);
    expect(looksLikeMoney('—')).toBe(false);
  });

  it('crie une fois sur un montant sans régime, se tait sinon', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    assertRegimeOnMoney('sonde-A 41,00 €', undefined);
    assertRegimeOnMoney('sonde-A 41,00 €', undefined);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0]![0])).toContain('sans régime');
    assertRegimeOnMoney('sonde-B 8,500 kg', undefined);
    assertRegimeOnMoney('sonde-C 41,00 €', 'ttc');
    assertRegimeOnMoney('—', undefined);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('⚠️ par DÉFAUT, `<Num>` n’appelle pas le garde (aucun bruit hors opt-in)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    monter(<Num>sonde-D 5,00 €</Num>);
    expect(spy).not.toHaveBeenCalled();
  });

  it('activé : `<Num>` crie sur un montant sans régime, pas sur une quantité ni avec régime', () => {
    configureNum({ guardMoneyRegime: true });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    monter(
      <>
        <Num>sonde-E 7,00 €</Num>
        <Num>sonde-F 3 kg</Num>
        <Num regime="ht">sonde-G 7,00 €</Num>
      </>,
    );
    const garde = spy.mock.calls.filter((c) => String(c[0]).startsWith('[Num]'));
    expect(garde).toHaveLength(1);
    expect(String(garde[0]![0])).toContain('sonde-E');
  });
});
