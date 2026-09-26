/**
 * Helper central de notifications toast — couche unique au-dessus de
 * `@mantine/notifications` (convention playbook §4 : jamais
 * `notifications.show` en direct dans les écrans).
 *
 * Vendoré de `gradilis_magasin/frontend/src/lib/notify.ts` (DM-7), re-tokenisé
 * Pépinière : couleurs = clés sémantiques FR du thème (`succes` / `erreur` /
 * `info` / `alerte`, cf. theme.ts M.1), jamais les couleurs Mantine brutes.
 *
 * Objectifs (hérités du magasin) :
 * - Uniformiser les appels en `notify.success/error/info/warning`.
 * - Poser une ICÔNE systématique (succès/erreur ne reposent plus sur la seule
 *   couleur → WCAG 1.4.1 « use of color »).
 * - Distinguer l'annonce lecteur d'écran : Mantine met `role="alert"`
 *   (assertif) par défaut sur TOUTE notification. On force donc `role="status"`
 *   (poli) sur succès/info pour ne pas interrompre l'utilisateur, et on garde
 *   `role="alert"` (assertif) sur erreur/warning.
 * - Nommer le bouton de fermeture (« Fermer la notification ») : la croix de
 *   Mantine n'a pas de nom accessible (axe `button-name`, cf. `CLOSE_LABEL`).
 * - Absorber `errorMessage()` (extraction du message d'erreur API).
 * - Factoriser le pattern « chargement → succès/erreur » (`loading`/`resolve`).
 * - Prioriser erreurs/avertissements au-delà de la limite de toasts (backport
 *   depuis l'app de référence, avec l'issue `'warning'` de `resolve`).
 */
import { createElement } from 'react';
import { notifications } from '@mantine/notifications';
import type { NotificationData } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
} from '@tabler/icons-react';

const ICON_SIZE = 18;

/**
 * Couleurs sémantiques des toasts.
 *
 * ⚠️ Les DÉFAUTS sont les noms canoniques du socle (`succes`/`alerte`/`erreur`/
 * `info`), et ils sont portables PAR CONSTRUCTION : `createGradilisTheme`
 * enregistre ces rampes dans le thème de TOUTE app passant par la factory. Il
 * n'y a donc rien à configurer pour que les couleurs soient justes.
 *
 * ⚠️ Ce point d'injection existe pour un besoin DIFFÉRENT : une app peut vouloir
 * sa rampe de MARQUE plutôt que la sémantique. `gradilis_magasin` colore ses
 * erreurs en `ampBrique` (sa brique) et non en rouge générique — un choix
 * d'identité, pas une correction. Sans cette porte, il devrait renoncer au
 * helper et rappeler `notifications.show()` en direct, c'est-à-dire perdre
 * l'icône et le `role` a11y que le helper existe pour garantir.
 */
export interface NotifyColors {
  success: string;
  error: string;
  info: string;
  warning: string;
}

const DEFAULT_COLORS: NotifyColors = {
  success: 'succes',
  error: 'erreur',
  info: 'info',
  warning: 'alerte',
};

let colors: NotifyColors = { ...DEFAULT_COLORS };

/**
 * Configure les couleurs des toasts. À appeler UNE fois au démarrage.
 * Surcharge PARTIELLE : les clés non fournies gardent le défaut du socle.
 *
 * ⚠️ Réglage de MODULE et non contexte React : `notify` est une API IMPÉRATIVE,
 * appelée depuis des gestionnaires d'évènements et des `catch`, hors de tout
 * arbre de rendu. Un contexte y serait inatteignable.
 */
export function configureNotify(options: { colors?: Partial<NotifyColors> }): void {
  colors = { ...DEFAULT_COLORS, ...options.colors };
}

/** Couleurs courantes — exposé pour les tests et le diagnostic. */
export function getNotifyColors(): NotifyColors {
  return { ...colors };
}

/**
 * Props du provider `<Notifications>` — partagées entre l'app (`main.tsx`) et
 * les tests pour éviter toute divergence de configuration. `aria-live="polite"`
 * par défaut ; les erreurs/warnings passent en assertif via `role="alert"` posé
 * par chaque notification.
 */
export const NOTIFICATIONS_PROVIDER_PROPS = {
  position: 'top-right',
  'aria-live': 'polite',
  limit: 5,
  autoClose: 4000,
} as const;

/** Options passables à un toast (tout `NotificationData` sauf `message`/`color`,
 *  déjà déterminés par le niveau sémantique). */
export type NotifyOptions = Partial<Omit<NotificationData, 'message' | 'color'>>;

/**
 * Extrait le message d'erreur d'une réponse API (`{ response: { data: { error } } }`),
 * avec repli.
 */
export function errorMessage(e: unknown, fallback = 'Une erreur est survenue'): string {
  const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
  // `|| fallback` (et non `??`) : une chaîne d'erreur VIDE renvoyée par le backend
  // retombe aussi sur le texte de repli (sinon toast au corps vide).
  return msg || fallback;
}

const icon = (Cmp: typeof IconCheck) => createElement(Cmp, { size: ICON_SIZE });

/**
 * Nom accessible du bouton de fermeture des toasts (WCAG 4.1.2, axe `button-name`).
 *
 * ⚠️ Le `CloseButton` de `Notification` (Mantine) ne rend qu'une icône SVG, sans
 * texte ni `aria-label` : sans ce nom, CHAQUE toast affiché ajoute à la page un
 * bouton qu'un lecteur d'écran annonce « bouton », sans plus (mesuré au
 * navigateur dans la pépinière, axe critique). Précisé par rapport au « Fermer »
 * des croix de modale : un toast peut s'afficher PAR-DESSUS une modale ouverte,
 * et deux boutons « Fermer » ne se distingueraient plus.
 */
const CLOSE_LABEL = 'Fermer la notification';

/**
 * `closeButtonProps` nommé, FUSIONNÉ avec celui de l'appelant : à poser APRÈS
 * `...opts`, sinon un `closeButtonProps` passé pour une autre raison (un
 * `data-*`, un style) écraserait l'objet entier et ferait perdre le nom. Un
 * `aria-label` fourni par l'appelant prime toujours.
 */
const closeButton = (opts?: NotifyOptions): Pick<NotificationData, 'closeButtonProps'> => ({
  closeButtonProps: { 'aria-label': CLOSE_LABEL, ...opts?.closeButtonProps },
});

/**
 * Priorités d'affichage (`priority` de `NotificationData`, Mantine ≥ 9.6 — d'où le
 * plancher des peers : en 9.5 le champ n'est pas reconnu et finit en attribut DOM).
 * Au-delà de la limite de toasts simultanés,
 * Mantine affiche les priorités les plus hautes en premier — une erreur ne doit
 * jamais être éclipsée par une rafale de succès. Un appelant qui passe SA propre
 * `priority` dans `opts` prime toujours (`...opts` en dernier).
 *
 * `PRIORITY_DEFAULT` vaut 0, la valeur que Mantine suppose en son absence :
 * succès et info ne changent donc pas de rang.
 *
 * ⚠️ `PRIORITY_LOADING === PRIORITY_ERROR` : la plus haute, à ÉGALITÉ avec les
 * erreurs, jamais au-dessus (un chargement ne doit pas repousser une vraie
 * erreur hors de la limite). À égalité, Mantine garde l'ordre d'INSERTION : le
 * toast de chargement, posé en premier, reste affiché devant les erreurs
 * survenues PENDANT l'opération — au lieu d'être relégué en file d'attente
 * alors qu'il n'a ni auto-close ni bouton fermer (l'opération semblerait ne
 * jamais avoir démarré). `resolve()` ramène ensuite la priorité à celle de
 * l'ISSUE réelle.
 */
const PRIORITY_ERROR = 2;
const PRIORITY_LOADING = PRIORITY_ERROR;
const PRIORITY_WARNING = 1;
const PRIORITY_DEFAULT = 0;

export const notify = {
  /** Succès (vert sémantique + IconCheck, annonce polie `role="status"`). */
  success(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: colors.success, icon: icon(IconCheck), role: 'status', priority: PRIORITY_DEFAULT, message, ...opts, ...closeButton(opts) });
  },

  /**
   * Erreur (terracotta + IconX + annonce assertive `role="alert"`, autoClose allongé).
   * `err` peut être une chaîne (message direct) ou une erreur API (extraite via
   * `errorMessage(err, fallback)`). Titre « Erreur » par défaut. Priorité la
   * plus haute : passe devant succès/info quand la limite de toasts est atteinte.
   */
  error(err: unknown, fallback = 'Une erreur est survenue', opts?: NotifyOptions): string {
    const message = typeof err === 'string' ? err : errorMessage(err, fallback);
    return notifications.show({
      color: colors.error,
      title: 'Erreur',
      icon: icon(IconX),
      role: 'alert',
      autoClose: 8000,
      priority: PRIORITY_ERROR,
      message,
      ...opts,
      ...closeButton(opts),
    });
  },

  /** Information neutre (ardoise + IconInfoCircle, annonce polie `role="status"`). */
  info(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: colors.info, icon: icon(IconInfoCircle), role: 'status', priority: PRIORITY_DEFAULT, message, ...opts, ...closeButton(opts) });
  },

  /** Avertissement (ambre + IconAlertTriangle, annonce assertive `role="alert"`). */
  warning(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: colors.warning, icon: icon(IconAlertTriangle), role: 'alert', priority: PRIORITY_WARNING, message, ...opts, ...closeButton(opts) });
  },

  /**
   * Démarre un toast de chargement persistant (loader, pas d'auto-close, pas de
   * bouton fermer). Retourne l'`id` à passer à `resolve()`.
   */
  loading(message: React.ReactNode, opts?: NotifyOptions): string {
    const id = opts?.id ?? `op-${notifyId()}`;
    notifications.show({
      id,
      loading: true,
      message,
      autoClose: false,
      withCloseButton: false,
      // Seul toast PERSISTANT : priorité au niveau ERREUR (cf. `PRIORITY_LOADING`).
      priority: PRIORITY_LOADING,
      ...opts,
      // Sans bouton par défaut, mais nommé d'avance : un appelant peut le rétablir
      // (`withCloseButton: true`), et `notifications.update` conserve ce champ.
      ...closeButton(opts),
    });
    return id;
  },

  /**
   * Résout un toast `loading` en succès (`true`), erreur (`false`) ou
   * avertissement (`'warning'`), en mettant à jour le même `id`.
   * Erreur → `role="alert"` + autoClose allongé, comme `notify.error`.
   *
   * ⚠️ Le 3ᵉ état `'warning'` n'est PAS cosmétique : une opération en LOT peut
   * réussir partiellement (« 4 envoyés, 2 en échec »), ce qu'un booléen ne sait
   * pas dire. Sans lui, l'appelant retomberait sur `notifications.update()` en
   * direct et perdrait l'icône et le `role` a11y — `icon()` étant privé, seul le
   * helper sait les poser. Toute nouvelle issue se règle ICI.
   */
  resolve(id: string, outcome: boolean | 'warning', message: React.ReactNode, opts?: NotifyOptions): void {
    const base =
      outcome === 'warning'
        ? { color: colors.warning, icon: icon(IconAlertTriangle), autoClose: 5000, role: 'alert' as const, priority: PRIORITY_WARNING }
        : outcome
          ? { color: colors.success, icon: icon(IconCheck), autoClose: 3000, role: 'status' as const, priority: PRIORITY_DEFAULT }
          : { color: colors.error, icon: icon(IconX), autoClose: 8000, role: 'alert' as const, priority: PRIORITY_ERROR };
    notifications.update({ id, message, loading: false, withCloseButton: true, ...base, ...opts, ...closeButton(opts) });
  },
};

/** Identifiant croissant sans dépendre de `Date.now()` (SSR/test friendly). */
let _seq = 0;
function notifyId(): number {
  _seq += 1;
  return _seq;
}
