# Donjon DSL — Éléments : États, Propriétés, Paramètres

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
[c score]              -- valeur du compteur "score" (voir dsl-05-avance.md)

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
