# Donjon DSL — Monde : Structure, Lieux, Objets, Portes

---

## 1. Structure d'un scénario

Un scénario est un fichier texte composé de **phrases** séparées par des points.

Les commentaires commencent par `--` et vont jusqu'à la fin de la ligne. Ils peuvent être :

- sur une ligne entière (`-- ceci est un commentaire`)
- en fin de ligne après une instruction (`Le héros est un objet. -- inline`)

Un `--` à l'intérieur d'une chaîne `"…"` n'est **pas** un commentaire — il fait partie du texte. Un commentaire de fin de ligne termine aussi la phrase courante si celle-ci n'était pas déjà terminée par `.` ou `:`, ce qui évite que l'instruction suivante soit absorbée par la précédente.

```
-- Ceci est un commentaire.

Le titre du jeu est "Mon jeu".
L'auteur du jeu est "Anonyme".
Les auteurs du jeu sont "Alpha et Beta".   -- variante pluriel

-- UUID unique identifiant le jeu sur les sites de fictions interactives.
-- Généré automatiquement par l'éditeur Donjon.
L'identifiant du jeu est "d0f16bc4-aa40-43f7-ba59-2b6909ba28d4".

-- Champs optionnels
Le titre du site web est "donjon.fi".
Le lien du site web est "https://donjon.fi/".
Le titre de la licence est "MIT".
Le lien de la licence est "https://opensource.org/licenses/MIT".
```

> Titre, auteur et identifiant sont **optionnels** — un scénario sans ces lignes est jouable.

---

## 2. Lieux

```
Le salon est un lieu.
Sa description est "Vous êtes dans un salon confortable.".
Son titre est "Le grand salon".   -- optionnel, sinon le nom est utilisé

-- Sans description, le moteur génère une description par défaut :
-- « Vous êtes dans le salon. »

-- Lieu féminin : (f) nécessaire seulement si le déterminant est ambigu (l')
L'entrée (f) est un lieu.          -- (f) requis : "l'" est ambigu
La cuisine est un lieu.            -- (f) inutile : "La" indique déjà le féminin
Sa description est "Une cuisine bien équipée.".

-- Les retours à la ligne dans le texte sont pris en compte par le moteur.
Le grenier est un lieu.
Sa description est "Un grenier poussiéreux.
Des caisses s'empilent jusqu'au plafond.".

-- Lieu avec plusieurs positions
La forêt se trouve au nord du carrefour et à l'est du village.
```

### Directions disponibles

| Syntaxe DSL          | Direction   |
|----------------------|-------------|
| `au nord de X`       | nord        |
| `au nord-est de X`   | nord-est    |
| `à l'est de X`       | est         |
| `au sud-est de X`    | sud-est     |
| `au sud de X`        | sud         |
| `au sud-ouest de X`  | sud-ouest   |
| `à l'ouest de X`     | ouest       |
| `au nord-ouest de X` | nord-ouest  |
| `en haut de X`       | monter      |
| `en bas de X`        | descendre   |
| `à l'intérieur de X` | entrer      |
| `à l'extérieur de X` | sortir      |

Les connexions sont **bidirectionnelles** automatiquement.

---

## 3. Objets

```
-- Objet simple
La pomme est un objet ici.
Sa description est "Une pomme rouge et luisante.".

-- Genre féminin : (f) nécessaire seulement si le déterminant est ambigu (l')
L'épée (f) est un objet ici.      -- (f) requis : "l'" est ambigu
La clé est un objet ici.          -- (f) inutile : "La" indique déjà le féminin

-- Pluriel : déduit automatiquement du déterminant ("les" → pluriel)
Les pièces d'or sont un objet ici.   -- pluriel automatique, ne pas ajouter "sont plurielles"

-- Localisation : "ici" et "dans [lieu]" sont mutuellement exclusifs
-- "ici" dans une définition = dernier lieu défini avant cette ligne
-- "ici" dans une routine (règle/action) = lieu où se trouve actuellement le personnage
-- "dans [lieu]" = lieu nommé explicitement (utilisable partout)
La pomme est un objet ici.            -- correct
Le livre est un objet dans le salon.  -- correct
-- INCORRECT : La pomme est un objet ici dans le salon.

-- Objet dans un lieu précis
Le livre est un objet dans le salon.

-- Objet dans un contenant
La pièce est un objet dans le coffre.

-- Objet sur un support
Le vase est un objet sur la table.

-- Objet avec aperçu (texte affiché lors du "regarder" du lieu)
Le magazine est un objet ici.
Son aperçu est "[initialement]Un magazine traîne sur le sol.[fin choix]".
```

### Classes d'objets courantes

| Classe       | Description                          |
|--------------|--------------------------------------|
| `objet`      | objet générique                      |
| `contenant`  | peut contenir d'autres objets        |
| `support`    | les objets se posent dessus/dessous  |
| `ressource`  | objet quantifiable et consommable, avec une unité (voir §5) |
| `porte`      | obstacle spécial (ouvrable/fermable) |
| `obstacle`   | bloque une sortie                    |
| `personne`   | personnage vivant                    |
| `animal`     | animal                               |
| `vivant`     | personne ou animal                   |

Hiérarchie : `porte → obstacle → objet → élément → concept → intitulé` · `ressource → objet`

### Classes personnalisées

Les classes sont **créées automatiquement** lorsqu'on les utilise dans une définition.
Par défaut, une classe nouvellement rencontrée hérite d'`objet`, sauf si une autre filiation est déclarée explicitement.

```
-- Création implicite : "parchemin" est créé automatiquement et hérite d'objet
Le parchemin de feu est un parchemin dans la bibliothèque.
Sa description est "Un parchemin gravé d'une rune flamboyante.".
Son texte est "Rune de feu : pointe la cible et prononce « Ignis ».".

-- Filiation explicite (à déclarer avant la première utilisation)
Un parchemin est un objet.            -- équivalent au comportement par défaut
Un familier est un animal.            -- hérite d'animal au lieu d'objet
Un sortilège est un concept.          -- hérite directement de concept (pas d'objet)
```

Une fois la classe utilisée, on peut tester l'appartenance dans une condition :

```
si ceci n'est pas un parchemin, refuser "Ce n'est pas un parchemin de sort.".
si cela est un familier, dire "Le familier ronronne.".
```

---

## 4. Portes et obstacles

### Porte

Une porte bloque une sortie directionnelle. Elle est toujours associée à un lieu cible dans la même direction.

```
-- Porte ouverte (passage libre)
La porte en bois est une porte ouverte à l'est du salon.
Le couloir est un lieu à l'est du salon.

-- Porte fermée (bloque le passage)
La grille de fer est une porte fermée à l'ouest du salon.
La réserve est un lieu à l'ouest du salon.

-- Porte verrouillée (fermée + ne peut pas être ouverte sans clé)
La porte cadenassée est une porte fermée et verrouillée au sud du salon.
La cave est un lieu au sud du salon.

-- Porte invisible (ne s'affiche pas dans "regarder", mais existe)
La porte secrète est une porte invisible et fermée au nord du salon.
Le passage secret est un lieu au nord du salon.

-- Porte invisible et ouverte (passage silencieux)
La trappe est une porte invisible et ouverte en bas du salon.
Le sous-sol est un lieu en bas du salon.
```

### Obstacle (non-porte)

Un obstacle bloque une sortie sans être une porte (ne peut pas être ouvert).

```
Le rocher est un obstacle au nord de la clairière.
La clairière nord est un lieu au nord de la clairière.
```

### Affichage des obstacles dans les sorties

Par défaut, les sorties obstruées affichent `({/obstrué/})` et les sorties avec porte invisible fermée affichent `({/pas d'accès/})`.

```
-- Désactiver cet affichage
désactiver affichage des obstacles.
```

---

## 5. Ressources (objets quantifiables)

Une **ressource** est un objet que l'on accumule en quantité variable (argent, bois, essence, fruits…). Elle hérite d'`objet` : on la prend, la pose, la donne, la mange… mais en **quantités**.

### Définir une ressource

```
Le bois est une ressource.
Les fruits sont une ressource.
```

### Unité de comptage (optionnelle)

Selon la déclaration, sans unité explicite :

- ressource **au pluriel** (« Les fruits ») → comptée par son nom : « 5 fruits » ;
- ressource **au singulier / massif** (« Le bois ») → unité par défaut « unité(s) » : « 30 unités de bois ».

Trois façons de déclarer une unité explicite (le moteur en dérive singulier et pluriel) :

```
L'argent est une ressource exprimée en pièces.   -- unité donnée au pluriel
L'eau est une ressource avec l'unité litre.        -- unité donnée au singulier
Le sable est une ressource.
Son unité est le grain.                            -- séparément, après la définition
```

**Genre de l'unité** — l'unité a son propre genre grammatical (« pièce » est féminin), qui peut différer de celui de la ressource (« or » masculin). Il sert aux accords des messages (« 3 pièces d'or **ont été ajoutées** »). Par défaut **masculin** ; déduit de l'article (`la`→féminin, `le`→masculin) quand il est présent ; ou forcé avec le marqueur `(f)` / `(m)` :

```
L'or est une ressource exprimée en pièces (f).    -- marqueur explicite
Le minerai est une ressource. Son unité est la pépite.   -- déduit de « la » → féminin
L'eau est une ressource avec l'unité litre (m).   -- masculin (défaut, ici explicite)
```

### Placer des quantités

Les nombres s'écrivent en **chiffres**. Positions : `ici`, `dans …`, `sur …`, `sous …`.

> **« Il y a … » est réservé aux ressources.** L'instruction `Il y a N X …` exige que `X` soit une **ressource déjà définie** (reconnue au singulier comme au pluriel : `Il y a 1 fruit` place 1 unité de la ressource `fruits`). Si `X` n'est pas une ressource, c'est une **erreur d'auteur** : pour un objet ordinaire, utilisez plutôt `X est un objet ici` (ou `… dans/sur/sous …`).

```
Il y a 30 unités de bois ici.
Il y a 5 pièces d'argent dans le coffre.
Il y a 3 unités d'essence sous la table.
Il y a 1 fruit ici.                       -- singulier accepté → ressource « fruits »
```

Une même ressource peut former **plusieurs piles indépendantes** :

```
Il y a 5 pièces d'argent dans le coffre.
Il y a 3 pièces d'argent sur la table.   -- deux piles distinctes : 5 et 3
```

> Une ressource déclarée mais jamais placée vaut **0** : le type existe, mais il n'y en a pas dans le monde tant qu'on n'en place pas.

### Affichage

Le moteur affiche la quantité avec l'unité : « 30 unités de bois », « 5 pièces d'argent » (élision automatique), ou « 5 fruits » quand la ressource se compte par son nom.

### Commandes du joueur

Les commandes standard acceptent une quantité et l'unité. Le joueur désigne la ressource par son **unité** (« les pièces ») ou par « unité de ressource » (« les pièces d'argent ») pour lever une ambiguïté.

```
prendre les pièces             -- prend toute la pile
prendre 3 pièces d'argent      -- quantité précise
manger 5 fruits
donner 3 pièces d'argent au marchand
lâcher les pièces
déposer 2 fruits sur la table  -- « déposer » = synonyme de « poser »
```

### Manipuler les ressources dans les règles (instructions)

Dans les règles, réactions et routines, on agit sur les ressources par script :

```
-- créer N unités à un emplacement (contenant, support, lieu, inventaire)
créer 3 pièces d'argent dans le coffre.
créer 3 unités d'argent dans l'inventaire.

-- consommer N unités possédées (les fait disparaître de l'inventaire)
consommer 5 unités d'essence.

-- déplacer d'un emplacement à un autre (« les … » = toute la pile)
déplacer les pièces d'argent depuis l'intérieur du coffre vers l'inventaire.
déplacer 5 unités d'argent depuis l'inventaire vers le dessous du lit.
```

Emplacements reconnus : `l'inventaire`, `l'intérieur du <contenant>`, `le dessus du <support>`, `le dessous du <support>`, ou un lieu / contenant / support nommé.

### Afficher une ressource dans le cartouche

Une ressource s'affiche dans le cartouche (la barre fixe du lecteur) comme un compteur. La quantité affichée est calculée **en direct** : prendre, lâcher, consommer ou créer la ressource met le cartouche à jour automatiquement.

```
L'argent est une ressource exprimée en pièces.

-- Afficher dans un coin (haut/bas + gauche/droite ; « en haut » et « droite » par défaut)
L'argent est affiché en haut à droite.
Le bois est affiché en bas à gauche.

-- Périmètre compté (mot-clé optionnel après le nom)
L'argent possédé est affiché en haut à droite.    -- piles de l'inventaire du joueur (défaut)
Le bois disponible est affiché en bas à gauche.    -- tout SAUF l'inventaire du joueur (lieux, coffres, PNJ…)

-- Options : masquer l'intitulé et/ou l'unité
L'argent est affiché en haut à droite sans intitulé.
L'argent est affiché en haut à droite sans unité.
L'argent est affiché en haut à droite sans intitulé sans unité.

-- Modifier l'affichage EN COURS DE PARTIE (dans une règle/action/réaction)
changer l'argent est affiché en bas à gauche.            -- repositionner (et/ou changer les options)
changer l'argent est affiché en haut à droite sans intitulé.
changer l'argent n'est plus affiché.                     -- retirer du cartouche
```

Notes :
- À l'exécution, `changer … est affiché …` sur une ressource encore jamais affichée **crée** l'entrée (périmètre `possédé`). À chaque réaffichage, les options « sans X » sont réinitialisées (les redéclarer pour les conserver). Le périmètre possédé/disponible se choisit à la définition, pas via `changer`.
- Sans mot-clé, le périmètre est **possédé** (ce que le joueur transporte). `possédé` et `disponible` sont complémentaires : leur somme couvre toutes les piles de la ressource, sans recouvrement.
- L'unité s'accorde automatiquement (singulier si la quantité vaut 0 ou 1, pluriel sinon). Une pile illimitée affiche « ∞ ».
- L'entrée du cartouche reste affichée même quand la quantité tombe à 0 (elle affiche « 0 », elle ne disparaît pas).
- Le périmètre est **direct** (comme `consommer`) : une pile rangée dans un sac porté par le joueur compte comme `disponible`, pas comme `possédé`.
