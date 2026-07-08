/**
 * useTableAutoFit — source unique de la « taille de page » d'une DataTable, avec
 * mode auto-fit optionnel (voir {@link useAutoPageSize}).
 *
 * Vendoré de `gradilis_magasin/frontend/src/hooks/useTableAutoFit.ts` (DM-7),
 * inchangé. Utilisé par `useTablePrefs` (mode client) — le pendant serveur
 * (`useServerTable` du magasin) sera vendoré quand un écran en aura besoin
 * (Chantier C, gros volumes).
 *
 * Quand `enabled` vaut false, le hook se comporte comme un simple
 * `useLocalStorage('tbl:<key>:size')` (taille manuelle uniquement).
 *
 * Trois clés localStorage distinctes :
 *  - `tbl:<key>:size`     = taille de page manuelle (lue seulement en mode manuel).
 *  - `tbl:<key>:auto`     = booléen mode auto. Défaut `true` (auto par défaut).
 *  - `tbl:<key>:autosize` = dernière taille auto calculée ; sert d'estimation
 *                           initiale au montage suivant (évite un 2ᵉ fetch).
 */
import { useCallback, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { useAutoPageSize } from './useAutoPageSize.js';

interface UseTableAutoFitOptions {
  /** Active le calcul auto-fit. Défaut false (comportement historique). */
  enabled: boolean;
  /** Taille par défaut avant tout choix/mesure. */
  defaultPageSize: number;
}

export interface TableAutoFit {
  /** Taille de page EFFECTIVE (auto calculée, estimation, ou choix manuel). */
  pageSize: number;
  /** Choix explicite d'une taille → bascule en manuel + persiste. */
  setPageSize: (n: number) => void;
  /** Revient au calcul automatique. */
  resetToAuto: () => void;
  /** true si en mode auto (et auto-fit activé). */
  isAuto: boolean;
  /** Bundle à passer à `<FittedDataTable>`. */
  fit: {
    ref: React.RefObject<HTMLDivElement | null>;
    /** Hauteur (px) à appliquer quand la pagination est nécessaire ; 0 sinon. */
    height: number;
    isAuto: boolean;
    resetToAuto: () => void;
    /** true dès la première mesure réussie. */
    ready: boolean;
  };
}

export function useTableAutoFit(
  storageKey: string,
  { enabled, defaultPageSize }: UseTableAutoFitOptions,
): TableAutoFit {
  const [manualSize, setManualSize] = useLocalStorage<number>({
    key: `tbl:${storageKey}:size`,
    defaultValue: defaultPageSize,
    getInitialValueInEffect: false,
  });
  const [autoFlag, setAutoFlag] = useLocalStorage<boolean>({
    key: `tbl:${storageKey}:auto`,
    defaultValue: true,
    getInitialValueInEffect: false,
  });
  const [autoGuess, setAutoGuess] = useLocalStorage<number>({
    key: `tbl:${storageKey}:autosize`,
    defaultValue: defaultPageSize,
    getInitialValueInEffect: false,
  });
  // Hauteur de ligne réelle persistée : sert de repli au montage suivant pour que le
  // 1er rendu (avant l'arrivée des données) dimensionne déjà juste (0 overflow).
  const [rowH, setRowH] = useLocalStorage<number>({
    key: `tbl:${storageKey}:rowh`,
    defaultValue: 44,
    getInitialValueInEffect: false,
  });

  const isAuto = enabled && autoFlag;

  // `revalidateKey: isAuto` → re-mesure à la bascule auto/manuel (le nombre de
  // lignes change sans modifier la hauteur observée, donc aucun observer ne réagit).
  const { ref, size, height, ready } = useAutoPageSize({
    enabled,
    revalidateKey: isAuto,
    rowHeightFallback: rowH,
    onRowHeight: setRowH,
  });

  // Persiste la dernière taille auto mesurée (estimation du prochain montage).
  useEffect(() => {
    if (isAuto && ready && size > 0 && size !== autoGuess) setAutoGuess(size);
  }, [isAuto, ready, size, autoGuess, setAutoGuess]);

  const setPageSize = useCallback(
    (n: number) => {
      setManualSize(n);
      if (enabled) setAutoFlag(false);
    },
    [enabled, setManualSize, setAutoFlag],
  );

  const resetToAuto = useCallback(() => {
    if (enabled) setAutoFlag(true);
  }, [enabled, setAutoFlag]);

  // Taille effective : en auto, la mesure une fois prête, sinon l'estimation
  // persistée (bonne taille initiale) ; en manuel, le choix stocké.
  const pageSize = isAuto ? (ready && size > 0 ? size : autoGuess) : manualSize;

  return {
    pageSize,
    setPageSize,
    resetToAuto,
    isAuto,
    fit: { ref, height, isAuto, resetToAuto, ready },
  };
}
