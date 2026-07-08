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
 * - Absorber `errorMessage()` (extraction du message d'erreur API).
 * - Factoriser le pattern « chargement → succès/erreur » (`loading`/`resolve`).
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

export const notify = {
  /** Succès (vert sémantique + IconCheck, annonce polie `role="status"`). */
  success(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: 'succes', icon: icon(IconCheck), role: 'status', message, ...opts });
  },

  /**
   * Erreur (terracotta + IconX + annonce assertive `role="alert"`, autoClose allongé).
   * `err` peut être une chaîne (message direct) ou une erreur API (extraite via
   * `errorMessage(err, fallback)`). Titre « Erreur » par défaut.
   */
  error(err: unknown, fallback = 'Une erreur est survenue', opts?: NotifyOptions): string {
    const message = typeof err === 'string' ? err : errorMessage(err, fallback);
    return notifications.show({
      color: 'erreur',
      title: 'Erreur',
      icon: icon(IconX),
      role: 'alert',
      autoClose: 8000,
      message,
      ...opts,
    });
  },

  /** Information neutre (ardoise + IconInfoCircle, annonce polie `role="status"`). */
  info(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: 'info', icon: icon(IconInfoCircle), role: 'status', message, ...opts });
  },

  /** Avertissement (ambre + IconAlertTriangle, annonce assertive `role="alert"`). */
  warning(message: React.ReactNode, opts?: NotifyOptions): string {
    return notifications.show({ color: 'alerte', icon: icon(IconAlertTriangle), role: 'alert', message, ...opts });
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
      ...opts,
    });
    return id;
  },

  /**
   * Résout un toast `loading` en succès ou erreur (met à jour le même `id`).
   * Erreur → `role="alert"` + autoClose allongé, comme `notify.error`.
   */
  resolve(id: string, ok: boolean, message: React.ReactNode, opts?: NotifyOptions): void {
    notifications.update(
      ok
        ? { id, color: 'succes', icon: icon(IconCheck), message, loading: false, autoClose: 3000, withCloseButton: true, role: 'status', ...opts }
        : { id, color: 'erreur', icon: icon(IconX), message, loading: false, autoClose: 8000, withCloseButton: true, role: 'alert', ...opts },
    );
  },
};

/** Identifiant croissant sans dépendre de `Date.now()` (SSR/test friendly). */
let _seq = 0;
function notifyId(): number {
  _seq += 1;
  return _seq;
}
