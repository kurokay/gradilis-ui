/**
 * `useAutoPageSize` — la mesure ne passe `ready` que sur des valeurs DIGNES DE CONFIANCE.
 *
 * Défaut couvert (backport de l'app de référence) : au premier rendu d'une liste serveur,
 * la taille était calculée sur des replis (pied de pagination absent, hauteur de ligne de
 * repli) et exposée `ready` ; `per_page` suivait chaque correction (5 → 8 → 12), soit une
 * requête serveur par étape. Retirer la garde `!chromeRef.current || reportedRowHRef.current
 * === null` fait rougir les deux premiers cas (vu rouge par mutation).
 */
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoPageSize } from './useAutoPageSize.js';

type Result = ReturnType<typeof useAutoPageSize>;

/** Hauteurs simulées (jsdom ne fait aucune mise en page : tout `offsetHeight` vaut 0). */
function heightOf(el: HTMLElement, rowH: number): number {
  if (el.tagName === 'THEAD') return 40;
  if (el.tagName === 'TR') return rowH;
  if (el.classList.contains('mantine-datatable-pagination')) return 50;
  return 0;
}

let rowH = 44;
const ORIGINAL_OFFSET_HEIGHT = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

beforeEach(() => {
  rowH = 44;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 100, left: 0, right: 800, bottom: 500, width: 800, height: 400, x: 0, y: 100,
    toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return heightOf(this, rowH);
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Rend à jsdom son accesseur d'origine.
  if (ORIGINAL_OFFSET_HEIGHT) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', ORIGINAL_OFFSET_HEIGHT);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
});

function Harness({ thead, footer, rows, out }: { thead: boolean; footer: boolean; rows: number; out: { r?: Result } }) {
  const r = useAutoPageSize();
  out.r = r;
  return (
    <div ref={r.ref}>
      <div className="mantine-datatable">
        <table>
          {thead && <thead><tr><th>h</th></tr></thead>}
          <tbody>
            {Array.from({ length: rows }, (_, i) => <tr key={i}><td>{i}</td></tr>)}
          </tbody>
        </table>
      </div>
      {footer && <div className="mantine-datatable-pagination">pied</div>}
    </div>
  );
}

describe('useAutoPageSize — `ready` seulement sur mesure réelle', () => {
  it('ne passe pas `ready` tant que le pied de pagination n’existe pas (replis)', () => {
    const out: { r?: Result } = {};
    render(<Harness thead footer={false} rows={3} out={out} />);
    expect(out.r?.ready).toBe(false);
  });

  it('ne passe pas `ready` tant qu’aucune VRAIE ligne n’a donné sa hauteur', () => {
    rowH = 2; // ligne placeholder de chargement : non plausible
    const out: { r?: Result } = {};
    render(<Harness thead footer rows={1} out={out} />);
    expect(out.r?.ready).toBe(false);
  });

  it('passe `ready` une fois en-tête, pied et vraie ligne mesurés', () => {
    const out: { r?: Result } = {};
    render(<Harness thead footer rows={3} out={out} />);
    expect(out.r?.ready).toBe(true);
    expect(out.r?.size).toBeGreaterThanOrEqual(5);
  });
});
