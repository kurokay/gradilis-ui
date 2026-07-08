/**
 * openConfirm — wrapper clavier-sûr de `modals.openConfirmModal` (convention
 * playbook §4 : jamais `window.confirm` ni `modals.openConfirmModal` en direct).
 *
 * Vendoré de `gradilis_magasin/frontend/src/lib/confirmModal.ts` (DM-7), inchangé.
 *
 * On pose `data-autofocus` sur le bouton **Annuler** (action sûre) : à l'ouverture,
 * le focus est déterministe côté annulation, donc `Entrée`/`Espace` (comme `Échap`)
 * FERMENT la fenêtre sans exécuter l'action. Pour confirmer, l'utilisateur clavier
 * fait un `Tab` délibéré vers le bouton de confirmation.
 *
 * Pourquoi PAS auto-focus « Confirmer » : ce helper couvre les confirmations
 * destructrices (suppressions, validations irréversibles). Y focaliser le bouton
 * destructeur ferait d'un Entrée réflexe / bufférisé / en key-repeat un chemin de
 * perte de données à une touche. La sûreté prime sur l'économie d'un Tab. Le focus
 * reste piégé DANS la fenêtre (les deux boutons sont atteignables au clavier).
 */
import { modals } from '@mantine/modals';

type ConfirmModalOptions = Parameters<typeof modals.openConfirmModal>[0];

export function openConfirm(options: ConfirmModalOptions): string {
  return modals.openConfirmModal({
    ...options,
    cancelProps: { 'data-autofocus': true, ...options?.cancelProps },
  });
}
