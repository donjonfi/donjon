# Donjon DSL — Monde : Structure, Lieux, Objets, Portes

---

## 1. Structure d'un scénario

Un scénario est un fichier texte composé de **phrases** séparées par des points.  
Les commentaires commencent par `--`.

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
| `porte`      | obstacle spécial (ouvrable/fermable) |
| `obstacle`   | bloque une sortie                    |
| `personne`   | personnage vivant                    |
| `animal`     | animal                               |
| `vivant`     | personne ou animal                   |

Hiérarchie : `porte → obstacle → objet → élément → concept → intitulé`

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
