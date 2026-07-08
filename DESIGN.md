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
| Appels API : instance axios `@/lib/api` (baseURL dérivée de `window.__GRADILIS__`, DM-5) | **Toute URL `/api/...` en dur** (casse PROXY_PREFIX/code-server) |
| Agrégats de pied de table fournis par les **données** (backend) | Recalculer des agrégats métier dans la lib de table |

## 8. Divergences consignées (écarts justifiés vs guidelines v2.0 / magasin)

1. **DM-1 — Stack tables = `mantine-datatable` 9.3.x (lockstep Mantine 9), PAS
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
3. **DM-7 — socle vendoré de `gradilis_magasin`** (thème, primitives, hooks) plutôt
   que package publié : dette « re-synchroniser si publication ultérieure de
   `@gradilis/ui` magasin » (détail : README du package, M.5). Deux adaptations de
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
