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
L'identifiant du jeu est "un-uuid-ici".
```

---

## 2. Lieux

```
Le salon est un lieu.
Sa description est "Vous êtes dans un salon confortable.".
Son titre est "Le grand salon".   -- optionnel, sinon le nom est utilisé

-- Lieu féminin
La cuisine (f) est un lieu.
Sa description est "Une cuisine bien équipée.".

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

-- Objet avec genre féminin
La clé dorée (f) est un objet ici.

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

| État             | Opposé         | Description                                  |
|------------------|----------------|----------------------------------------------|
| `ouvert`         | `fermé`        | porte/contenant ouvert                       |
| `fermé`          | `ouvert`       | porte/contenant fermé                        |
| `verrouillé`     | `déverrouillé` | ne peut pas être ouvert                      |
| `visible`        | `invisible`    | visible pour le joueur                       |
| `invisible`      | `visible`      | caché, non décrit, non proposé               |
| `secret`         | —              | invisible jusqu'à révélation explicite       |
| `caché`          | —              | visible seulement à l'examen du contenant    |
| `discret`        | —              | non décrit automatiquement                   |
| `accessible`     | `inaccessible` | le joueur peut interagir avec                |
| `intact`         | `pas intact`   | état initial de l'objet                      |
| `ouvrable`       | —              | peut être ouvert                             |
| `mangeable`      | —              | peut être mangé                              |
| `buvable`        | —              | peut être bu                                 |
| `parlant`        | —              | peut répondre à "parler à"                   |
| `vu`             | —              | le joueur a déjà vu cet objet                |
| `visité`         | —              | le joueur a déjà visité ce lieu              |
| `présent`        | —              | calculé : l'objet est dans le lieu du joueur |

```
-- Déclarer un état dans la définition
La lampe est un objet éteint ici.
Le coffre est un contenant fermé ici.

-- Changer un état dans une action/règle
changer la lampe est allumée.
changer la lampe n'est plus éteinte.
changer le coffre est ouvert.
```

---

## 6. Propriétés

```
Sa description est "texte".
Son aperçu est "texte".
Son titre est "texte".
Le texte de X est "texte".        -- texte lisible
La quantité de X est 3.           -- pour les objets quantifiables
```

---

## 7. Paramètres du jeu

```
-- Affichage
désactiver affichage des obstacles.
désactiver affichage des sorties.
désactiver affichage de la description des lieux.

-- Activer (si désactivé par défaut)
activer affichage des sorties.
```

---

## 8. Synonymes et interprétations

```
-- Noms alternatifs pour un objet
Interpréter la table comme la table basse.
Interpréter le coffre comme le coffre du capitaine.

-- Synonymes d'actions
interpréter déchirer et détruire comme casser.
interpréter fouiller comme examiner.
```

---

## 9. Actions personnalisées

```
action INFINITIF:
  phase exécution:
    dire "texte".
fin action

-- Avec un objet cible
action examiner ceci:
  définitions:
    ceci est un objet visible.
  phase prérequis:
    si ceci n'est pas visible, refuser "Je ne le vois pas.".
  phase exécution:
    dire "[description ceci]".
  phase épilogue:
    dire "Voilà.".
fin action

-- Avec deux cibles
action utiliser ceci sur cela:
  définitions:
    ceci est un objet visible.
    cela est un objet visible.
  phase exécution:
    dire "Vous utilisez [intitulé ceci] sur [intitulé cela].".
fin action
```

### Phases d'une action (dans l'ordre d'exécution)

1. `phase prérequis` — conditions, peut appeler `refuser "message".`
2. `phase exécution` — logique principale
3. `phase épilogue` — toujours exécuté (même après refus)

### `définitions` : types de cibles

```
ceci est un objet visible.
ceci est un objet vu et visible.
ceci est prioritairement possédé.    -- cherche d'abord dans l'inventaire
ceci est prioritairement ouvrable.
ceci est un intitulé.                -- n'importe quel élément ou direction
ceci est une direction.
ceci est un lieu.
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

### Changements d'état

```
changer X est ouvert.
changer X n'est plus fermé.
changer X est invisible.
changer le joueur se trouve dans le salon.
changer la quantité de X diminue de 1.
changer la quantité de X augmente de 2.
```

### Déplacement

```
déplacer le joueur vers le nord.
déplacer X dans le salon.
effacer X.                           -- retire X du jeu
```

### Exécution

```
exécuter la commande "regarder".
exécuter l'action regarder.
refuser "Message d'erreur.".
continuer l'action.
arrêter l'action.
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
[obstacle vers ceci]     -- description de l'obstacle dans la direction ceci
[décrire objets dans X]  -- liste les objets dans le contenant X
[décrire objets sur X]   -- liste les objets sur le support X
[lister objets inventaire]

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
{N}   -- saut de paragraphe (ligne vide)
{P}   -- nouveau paragraphe
{U}   -- retour à la ligne (ul style)
{e}   -- indentation

{*texte*}    -- gras
{/texte/}    -- italique
{_texte_}    -- souligné
{+texte+}    -- surligné / mis en valeur
{-texte-}    -- commande (style monospace)
{=texte=}    -- barré

-- Choix/conditions dans les textes
[si X est Y]...[sinon]...[fin si]
[initialement]texte premier affichage[fin choix]
[aléatoirement]texte A[ou]texte B[ou]texte C[fin choix]
[choisir]texte A[ou]texte B[fin choix]      -- rotation
```

---

## 14. Positions du joueur

```
-- Le joueur démarre dans le premier lieu défini par défaut.
-- Pour changer :
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

## 16. Ce que le moteur gère automatiquement

- Bidirectionnalité des sorties entre lieux.
- Affichage des portes visibles dans `regarder` (ouverte/fermée).
- Affichage des sorties avec statut d'obstruction.
- Actions de base : `regarder`, `examiner`, `prendre`, `poser`, `inventaire`, `aller`, `ouvrir`, `fermer`, `parler à`, `donner`... (si le fichier d'actions est inclus).
- Accord grammatical automatique selon le genre et le nombre des éléments.
- Gestion des états `vu`, `présent`, `adjacent`, `visité` automatiquement lors des déplacements.
