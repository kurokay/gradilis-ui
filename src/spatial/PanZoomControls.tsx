/**
 * PanZoomControls — les trois boutons standard du plateau spatial (K.0) :
 * zoom avant / zoom arrière / ajuster. À poser en overlay du plateau
 * (l'appelant gère le positionnement absolu). Libellés FR = aria-labels,
 * doublés d'un tooltip.
 */
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconMaximize, IconMinus, IconPlus } from '@tabler/icons-react';

import type { PanZoom } from './usePanZoom.js';

export interface PanZoomControlsProps {
  panZoom: Pick<PanZoom, 'zoomAvant' | 'zoomArriere' | 'ajuster'>;
}

const BOUTONS = [
  { action: 'zoomAvant', label: 'Zoom avant', Icone: IconPlus },
  { action: 'zoomArriere', label: 'Zoom arrière', Icone: IconMinus },
  { action: 'ajuster', label: 'Ajuster à la vue', Icone: IconMaximize },
] as const;

export function PanZoomControls({ panZoom }: PanZoomControlsProps) {
  return (
    <ActionIcon.Group orientation="vertical">
      {BOUTONS.map(({ action, label, Icone }) => (
        <Tooltip key={action} label={label} position="right">
          <ActionIcon variant="default" size="lg" aria-label={label} onClick={panZoom[action]}>
            <Icone size={18} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      ))}
    </ActionIcon.Group>
  );
}
