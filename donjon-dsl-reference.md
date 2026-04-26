# Référence DSL Donjon FI (v3)

> Document destiné aux IAs pour générer du code Donjon FI correct.  
> Donjon FI est un moteur de fiction interactive en **français**.  
> La syntaxe est du français naturel structuré, chaque phrase se termine par un point.

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

## 5. États des éléments

Les états se déclarent directement dans la définition ou via `changer`.

### États courants

Les états marqués *(calculé)* sont gérés automatiquement par le moteur et ne peuvent pas être appliqués directement.  
`↔` = bascule : appliquer l'un retire l'autre.

#### Visibilité et accès

| État             | Opposé          | Description                                                        |
|------------------|-----------------|--------------------------------------------------------------------|
| `visible`        | `invisible`     | *(calculé)* visible pour le joueur                                |
| `invisible`      | —               | non décrit, non proposé ; peut interagir en tant que concept      |
| `secret`         | —               | invisible, non proposé, jamais décrit automatiquement             |
| `caché`          | —               | visible seulement si le joueur regarde dans le contenant          |
| `discret`        | —               | présent mais non décrit automatiquement                           |
| `accessible`     | `inaccessible`  | *(calculé)* le joueur peut toucher l'objet                        |
| `couvert`        | —               | non visible (recouvert par un autre objet)                        |
| `présent`        | `absent`        | *(calculé)* l'objet est dans le lieu du joueur                    |
| `possédé`        | —               | *(calculé)* l'objet est dans l'inventaire du joueur               |
| `disponible`     | —               | *(calculé)* présent mais non possédé                              |
| `porté`          | —               | *(calculé)* le joueur porte l'objet sur lui (vêtement)            |

#### Connaissance du joueur

| État         | Description                                                                       |
|--------------|-----------------------------------------------------------------------------------|
| `mentionné`  | *(calculé)* le joueur sait que l'objet existe (peut interagir avec)              |
| `vu`         | *(calculé)* le joueur a vu l'objet (implique mentionné)                          |
| `connu`      | *(calculé)* le joueur a manipulé l'objet (déterminant défini : « le/la »)        |
| `visité`     | *(calculé)* le joueur a déjà visité ce lieu                                      |

#### Ouverture et verrouillage

| État           | Opposé          | Description                              |
|----------------|-----------------|------------------------------------------|
| `ouvert`       | `fermé` ↔       | porte/contenant ouvert                   |
| `fermé`        | `ouvert` ↔      | porte/contenant fermé                    |
| `ouvrable`     | —               | peut être ouvert par le joueur           |
| `verrouillé`   | `déverrouillé` ↔| ne peut pas être ouvert sans clé         |
| `verrouillable`| —               | peut être verrouillé                     |
| `opaque`       | `transparent` ↔ | contenant : on ne voit pas l'intérieur   |

#### Comportement physique

| État              | Opposé         | Description                                              |
|-------------------|----------------|----------------------------------------------------------|
| `intact`          | `déplacé` ↔    | objet non encore déplacé/modifié par le joueur           |
| `déplacé`         | `intact` ↔     | objet déplacé de sa position initiale                    |
| `modifié`         | `intact`       | objet modifié (implique non intact)                      |
| `portable`        | —              | le joueur peut le porter sur lui (se vêtir)              |
| `mangeable`       | —              | peut être mangé                                          |
| `buvable`         | —              | peut être bu                                             |
| `décoratif`       | —              | fixe, le joueur ne peut pas l'emporter                   |
| `dénombrable`     | `indénombrable`↔| l'objet est comptable (une épée, des épées)             |

#### Lumière

| État       | Opposé      | Description                               |
|------------|-------------|-------------------------------------------|
| `allumé`   | `éteint` ↔  | source de lumière active (lampe, bougie)  |
| `éteint`   | `allumé` ↔  | source de lumière inactive               |
| `éclairé`  | —           | lieu ou contenant éclairé                |
| `clair`    | `obscur` ↔  | lieu : lumineux                          |
| `obscur`   | `clair` ↔   | lieu : sombre                            |

#### Personnages

| État       | Opposé      | Description                              |
|------------|-------------|------------------------------------------|
| `parlant`  | `muet` ↔    | peut répondre à "parler à"               |
| `muet`     | `parlant` ↔ | ne peut pas parler                       |
| `actionné` | `arrêté` ↔  | appareil/machine en marche               |
| `arrêté`   | `actionné` ↔| appareil/machine à l'arrêt              |

```
-- Déclarer un état dans la définition
La lampe est un objet éteint ici.
Le coffre est un contenant fermé ici.         -- fermé, mais le joueur NE PEUT PAS l'ouvrir
Le coffre est un contenant ouvrable et fermé ici.  -- le joueur PEUT l'ouvrir

-- Changer un état dans une action/règle
changer la lampe est allumée.
changer la lampe n'est plus éteinte.
changer le coffre est ouvert.
```

---

## 6. Propriétés

### Propriétés intégrées

```
Sa description est "texte".       -- affiché lors de "examiner"
Son aperçu est "texte".           -- affiché lors du "regarder" du lieu (remplace la mention automatique)
Son titre est "texte".            -- optionnel, remplace le nom dans les titres
Son texte est "texte".            -- affiché lors de "lire"
La quantité de X est 3.           -- pour les objets quantifiables
```

### Propriétés personnalisées

Vous pouvez définir vos propres propriétés sur n'importe quel objet ou lieu.

- `est` → propriété de type **texte**
- `vaut` → propriété de type **nombre**

```
-- Définir des propriétés personnalisées
L'épée est un objet portable sur l'étale.
Son prix vaut 45.
Sa couleur est "bronze".

-- Syntaxe alternative (utile pour définir après déclaration)
Le prix du bouclier en bois vaut 10.
La couleur du bouclier en bois est "brun".
```

### Afficher une propriété dans un texte

```
[p prix ceci]          -- valeur numérique de la propriété "prix" de ceci
[p prix la hache]      -- valeur numérique de la propriété "prix" de la hache
[c score]              -- valeur du compteur "score" (voir §17)

-- Exemple avec accord automatique du pluriel
dire "[intitulé ceci] coûte [p prix ceci] pièce[s prix ceci] d'or.".

-- Test de l'existence d'une propriété dans un texte dynamique
dire "[si aucun prix pour ceci]sans prix[sinon][p prix ceci] pièces[fin si]".
```

---

## 7. Paramètres du jeu

La syntaxe est `activer X.` ou `désactiver X.` en dehors de toute action ou règle.

```
-- Affichage (activés par défaut)
désactiver affichage des sorties.
désactiver affichage des directions des sorties.
désactiver affichage des sorties en ligne.
désactiver affichage des obstacles.
désactiver description des objets sur les supports.

-- Affichage (désactivés par défaut)
activer affichage des lieux inconnus.

-- Comportement (activés par défaut)
désactiver synonymes automatiques.
désactiver remplacement de la destination des déplacements.
désactiver attendre.

-- Comportement (désactivés par défaut)
activer audio.
activer choix numériques.

-- Actions de base (chargées par défaut, déclare si inclus dans le scénario)
désactiver actions de base.
```

---

## 8. Synonymes et interprétations

```
-- Noms alternatifs pour un objet (définis à la compilation)
Interpréter la table comme la table basse.
Interpréter le coffre comme le coffre du capitaine.

-- Synonymes d'actions
interpréter déchirer et détruire comme casser.
interpréter fouiller comme examiner.
```

### Synonymes automatiques

Par défaut, le moteur génère automatiquement des synonymes à partir des mots de l'intitulé d'un objet.
Exemple : « la boîte rouge » génère les synonymes `boite` et `rouge`.

Ces synonymes sont recalculés automatiquement quand l'intitulé est changé via `changer l'intitulé de xxx est "…"`.

### Modifier les synonymes en cours de partie

```
-- Ajouter des synonymes sans effacer les existants
ajouter "coffre" et "vieux" aux synonymes de ceci.
ajouter "coffre", "grand" et "vieux" aux synonymes de ceci.
ajouter "caisse" aux synonymes de la boîte rouge.

-- Remplacer tous les synonymes d'un élément (auto ET explicites)
changer les synonymes de ceci sont "coffre" et "vieux".
changer les synonymes de ceci sont "coffre", "grand" et "vieux".

-- Fonctionne aussi sur un élément nommé
changer les synonymes de la boîte rouge sont "caisse" et "rouge".
```

> Les synonymes définis ainsi ne sont **pas** recalculés automatiquement lors d'un prochain changement d'intitulé — sauf si `activerSynonymesAuto` est activé, auquel cas `changer l'intitulé de xxx est "…"` écrase à nouveau les synonymes.

---

## 9. Actions personnalisées

### Action simple (sans phases)

```
action sauter:
  dire "Vous sautez sur place.".
fin action
```

### Action complète (avec phases)

```
action pousser ceci:

  phase prérequis:
    si ceci n'est pas accessible, refuser "Je n'y ai pas accès.".

  phase exécution:
    changer ceci est déplacé.

  phase épilogue:
    dire "Je [l' ceci]ai poussé[es ceci] mais ça n'a servi à rien.".

fin action
```

### Phases d'une action (dans l'ordre d'exécution)

1. `phase prérequis` — conditions ; peut appeler `refuser "message".` pour bloquer l'action
2. `phase exécution` — logique principale
3. `phase épilogue` — toujours exécuté (même si l'action a été refusée)

### Action avec 1 complément (ceci)

```
action examiner ceci:
  définition:
    ceci est un objet visible.
  phase prérequis:
    si ceci n'est pas visible, refuser "Je ne le vois pas.".
  phase exécution:
    dire "[description ceci]".
fin action
```

### Action avec 2 compléments (ceci et cela)

```
action utiliser ceci sur cela:
  définitions:
    ceci est un objet visible et accessible.
    cela est un objet visible et accessible.
  phase épilogue:
    dire "Vous utilisez [intitulé ceci] sur [intitulé cela].".
fin action
```

### `définition` / `définitions` : types de cibles

```
ceci est un objet.
ceci est un objet visible.
ceci est un objet vu et visible.
ceci est prioritairement possédé.    -- cherche d'abord dans l'inventaire
ceci est prioritairement disponible. -- cherche d'abord hors inventaire
ceci est un intitulé.                -- n'importe quel élément ou direction
ceci est une direction.
ceci est un lieu.
```

### Action qui déplace le joueur

En ajoutant `L'action déplace le joueur vers ceci.` dans les définitions, les variables `origine`, `destination` et `orientation` sont disponibles dans les règles.

```
action aller vers ceci:

  définitions:
    ceci est un lieu.
    L'action déplace le joueur vers ceci.

  phase prérequis:
    si le joueur se trouve dans ceci, refuser "Vous y êtes déjà.".

  phase exécution:
    déplacer le joueur vers ceci.

  phase épilogue:
    exécuter l'action regarder.

fin action
```

---

## 10. Règles (avant / après)

```
-- Avant une action (peut l'empêcher)
règle avant prendre la pomme:
  si la pomme est pourrie:
    refuser "Cette pomme est pourrie.".
  sinon
    continuer l'action.
  fin si
fin règle

-- Après une action
règle après prendre la pomme:
  si la règle se déclenche pour la première fois:
    dire "Vous saisissez la pomme royalement.".
  sinonsi la règle se déclenche pour la deuxième fois:
    dire "Encore une pomme...".
  sinon
    continuer l'action.
  fin si
fin règle

-- Déclencheurs combinés (ou)
règle après donner l'anneau au roi, donner l'anneau au prince ou donner l'anneau à la reine:
  dire "<< Grâce à vous le royaume est sauvé ! >>".
fin règle

-- Déclencheur générique (sur une classe d'objet)
règle après parler à un chien:
  dire "<< Wouf ! >>".
fin règle

-- Déclencheur : commencer le jeu
règle avant commencer le jeu:
  changer le joueur possède la lampe.
  changer la porte est déverrouillée.
fin règle
```

### Tester si la règle s'est déjà déclenchée

```
si la règle se déclenche pour la première fois:
si la règle se déclenche pour la deuxième fois:
si la règle ne se déclenche pas pour la première fois:
```

---

## 11. Instructions courantes

### Affichage

```
dire "texte simple".
dire "Bonjour [intitulé ceci] !".    -- avec balise dynamique
```

### Conditions

```
si X est Y:
  ...
fin si

si X est Y:
  ...
sinon
  ...
fin si

si X est Y:
  ...
sinonsi X est Z:
  ...
sinon
  ...
fin si

-- Sur une seule ligne
si ceci est ouvert, dire "C'est ouvert.".
si ceci n'est pas visible, refuser "Je ne le vois pas.".
```

### Changements d'état et de propriétés

```
changer X est ouvert.
changer X n'est plus fermé.
changer X est invisible.
changer le joueur se trouve dans le salon.
-- place l'objet dans l'inventaire du joueur
changer le joueur possède la lanterne.
-- renomme l'objet (recalcule les synonymes automatiques)
changer l'intitulé du coffre est "un vieux coffre".

-- Propriétés numériques
changer la quantité de X diminue de 1.
changer la quantité de X augmente de 2.
changer le score vaut 100.
changer le score augmente de 10.
changer le score diminue de 5.
```

### Déplacement

```
déplacer le joueur vers le nord.
déplacer X dans le salon.
-- retire X du jeu
effacer X.
```

### Exécution

```
exécuter la commande "regarder".
exécuter l'action regarder.
exécuter routine nomDeLaRoutine.
exécuter la routine nomDeLaRoutine dans 10 secondes.
refuser "Message.".
continuer l'action.
arrêter l'action.
terminer le jeu.
```

---

## 12. Balises dynamiques dans `dire`

```
[intitulé ceci]          -- "la pomme", "le coffre"...
[Intitulé ceci]          -- majuscule : "La pomme"
[description ceci]       -- description de l'objet
[aperçu ceci]            -- aperçu de l'objet
[statut ceci]            -- statut (ouvert/fermé) d'une porte ou contenant
[sorties ici]            -- liste des sorties du lieu actuel
[titre ici]              -- titre du lieu actuel
[obstacle vers ceci]     -- description de l'obstacle dans la direction ceci
[décrire objets dans X]  -- liste les objets dans le contenant X
[décrire objets sur X]   -- liste les objets sur le support X
[lister objets inventaire]

-- Mentions : empêchent la liste automatique de l'objet dans le lieu
[@nom de l'objet]        -- vu + mentionné (objet actuellement visible dans le lieu)
[#nom de l'objet]        -- mentionné uniquement (objet pas forcément visible)
[&nom de l'objet]        -- connu + vu + mentionné (objet déjà connu du joueur)

-- Propriétés et compteurs
[p prix ceci]            -- valeur de la propriété numérique "prix" de ceci
[p poids le sac]         -- valeur de la propriété numérique "poids" du sac
[c score]                -- valeur du compteur "score"
[s score]                -- "s" si la valeur du compteur est ≠ 1 (accord pluriel)

-- Listes
[lister maListe]         -- liste les éléments de la liste (intitulés)
[décrire maListe]        -- décrit les éléments de la liste (descriptions)
[énumérer maListe]       -- énumère les éléments de la liste

-- Accord grammatical
[pronom ceci]            -- "il", "elle", "ils", "elles"
[Pronom ceci]            -- majuscule
[le ceci]                -- "le", "la", "l'", "les"
[l' ceci]                -- "l'" si possible, sinon "le"/"la"
[es ceci]                -- "e" ou "es" selon genre/nombre
[s ceci]                 -- "s" si pluriel
[accord ceci]            -- "e" si féminin

-- Verbes conjugués
[v être ipr ceci]        -- conjugaison de "être" à l'indicatif présent
[v être ipr pas ceci]    -- forme négative
[v avoir spr ceci]       -- subjonctif présent
```

---

## 13. Balises de mise en forme dans les textes

```
{n}   -- saut de ligne
{N}   -- saut de ligne conditionnel (ignoré s'il n'est pas suivi de texte)
{p}   -- nouveau paragraphe
{U}   -- retour à la ligne (style liste)
{e}   -- espace forcé en début ou fin de texte (évite que les espaces soient supprimés)
{i}   -- espace insécable (empêche une coupure de ligne à cet endroit)

{*texte*}    -- gras
{/texte/}    -- italique
{_texte_}    -- souligné
{+texte+}    -- surligné / mis en valeur
{-texte-}    -- commande (style monospace)
{=texte=}    -- barré

-- Conditions et choix dans les textes
[si X est Y]...[sinon]...[fin si]

-- Affichage selon le nombre de fois que le texte a été rencontré
[1ère fois]texte[fin]
[1ère fois]texte A[2e fois]texte B[puis]texte suite[fin]
[3e fois]texte rare[sinon]texte habituel[fin]

-- Texte aléatoire
[au hasard]texte A[ou]texte B[ou]texte C[fin]

-- Rotation (en boucle)
[en boucle]texte 1[puis]texte 2[puis]texte 3[fin]

-- Selon l'état intact de l'objet
[initialement]texte si intact[fin]
[initialement]texte si intact[puis]texte si modifié/déplacé[fin]
```

---

## 14. Positions du joueur

```
-- Le joueur démarre dans le premier lieu défini par défaut.
-- Cette instruction n'est utile que lorsqu'il y a plusieurs lieux
-- et que le lieu de départ n'est pas le premier déclaré.
Le joueur se trouve dans le salon.
```

---

## 15. Exemple complet minimal

```
-- Informations
Le titre du jeu est "La maison mystérieuse".
L'auteur du jeu est "Anonyme".

-- Lieux
Le hall est un lieu.
Sa description est "Un hall d'entrée sombre.".

Le salon est un lieu au nord du hall.
Sa description est "Un salon poussiéreux.".

La cave est un lieu en bas du hall.
Sa description est "Une cave humide et froide.".

-- Connexion avec porte
La porte du salon est une porte fermée au nord du hall.

-- Obstacle vers la cave
La trappe clouée est un obstacle en bas du hall.

-- Objet
La bougie est un objet ici.
Sa description est "Une bougie à moitié consumée.".

-- Action personnalisée
action allumer la bougie:
  phase prérequis:
    si la bougie n'est pas dans l'inventaire, refuser "Je n'ai pas la bougie.".
  phase exécution:
    changer la bougie est allumée.
    dire "Vous allumez la bougie. La flamme vacille.".
fin action
```

---

## 17. Routines simples

Une routine simple est un bloc d'instructions réutilisable, appelable depuis n'importe quelle action ou règle.

```
routine remercier:
  dire "« Merci et à bientôt ! »".
fin routine

action acheter:
  dire "Vous achetez l'objet.".
  exécuter routine remercier.
fin action
```

---

## 18. Réactions (personnages)

Les réactions permettent aux personnages de répondre quand le joueur leur parle.

```
Le berger est une personne.

réactions du berger:
  concernant la brebis:
    dire "Elle s'est perdue. Il faut absolument la retrouver avant la tombée de la nuit !".

  -- se déclenche si le joueur parle d'un sujet non prévu
  concernant un sujet inconnu:
    dire "Il faut se concentrer sur ma brebis.".

  -- se déclenche si le joueur parle sans préciser de sujet
  basique:
    dire "J'ai égaré ma brebis. Je vous prie de m'aider à la retrouver !".
fin réactions

-- Réaction basique unique (forme courte, sans étiquette)
Le chien est un vivant parlant.
réaction du chien:
  dire "Le chien vous a mordu ! Vous lui avez fait peur.".
  changer le joueur est mordu.
fin réaction
```

---

## 19. Mémoire : compteurs

```
-- Définir un compteur
Le score est un compteur.
La vie est un compteur initialisé à 100.
La bourse est un compteur avec l'unité pièce.                  -- unité affichée à côté de la valeur
La bourse est un compteur initialisé à 100 avec l'unité pièce.
La bourse est un compteur avec l'unité pièce initialisé à 100. -- ordre indifférent

-- Afficher dans un coin de l'écran
La vie est affichée en haut à droite.
Le score est affiché en haut à gauche.
Les vies sont affichées en bas à droite.
La bourse est affichée en bas à gauche.
-- Positions : haut/bas + gauche/droite (sans direction latérale → droite par défaut)
-- « en haut » est sous-entendu si omis :
La bourse est affichée.              -- équivalent à « affichée en haut à droite »
Le score est affiché à gauche.       -- équivalent à « affiché en haut à gauche »

-- Référence par pronom personnel au dernier élément défini
Le score est un compteur initialisé à 0.
Il est affiché en haut.                       -- équivalent à "Le score est affiché en haut."
La bourse est un compteur initialisé à 100.
Elle est affichée en bas à gauche.
Les vies sont un compteur initialisé à 3.
Elles sont affichées en bas à droite.

-- Options d'affichage : masquer l'intitulé et/ou l'unité
La bourse est affichée en haut à droite sans intitulé.
La bourse est affichée en haut à droite sans unité.
La bourse est affichée en haut à droite sans intitulé sans unité.
La bourse est affichée en haut à droite sans intitulé et sans unité. -- « et » optionnel

-- Afficher la valeur dans un texte dynamique
dire "Votre score est de [c score].".
dire "Votre bourse contient [c bourse] pièce[s bourse] d'or.".  -- [s X] → "s" si valeur ≠ 1

-- Modifier (valeur fixe)
changer le score augmente de 10.
changer le score diminue de 5.
changer le score vaut 100.

-- Modifier (valeur d'une propriété)
changer le total augmente du prix de l'épée d'argent.
changer la bourse diminue du prix de ceci.
changer la luminosité d'ici vaut la luminosité de la lampe.

-- Tester (égalité)
si le score vaut 100, dire "Score parfait !".
si le score ne vaut pas 100, dire "Il y a moyen de faire mieux.".

-- Tester (comparaison)
si le score est supérieur à 50, dire "Bonne progression.".
si le score est inférieur à 10, dire "Attention, score bas.".
si le score n'atteint pas 10, dire "Vous ferez mieux la prochaine fois !".  -- strictement inférieur
si le prix de ceci ne dépasse pas la bourse, dire "Vous pouvez l'acheter.".  -- inférieur ou égal
```

---

## 20. Mémoire : listes et historique

```
-- Définir une liste
Les suspects sont une liste.
L'historique est une liste.

-- Modifier une liste
changer les suspects contiennent le majordome.
changer les suspects ne contiennent plus le majordome.
vider les suspects.

-- Tester
si les suspects contiennent le majordome:
  dire "Le majordome est suspect.".
fin si

-- Historique : même syntaxe avec des chaînes de texte
changer l'historique contient "grotte visitée".
changer l'historique ne contient plus "grotte bloquée".
si l'historique contient "grotte visitée":
  dire "Vous connaissez déjà cette grotte.".
fin si

-- Afficher dans un texte dynamique
sa description est "[si l'historique contient "grotte bloquée"]Pas moyen de sortir.[sinon]On peut sortir.[fin si]".
```

---

## 21. Temps : programmer une routine

```
-- Déclencher une routine après un délai
règle après commencer le jeu:
  exécuter la routine boom dans 10 secondes.
fin règle

routine boom:
  dire "La bombe a explosé ! Vous avez perdu.".
fin routine
```

---

## 16. Ce que le moteur gère automatiquement

- Bidirectionnalité des sorties entre lieux.
- Description par défaut pour les lieux sans `Sa description est` (ex: « Vous êtes dans le salon. »).
- Description du lieu affichée automatiquement au démarrage de la partie et après chaque déplacement du joueur.
- Listing automatique des objets visibles dans la description du lieu. Si l'objet a un `aperçu`, celui-ci est utilisé à la place de la mention automatique.
- Affichage des portes visibles dans `regarder` (ouverte/fermée).
- Affichage des sorties avec statut d'obstruction.
- Actions de base : `regarder`, `examiner`, `prendre`, `poser`, `inventaire`, `aller`, `ouvrir`, `fermer`, `parler à`, `donner`... (si le fichier d'actions est inclus).
- Accord grammatical automatique selon le genre et le nombre des éléments.
- Gestion des états `vu`, `présent`, `adjacent`, `visité` automatiquement lors des déplacements.
