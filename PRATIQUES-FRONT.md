# PRATIQUES-FRONT.md — pratiques de développement front des apps Gradilis

Compagnon de [`DESIGN.md`](./DESIGN.md) : `DESIGN.md` dit **à quoi** doit ressembler un écran
(charte, tokens, états, accessibilité) ; ce fichier dit **comment** l'écrire et le tester sans
retomber dans des pièges déjà rencontrés. Il s'adresse aux humains comme aux agents IA, et les
`CLAUDE.md` des apps Gradilis y renvoient. Chaque règle tient en quelques lignes ; elle existe
parce que son contraire a produit un défaut réel.

Les pratiques transverses (backend, migrations, git, déploiement, méthode de travail) ne sont
pas ici : elles vivent dans la documentation interne de l'écosystème.

---

## 1. Consommer le socle

- Installer `@gradilis/ui` en git-dep **épinglée sur un tag** (README § « Consommation ») et
  fabriquer le thème de l'app avec `createGradilisTheme(tokens)` — jamais recopier le thème.
- **Les `peerDependencies` fixent les majeures de l'app** (Node, Mantine, `react-router`,
  zod). Après un bump du tag, lire `npm ls --all` : un `npm install` qui réussit ne prouve pas
  que l'arbre est cohérent, et une borne de peer trop étroite fige Mantine sans rien dire.
- **Côté socle** : borner chaque peer à la MAJEURE (`>=x.y.0 <X+1`), jamais `~x.y.0` — un peer
  étroit fige la version installée dans l'app même si sa propre plage est plus large, et chaque
  correctif de la lib devient alors un tag du socle.
- Vérifier `node -v` **avant** tout `npm install` : un npm plus ancien que celui du lockfile peut
  le réécrire (perte de champs, dépendances natives mal résolues).
- Importer le routeur depuis **`react-router`**, jamais `react-router-dom`.
- Une primitive du socle qui ne convient pas **se configure** (`configureNum`,
  `configureNotify`, `GradilisLabelsProvider`, props d'injection) ou **s'améliore dans le
  socle**. Une copie locale « le temps de » diverge : si une app garde exceptionnellement une
  copie, toute évolution générique de cette copie doit être reportée dans le socle.

## 2. Écrans et composants

- **Toute requête a trois états, pas deux** : chargement, échec, données. `disabled={!data}`
  confond l'échec avec le chargement et laisse un bouton grisé sans explication. Chaque écran
  rend en plus les états vide et partiel (`DESIGN.md` §5).
- **Mantine ne rejette pas une couleur inconnue du thème** : `color="nomAbsent"` devient une
  valeur CSS invalide, ignorée sans erreur ni warning. N'utiliser que les rampes enregistrées
  par le thème (sémantiques du socle ou rampes de marque de l'app).
- **Un état qui change très souvent (progression, minuterie) ne vit pas dans l'état de la
  page** : chaque tick re-rend tout l'arbre. Le confiner au plus petit composant qui l'affiche.
- **Recherche au clavier** : un champ contrôlé qui déclenche une requête à chaque frappe perd
  des frappes. Débouncer (≈ 250 ms) avec une valeur locale découplée de la requête.
- **Plages de dates Mantine** (`type="range"`) : gérer explicitement l'état intermédiaire
  `[début, null]` dans un brouillon local, sinon certaines options (`allowSingleDateInRange`)
  deviennent inertes.
- **Préférence d'appareil (`localStorage`)** : valeur stockée si présente, sinon défaut
  DÉRIVÉ ; ne rien écrire au montage, sinon le défaut du jour se fige comme un choix de
  l'utilisateur. Toujours lire et écrire dans un `try/catch`.
- **Changer une route ne migre ni les favoris ni les liens enregistrés** : garder les anciens
  chemins dans une table de correspondance testée.
- **Modales** : `data-autofocus` sur le premier champ ; `openConfirm` met le focus sur
  « Annuler » ; neutraliser la soumission répétée par une touche Entrée maintenue.
- **Montants** : dire le régime (HT ou TTC) de tout montant affiché ; il se lit au
  sérialiseur, jamais au nom du champ.
- **Une règle métier que le serveur connaît ne se recalcule pas dans le front** (héritage,
  taxes, cascades) : le serveur la résout et la sert, le front l'affiche.

## 3. Tests front

- **`as unknown as T` désarme le typecheck**, et les fixtures d'un client API moqué ne sont pas
  vérifiées contre les types réels : un champ renommé côté API reste vert. Typer les fixtures
  sur les types de l'API.
- **`tsc --noEmit` peut exclure les fichiers de test** selon la configuration : seule
  l'exécution de la suite prouve qu'ils compilent.
- **`vi.mock` d'un module utilitaire doit être partiel** (`importOriginal`) : sinon tout ce que
  le module exporte d'autre devient `undefined` dans le test.
- **Un garde-fou qu'on n'a jamais vu rougir n'en est pas un** : casser volontairement le code
  protégé, constater le rouge, restaurer. Un test vacueux se propage par copie : corriger tous
  ses frères.
- **Jamais de verdict à travers un pipe** (`npm test | grep …`, `| tail`) : le code de sortie
  est celui du dernier maillon. Lire celui de la commande de test.
- **Un « unhandled error » de Vitest nomme un témoin, pas forcément le coupable** ; un rouge
  intermittent peut venir de la charge machine : rejouer le fichier isolé avant de conclure.
- Séparer les tests purs (environnement `node`) des tests qui rendent du DOM : plus rapides,
  et la frontière `.test.ts` / `.test.tsx` se maintient seule.
- Accessibilité : `vitest-axe` sur les composants, passe axe-core sur les écrans ; mesurer le
  mode sombre séparément, le clair corrigé ne dit rien du sombre.

## 4. Revue

- Réviser **avant** de merger. Sur un changement d'écran, rejouer aussi les tests des visites
  guidées ou parcours qui l'ancrent.
- Une affirmation sur les internes d'une lib (Mantine, React Router…) n'entre dans une
  doctrine qu'après mesure : lire la doc à jour, ou écrire le test qui la prouve.
