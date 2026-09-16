// @vitest-environment jsdom
/**
 * Garde-fou du point d'injection des libellés (dé-brandification étape 1).
 *
 * Ce que ces tests protègent, dans l'ordre d'importance :
 *
 * 1. **La non-régression du seul consommateur actuel.** Sans provider, les
 *    primitives doivent rendre les chaînes FR historiques, au caractère près —
 *    sinon l'application Pépinière change d'apparence sans avoir rien demandé.
 *    ⚠️ C'est déjà couvert de fait par `components/primitives.test.tsx` (qui
 *    attend « Accueil » et « Fil d'Ariane ») ; on le réaffirme ici parce que
 *    c'est désormais une PROMESSE d'API, pas un simple détail de rendu.
 * 2. **La fusion par section.** Le piège n'est pas théorique : un
 *    `{...defaults, ...value}` plat remplacerait `breadcrumb` en entier, donc
 *    surcharger `home` seul viderait `landmark` — un `<nav>` sans nom
 *    accessible, invisible à l'écran et cassé pour un lecteur d'écran.
 */
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { GradilisLabelsProvider, DEFAULT_LABELS } from './labels.js';

// Stubs des APIs navigateur absentes de jsdom, requises par Mantine et par le
// repli mobile de `PageBreadcrumb` (`useMediaQuery`). Même patron que
// `components/primitives.test.tsx` — `matches: false` = viewport large, donc
// c'est bien la piste complète du fil qui est rendue, pas le repli « ← Parent ».
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

function monter(ui: React.ReactNode) {
  return render(
    <MantineProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </MantineProvider>,
  );
}

const FIL = <PageBreadcrumb items={[{ label: 'Commandes' }]} />;

describe('injection des libellés du socle', () => {
  it('sans provider : rend les défauts FR historiques (non-régression Pépinière)', () => {
    const { getByRole } = monter(FIL);
    const nav = getByRole('navigation', { name: "Fil d'Ariane" });
    expect(nav.textContent).toContain('Accueil');
  });

  it('avec provider : le segment racine et le landmark sont remplacés', () => {
    const { getByRole } = monter(
      <GradilisLabelsProvider value={{ breadcrumb: { home: 'Inicio', landmark: 'Ruta de navegación' } }}>
        {FIL}
      </GradilisLabelsProvider>,
    );
    const nav = getByRole('navigation', { name: 'Ruta de navegación' });
    expect(nav.textContent).toContain('Inicio');
    expect(nav.textContent).not.toContain('Accueil');
  });

  /**
   * ⚠️ LE test de ce fichier. Une surcharge partielle ne doit JAMAIS effacer les
   * clés voisines : ici on ne fournit que `home`, et `landmark` doit rester le
   * défaut. Avec un spread plat, `getByRole('navigation', { name: … })` ne
   * trouverait plus rien — et personne ne le verrait à l'écran.
   */
  it('surcharge PARTIELLE : les clés non fournies gardent leur défaut', () => {
    const { getByRole } = monter(
      <GradilisLabelsProvider value={{ breadcrumb: { home: 'Inicio' } }}>{FIL}</GradilisLabelsProvider>,
    );
    const nav = getByRole('navigation', { name: DEFAULT_LABELS.breadcrumb.landmark });
    expect(nav.textContent).toContain('Inicio');
  });

  /**
   * Contrôle de non-vacuité des défauts : un défaut vide rendrait les deux tests
   * ci-dessus satisfaisables par accident (un `name: ''` ne matche rien d'utile)
   * et surtout produirait un landmark anonyme en production.
   */
  it('aucun libellé par défaut n’est vide', () => {
    for (const section of Object.values(DEFAULT_LABELS)) {
      for (const [cle, valeur] of Object.entries(section)) {
        expect(valeur, `libellé par défaut vide : ${cle}`).toMatch(/\S/);
      }
    }
  });
});
