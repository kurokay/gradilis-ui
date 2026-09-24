/**
 * Num — texte à chiffres tabulaires (tabular-nums), pour aligner les montants
 * et quantités (GUIDELINES §3.1 : « tabular-nums dans les tableaux »).
 * Conserve la police proportionnelle ; ajoute seulement font-variant-numeric.
 *
 * Vendoré de `gradilis_magasin/frontend/src/components/Num.tsx` (DM-7) ;
 * régime HT/TTC et garde d'exécution : backport depuis l'app de référence.
 *
 * ## Classe marqueur (`configureNum({ markerClass })`)
 *
 * Classe ajoutée à CHAQUE instance. Sans appel, rien ne change (`undefined` par
 * défaut) — aucune app n'en hérite sans l'avoir demandé.
 *
 * Le besoin qui l'a motivé (un « mode confidentiel ») : flouter en CSS tous les
 * montants d'un écran d'un seul geste, via une classe posée sur `<html>`.
 * ⚠️ Le point ENTIER est que les `<Num>` ne s'abonnent à AUCUN contexte : un
 * marqueur statique + une règle CSS, sinon basculer le mode re-rendrait tout
 * l'écran au lieu du seul bouton. Ne pas « améliorer » ça en y branchant un
 * contexte React — c'est aussi pourquoi les libellés de régime passent par une
 * FONCTION de module et non par `GradilisLabelsProvider`.
 *
 * ## Régime fiscal (`regime`)
 *
 * Un montant affiché sans son régime (HT ou TTC) se lit mal dès que les deux
 * cohabitent sur un même écran : diviser mentalement un HT par un TTC est une
 * erreur silencieuse. La prop `regime` pose un marqueur court (« HT », « TTC »,
 * « TVA ») à côté du nombre.
 *
 * ⚠️ Le régime est un **fait de la source des données**, jamais une déduction
 * du nom d'un champ : avant d'annoter un site, remonter au sérialiseur.
 *
 * ⚠️ La prop est **optionnelle au type** : `<Num>` rend aussi des QUANTITÉS
 * (poids, colis, compteurs) qui n'ont pas de régime. L'exiger partout rendrait
 * la règle ingérable, donc contournée. Ce qui la tient est ailleurs :
 *   1. un **scan de source** — propre à chaque app, hors socle ;
 *   2. un **garde d'exécution** (`assertRegimeOnMoney`), activé par
 *      `configureNum({ guardMoneyRegime: true })` (typiquement en dev/test) :
 *      il crie si le texte RENDU contient `€` sans régime. C'est lui qui
 *      rattrape la forme indirecte (`<Num>{k.value}</Num>`, chaîne fabriquée
 *      ailleurs) que le scan de source ne voit pas.
 *
 * ⚠️ Le garde ne voit que les `children` : un `€` écrit en FRÈRE de `<Num>`
 * dans le JSX du parent lui échappe par construction — seul un scan de source
 * peut l'attraper. Corollaire d'écriture : l'unité monétaire se met DANS les
 * enfants (sinon elle échappe aussi à la classe marqueur, donc au floutage).
 * Une quantité, elle, garde légitimement son unité dehors (`%`, `kg`…).
 *
 * ⚠️ Pas d'échappatoire par site (aucune prop « masquer le marqueur ») : si la
 * densité gêne un jour, le levier est ici, dans un seul rendu.
 *
 * ⚠️ Le marqueur est un **frère** du nombre, hors de l'élément qui porte la
 * classe marqueur : un `filter: blur()` CSS ne se défait pas sur un descendant,
 * donc l'imbriquer flouterait « HT » avec le montant — or le régime n'est pas
 * confidentiel, c'est ce qui rend le montant lisible.
 */
import { Text, type TextProps, type ElementProps } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * Les trois natures de montant.
 *
 * - `ht`  — hors taxes (coûts d'achat, cotations…)
 * - `ttc` — toutes taxes comprises (prix de vente, tickets, encaissements…)
 * - `tva` — le montant de la TAXE lui-même : ni HT ni TTC.
 *
 * ⚠️ Chaque valeur est POSITIVE : elle affirme ce que le montant EST. Pas de
 * « sans objet » — une valeur qui se lit « non applicable » finit par se lire
 * « je n'ai pas vérifié », et le garde s'éteint sans que personne le remarque.
 */
export type MoneyRegime = 'ht' | 'ttc' | 'tva';

/** Forme du libellé : `short` = marqueur visible, `long` = `title` de l'`<abbr>`. */
export type RegimeLabelForm = 'short' | 'long';

/**
 * Trace textuelle d'un montant rendu, lue par le garde d'exécution.
 * Exportée pour qu'un scan de source applicatif puisse vérifier qu'il cherche
 * la MÊME trace (sinon une couche cesserait de voir ce que l'autre voit).
 */
export const MONEY_MARKER = '€';

/** Libellés FR par défaut (identiques à ceux de l'app de référence). */
const DEFAULT_REGIME_LABELS: Record<MoneyRegime, Record<RegimeLabelForm, string>> = {
  ht: { short: 'HT', long: 'hors taxes' },
  ttc: { short: 'TTC', long: 'toutes taxes comprises' },
  tva: { short: 'TVA', long: 'montant de TVA' },
};

const defaultRegimeLabel = (regime: MoneyRegime, form: RegimeLabelForm): string =>
  DEFAULT_REGIME_LABELS[regime][form];

export interface NumConfig {
  /** Classe marqueur ajoutée à chaque instance. `undefined` = aucune. */
  markerClass?: string;
  /**
   * Libellé d'un régime, appelé À CHAQUE RENDU (pas mémorisé) : une app
   * multilingue y lit sa langue COURANTE (ex. singleton i18n), sans abonner
   * les `<Num>` à un contexte. Défaut : libellés FR.
   */
  regimeLabel?: (regime: MoneyRegime, form: RegimeLabelForm) => string;
  /**
   * Active le garde d'exécution dans `<Num>` (montant rendu sans `regime` →
   * `console.error`). Défaut `false`. Typiquement `import.meta.env.DEV` côté
   * app : le socle ne lit aucune variable d'environnement de bundler.
   */
  guardMoneyRegime?: boolean;
}

let config: NumConfig = {};

/**
 * Configure les `<Num>` de l'application. À appeler UNE fois au démarrage, avant
 * le premier rendu — et dans le setup de tests de l'app si ses tests dépendent
 * de la classe marqueur, des libellés ou du garde.
 *
 * ⚠️ REMPLACEMENT COMPLET, pas une fusion : toute clé absente revient à son
 * défaut. `configureNum({})` restaure donc le comportement historique.
 *
 * ⚠️ Réglage de MODULE et non contexte React, délibérément : un contexte ferait
 * s'abonner chaque `<Num>`, exactement ce que ce composant existe pour éviter.
 * Contrepartie assumée : la valeur est globale au bundle.
 */
export function configureNum(options: NumConfig): void {
  config = { ...options };
}

/** Libellé courant d'un régime (fonction configurée, sinon FR). */
export function regimeLabel(regime: MoneyRegime, form: RegimeLabelForm = 'short'): string {
  return (config.regimeLabel ?? defaultRegimeLabel)(regime, form);
}

/** Aplatit les enfants primitifs en texte — suffisant pour repérer un `€` rendu. */
function flatten(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flatten).join('');
  return '';
}

/**
 * Le texte rendu ressemble-t-il à un montant ? (`MONEY_MARKER` présent)
 *
 * ⚠️ Ne voit QUE les enfants primitifs : un montant rendu par un composant
 * enfant lui échappe. Assumé — c'est le rôle du scan de source applicatif.
 */
export function looksLikeMoney(children: ReactNode): boolean {
  return flatten(children).includes(MONEY_MARKER);
}

/** Empêche un même site de crier à chaque rendu (une fois par texte). */
const warned = new Set<string>();

/**
 * Garde d'exécution : `console.error` si `children` ressemble à un montant et
 * qu'aucun régime n'est fourni. Inconditionnel quand on l'appelle directement
 * (exporté pour les sondes de tests) ; `<Num>` ne l'appelle que si
 * `guardMoneyRegime` est activé.
 */
export function assertRegimeOnMoney(children: ReactNode, regime: MoneyRegime | undefined): void {
  if (regime || !looksLikeMoney(children)) return;
  const text = flatten(children).trim().slice(0, 60);
  if (warned.has(text)) return;
  warned.add(text);
  console.error(
    `[Num] Montant rendu sans régime HT/TTC : « ${text} ». Ajouter regime="ht", ` +
      'regime="ttc" ou regime="tva" (le régime est un fait de la source des données).',
  );
}

export interface NumProps extends TextProps, ElementProps<'span', keyof TextProps> {
  /**
   * Régime fiscal du montant rendu — à poser dès qu'il s'agit d'un montant.
   * Laisser absent sur une QUANTITÉ : un poids ou un compteur n'a pas de régime.
   */
  regime?: MoneyRegime;
}

export function Num({ regime, style, className, ...props }: NumProps) {
  if (config.guardMoneyRegime) assertRegimeOnMoney(props.children, regime);

  const classes = [config.markerClass, className].filter(Boolean).join(' ');
  const value = (
    <Text
      component="span"
      {...props}
      className={classes || undefined}
      style={[{ fontVariantNumeric: 'tabular-nums' }, style]}
    />
  );

  // Sans régime : rendu historique à l'identique (aucun fragment, aucun frère).
  if (!regime) return value;

  return (
    <>
      {value}
      <Text
        component="abbr"
        size="xs"
        c="dimmed"
        // `abbr` porte la forme longue : « HT » lu tel quel par un lecteur
        // d'écran ne dit rien à qui ne connaît pas l'abréviation.
        title={regimeLabel(regime, 'long')}
        data-regime={regime}
        style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        {/* Espace INSÉCABLE : le montant et « HT » ne se séparent jamais en fin de ligne. */}
        {'\u00A0'}
        {regimeLabel(regime, 'short')}
      </Text>
    </>
  );
}
