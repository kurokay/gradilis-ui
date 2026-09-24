# Banc de rendu visuel du canon

Mini-app Vite (aucun bundler ajouté au socle publié : `vite` est déjà une
dépendance transitoire de `vitest`) qui monte chaque section de
`src/canon/` dans un `MantineProvider`, pour la capture Playwright de
`visual/canon.spec.ts`. Ne fait PAS partie du paquet publié (voir
`tsconfig.build.json`, qui n'inclut que `src/`, et `package.json#files`).

Paramètres d'URL de `index.html` :

- `section` — une des clés de `SECTIONS` (`App.tsx`) : `appshell`, `tableau`,
  `formulaire`, `kpi`, `etats`, `couleurs`, `spatial`.
- `marque` — `pepiniere` (le vert réel du socle, `tokens/pepiniere.ts`) ou
  `factice` (une marque olive INVENTÉE pour ce banc, patron déjà présent dans
  `src/canon/canon.test.tsx` sous `themeOlive` — aucune couleur de marque
  réelle d'une app consommatrice n'entre dans ce dépôt public).
- `schema` — `clair` ou `sombre` (`forceColorScheme`).

La page pose `document.body.dataset.ready = '1'` une fois : la section
montée, les polices chargées (`document.fonts.ready`) et deux frames
écoulées — c'est ce que `canon.spec.ts` attend avant de capturer.
