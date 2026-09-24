/**
 * ErrorState — « on n'a PAS PU lire », par opposition à « il n'y a rien ».
 *
 * Repris de l'app de référence (backport).
 *
 * ⚠️ Raison d'être : un échec de chargement rendu comme un état vide est un des
 * défauts les plus coûteux de ces écrans — « Aucune donnée » après un 500 est un
 * MENSONGE sur lequel l'opérateur décide. Un toast attire l'œil mais disparaît ;
 * ce bloc reste tant que la lecture a échoué (charte DESIGN.md §5, état 3).
 *
 * ⚠️ Point de vérité UNIQUE : la mise en page est déléguée à {@link EmptyState}
 * (icône + titre + description + action) — on ne réécrit pas un bloc par appelant.
 * La nature d'erreur est portée par l'ICÔNE, le TITRE et le motif serveur, jamais
 * par la seule couleur (WCAG 1.4.1).
 *
 * ⚠️ `announce` (défaut `true`) pose `role="alert"` : un lecteur d'écran doit
 * apprendre l'échec même si rien n'a encore annoncé quoi que ce soit. Un
 * consommateur qui a DÉJÀ notifié l'échec ailleurs (toast assertif) passe
 * `announce={false}` pour ne pas doubler l'annonce.
 *
 * Libellés (titre, rappel, bouton) injectables via `GradilisLabelsProvider`
 * (`labels.states`) — défauts FR ci-dessous.
 *
 * @example
 * error ? <ErrorState message={error} onRetry={() => fetchStock(page)} /> : <FittedDataTable … />
 */
import { Button } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { EmptyState } from './EmptyState.js';
import { useGradilisLabels } from '../lib/labels.js';

export interface ErrorStateProps {
  /** Motif renvoyé par le serveur. Absent → seul le rappel générique s'affiche. */
  message?: string | null;
  /** Relance le chargement. Doit remettre l'état d'erreur à `null` en entrée de fetch. */
  onRetry: () => void;
  /** Titre — surcharge le libellé injecté/par défaut. */
  title?: string;
  /** Pose `role="alert"` (défaut `true`) — mettre `false` si déjà annoncé ailleurs. */
  announce?: boolean;
}

export function ErrorState({ message, onRetry, title, announce = true }: ErrorStateProps) {
  const labels = useGradilisLabels().states;
  const content = (
    <EmptyState
      icon={<IconAlertTriangle size={26} />}
      color="erreur"
      title={title ?? labels.errorTitle}
      // Le motif serveur ne REMPLACE pas le rappel, il s'y AJOUTE : sans ce rappel,
      // rien ne distinguerait ce bloc d'une liste vide aux yeux de l'opérateur.
      description={[labels.errorHint, message].filter(Boolean).join(' ')}
      action={
        <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={onRetry}>
          {labels.retry}
        </Button>
      }
    />
  );
  if (!announce) return content;
  return (
    <div role="alert" aria-live="assertive">
      {content}
    </div>
  );
}
