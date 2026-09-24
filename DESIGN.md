# DESIGN.md — règles d'usage de la charte Gradilis (`@gradilis/ui`)

> Règles de la charte de gouvernance UI/UX Gradilis reformulées en do/don't, plus
> les conventions frontend obligatoires de l'écosystème et les **divergences
> consignées** (§ final).
> Le socle est **agnostique de marque** : les rampes sémantiques + le neutre vivent
> dans `src/colors.ts`, la structure du thème dans `src/theme.ts` (factory
> `createGradilisTheme`) ; les **rampes d'identité de chaque marque** vivent dans
> l'app (`theme/tokens.ts` de l'app), injectées dans la factory. Seuls ces fichiers
> sont autorisés à contenir des hex (lint anti-hex, échec = build cassé).
> Référence inspectable : l'app-canon (subpath `@gradilis/ui/canon`), montée par
> chaque app avec **son** thème (§9 : « comparer » = la rendre et confronter).

## 1. Couleurs

| ✅ Do | ❌ Don't |
|---|---|
| Toute couleur via les tokens du thème : `color="gradilisGreen"`, `c="gradilisBrown.7"`, `var(--mantine-color-succes-9)` | Un hex, `rgb()`/`hsl()` ou couleur Mantine brute (`red`, `teal`…) dans un composant, un style inline ou un CSS module |
| Boutons pleins : le primaire par défaut (`primaryShade: 7` → vert idx 7, blanc dessus = 5,86:1 AA) | `gradilisGreen.6` (identité, 4,32:1) comme fond de bouton porteur de texte normal |
| `gradilisLime` : highlights, séries de graphes, décor | **Lime en texte ou fond de bouton — jamais** (idx 5 sur blanc = 2,09:1, échec AA) |
| Titres et libellés appuyés : `c="gradilisBrown.7"` (7,70:1) | Des titres dans une couleur décorative |
| États sémantiques via les clés FR du thème : `succes` / `alerte` / `erreur` / `info` | `green`/`orange`/`red`/`blue` Mantine, ou la couleur seule sans icône (WCAG 1.4.1) |
| Fonds/bordures neutres via `gradilisGray` ou les variables `--gradilis-*` (cssVariablesResolver) | Des gris ad hoc |

Mode **clair uniquement** (§3.3) : l'app passe `forceColorScheme="light"` — ne pas
introduire de styles dépendant du mode sombre.

## 2. Typographie & chiffres

| ✅ Do | ❌ Don't |
|---|---|
| Inter (UI) et JetBrains Mono (chiffres/montants) via le thème — déjà câblés | Importer une autre fonte, ou Roca/Acumin (marque print/magasin, hors UI apps) |
| Chiffres alignés : composant **`<Num>`** (tabular-nums) dans tableaux, KPI, totaux | `<Text>` nu pour des colonnes de nombres, ou `fontVariantNumeric` re-déclaré à la main |
| Tout formatage FR via **`@gradilis/ui/format`** : `formatDate`, `formatNumber`, `formatEUR`, `formatQuantite`, `formatPourcent`, `dataTableTextesFR` | `new Intl.…` hors de `src/format/` (lint), `toLocaleString`, formatage à la main (`x.toFixed(2) + ' €'`) |
| Base dense métier : 14 px (`fontSizes.sm`, défaut des composants), graisses 400/500/600 | Tailles/graisses en dur |

## 3. Espacement, rayons, ombres

| ✅ Do | ❌ Don't |
|---|---|
| Grille 4 px via les tokens : `spacing` xs 8 · sm 12 · md 16 · lg 24 · xl 32 ; `radius` défaut `md` (8) | Marges/paddings en px arbitraires |
| Ombres **`sm`** (cartes, menus) et **`md`** (modales) seulement | `lg`/`xl`, ombres décoratives, glow (les clés n'existent d'ailleurs plus dans le thème) |

## 4. Iconographie

| ✅ Do | ❌ Don't |
|---|---|
| Tabler (`@tabler/icons-react`), style **outline**, **18–20 px** en ligne (`size={18}`) | Toute autre librairie d'icônes, mix de styles filled/outline, tailles fantaisistes |

## 5. États ingrats — les 4 sont OBLIGATOIRES sur chaque écran

1. **Vide** — avec une action de sortie (bouton « Nouveau … »), jamais un blanc.
2. **Chargement** — skeletons (`<Skeleton>`), région `role="status"` + `aria-busy`.
3. **Erreur** — expliquée, avec relance (`Alert color="erreur"` + bouton Réessayer).
4. **Succès** — confirmation (toast `notify.success` et/ou `Alert color="succes"`).

Modèles rendus côte à côte : `/app/canon/etats`.

## 6. Accessibilité (WCAG 2.1 AA)

- Texte normal ≥ **4,5:1** ; texte large/gras et composants UI ≥ **3:1**. Les ratios
  des rampes sont mesurés dans `colors.ts` — tout nouveau couple texte/fond se vérifie.
- Navigation clavier complète + **focus visible** : fournis par Mantine (`focusRing`
  auto) — ne pas les casser (`outline: none` interdit).
- Ne jamais porter une information par la couleur seule : icône ou texte en double
  (`notify.*` et les badges du canon montrent le pattern).
- `respectReducedMotion: true` est posé par le thème — ne pas ajouter d'animations
  qui l'ignorent.

## 7. Conventions obligatoires (playbook §4 — miroir de Magasin)

| ✅ Do | ❌ Don't |
|---|---|
| Toasts via **`notify.success/error/info/warning`** (icône + couleur charte + `role` a11y ; `notify.error(err)` extrait le message API) | `notifications.show` en direct |
| Confirmations via **`openConfirm`** (focus initial sur **Annuler** — Entrée réflexe ne détruit rien) | `window.confirm`, `modals.openConfirmModal` en direct |
| Fil d'Ariane via **`<PageBreadcrumb items={…} />`** (« Accueil » auto, `aria-current`, repli mobile) | Re-hardcoder `<Breadcrumbs>` Mantine |
| Tables : `mantine-datatable` via **`<FittedDataTable fit={fit} …>`** + **`useTablePrefs(key, { autoFit: true })`** (client par défaut) ; textes FR spreadés d'office | `<table>` maison, DataTable sans localisation FR, pagination re-implémentée |
| Formulaires : `@mantine/form` + `zodResolver` (le schéma Zod = source de vérité, messages FR), `data-autofocus` sur le 1er champ, **`useSaveShortcut`** (Ctrl+S / Ctrl+Entrée) sur la saisie | Validation à la main, erreurs en anglais |
| Appels API : instance axios `@/lib/api` de l'app, baseURL dérivée d'une **source unique** propre à l'app (magasin : `lib/basePath.ts` depuis `import.meta.env.BASE_URL` ; pépinière : `window.__GRADILIS__`, DM-5 — deux mécanismes, une seule règle) | **Toute URL `/api/...` en dur** (casse PROXY_PREFIX/code-server) |
| Agrégats de pied de table fournis par les **données** (backend) | Recalculer des agrégats métier dans la lib de table |

## 8. Divergences consignées (écarts justifiés vs guidelines v2.0 / magasin)

1. **DM-1 — Stack tables = `mantine-datatable` (lockstep Mantine 9 ; 9.4.x depuis v0.5.0), PAS
   `mantine-react-table`.** Les mentions MRT des guidelines v2.0 (§5 « MRT_Localization_FR »,
   §8 « tableaux → mantine-react-table », §3.7 « Mantine et MRT ») sont **périmées** :
   MRT v2 est bloqué en beta depuis février 2025 et incompatible au-delà de Mantine 7,
   tandis que `mantine-datatable` est maintenu en lockstep et déjà en production dans
   `gradilis_magasin` (décision Lucas 2026-07-07, plan Chantier M DM-1).
   → **Entrée changelog à proposer aux guidelines** : « v2.1 — stack tables :
   `mantine-react-table` remplacé par `mantine-datatable` (lockstep Mantine 9) ;
   localisation FR via `dataTableTextesFR` de `@gradilis/ui/format` ».
2. **`semSuccess` : ancre assombrie `#277A37` en idx 9, au lieu du `#2B8A3E` du §3.2.**
   L'ancre documentaire donne 4,37:1 sur blanc — insuffisant pour du texte normal AA
   (4,5:1). La rampe est héritée du socle magasin, qui avait déjà opéré cet
   assombrissement ; le reste de la rampe est inchangé. (Les 3 autres ancres
   sémantiques §3.2 coïncident.)
3. **DM-7 — ~~socle vendoré de `gradilis_magasin`~~ : CADUC.** Le socle est ce repo,
   consommé en git-dep + tag par magasin ET pépinière ; le vendoring est abandonné
   (README § « Écosystème »). Ce qui reste vrai de DM-7 : deux adaptations de
   code au passage du lint plus strict de Pépinière (typescript-eslint strict +
   react-hooks v7) : pattern « latest ref » de `useAutoPageSize` déplacé dans un
   layout effect, et règle `react-hooks/refs` coupée pour le seul
   `FittedDataTable.tsx` (faux positif documenté dans `eslint.config.js`).
4. **App-canon = route `/app/canon` dans la SPA** (DM-2), pas Storybook — option
   explicitement autorisée par §9 ; rendue avec le vrai thème, le vrai AppShell et la
   vraie auth (fallback Flask connecté).

## 9. Outillage (rappel)

- `npm run lint` : ESLint (anti-hex + anti-`Intl` hors format, `--max-warnings 0`)
  + Stylelint (`color-no-hex`). `npm run typecheck`, `npm test`, `npm run build` : CI (M.4).
- Checklist « fini » par écran : guidelines §9 (tokens only, 4 états, AA, clavier,
  responsive, tabular-nums + format FR, comparé à `/app/canon`, tests verts).

---

## 10. Agnosticisme de marque — état du chantier (2026-08-01)

**Le socle sert DEUX applications** : `gradilis_pepiniere_app` (qui consomme les
primitives `notify`/`Num`/`PageBreadcrumb`/`FittedDataTable`/`openConfirm`) et
`gradilis_magasin` (qui ne consomme aujourd'hui que les helpers de format et la
factory de thème). Tant qu'une seule app utilisait les primitives, leurs textes
et couleurs en dur ne se voyaient pas. Ils bloquaient l'adoption par la seconde.

### Ce qui est FAIT (étape 1)

| Sujet | Avant | Maintenant |
|---|---|---|
| Bouton « Auto » de `FittedDataTable` | `color="gradilisGreen"` | pas de prop `color` → suit `theme.primaryColor` |
| Libellés de `PageBreadcrumb` / bouton « Auto » | chaînes FR en dur | `GradilisLabelsProvider` (défauts FR **identiques**) |
| Couleurs de `notify` | noms figés | `configureNotify({ colors })`, surcharge partielle |
| Classe marqueur des `<Num>` | inexistante | `configureNum({ markerClass })`, `undefined` par défaut |
| Actions à droite du fil d'Ariane | inexistant | prop `actions?: ReactNode` (absente = markup INCHANGÉ) |
| `data-*` sur `FittedDataTable` | perdus | extraits sur le `<div>` racine (ancres de visite guidée) |

Les quatre dernières lignes sont le **backport** des extensions de
`gradilis_magasin`, qui était en avance sur le socle. ⚠️ Toutes sont des OPT-IN à
défaut neutre : sans appel de configuration, le rendu est celui d'avant.

⚠️ **Les deux changements sont NON CASSANTS pour Pépinière, par construction** :
sa primaire EST `gradilisGreen` (vérifié dans ses tokens), et sans provider les
libellés rendent les chaînes historiques au caractère près. Prouvé par
`src/lib/labels.test.tsx` + `src/components/primitives.test.tsx` (qui attendait
déjà « Accueil » et « Fil d'Ariane » et passe toujours). **Pépinière n'a rien à
faire**, et n'a d'ailleurs pas été modifiée.

⚠️ **`color="gradilisGreen"` était un défaut MUET**, pas cosmétique : Mantine ne
rejette pas un nom de couleur inconnu du thème — `parseThemeColor` fait
`isThemeColor = _color in theme.colors` et, si c'est faux, renvoie la chaîne
**telle quelle comme valeur CSS**. Dans le magasin, `background: gradilisGreen`
est une déclaration invalide, silencieusement ignorée : le bouton perdait sa
couleur sans erreur, sans warning, sans test rouge.

### Ce qui N'A PAS besoin d'être fait — ne pas y perdre du temps

**Les couleurs sémantiques sont DÉJÀ agnostiques.** `createGradilisTheme`
enregistre `SEMANTIC_RAMPS` (`succes`/`alerte`/`erreur`/`info`) dans le thème de
**toute** application passant par la factory. Un composant du socle qui écrit
`color="erreur"` est donc portable par construction. ⚠️ Un premier diagnostic a
conclu l'inverse (« les toasts perdraient leur couleur dans le magasin ») : c'est
FAUX, et l'erreur venait de n'avoir pas lu la factory. Seules les rampes de
**MARQUE** (`gradilisGreen`, `ampOlive`…) sont non portables.

### Ce qui RESTE

**Une seule chose : basculer les imports de `gradilis_magasin` sur le socle.**
Tout ce dont ce basculement avait besoin côté lib est en place.

⚠️ Ne pas poser un tag qui déplace les peers sans arbitrage : `gradilis_pepiniere_app` est en
PAUSE de développement, et déplacer sa dépendance sous elle pendant ce temps est
la meilleure façon de lui laisser une surprise au réveil.

Ce que le magasin devra appeler à son démarrage, une fois basculé :

```ts
configureNum({ markerClass: 'confidential-value' });   // mode confidentiel
configureNotify({ colors: { error: 'ampBrique' } });   // brique de marque
<GradilisLabelsProvider value={{ breadcrumb: { home: t('nav.home') } }}>
```
…et remplacer sa prop `helpTourId` par `actions={<PageHelp tourId={…} />}`.

### ⚠️ Correction d'une affirmation antérieure de ce document

Une version précédente de ce §10 posait « trancher le vocabulaire sémantique
FR/EN » comme l'étape 2 d'un ordre « non négociable ». **C'était faux, et le
vérifier coûtait un `grep`** : les deux jeux de noms COEXISTENT sans conflit. Le
socle injecte `succes/alerte/erreur/info` dans toute app ; le magasin ajoute des
alias `success/warning/error` sur les MÊMES rampes ; Pépinière emploie les noms
FR à 26 endroits. Rien ne casse, rien n'est ambigu, et trancher aujourd'hui
n'aurait qu'un effet : forcer une migration dans un dépôt en pause.

**Décision : le socle garde le FR canonique, le sujet est REPORTÉ.** C'est une
question de propreté, pas un prérequis. Le noter ici pour que personne ne se
croie bloqué par elle — et parce qu'un ordre annoncé « non négociable » qui ne
l'est pas est exactement le genre d'affirmation qui coûte du temps à la
personne suivante.
