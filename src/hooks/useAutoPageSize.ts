/**
 * useAutoPageSize — calcule le nombre de lignes qui tiennent dans la hauteur
 * restante du viewport, pour qu'une `<DataTable>` (mantine-datatable) se termine
 * proprement en bas de page (footer de pagination ancré, sans scroll du document).
 *
 * Vendoré de `gradilis_magasin/frontend/src/hooks/useAutoPageSize.ts` (DM-7),
 * inchangé (le layout cible pose `id="main-content"` sur `AppShell.Main`,
 * cf. CanonAppShell).
 *
 * Principe : plutôt que d'additionner la « chrome » très variable au-dessus de la
 * table (fil d'Ariane, bandeaux, onglets, cartes de filtres), on MESURE la position
 * réelle du haut de la table (`getBoundingClientRect().top`), ce qui absorbe
 * automatiquement tout ce qui la précède.
 *
 *   availableHeight = innerHeight - topDeLaTable - paddingBas(AppShell.Main)
 *   size            = max(minRows, floor((availableHeight - headerH - footerH) / rowH))
 *
 * Points durs :
 * - `headerH`/`footerH` sont une RÉSERVE FIXE mesurée une fois : la hauteur du
 *   footer de pagination varie avec le nombre de pages (boutons qui wrappent en
 *   largeur étroite) ; la réinjecter à chaque rendu créerait une oscillation
 *   2-cycle (A→B→A→B) que la garde `>1px` ne rattrape pas. Seuls `top` et `rowH`
 *   sont des entrées vivantes.
 * - garde d'égalité : on ne pousse un nouvel état que si `size` change ou si la
 *   hauteur bouge de plus d'1px, pour éviter les re-rendus en boucle.
 * - `size` est débouncé avant exposition (drag de fenêtre → un seul recalcul utile,
 *   important pour les tables en pagination serveur où `size` déclenche un fetch).
 * - la mesure est ignorée quand la page est scrollée (`scrollTop !== 0`) : `top`
 *   serait faussé ; l'état cible n'a de toute façon aucun scroll de document.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// Mesure AVANT peinture (élimine le flash « grand puis parfait » au montage) tout
// en restant sûr côté SSR/tests sans DOM.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UseAutoPageSizeOptions {
  /** Plancher de lignes : on ne descend jamais en dessous. Défaut 5. */
  minRows?: number;
  /** Hauteur de ligne de repli quand la table est vide/en chargement. Défaut 44px. */
  rowHeightFallback?: number;
  /** Débounce (ms) avant d'exposer une nouvelle taille. Défaut 150. */
  debounceMs?: number;
  /** Désactive le calcul (retombe sur `size`/`height` neutres). Défaut true. */
  enabled?: boolean;
  /**
   * Notifié quand une hauteur de ligne RÉELLE est mesurée (≠ repli). L'appelant la
   * persiste et la repasse en `rowHeightFallback` au montage suivant → le tout
   * premier rendu utilise la vraie hauteur (plus d'overflow transitoire avant que
   * les données n'arrivent).
   */
  onRowHeight?: (rowH: number) => void;
  /**
   * Valeur dont tout changement force une re-mesure (ex. bascule auto/manuel) :
   * le nombre de lignes affichées change sans modifier la hauteur observée, donc
   * ni le `resize` ni le `ResizeObserver` ne se déclenchent — d'où ce signal.
   */
  revalidateKey?: unknown;
}

interface UseAutoPageSizeResult {
  /** À poser sur le `<div>` wrapper immédiat de la `<DataTable>`. */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Nombre de lignes calculé (≥ minRows). `0` tant qu'aucune mesure n'a eu lieu. */
  size: number;
  /** Hauteur (px) à appliquer sur la table quand la pagination est nécessaire. */
  height: number;
  /** true dès la première mesure réussie. */
  ready: boolean;
}

const DEFAULT_HEADER_H = 40;
const DEFAULT_FOOTER_H = 52;
const DEFAULT_PAD_BOTTOM = 16;
const SAFETY_PX = 1;

/**
 * Hauteur (px) minimale plausible pour une VRAIE ligne de données. En-deçà, il
 * s'agit de la ligne PLACEHOLDER (~2px) que mantine-datatable rend pendant le
 * chargement / l'état vide. La retenir donnerait un `rowH` minuscule → `size`
 * géant → `per_page` géant → table non paginée → hauteur non appliquée →
 * débordement plein écran. Sert à la fois de seuil d'acceptation et de plancher.
 */
export const MIN_PLAUSIBLE_ROW_H = 20;

/** true si `h` peut être une vraie ligne (et non un placeholder de chargement). */
export const isPlausibleRowHeight = (h: number): boolean => h >= MIN_PLAUSIBLE_ROW_H;

interface AutoFitInput {
  innerHeight: number;
  /** Distance (px) du haut du viewport au haut de la table. */
  top: number;
  padBottom: number;
  headerH: number;
  footerH: number;
  rowH: number;
  minRows: number;
}

/**
 * Cœur de calcul (pur, sans DOM) — testable indépendamment.
 * `size` = lignes qui tiennent (≥ minRows). `height` remplit jusqu'en bas dans le
 * cas courant ; sur petit écran (plancher minRows plus haut que l'espace dispo),
 * `height` prend la place des minRows lignes → léger scroll de page toléré.
 */
export function computeAutoFit(p: AutoFitInput): { size: number; height: number } {
  // `available` ne peut jamais excéder la hauteur du viewport (une table « qui finit
  // en bas » tient au plus dans l'écran). Ce plafond neutralise toute mesure aberrante
  // (ex. `top` transitoirement négatif si la page est scrollée pendant une bascule),
  // qui gonflerait sinon le nombre de lignes de façon absurde.
  const available = Math.min(
    Math.floor(p.innerHeight - p.top - p.padBottom - SAFETY_PX),
    Math.floor(p.innerHeight - p.padBottom - SAFETY_PX),
  );
  const rowH = p.rowH > 0 ? p.rowH : DEFAULT_HEADER_H; // garde-fou anti /0
  const bodyAvail = available - p.headerH - p.footerH;
  const size = Math.max(p.minRows, Math.floor(bodyAvail / rowH));
  const heightForRows = p.headerH + p.footerH + size * rowH;
  const height = Math.max(available, heightForRows);
  return { size, height };
}

export function useAutoPageSize(opts: UseAutoPageSizeOptions = {}): UseAutoPageSizeResult {
  const {
    minRows = 5,
    rowHeightFallback = 44,
    debounceMs = 150,
    enabled = true,
    revalidateKey,
    onRowHeight,
  } = opts;

  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{ size: number; height: number; ready: boolean }>({
    size: 0,
    height: 0,
    ready: false,
  });

  // Réserves fixes mesurées une seule fois (anti-oscillation) + dernier rowH connu.
  const chromeRef = useRef<{ headerH: number; footerH: number } | null>(null);
  const rowHRef = useRef(rowHeightFallback);
  // rowH réel déjà remonté à l'appelant (évite de re-notifier la même valeur).
  const reportedRowHRef = useRef<number | null>(null);
  // Pattern « latest ref » : mise à jour DANS un layout effect (et non pendant le
  // rendu comme le faisait le magasin — interdit par react-hooks/refs). Déclaré
  // AVANT l'effet de mesure : les effets s'exécutent dans l'ordre de déclaration,
  // donc `measure()` lit toujours le callback à jour.
  const onRowHeightRef = useRef(onRowHeight);
  useIsomorphicLayoutEffect(() => {
    onRowHeightRef.current = onRowHeight;
  });
  // Dernières valeurs poussées, pour la garde d'égalité.
  const lastRef = useRef<{ size: number; height: number }>({ size: 0, height: 0 });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    // Page scrollée → `top` faussé : on garde la dernière valeur, un prochain
    // déclencheur (resize/observer) recalculera au repos.
    const scrollTop = document.scrollingElement?.scrollTop ?? 0;
    if (scrollTop !== 0) return;

    const rect = el.getBoundingClientRect();
    const top = rect.top;

    // Élément caché (`display:none`, ex. `Tabs.Panel` inactif monté via keepMounted) :
    // rect entièrement à zéro, thead/footer à `offsetHeight:0`. On DOIT sauter, sinon
    // `chromeRef` se figerait sur les réserves par défaut (jamais recalculé ensuite).
    // Le ResizeObserver (wrapper + #main-content) rappellera `measure` à l'affichage.
    if (rect.width === 0 && rect.height === 0) return;

    // `top` négatif = table (transitoirement) au-dessus du viewport (bascule,
    // conteneur scrollé) : mesure invalide, on saute et on retentera au repos.
    if (top < 0) return;

    // Padding bas réel de AppShell.Main (thème pouvant surcharger le `md`).
    const mainEl = el.closest('#main-content') as HTMLElement | null;
    const padBottom = mainEl
      ? parseFloat(getComputedStyle(mainEl).paddingBottom) || DEFAULT_PAD_BOTTOM
      : DEFAULT_PAD_BOTTOM;

    // Réserve header/footer : mesurée une fois, puis figée (anti-oscillation).
    let headerHNow: number;
    let footerHNow: number;
    if (chromeRef.current) {
      headerHNow = chromeRef.current.headerH;
      footerHNow = chromeRef.current.footerH;
    } else {
      const theadEl = el.querySelector('.mantine-datatable table thead') as HTMLElement | null;
      const footerEl = el.querySelector('.mantine-datatable-pagination') as HTMLElement | null;
      headerHNow = theadEl?.offsetHeight || DEFAULT_HEADER_H;
      footerHNow = footerEl?.offsetHeight || DEFAULT_FOOTER_H;
      // On ne fige qu'une fois les deux réellement présents ; sinon on réutilise
      // les valeurs par défaut ce tick et on retentera au prochain déclencheur.
      if (theadEl && footerEl) chromeRef.current = { headerH: headerHNow, footerH: footerHNow };
    }

    // Hauteur de ligne : 1re ligne réelle rendue, sinon dernier bon rowH / repli.
    // On IGNORE les lignes placeholder de chargement (voir MIN_PLAUSIBLE_ROW_H) —
    // sinon rowH minuscule → per_page géant → table non paginée → débordement.
    const rowEl = el.querySelector('.mantine-datatable table tbody tr') as HTMLElement | null;
    if (rowEl && isPlausibleRowHeight(rowEl.offsetHeight)) {
      rowHRef.current = rowEl.offsetHeight;
      // Remonte la hauteur réelle à l'appelant (persistance) une fois par valeur.
      if (reportedRowHRef.current !== rowHRef.current) {
        reportedRowHRef.current = rowHRef.current;
        onRowHeightRef.current?.(rowHRef.current);
      }
    }
    // Repli borné : une valeur persistée aberrante (ex. rowh=2) ne doit pas
    // réintroduire un rowH minuscule au montage suivant.
    const rowH = Math.max(MIN_PLAUSIBLE_ROW_H, rowHRef.current || rowHeightFallback);

    const { size, height } = computeAutoFit({
      innerHeight: window.innerHeight,
      top,
      padBottom,
      headerH: headerHNow,
      footerH: footerHNow,
      rowH,
      minRows,
    });

    // Garde d'égalité : évite les re-rendus/fetch inutiles.
    const prev = lastRef.current;
    if (prev.size === size && Math.abs(prev.height - height) <= 1) {
      if (!state.ready) setState({ size, height, ready: true });
      return;
    }
    lastRef.current = { size, height };
    setState({ size, height, ready: true });
  }, [minRows, rowHeightFallback, state.ready]);

  // Mesure SYNCHRONE avant peinture : au montage et à chaque changement de
  // `revalidateKey` (bascule auto/manuel). Le premier rendu utilise `pageSize`
  // = estimation (`:autosize`/défaut) ; on corrige ici AVANT que le navigateur
  // ne peigne, donc l'utilisateur ne voit jamais la taille intermédiaire (fin du
  // flash « grand puis parfait » au chargement et à la navigation).
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return;
    measure();
  }, [enabled, measure, revalidateKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Débounce à FRONT MONTANT : on mesure IMMÉDIATEMENT au premier déclencheur
    // (ex. arrivée des données → la vraie hauteur de ligne devient mesurable →
    // correction quasi instantanée, pas 150ms de flash), puis on coalesce les
    // déclencheurs rapprochés (drag de fenêtre) en une seule mesure de traîne.
    const scheduleMeasure = () => {
      const inQuietPeriod = debounceTimer.current !== null;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (!inQuietPeriod) measure(); // front montant : immédiat
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        measure(); // traîne : après stabilisation
      }, debounceMs);
    };

    window.addEventListener('resize', scheduleMeasure);

    // ResizeObserver sur l'ANCÊTRE #main-content (jamais le wrapper dont on fixe la
    // hauteur, sinon boucle) : capte l'apparition/disparition des bandeaux, le wrap
    // des cartes de filtres, ET l'arrivée/apparition de la table (données, ou bascule
    // d'une vue cartes→tableau / d'un onglet). On le résout via getElementById — il
    // existe toujours dans le layout — pour ne PAS dépendre de `ref.current`, qui peut
    // être null au montage si la table n'est pas encore rendue (sinon l'observer ne
    // serait jamais créé et aucune re-mesure ne surviendrait à l'apparition).
    let observer: ResizeObserver | null = null;
    const mainEl =
      (typeof document !== 'undefined'
        ? (document.getElementById('main-content') as HTMLElement | null)
        : null) ?? (ref.current?.closest('#main-content') as HTMLElement | null);
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleMeasure);
      if (mainEl) observer.observe(mainEl);
      // On observe AUSSI le wrapper : sûr car on fixe la hauteur de son ENFANT (la
      // table), pas la sienne — pas de boucle — et cela capte la transition
      // caché→visible d'un onglet keepMounted (0×0 → dimensions réelles) que
      // #main-content peut manquer si sa hauteur ne change pas.
      if (ref.current) observer.observe(ref.current);
    }

    return () => {
      window.removeEventListener('resize', scheduleMeasure);
      if (observer) observer.disconnect();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        // Remettre à null : l'effet peut se re-créer (identité de `measure`) hors
        // unmount ; sans ça, `scheduleMeasure` verrait un « quiet period » fantôme
        // et sauterait son tir immédiat (front montant) → 150ms de latence.
        debounceTimer.current = null;
      }
    };
  }, [enabled, measure, debounceMs]);

  return { ref, size: state.size, height: state.height, ready: state.ready };
}
