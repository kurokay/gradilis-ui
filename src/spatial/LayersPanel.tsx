/**
 * LayersPanel — panneau de calques du plateau spatial (K.0) : Popover +
 * Switch Mantine, liste DÉCLARATIVE `{id, label, actif}[]`. L'état est
 * possédé par l'écran appelant (le panneau ne stocke rien) : `onChange`
 * remonte `(id, actif)` à chaque bascule.
 */
import { Button, Popover, Stack, Switch } from '@mantine/core';
import { IconStack2 } from '@tabler/icons-react';

export interface Calque {
  id: string;
  label: string;
  actif: boolean;
}

export interface LayersPanelProps {
  calques: readonly Calque[];
  onChange: (id: string, actif: boolean) => void;
  /** Libellé du bouton déclencheur (défaut « Calques »). */
  label?: string;
}

export function LayersPanel({ calques, onChange, label = 'Calques' }: LayersPanelProps) {
  return (
    <Popover position="bottom-end" shadow="sm" withinPortal>
      <Popover.Target>
        <Button variant="default" size="xs" leftSection={<IconStack2 size={18} stroke={1.75} />}>
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          {calques.map((calque) => (
            <Switch
              key={calque.id}
              size="sm"
              label={calque.label}
              checked={calque.actif}
              onChange={(event) => onChange(calque.id, event.currentTarget.checked)}
            />
          ))}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
