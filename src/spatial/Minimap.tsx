/**
 * Minimap — rendu réduit générique du plateau spatial (K.0). Aucune logique
 * métier : le contenu réduit est fourni par render-prop (`contenu`), la
 * minimap n'apporte que le cadre, le rectangle de viewport live et le
 * recentrage au clic/drag (délégué à `usePanZoom().centrerSur`).
 *
 * Tokens (plan §4) : fond `gradilisGray.0`, rectangle viewport bordure
 * `gradilisGreen.7`.
 */
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { Box } from '@mantine/core';

import type { PanZoomViewport } from './usePanZoom.js';

export interface MinimapProps {
  /** Dimensions du monde (px du contenu non zoomé). */
  largeurMonde: number;
  hauteurMonde: number;
  /** Viewport publié par `usePanZoom` — `null` avant montage. */
  viewport: PanZoomViewport | null;
  /** Recentrage sur un point monde — brancher `panZoom.centrerSur`. */
  onCentrer: (x: number, y: number) => void;
  /**
   * Rendu réduit du plateau : reçoit l'échelle minimap (px minimap / px
   * monde) et rend des éléments positionnés en absolu dans le cadre.
   */
  contenu: (echelle: number) => ReactNode;
  /** Largeur de la minimap en px (défaut 180) — la hauteur suit le ratio monde. */
  largeur?: number;
  label?: string;
}

export function Minimap({
  largeurMonde,
  hauteurMonde,
  viewport,
  onCentrer,
  contenu,
  largeur = 180,
  label = 'Minimap',
}: MinimapProps) {
  const dragEnCours = useRef(false);
  const echelle = largeurMonde > 0 ? largeur / largeurMonde : 0;
  const hauteur = hauteurMonde * echelle;

  const recentrer = (event: PointerEvent<HTMLDivElement>) => {
    if (echelle <= 0) return;
    const cadre = event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - cadre.left) / echelle, 0), largeurMonde);
    const y = Math.min(Math.max((event.clientY - cadre.top) / echelle, 0), hauteurMonde);
    onCentrer(x, y);
  };

  const surPointeurBas = (event: PointerEvent<HTMLDivElement>) => {
    dragEnCours.current = true;
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // jsdom / pointeur synthétique : la capture est un confort, pas un prérequis.
      }
    }
    recentrer(event);
  };

  const surPointeurMouvement = (event: PointerEvent<HTMLDivElement>) => {
    if (dragEnCours.current) recentrer(event);
  };

  const finDrag = () => {
    dragEnCours.current = false;
  };

  return (
    <Box
      role="img"
      aria-label={label}
      onPointerDown={surPointeurBas}
      onPointerMove={surPointeurMouvement}
      onPointerUp={finDrag}
      onPointerCancel={finDrag}
      style={{
        position: 'relative',
        width: largeur,
        height: hauteur,
        overflow: 'hidden',
        cursor: 'pointer',
        touchAction: 'none',
        backgroundColor: 'var(--mantine-color-gradilisGray-0)',
        border: '1px solid var(--gradilis-border)',
        borderRadius: 'var(--mantine-radius-sm)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {contenu(echelle)}
      </Box>
      {viewport ? (
        <Box
          data-minimap-viewport
          aria-hidden
          style={{
            position: 'absolute',
            left: viewport.x * echelle,
            top: viewport.y * echelle,
            width: viewport.largeur * echelle,
            height: viewport.hauteur * echelle,
            border: '2px solid var(--mantine-color-gradilisGreen-7)',
            borderRadius: 'var(--mantine-radius-xs)',
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : null}
    </Box>
  );
}
