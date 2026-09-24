/**
 * Route unique du banc, pilotée par les paramètres d'URL `?section=&marque=&schema=`
 * (voir README.md). Une section par capture, montée SEULE (pas emboîtée dans
 * `CanonAppShell`, sauf pour la section `appshell` elle-même) — patron
 * `MantineProvider > ModalsProvider > MemoryRouter` repris de `canon.test.tsx`.
 */
import { useEffect, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { MemoryRouter } from 'react-router';

import {
  CanonAppShell,
  CanonColors,
  CanonForm,
  CanonKPI,
  CanonSpatial,
  CanonStates,
  CanonTable,
} from '../src/canon/index.js';
import { THEMES, type MarqueId } from './brands.js';

const SECTIONS = {
  appshell: CanonAppShell,
  tableau: CanonTable,
  formulaire: CanonForm,
  kpi: CanonKPI,
  etats: CanonStates,
  couleurs: CanonColors,
  spatial: CanonSpatial,
} as const;

export type SectionId = keyof typeof SECTIONS;

function lireParametres() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section') as SectionId | null;
  const marque = params.get('marque') as MarqueId | null;
  const schema = params.get('schema') === 'sombre' ? 'dark' : 'light';
  return {
    section: section && section in SECTIONS ? section : 'tableau',
    marque: marque && marque in THEMES ? marque : 'pepiniere',
    schema,
  } as const;
}

/**
 * Signale la page prête à capturer : composant monté (effet passé), polices
 * chargées, et deux frames de rendu écoulées (laisse `ResizeObserver`
 * — `FittedDataTable`/`ResponsiveContainer`/minimap — se stabiliser une fois).
 * `canon.spec.ts` attend `body[data-ready="1"]` avant `toHaveScreenshot`.
 */
function useMarqueurPret() {
  useEffect(() => {
    let annule = false;
    const marquerPret = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!annule) document.body.dataset.ready = '1';
        });
      });
    };
    const polices = 'fonts' in document ? document.fonts.ready : Promise.resolve();
    polices.then(marquerPret).catch(marquerPret);
    return () => {
      annule = true;
    };
  }, []);
}

export function App() {
  const [{ section, marque, schema }] = useState(lireParametres);
  useMarqueurPret();

  const Section = SECTIONS[section];
  // La section `appshell` a besoin d'un `NavLink` ACTIF pour que la capture
  // varie avec la marque (le lien actif porte la couleur PRIMAIRE du thème) —
  // constaté : sans ça, les captures pépinière/factice de l'AppShell étaient
  // OCTET POUR OCTET identiques (aucun contraste de marque testé). Les autres
  // sections n'ont pas de router interne à ce point (`PageBreadcrumb` seul),
  // donc l'entrée '/canon' générique leur suffit.
  const entree = section === 'appshell' ? '/canon/tableau' : '/canon';

  return (
    <MantineProvider theme={THEMES[marque]} forceColorScheme={schema}>
      <ModalsProvider>
        <MemoryRouter initialEntries={[entree]}>
          <Section />
        </MemoryRouter>
      </ModalsProvider>
    </MantineProvider>
  );
}
