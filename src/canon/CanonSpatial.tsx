/**
 * CanonSpatial — section « Plateau spatial » de l'app-canon (plan Chantier K
 * §4, K.0) : LA référence de comparaison des futurs écrans carte (frigo K.2,
 * pépinière K.3). Démontre le châssis `@gradilis/ui/spatial` sur une grille
 * FACTICE (aucune donnée réelle, aucun appel réseau) :
 * pan/zoom (molette centrée curseur + boutons), minimap avec rectangle de
 * viewport live et recentrage clic/drag, calques on/off (état possédé ici,
 * comme le fera l'écran), HUD de coordonnées avec message contextuel tonal.
 *
 * Le drag de palettes (dnd-kit) n'est PAS démontré ici : il appartient à
 * l'écran K.2 (et ne se teste qu'en navigateur réel, plan §10).
 */
import { useState, type PointerEvent } from 'react';
import { Box, Group, Paper, Stack, Text } from '@mantine/core';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import { PageBreadcrumb } from '../components/PageBreadcrumb.js';
import { HUDCoordonnees, type HUDTonalite } from '../spatial/HUDCoordonnees.js';
import { LayersPanel, type Calque } from '../spatial/LayersPanel.js';
import { Minimap } from '../spatial/Minimap.js';
import { PanZoomControls } from '../spatial/PanZoomControls.js';
import { usePanZoom } from '../spatial/usePanZoom.js';

// ── Monde factice : un « frigo de démonstration » en grille (px monde) ──────
const COLONNES = 14;
const RANGS = 6;
const CELLULE = 56;
const LARGEUR_MONDE = COLONNES * CELLULE;
const HAUTEUR_MONDE = RANGS * CELLULE;
const HAUTEUR_PLATEAU = 420;

const PALETTES = [
  { numero: 57, col: 0, rang: 0, variete: 'Golden', pg: 'M9' },
  { numero: 58, col: 1, rang: 0, variete: 'Golden', pg: 'M9' },
  { numero: 61, col: 2, rang: 0, variete: 'Gala', pg: 'MM106' },
  { numero: 64, col: 0, rang: 1, variete: 'Gala', pg: 'M9' },
  { numero: 65, col: 1, rang: 1, variete: 'Chantecler', pg: 'M9' },
  { numero: 72, col: 6, rang: 0, variete: 'Reinette', pg: 'MM111' },
  { numero: 73, col: 7, rang: 0, variete: 'Reinette', pg: 'MM111' },
  { numero: 80, col: 6, rang: 2, variete: 'Fuji', pg: 'M9' },
  { numero: 88, col: 11, rang: 4, variete: 'Braeburn', pg: 'M26' },
] as const;

const CELLULES_BLOQUEES = [
  { col: 4, rang: 0, motif: 'pilier' },
  { col: 4, rang: 1, motif: 'pilier' },
  { col: 4, rang: 2, motif: 'pilier' },
  { col: 9, rang: 5, motif: 'groupe froid' },
  { col: 10, rang: 5, motif: 'groupe froid' },
] as const;

const ZONES = [
  { label: 'N-12', col: 0, rang: 0, w: 4, h: 3 },
  { label: 'N-14', col: 5, rang: 0, w: 4, h: 3 },
  { label: 'N-16', col: 10, rang: 0, w: 4, h: 3 },
  { label: 'N-18', col: 0, rang: 4, w: 8, h: 2 },
] as const;

const CALQUES_INITIAUX: Calque[] = [
  { id: 'zones', label: 'Zones / travées', actif: true },
  { id: 'bloquees', label: 'Cellules bloquées', actif: true },
  { id: 'etiquettes', label: 'Étiquettes', actif: true },
];

interface Survol {
  col: number;
  rang: number;
}

function messageSurvol(survol: Survol | null): { message: string; tonalite: HUDTonalite } {
  if (!survol) {
    return { message: 'Survolez le plateau — molette pour zoomer', tonalite: 'neutre' };
  }
  const bloquee = CELLULES_BLOQUEES.find((c) => c.col === survol.col && c.rang === survol.rang);
  if (bloquee) return { message: `Structure : ${bloquee.motif}`, tonalite: 'erreur' };
  const palette = PALETTES.find((p) => p.col === survol.col && p.rang === survol.rang);
  if (palette) {
    return {
      message: `Palette n° ${palette.numero} — ${palette.variete} | ${palette.pg}`,
      tonalite: 'neutre',
    };
  }
  return { message: 'Emplacement libre', tonalite: 'succes' };
}

export function CanonSpatial() {
  const panZoom = usePanZoom();
  const [calques, setCalques] = useState<Calque[]>(CALQUES_INITIAUX);
  const [survol, setSurvol] = useState<Survol | null>(null);

  const actif = (id: string) => calques.some((c) => c.id === id && c.actif);
  const basculerCalque = (id: string, actifNouveau: boolean) =>
    setCalques((liste) => liste.map((c) => (c.id === id ? { ...c, actif: actifNouveau } : c)));

  // Cellule survolée : le rect du monde inclut le transform CSS courant →
  // la proportion (pointeur − origine) / taille rendue est déjà en monde.
  const surPointeurMouvement = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * COLONNES);
    const rang = Math.floor(((event.clientY - rect.top) / rect.height) * RANGS);
    if (col < 0 || col >= COLONNES || rang < 0 || rang >= RANGS) {
      setSurvol(null);
      return;
    }
    setSurvol((courant) =>
      courant && courant.col === col && courant.rang === rang ? courant : { col, rang },
    );
  };

  const { message, tonalite } = messageSurvol(survol);

  return (
    <Stack gap="sm">
      <PageBreadcrumb
        items={[{ label: 'App-canon', to: '/canon' }, { label: 'Plateau spatial' }]}
      />
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text c="dimmed" size="sm">
          Châssis spatial partagé (`@gradilis/ui/spatial`, K.0) : pan/zoom molette et boutons,
          minimap (rectangle de viewport, clic/drag = recentrage), calques déclaratifs, HUD de
          coordonnées. Grille factice — la référence de comparaison des écrans carte K.2/K.3.
        </Text>
        <LayersPanel calques={calques} onChange={basculerCalque} />
      </Group>

      <Paper withBorder radius="md" shadow="sm" style={{ position: 'relative', overflow: 'hidden' }}>
        <TransformWrapper {...panZoom.wrapperProps}>
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: HAUTEUR_PLATEAU,
              backgroundColor: 'var(--gradilis-bg-subtle)',
            }}
          >
            <Box
              onPointerMove={surPointeurMouvement}
              onPointerLeave={() => setSurvol(null)}
              style={{
                position: 'relative',
                width: LARGEUR_MONDE,
                height: HAUTEUR_MONDE,
                backgroundColor: 'var(--mantine-color-white)',
                backgroundImage:
                  'linear-gradient(to right, var(--gradilis-border-muted) 1px, transparent 1px),' +
                  ' linear-gradient(to bottom, var(--gradilis-border-muted) 1px, transparent 1px)',
                backgroundSize: `${CELLULE}px ${CELLULE}px`,
                outline: '1px solid var(--gradilis-border)',
              }}
            >
              {actif('zones')
                ? ZONES.map((zone) => (
                    <Box
                      key={zone.label}
                      style={{
                        position: 'absolute',
                        left: zone.col * CELLULE,
                        top: zone.rang * CELLULE,
                        width: zone.w * CELLULE,
                        height: zone.h * CELLULE,
                        backgroundColor: 'var(--gradilis-bg-brand)',
                        opacity: 0.6,
                        border: '1px dashed var(--mantine-color-gradilisGreen-7)',
                        pointerEvents: 'none',
                      }}
                    >
                      <Text size="xs" fw={600} c="gradilisGreen.7" px={4}>
                        {zone.label}
                      </Text>
                    </Box>
                  ))
                : null}

              {actif('bloquees')
                ? CELLULES_BLOQUEES.map((cellule) => (
                    <Box
                      key={`${cellule.col}-${cellule.rang}`}
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: cellule.col * CELLULE,
                        top: cellule.rang * CELLULE,
                        width: CELLULE,
                        height: CELLULE,
                        backgroundImage:
                          'repeating-linear-gradient(45deg, var(--gradilis-border) 0,' +
                          ' var(--gradilis-border) 3px, transparent 3px, transparent 9px)',
                        border: '1px solid var(--gradilis-border)',
                        pointerEvents: 'none',
                      }}
                    />
                  ))
                : null}

              {PALETTES.map((palette) => (
                <Box
                  key={palette.numero}
                  style={{
                    position: 'absolute',
                    left: palette.col * CELLULE + 2,
                    top: palette.rang * CELLULE + 2,
                    width: CELLULE - 4,
                    height: CELLULE - 4,
                    backgroundColor: 'var(--mantine-color-gradilisGreen-1)',
                    border: '1px solid var(--mantine-color-gradilisGreen-7)',
                    borderRadius: 'var(--mantine-radius-xs)',
                    overflow: 'hidden',
                    paddingInline: 4,
                    pointerEvents: 'none',
                  }}
                >
                  {actif('etiquettes') ? (
                    <>
                      <Text size="xs" fw={600} ff="monospace" lh={1.3}>
                        {palette.numero}
                      </Text>
                      <Text size="xs" c="gradilisBrown.7" lh={1.3} truncate>
                        {palette.variete}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.3} truncate>
                        {palette.pg}
                      </Text>
                    </>
                  ) : null}
                </Box>
              ))}
            </Box>
          </TransformComponent>
        </TransformWrapper>

        {/* Overlays fixes du plateau (hors transform). */}
        <Box
          style={{
            position: 'absolute',
            top: 'var(--mantine-spacing-sm)',
            left: 'var(--mantine-spacing-sm)',
          }}
        >
          <PanZoomControls panZoom={panZoom} />
        </Box>
        <Box
          style={{
            position: 'absolute',
            bottom: 'var(--mantine-spacing-sm)',
            left: 'var(--mantine-spacing-sm)',
          }}
        >
          <HUDCoordonnees
            coordonnees={survol ? `col ${survol.col + 1} · rang ${survol.rang + 1}` : '— · —'}
            message={message}
            tonalite={tonalite}
          />
        </Box>
        <Box
          style={{
            position: 'absolute',
            bottom: 'var(--mantine-spacing-sm)',
            right: 'var(--mantine-spacing-sm)',
          }}
        >
          <Minimap
            largeurMonde={LARGEUR_MONDE}
            hauteurMonde={HAUTEUR_MONDE}
            largeur={168}
            viewport={panZoom.viewport}
            onCentrer={panZoom.centrerSur}
            label="Minimap du plateau"
            contenu={(echelle) => (
              <>
                {PALETTES.map((palette) => (
                  <Box
                    key={palette.numero}
                    style={{
                      position: 'absolute',
                      left: palette.col * CELLULE * echelle,
                      top: palette.rang * CELLULE * echelle,
                      width: Math.max(CELLULE * echelle - 1, 2),
                      height: Math.max(CELLULE * echelle - 1, 2),
                      backgroundColor: 'var(--mantine-color-gradilisGreen-6)',
                    }}
                  />
                ))}
                {CELLULES_BLOQUEES.map((cellule) => (
                  <Box
                    key={`${cellule.col}-${cellule.rang}`}
                    style={{
                      position: 'absolute',
                      left: cellule.col * CELLULE * echelle,
                      top: cellule.rang * CELLULE * echelle,
                      width: Math.max(CELLULE * echelle - 1, 2),
                      height: Math.max(CELLULE * echelle - 1, 2),
                      backgroundColor: 'var(--gradilis-icon-muted)',
                    }}
                  />
                ))}
              </>
            )}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
