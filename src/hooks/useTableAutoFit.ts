/**
 * useTableAutoFit — source unique de la « taille de page » d'une DataTable, avec
 * mode auto-fit optionnel (voir {@link useAutoPageSize}).
 *
 * Utilisé par `useTablePrefs` (mode client) et par le pendant serveur d'une
 * application consommatrice, pour ne pas dupliquer la logique auto/manuel ni la
 * persistance. Quand `enabled` vaut false, le hook se comporte comme un simple
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
  /**
   * Signal de RE-MESURE, à bouger quand la hauteur du chrome AU-DESSUS de la table
   * change sans que la table elle-même bouge (repli d'un encart d'aide, d'un bandeau
   * de KPI, d'une carte de filtres).
   *
   * ⚠️⚠️ **Sans lui, replier ne rend RIEN** : la taille de page se déduit du `top` du
   * tableau, mais aucun observateur ne voit ce `top` changer. La table est en hauteur
   * FIXÉE (`fit.height`) dès que la pagination est nécessaire — donc quand le chrome
   * au-dessus rétrécit, ni le conteneur de page ni le wrapper ne changent de hauteur,
   * et le `ResizeObserver` reste muet. Un écran qui débordait peut masquer le défaut
   * (la hauteur du document change, elle) : mesurer le pire écran, pas le premier.
   * ⚠️ Si le repli est ANIMÉ, bouger la clé à la FIN de la transition — sinon la
   * mesure lit une hauteur intermédiaire, et plus rien ne la corrige ensuite.
   */
  revalidateKey?: RevalidateKey;
}

/**
 * Clé PRIMITIVE : elle est comparée par sa représentation texte, donc un objet
 * donnerait toujours « [object Object] » et ne déclencherait jamais de re-mesure.
 * Pour plusieurs états, les joindre : `` `${helpOpen}|${kpiCollapsed}` ``.
 */
export type RevalidateKey = string | number | boolean | null | undefined;

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
    /**
     * L'auto-fit est-il activé sur cette table ? Le wrapper s'en sert pour n'émettre
     * l'affordance « Auto » que là où elle AGIT : sans auto-fit, `resetToAuto` est un
     * no-op et le bouton serait mort. Optionnel pour les `fit` construits hors de
     * ce hook : absent, il vaut `true` (comportement antérieur, bouton affiché).
     */
    enabled?: boolean;
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
  { enabled, defaultPageSize, revalidateKey }: UseTableAutoFitOptions,
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

  // Re-mesure à la bascule auto/manuel (le nombre de lignes change sans modifier la
  // hauteur observée, donc aucun observer ne réagit) ET sur le signal de l'appelant
  // (repli d'un bloc au-dessus de la table — même angle mort, voir les options).
  // ⚠️ Les deux sont COMBINÉS en une seule valeur : les garder séparés obligerait
  // `useAutoPageSize` à porter deux dépendances, pour un même effet.
  const { ref, size, height, ready } = useAutoPageSize({
    enabled,
    revalidateKey: `${isAuto}|${String(revalidateKey)}`,
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
    fit: { enabled, ref, height, isAuto, resetToAuto, ready },
  };
}
