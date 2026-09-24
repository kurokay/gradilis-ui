// @vitest-environment jsdom
/**
 * FittedDataTable — chrome de pagination (verrou des libellés génériques,
 * injection via `GradilisLabelsProvider`), affordance « Auto » conditionnelle,
 * et recalage de `page` hors bornes.
 */
import { useRef } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { FittedDataTable } from './FittedDataTable.js';
import { GradilisLabelsProvider, DEFAULT_LABELS } from '../lib/labels.js';
import type { TableAutoFit } from '../hooks/useTableAutoFit.js';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
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

afterEach(cleanup);

function renderAvecProviders(ui: React.ReactNode) {
  return render(<MantineProvider forceColorScheme="light">{ui}</MantineProvider>);
}

/** Bundle `fit` de test : un `useTableAutoFit` réel exigerait localStorage + mesure DOM. */
function useFitStub(overrides: Partial<TableAutoFit['fit']> = {}): TableAutoFit['fit'] {
  const ref = useRef<HTMLDivElement>(null);
  return {
    enabled: false,
    ref,
    height: 0,
    isAuto: true,
    resetToAuto: () => {},
    ready: true,
    ...overrides,
  };
}

interface Ligne {
  id: number;
  nom: string;
}
const ROWS: Ligne[] = [{ id: 1, nom: 'A' }];
const COLUMNS = [{ accessor: 'nom' }];

function Table(props: { fit?: Partial<TableAutoFit['fit']>; [k: string]: unknown }) {
  const { fit: fitOverrides, ...rest } = props;
  const fit = useFitStub(fitOverrides);
  return <FittedDataTable fit={fit} records={ROWS} columns={COLUMNS} {...rest} />;
}

describe('FittedDataTable — chrome de pagination (défauts et injection)', () => {
  // ⚠️ mantine-datatable rend `noRecordsText` à DEUX endroits quand
  // `totalRecords === 0` : l'état vide du corps de table ET le pied de
  // pagination (qui n'a pas de plage à annoncer). `getAllByText` est donc le
  // bon outil ici, pas `getByText` — les deux occurrences sont attendues.

  it('sans provider : les défauts FR historiques sont rendus tels quels', () => {
    renderAvecProviders(
      <Table totalRecords={0} recordsPerPage={20} page={1} onPageChange={() => {}} />,
    );
    expect(screen.getAllByText(DEFAULT_LABELS.dataTable.noRecordsText).length).toBeGreaterThan(0);
  });

  it('avec provider : noRecordsText générique suit la langue injectée', () => {
    renderAvecProviders(
      <GradilisLabelsProvider value={{ dataTable: { noRecordsText: 'Sin registros' } }}>
        <Table totalRecords={0} recordsPerPage={20} page={1} onPageChange={() => {}} />
      </GradilisLabelsProvider>,
    );
    expect(screen.getAllByText('Sin registros').length).toBeGreaterThan(0);
    expect(screen.queryByText(DEFAULT_LABELS.dataTable.noRecordsText)).toBeNull();
  });

  /**
   * ⚠️ LE test du verrou : le chrome de pagination appartient au wrapper, jamais
   * à l'appelant — un `loadingText`/`recordsPerPageLabel`/`paginationText` étalé
   * par réflexe (le geste canonique sur `<DataTable>` nu) ne doit RIEN changer.
   */
  it('CHROME_LABEL_KEYS : loadingText/recordsPerPageLabel/paginationText de l’appelant sont ignorés', () => {
    renderAvecProviders(
      <Table
        totalRecords={40}
        recordsPerPage={10}
        page={1}
        onPageChange={() => {}}
        loadingText="Un texte que l'appelant n'aurait pas dû pouvoir poser"
        recordsPerPageLabel="Autre chose"
        paginationText={() => 'Jamais affiché'}
      />,
    );
    // Le texte de pagination par défaut reste celui du wrapper (la borne haute
    // suit le nombre de lignes RENDUES par la page de test, 1 seule ligne).
    expect(
      screen.getByText(DEFAULT_LABELS.dataTable.paginationText({ from: 1, to: 1, totalRecords: 40 })),
    ).toBeTruthy();
    expect(screen.queryByText('Jamais affiché')).toBeNull();
  });

  it('noRecordsText MÉTIER (différent du défaut générique) reste affiché tel quel', () => {
    renderAvecProviders(
      <Table
        totalRecords={0}
        recordsPerPage={20}
        page={1}
        onPageChange={() => {}}
        noRecordsText="Aucune vente enregistrée sur cette période."
      />,
    );
    expect(
      screen.getAllByText('Aucune vente enregistrée sur cette période.').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(DEFAULT_LABELS.dataTable.noRecordsText)).toBeNull();
  });

  it('noRecordsText IDENTIQUE à la constante générique est absorbé par le wrapper (aucun effet observable)', () => {
    // Poser explicitement la valeur générique par défaut ne doit ni planter ni
    // produire un rendu différent de « ne pas la poser du tout » : elle est
    // filtrée avant l'assemblage, dans les deux cas.
    const sansOverride = renderAvecProviders(
      <Table totalRecords={0} recordsPerPage={20} page={1} onPageChange={() => {}} />,
    );
    const compteSansOverride = sansOverride.getAllByText(
      DEFAULT_LABELS.dataTable.noRecordsText,
    ).length;
    sansOverride.unmount();

    renderAvecProviders(
      <Table
        totalRecords={0}
        recordsPerPage={20}
        page={1}
        onPageChange={() => {}}
        noRecordsText={DEFAULT_LABELS.dataTable.noRecordsText}
      />,
    );
    expect(screen.getAllByText(DEFAULT_LABELS.dataTable.noRecordsText)).toHaveLength(
      compteSansOverride,
    );
  });
});

describe('FittedDataTable — affordance « Auto »', () => {
  it('fit.enabled=false : aucun bouton Auto (resetToAuto serait un no-op)', () => {
    renderAvecProviders(
      <Table
        fit={{ enabled: false }}
        totalRecords={40}
        recordsPerPage={10}
        page={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: DEFAULT_LABELS.autoFit.ariaLabel })).toBeNull();
  });

  it('fit sans `enabled` (construit hors du hook) : le bouton Auto reste rendu', () => {
    renderAvecProviders(
      <Table fit={{ enabled: undefined }} totalRecords={40} recordsPerPage={10} page={1} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: DEFAULT_LABELS.autoFit.ariaLabel })).toBeTruthy();
  });

  it('fit.enabled=true : le bouton Auto est rendu', () => {
    renderAvecProviders(
      <Table
        fit={{ enabled: true }}
        totalRecords={40}
        recordsPerPage={10}
        page={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: DEFAULT_LABELS.autoFit.ariaLabel })).toBeTruthy();
  });
});

describe('FittedDataTable — recalage de `page` hors bornes', () => {
  /**
   * ⚠️ Cas historique du correctif : le résultat FILTRÉ tient sur une page (5
   * lignes, taille 10) mais `page` est encore à 3 (recherche précédente sur un
   * jeu plus large). `totalRecords > recordsPerPage` est FAUX ici (5 ≤ 10) — la
   * garde `paginationNeeded` du clamp doit donc être ABSENTE, sinon ce cas précis
   * ne recale jamais et la table affiche un état vide par-dessus des lignes qui
   * existent.
   */
  it('recale même quand la pagination n’est pas « nécessaire » (résultat tenant sur une page)', () => {
    const onPageChange = vi.fn();
    renderAvecProviders(
      <Table totalRecords={5} recordsPerPage={10} page={3} onPageChange={onPageChange} />,
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('ne recale pas quand `page` est dans les bornes', () => {
    const onPageChange = vi.fn();
    renderAvecProviders(
      <Table totalRecords={40} recordsPerPage={10} page={2} onPageChange={onPageChange} />,
    );
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('recale en page 1 sur un résultat VIDE hors chargement (filtre sans résultat)', () => {
    // Hors `fetching`, un total de 0 est une réponse : la page 3 d'une liste vide n'a pas
    // de sens, et la garder ferait retomber en page 3 au retrait du filtre.
    const onPageChange = vi.fn();
    renderAvecProviders(
      <Table totalRecords={0} recordsPerPage={10} page={3} onPageChange={onPageChange} />,
    );
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('ne recale pas un total de 0 PENDANT un chargement (`fetching`)', () => {
    // Page restaurée depuis l'URL : les données ne sont pas encore arrivées, l'appelant
    // passe 0 faute de mieux — et doit alors passer `fetching`.
    const onPageChange = vi.fn();
    renderAvecProviders(
      <Table fetching totalRecords={0} recordsPerPage={10} page={3} onPageChange={onPageChange} />,
    );
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('ne recale pas pendant un rechargement (`fetching`)', () => {
    const onPageChange = vi.fn();
    renderAvecProviders(
      <Table fetching totalRecords={5} recordsPerPage={10} page={3} onPageChange={onPageChange} />,
    );
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('ne plante pas sur recordsPerPage=0 (repli défensif)', () => {
    const onPageChange = vi.fn();
    expect(() =>
      renderAvecProviders(
        <Table totalRecords={5} recordsPerPage={0} page={3} onPageChange={onPageChange} />,
      ),
    ).not.toThrow();
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

describe('FittedDataTable — attributs data-*', () => {
  it('posés sur le div racine, pas transmis à la table sous-jacente', () => {
    const { container } = renderAvecProviders(
      <Table
        totalRecords={0}
        recordsPerPage={20}
        page={1}
        onPageChange={() => {}}
        data-tour="ancre-test"
      />,
    );
    expect(container.querySelector('[data-tour="ancre-test"]')).toBeTruthy();
  });
});

describe('FittedDataTable — contrat de type', () => {
  it('les libellés de chrome ne sont pas acceptés par le type des props', () => {
    const ref = { current: null };
    const fit = { ref, height: 0, isAuto: false, resetToAuto: () => {}, ready: true };
    // Vérifié par `npm run typecheck` : si le type les acceptait de nouveau, les
    // directives ci-dessous deviendraient inutiles et tsc échouerait.
    const el = (
      <FittedDataTable
        fit={fit}
        records={ROWS}
        columns={COLUMNS}
        // @ts-expect-error — retiré du type : passer par GradilisLabelsProvider
        paginationText={() => 'x'}
      />
    );
    expect(el).toBeTruthy();
  });
});
