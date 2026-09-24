# @gradilis/ui

Design system **Gradilis** — socle Mantine v9 **agnostique de marque**, partagé par les
applications Gradilis (magasin, pépinière, verger, …). Source unique de la charte
graphique : thème, tokens sémantiques, formatage fr-FR, primitives, page-vitrine `canon`
et châssis `spatial`.

> Repo dédié, versionné par tags git. Consommé par **toutes** les apps Gradilis
> (magasin, pépinière, verger, et les apps legacy en cours de modernisation :
> logistique, personnel).

## Écosystème & gouvernance

Ce repo est la **stratégie de consommation retenue** pour la charte Gradilis :
chaque app l'installe en **git-dep + tag** (ci-dessous). L'ancienne approche par
**vendoring** (recopier les tokens dans chaque app) est **abandonnée** — toute app
qui aurait vendoré le thème doit basculer sur ce package.

Ce package **implémente** la charte de gouvernance UI/UX transverse de l'écosystème
(couleurs chiffrées, typographie, WCAG AA, interdits) ; les do/don't opérationnels
sont dans [`DESIGN.md`](./DESIGN.md).

## Points d'entrée (subpaths)

| Import | Contenu |
|---|---|
| `@gradilis/ui` | thème (`createGradilisTheme`), tokens sémantiques, `notify`/`openConfirm`, primitives (`Num`, `PageBreadcrumb`, `FittedDataTable`), états d'écran (`EmptyState`, `ErrorState`, `StatusScreen`, `PageSkeleton`), hooks tableaux, `GradilisLabelsProvider` |
| `@gradilis/ui/format` | formatage fr-FR (€ au centime, arrondi ou unitaire, nombres, quantités sans zéros forcés, dates), localisation datatable |
| `@gradilis/ui/canon` | référence visuelle vivante de la charte, montée par chaque app avec **son** thème |
| `@gradilis/ui/spatial` | châssis pan/zoom (minimap, HUD, calques) — peers optionnels, opt-in |

## Consommation (git-dep + tags)

Dans le `package.json` d'une app :

```jsonc
"dependencies": {
  "@gradilis/ui": "github:kurokay/gradilis-ui#v0.8.0"
}
```

(La forme longue `git+https://github.com/kurokay/gradilis-ui.git#vX.Y.Z` est équivalente.)

⚠️ **Les `peerDependencies` fixent les majeures de l'app consommatrice** (Node 24,
Mantine ≥ 9.6, `react-router` ≥ 7 si `spatial`, zod 3.25 ou 4). Monter le tag peut donc
exiger des montées dans l'app : lire `npm ls --all` après l'installation, un `npm install`
qui réussit ne suffit pas à le prouver.

`npm install` clone le repo au tag, puis le script `prepare` compile `dist/` automatiquement
(rien de compilé n'est commité). Chaque app **épingle** sa version — aucune app n'est
impactée tant qu'on ne monte pas son tag.

### Marque : chaque app injecte ses tokens

Le socle ne contient **aucune couleur de marque figée**. L'app fabrique son thème :

```ts
import { createGradilisTheme } from '@gradilis/ui';
import { tokens } from './theme/tokens'; // rampes propres à l'app

export const theme = createGradilisTheme(tokens);
```

## Développement

```bash
npm install       # installe les deps + build dist/ (prepare)
npm run build     # tsc -p tsconfig.build.json → dist/ (JS + .d.ts)
npm run typecheck # tsc --noEmit
npm run test      # vitest
```

## Publier une nouvelle version

```bash
git commit -am "feat: …"
git tag vX.Y.Z
git push --tags
# puis, dans chaque app à mettre à jour : bump du tag dans package.json + npm install
```

## Auth builds (Dokploy, CI, clones)

Repo **public** : le clone HTTPS est **anonyme** — aucune clé, aucun secret, ni en
local, ni en CI, ni dans les builds Dokploy. Le contenu se limite à la charte
graphique (thème, tokens sémantiques, primitives génériques) : aucun secret, aucune
donnée métier, aucune logique applicative. Les tokens de marque de chaque app
restent dans l'app.

## Peer dependencies

Mantine v9 (`core`, `hooks`, `charts`, `dates`, `form`, `modals`, `notifications`),
`@tabler/icons-react`, `dayjs`, `mantine-datatable`, `mantine-form-zod-resolver`, `react`,
`react-dom`, `zod`. Optionnelles (subpath `spatial`) : `react-zoom-pan-pinch`,
`react-router` (v7+ — **plus** `react-router-dom`, depuis v0.7.0). Runtime : Node 24
(`engines`). Les bornes exactes font foi dans `package.json`, pas ici.

Règles d'usage détaillées de la charte : voir [`DESIGN.md`](./DESIGN.md).
Pratiques de développement et de test front : [`PRATIQUES-FRONT.md`](./PRATIQUES-FRONT.md).

## Tests visuels du canon

Filet de non-régression du rendu de `src/canon/` (Playwright + captures d'écran),
séparé de `npm test` (vitest, rapide, sans navigateur) :

```bash
npm run test:visual          # compare aux références commitées
npm run test:visual:update   # régénère les références (après avoir REGARDÉ les écarts)
```

**Quand les lancer** : avant de poser un tag — un changement de rendu du socle doit
se voir ici, pas être découvert en recette dans une app consommatrice.

**Comment mettre à jour les références** : `npm run test:visual` d'abord pour voir le
diff — trois PNG par capture en écart (`*-actual.png`/`*-expected.png`/`*-diff.png`)
sous `test-results/`, et un rapport HTML consultable sous `playwright-report/`
(`npx playwright show-report`), aucun des deux commité ; si le changement est
VOULU, `npm run test:visual:update` puis relire les PNG modifiés avant de committer
`visual/__screenshots__/`.

**Ce qu'ils couvrent** : les 7 sections de `src/canon/` (`CanonAppShell`,
`CanonTable`, `CanonForm`, `CanonKPI`, `CanonStates`, `CanonColors`,
`CanonSpatial`) × 2 marques (le vert Pépinière réel + une marque olive FACTICE,
`visual/brands.ts` — aucune couleur de marque d'une app consommatrice n'entre
dans ce dépôt public) × 2 schémas (clair/sombre) = 28 captures, servies par un
petit banc Vite (`visual/`, jamais publié — voir `visual/README.md`).

**Ce qu'ils ne couvrent PAS** :
- les interactions (survol, focus, drag du plateau spatial, tri de table) —
  seul l'état initial de chaque section est capturé ;
- toute app consommatrice (ses propres écrans, ses propres tokens de marque) ;
- **les polices** : Inter (référencée par défaut par le socle) n'est ni une
  police système ni une dépendance de ce paquet ; le banc épingle une pile
  explicite et INSTALLÉE sur la machine qui régénère (`visual/brands.ts`) pour
  que deux runs consécutifs SUR CETTE MACHINE soient identiques — mais les
  références PNG elles-mêmes restent dépendantes des polices disponibles sur
  la machine qui les a produites ; les régénérer sur une autre machine peut
  produire un diff de rendu de texte qui n'a rien à voir avec le socle ;
- **le navigateur** : capturé avec Chrome système (`/usr/bin/google-chrome`,
  version **153.0.8010.36** au moment des références), jamais le Chromium
  téléchargé par Playwright (absent de cette machine, bac à sable cassé sous ce
  montage) — une mise à jour de Chrome système peut à elle seule invalider les
  références ;
- **le système d'exploitation** : le suffixe `-chromium-linux` du nom des PNG
  de référence (`playwright.config.ts` → `projects[0].name`, résolu par
  Playwright à partir de l'OS d'exécution) rend les références **absentes**,
  pas différentes, sur un run macOS/Windows — `test:visual` régénérerait tout
  au lieu de comparer ;
- **le sous-pixel exact** : `expect.toHaveScreenshot` (`playwright.config.ts`)
  sépare deux tolérances qui gardent des rôles distincts (détail dans le
  commentaire du fichier) — `threshold` (delta de teinte pixel-à-pixel)
  absorbe un décalage de NUANCE étalé sur beaucoup de pixels, `maxDiffPixels`
  absorbe l'antialiasing localisé d'un bord. `threshold: 0` (aucune marge de
  teinte), `maxDiffPixels: 24` conservé : deux runs consécutifs identiques
  restent VERTS sur cette machine (bruit de teinte nul, mesuré) — la marge de
  `threshold: 0.01` retenue protège donc une machine moins déterministe, pas
  un bruit constaté ici. Contrepartie éprouvée : un décalage de ~15 valeurs
  RGB sur UNE seule nuance sémantique (`succes[9]`, lue par le variant
  `light` — texte en schéma clair, FOND assombri en schéma sombre,
  `get-css-color-variables.mjs`) fait échouer Couleurs (les 4 captures, hex
  affiché) ET Tableau/KPI/États dans les DEUX schémas (badges et alertes) —
  le premier essai à `threshold: 0.05` avait manqué les pendants sombres
  (delta trop petit pour ce seuil trop lâche), ce qui a fait baisser
  `threshold` à `0.01`. Formulaire/Spatial/AppShell restent verts (ne rendent
  pas cette couleur). Le radius `md` (8px→24px, mutation large) fait lui
  échouer 24/28 captures. Le filet est donc sensible à un décalage de nuance
  RÉALISTE sur les DEUX schémas — pas seulement à un changement de teinte
  grossier — sans jamais rougir entre deux runs identiques.

## Journal des versions

- **(non publié)** — Tests de non-régression visuelle du canon (Playwright,
  Chrome système, 28 captures section × marque × schéma), voir § ci-dessus.
  Aucun changement de comportement du socle.
- **v0.9.0** — `notify` : priorités d'affichage (erreur > avertissement > succès/info,
  chargement au niveau erreur) et issue `'warning'` de `resolve`. `Num` : prop `regime`
  (HT/TTC/TVA), `configureNum({ regimeLabel, guardMoneyRegime })`. `FittedDataTable` :
  libellés via `GradilisLabelsProvider` (section `dataTable`), pas de recalage de page
  pendant un chargement, `fit.enabled`. `useTablePrefs`/`useTableAutoFit` : `sortValues`,
  `revalidateKey`. Nouveaux composants d'état `EmptyState`, `ErrorState`, `StatusScreen`,
  `PageSkeleton` (section de libellés `states`). `format` : `formatQuantiteLibre`,
  `formatEURArrondi`, `formatPrixUnitaire`. ⚠️ Peers Mantine relevés à `>=9.6.0` ;
  ⚠️ `FittedDataTable` refuse désormais au typage `paginationText`/`loadingText`/
  `recordsPerPageLabel` (ils étaient déjà ignorés à l'exécution depuis ce même tag).
