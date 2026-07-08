/**
 * usePanZoom — enrobage typé de `react-zoom-pan-pinch` v4 (plan Chantier K §4,
 * châssis K.0). Aucune logique métier : le hook possède la ref du
 * `TransformWrapper`, publie le viewport en coordonnées MONDE (pour la
 * `Minimap`) et expose les commandes zoom+/zoom−/ajuster/centrerSur.
 *
 * Usage :
 * ```tsx
 * const panZoom = usePanZoom();
 * <TransformWrapper {...panZoom.wrapperProps}>
 *   <TransformComponent>…contenu monde…</TransformComponent>
 * </TransformWrapper>
 * <PanZoomControls panZoom={panZoom} />
 * <Minimap viewport={panZoom.viewport} onCentrer={panZoom.centrerSur} … />
 * ```
 *
 * Le zoom molette est centré sur le curseur (comportement natif de la lib).
 * NB K.2 : `onTransform` est relayé À CHAQUE frame de pan/zoom (le rectangle
 * de viewport de la minimap doit suivre en live) — si le re-rendu du plateau
 * devient coûteux, isoler la minimap/HUD dans un sous-arbre dédié plutôt que
 * de throttler (le ghost du drag, lui, ne dépend pas de ce state).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactZoomPanPinchProps, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

/** Zone visible du plateau, en coordonnées monde (px du contenu non zoomé). */
export interface PanZoomViewport {
  /** Coin haut-gauche visible (monde). */
  x: number;
  y: number;
  /** Dimensions visibles (monde). */
  largeur: number;
  hauteur: number;
  /** Facteur de zoom courant. */
  echelle: number;
}

export interface UsePanZoomOptions {
  /** Zoom minimal (défaut 0.25). */
  echelleMin?: number;
  /** Zoom maximal (défaut 4). */
  echelleMax?: number;
}

/** Props à spreader telles quelles sur `<TransformWrapper>`. */
export type PanZoomWrapperProps = Pick<
  ReactZoomPanPinchProps,
  | 'ref'
  | 'minScale'
  | 'maxScale'
  | 'limitToBounds'
  | 'centerOnInit'
  | 'wheel'
  | 'doubleClick'
  | 'onInit'
  | 'onTransform'
>;

export interface PanZoom {
  wrapperProps: PanZoomWrapperProps;
  /** `null` tant que le wrapper n'est pas monté/mesuré. */
  viewport: PanZoomViewport | null;
  zoomAvant: () => void;
  zoomArriere: () => void;
  /** « Ajuster » : cadre tout le contenu dans le wrapper, centré. */
  ajuster: () => void;
  /** Centre la vue sur un point monde (x, y) — utilisé par la Minimap. */
  centrerSur: (x: number, y: number) => void;
}

const DUREE_ANIMATION_MS = 200;

export function usePanZoom(options: UsePanZoomOptions = {}): PanZoom {
  const { echelleMin = 0.25, echelleMax = 4 } = options;
  const refPanZoom = useRef<ReactZoomPanPinchRef | null>(null);
  const [viewport, setViewport] = useState<PanZoomViewport | null>(null);

  const majViewport = useCallback((contexte: ReactZoomPanPinchRef) => {
    const wrapper = contexte.instance.wrapperComponent;
    const { scale, positionX, positionY } = contexte.instance.state;
    if (!wrapper || !scale) return;
    setViewport({
      x: -positionX / scale,
      y: -positionY / scale,
      largeur: wrapper.clientWidth / scale,
      hauteur: wrapper.clientHeight / scale,
      echelle: scale,
    });
  }, []);

  const wrapperProps = useMemo<PanZoomWrapperProps>(
    () => ({
      ref: (contexte: ReactZoomPanPinchRef | null) => {
        refPanZoom.current = contexte;
      },
      minScale: echelleMin,
      maxScale: echelleMax,
      // Le plateau peut être plus petit que le wrapper une fois dézoomé, et
      // `centrerSur` doit rester libre : pas de rappel élastique aux bords.
      limitToBounds: false,
      centerOnInit: true,
      // Molette = zoom centré curseur (natif). Le double-clic est coupé :
      // il entre en conflit avec la sélection/le drag des écrans carte.
      wheel: { step: 0.2 },
      doubleClick: { disabled: true },
      onInit: majViewport,
      onTransform: majViewport,
    }),
    [echelleMin, echelleMax, majViewport],
  );

  const zoomAvant = useCallback(() => {
    refPanZoom.current?.zoomIn();
  }, []);

  const zoomArriere = useCallback(() => {
    refPanZoom.current?.zoomOut();
  }, []);

  const ajuster = useCallback(() => {
    const contexte = refPanZoom.current;
    const wrapper = contexte?.instance.wrapperComponent;
    const contenu = contexte?.instance.contentComponent;
    if (!contexte || !wrapper || !contenu) return;
    // `offsetWidth/Height` = taille layout du contenu, insensible au transform
    // CSS courant → c'est bien la taille monde.
    const largeurMonde = contenu.offsetWidth;
    const hauteurMonde = contenu.offsetHeight;
    if (!largeurMonde || !hauteurMonde || !wrapper.clientWidth || !wrapper.clientHeight) return;
    const echelle = Math.min(
      wrapper.clientWidth / largeurMonde,
      wrapper.clientHeight / hauteurMonde,
    );
    contexte.centerView(
      Math.min(Math.max(echelle, echelleMin), echelleMax),
      DUREE_ANIMATION_MS,
      'easeOut',
    );
  }, [echelleMin, echelleMax]);

  const centrerSur = useCallback((x: number, y: number) => {
    const contexte = refPanZoom.current;
    const wrapper = contexte?.instance.wrapperComponent;
    if (!contexte || !wrapper) return;
    const { scale } = contexte.instance.state;
    contexte.setTransform(
      wrapper.clientWidth / 2 - x * scale,
      wrapper.clientHeight / 2 - y * scale,
      scale,
      DUREE_ANIMATION_MS,
      'easeOut',
    );
  }, []);

  return { wrapperProps, viewport, zoomAvant, zoomArriere, ajuster, centrerSur };
}
