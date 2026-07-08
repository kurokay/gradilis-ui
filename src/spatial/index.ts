/**
 * @gradilis/ui/spatial — châssis spatial partagé (plan Chantier K §4, K.0).
 *
 * Primitives SANS logique métier, réutilisées telles quelles par la carte
 * frigo (K.2) et le plan pépinière (K.3) : pan/zoom (`usePanZoom` +
 * `PanZoomControls`, enrobage typé de react-zoom-pan-pinch), `Minimap`
 * (rendu réduit par render-prop + viewport live + recentrage), `LayersPanel`
 * (calques déclaratifs, état chez l'appelant), `HUDCoordonnees` (position +
 * message contextuel en mono). Référence visuelle : `/app/canon/spatial`.
 */
export {
  usePanZoom,
  type PanZoom,
  type PanZoomViewport,
  type PanZoomWrapperProps,
  type UsePanZoomOptions,
} from './usePanZoom.js';
export { PanZoomControls, type PanZoomControlsProps } from './PanZoomControls.js';
export { Minimap, type MinimapProps } from './Minimap.js';
export { LayersPanel, type Calque, type LayersPanelProps } from './LayersPanel.js';
export { HUDCoordonnees, type HUDCoordonneesProps, type HUDTonalite } from './HUDCoordonnees.js';
