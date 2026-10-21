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
- **Alignement dans les tableaux** : un nombre (quantité, montant, %, compte) s'aligne à
  DROITE, en-tête compris, pour que les unités se lisent en colonne ; une colonne de gestes
  (boutons, menu de ligne) aussi. Le centre ne sert qu'aux pastilles catégorielles courtes
  (statut, calibre). ⚠️ `textAlign`/`ta` ne déplace pas un contenu flex (`Group`, `Stack`) :
  aligner aussi son `justify`/`align`, sinon la cellule ne bouge pas à l'écran.
- **Un composant rendu dans un parent flex rend UN seul nœud, jamais un fragment** : chaque
  nœud d'un fragment devient un item flex. `<Num regime>` rendait montant et « HT » en
  fragment ⇒ dans `Group justify="space-between"` le montant tombait au MILIEU et « HT »
  seul au bord droit (corrigé en v0.9.3 : un `span` enveloppe les deux).
- **Ouvrir un PDF dans un onglet quand l'auth passe par un en-tête** (pas de cookie) : un
  lien direct prendrait un 401, donc le PDF se récupère en blob ; mais `window.open` APRÈS
  l'`await` de génération est bloqué comme pop-up (l'activation du clic ne dure qu'environ
  1 s sous Firefox). Ouvrir l'onglet vide AU CLIC, de façon synchrone, avant tout `await`,
  puis y poser l'URL du blob (révocation différée, jamais immédiate). Repli téléchargement si
  l'onglet est bloqué ou sur iOS ; fermer l'onglet si la génération échoue. ⚠️ Un seul `await`
  placé avant l'appel dans le gestionnaire de clic perd le geste, et le repli téléchargement
  masque le défaut en silence.
- **Une règle métier que le serveur connaît ne se recalcule pas dans le front** (héritage,
  taxes, cascades) : le serveur la résout et la sert, le front l'affiche.
- **Une barre à débordement (« Plus (n) ») mesure des onglets FANTÔMES : sa rangée de mesure
  doit recevoir tout ce qui change la LARGEUR** — une classe qui pose `font-weight: 500` sur
  les vrais onglets et pas sur la rangée invisible fait sous-évaluer TOUTES les largeurs, donc
  garder un élément de trop en barre, donc déborder : exactement ce que le composant existe
  pour empêcher. ⚠️ Faire voyager la classe par une prop DÉDIÉE, jamais par le sac d'attributs
  qui porte les ancres (`data-*`) : un `data-tour` dupliqué sur un élément invisible de 0 px
  donne au moteur de visites une cible fantôme — on échangerait un défaut de mesure contre un
  défaut de visite. ⚠️ Et la signature qui déclenche la remesure doit inclure cette classe,
  sinon un changement de style n'est jamais remesuré.
- **Une classe passée en prop et posée sur un composant Mantine entre en CONCURRENCE de
  cascade** : sa racine déclare souvent déjà `position` et `background` à spécificité ÉGALE
  (0,1,0), et `@mantine/core/styles.css` étant importé sans `@layer`, le gagnant ne dépend que
  de l'ORDRE des feuilles. Pour un `sticky` ou un fond opaque, envelopper dans un conteneur NU
  (`<Box className=…>`) plutôt que d'arbitrer cet ordre : les deux issues d'une concurrence
  sont fausses (pas de collage, ou un remplissage de bouton effacé donc une affordance perdue).
  ⚠️⚠️ Et un `sticky` de page se cale **sous l'en-tête fixe**, jamais à `top: 0` : un en-tête `fixed`
  de 56 px à `z-index` élevé range la barre dessous, où elle n'affiche rien — le collage « marche »
  (la position est bien `sticky`) et personne ne le voit. Mesurer avec `elementFromPoint`, pas à l'œil.
  ⚠️ De même, une barre d'onglets tactile porte sa cible de 44 px elle-même : les feuilles de
  hausse tactile couvrent boutons et champs, rarement les onglets.
  ⚠️ Corollaire : un `sticky` ne sort JAMAIS de son parent — posé sur une liste dont le parent
  fait exactement la même hauteur, il n'a aucune course et ne colle pas.
- **Une étape de visite guidée qui vise un élément d'une barre à débordement porte un repli**
  (popover centré) : l'élément part dans le menu « Plus » au BUREAU dès que la largeur manque,
  pas seulement sur mobile — et un garde-fou qui vérifie que l'ancre EXISTE dans les sources
  reste vert pendant que l'étape se saute en silence. ⚠️ Ne pas « réparer » en étalant l'ancre
  sur l'entrée de menu : elle n'existe dans le DOM que menu OUVERT.
- **Un texte de visite guidée qui COMPTE ou ÉNUMÈRE des sections ment dès qu'une section est
  gatée** (rôle, module) : dire ce que fait le contrôle, pas combien il contient. Le risque est
  maximal sur une visite SANS liste de rôles, donc jouable par le profil le plus restreint.

## 3. Tests front

- **`as unknown as T` désarme le typecheck**, et les fixtures d'un client API moqué ne sont pas
  vérifiées contre les types réels : un champ renommé côté API reste vert. Typer les fixtures
  sur les types de l'API.
- **`tsc --noEmit` peut exclure les fichiers de test** selon la configuration : seule
  l'exécution de la suite prouve qu'ils compilent.
- **`vi.mock` d'un module utilitaire doit être partiel** (`importOriginal`) : sinon tout ce que
  le module exporte d'autre devient `undefined` dans le test.
- **`notify.promise(p, { loading, success, error? })`** pour une promesse simple succès/erreur
  (construit sur `loading`/`resolve`, jamais `notifications.promise`) ; l'issue partielle
  (`'warning'`) reste sur `loading`/`resolve`.
- **Tooltip en test happy-dom** : Mantine 9.7 cache toutes les bulles (cibles de taille 0) ;
  poser `hideDetached: false` sur le `Tooltip` du thème de test, sans `env="test"` qui
  désactive les portails.
- **Un garde-fou qu'on n'a jamais vu rougir n'en est pas un** : casser volontairement le code
  protégé, constater le rouge, restaurer. Un test vacueux se propage par copie : corriger tous
  ses frères.
- **Jamais de verdict à travers un pipe** (`npm test | grep …`, `| tail`) : le code de sortie
  est celui du dernier maillon. Lire celui de la commande de test.
- **Un « unhandled error » de Vitest nomme un témoin, pas forcément le coupable** ; un rouge
  intermittent peut venir de la charge machine : rejouer le fichier isolé avant de conclure.
- **Un `setState` hors `act()` n'est pas vidé, donc un banc de performance peut être VACUEUX** :
  un test qui compte les rendus d'une page pendant une rafale d'évènements fabriqués reste VERT
  même après avoir rebranché l'état sur la page hôte. Envelopper le geste dans `act()`, puis
  revoir la mutation ROUGE — sinon le banc n'éprouve rien.
- **Une aide de test qui fabrique un évènement doit poser TOUS les champs que le code lit.** Un
  `TouchEvent` maison sans `clientX` donne un `dx` à `NaN`, et `dy > Math.abs(NaN)` est **faux** :
  toute la logique part dans la branche d'abandon, en silence. Le symptôme est une volée de bancs
  existants qui rougissent sur un code pourtant juste — chercher le champ absent, pas la règle.
- Séparer les tests purs (environnement `node`) des tests qui rendent du DOM : plus rapides,
  et la frontière `.test.ts` / `.test.tsx` se maintient seule.
- Accessibilité : `vitest-axe` sur les composants, passe axe-core sur les écrans ; mesurer le
  mode sombre séparément, le clair corrigé ne dit rien du sombre.

## 4. Revue

- Réviser **avant** de merger. Sur un changement d'écran, rejouer aussi les tests des visites
  guidées ou parcours qui l'ancrent.
- Une affirmation sur les internes d'une lib (Mantine, React Router…) n'entre dans une
  doctrine qu'après mesure : lire la doc à jour, ou écrire le test qui la prouve.

### Tirer-pour-rafraîchir, et la famille de défauts qu'il révèle

Lot A5 de Gradilis Magasin, 2026-10-21 : sept constats, dont quatre sont **génériques**.

- ⚠️⚠️ **`isFetching` n'est pas « l'utilisateur attend quelque chose qu'il a demandé ».** C'est vrai
  au chargement initial ET à chaque page, tri, filtre ou recherche. Un retour visuel câblé dessus
  apparaît donc partout, y compris là où le geste qui le justifie n'existe pas — et il double l'état
  `loading` du bouton d'à côté. Un retour visuel de GESTE se conditionne au geste, jamais à l'état
  de la requête : compter les déclenchements, et n'afficher que la lecture née de l'un d'eux.
- ⚠️⚠️ **Un compteur dans un store de MODULE ne retombe jamais à zéro : seuls ses INCRÉMENTS
  depuis le montage ont un sens.** Lire sa valeur absolue (`triggers > 0`) rouvre exactement le
  défaut précédent par une autre porte — un composant monté plus tard croit hériter du
  déclenchement d'un autre écran. Poser une ligne de base au montage (`useRef(read())`).
- ⚠️⚠️ **Un geste tactile se décide sur un AXE, une seule fois, et ne se rejuge plus.** Appeler
  `preventDefault()` dès que `dy > 0` vole le panning natif pour **toute la séquence** : un
  balayage horizontal dans une table large emporte toujours quelques pixels de dérive verticale,
  et la table devient impossible à parcourir. Verrouiller l'axe à ~8 px (`dy > |dx|`), et traiter
  un ancêtre déjà défilé **horizontalement** (`scrollLeft > 0`) comme un `scrollTop > 0`.
- ⚠️⚠️ **Neutraliser un geste natif se fait en JS (`touchmove` non passif + `preventDefault`),
  jamais en CSS (`overscroll-behavior`).** Si l'application est figée, l'écouteur ne tourne plus et
  le comportement natif REPREND la main : l'échappatoire survit gratuitement. Le CSS, lui, tiendrait
  toujours — et en application installée, sans barre d'adresse, il retirerait le filet au moment
  précis où il sert. Prix à connaître : `{ passive: false }` explicite, les écouteurs tactiles de
  `document` étant passifs par défaut.
- ⚠️ **Une distance qui change à chaque `touchmove` ne passe PAS par l'état de la page hôte** :
  elle vit dans un store de module auquel seul l'indicateur s'abonne (`useSyncExternalStore`).
  Sinon la page entière — table, groupes, tuiles — se re-rend à chaque pixel, sur le seul appareil
  où le geste existe.
- ⚠️ **Les écouteurs posés sur `document` captent aussi ce qui se passe AU-DESSUS** : un
  `[role="dialog"]` présent doit désarmer, sans quoi le geste agit sur la liste cachée dessous.
- ⚠️ **Un garde de source qui lit une balise JSX ne peut pas se contenter de `/<Composant[^>]*prop/`** :
  `[^>]*` ne traverse pas un `>`, donc une prop contenant `=>` écrite avant celle qu'on cherche fait
  sortir le fichier de la population — et l'anti-vacuité reste verte tant que les fichiers
  d'aujourd'hui placent la prop en premier. Lire la balise entière en comptant les accolades.

### Recette NAVIGATEUR — deux sondes qui rendent un faux NÉGATIF silencieux

Les deux ont été payées, et l'erreur se lit comme un défaut du PRODUIT, pas de la sonde.

- **Patcher `window.fetch` ne voit AUCUNE requête d'une app en axios** (donc
  `XMLHttpRequest`) : la sonde rend une liste vide, qui se lit « le bouton ne fait rien ».
  Mesurer le réseau par l'écouteur du navigateur (`page.on('request')`), qui voit les deux
  transports — jamais par un patch du client HTTP.
- **Chercher un libellé d'ÉTAT ne prouve pas la présence d'un composant** : une brique de
  fraîcheur affiche « à jour à l'instant » juste après une lecture (pas « il y a N min »), et
  son bouton peut être une icône SANS texte. Mesurer la présence par le **nom accessible**
  (`button[aria-label="…"]`), qui ne dépend pas de l'état.
- **Avant de rapporter une ABSENCE, poser la contre-épreuve** là où la chose est censée être :
  une sonde muette et une fonctionnalité manquante se ressemblent trait pour trait.
