/**
 * useSaveShortcut — raccourci clavier d'enregistrement pour les formulaires de saisie.
 *
 * Vendoré de `gradilis_magasin/frontend/src/hooks/useSaveShortcut.ts` (DM-7), inchangé.
 *
 * `⌘/Ctrl+S` et `⌘/Ctrl+Entrée` déclenchent `onSave`. Les formulaires multi-lignes
 * NE SONT PAS enveloppés dans un `<form onSubmit>` à dessein : `Entrée` seul y
 * soumettrait la saisie au milieu d'une ligne. Le raccourci offre le geste clavier
 * explicite « enregistrer » sans ce risque.
 *
 * `tagsToIgnore = []` : le raccourci se déclenche AUSSI depuis un champ (on veut
 * enregistrer en pleine saisie). `preventDefault` neutralise le « Enregistrer la page »
 * natif du navigateur sur ⌘/Ctrl+S.
 *
 * Deux garde-fous (le raccourci est global sur `document.documentElement`) :
 * - `event.repeat` ignoré → maintenir la touche ne double-soumet pas (la garde
 *   `enabled=!isSaving` est périmée tant que React n'a pas re-rendu).
 * - si un overlay est ouvert au-dessus (modale de contenu ou de confirmation →
 *   `[role="dialog"]`), on NE soumet PAS le formulaire sous-jacent : le focus et
 *   l'intention de l'utilisateur sont dans l'overlay.
 *
 * L'appelant reste responsable du `enabled` métier (ex. étape finale d'un wizard,
 * brouillon éditable uniquement) en plus du `!isSaving`.
 */
import { useHotkeys } from '@mantine/hooks';

export function useSaveShortcut(onSave: () => void, enabled = true): void {
  const handler = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (document.querySelector('[role="dialog"]')) return;
    onSave();
  };
  useHotkeys(
    enabled
      ? [
          ['mod+S', handler, { preventDefault: true }],
          ['mod+Enter', handler, { preventDefault: true }],
        ]
      : [],
    [],
  );
}
