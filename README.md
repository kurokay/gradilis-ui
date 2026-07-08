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
| `@gradilis/ui` | thème (`createGradilisTheme`), tokens sémantiques, `notify`/`openConfirm`, primitives (`Num`, `PageBreadcrumb`, `FittedDataTable`), hooks tableaux |
| `@gradilis/ui/format` | formatage fr-FR (€, nombres, dates), localisation datatable |
| `@gradilis/ui/canon` | référence visuelle vivante de la charte, montée par chaque app avec **son** thème |
| `@gradilis/ui/spatial` | châssis pan/zoom (minimap, HUD, calques) — peers optionnels, opt-in |

## Consommation (git-dep + tags)

Dans le `package.json` d'une app :

```jsonc
"dependencies": {
  "@gradilis/ui": "git+https://github.com/kurokay/gradilis-ui.git#v0.4.0"
}
```

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
`react-router-dom`.

Règles d'usage détaillées de la charte : voir [`DESIGN.md`](./DESIGN.md).
