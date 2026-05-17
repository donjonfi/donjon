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

### 5b. Déclarer ses propres états

Vous pouvez déclarer des états personnalisés dans le scénario, en plus des états intégrés. **Les déclarations doivent venir avant la première utilisation.** Cinq formes existent :

| Forme | Effet |
|---|---|
| `troué est un état.` | État simple, sans relation avec d'autres états. |
| `sec et mouillé forment une bascule.` | Bascule : exactement 2 états opposés, mutex. Retirer l'un ré-introduit automatiquement l'autre. |
| `solide, liquide et gazeux se contredisent.` | Groupe : ≥ 2 états mutuellement exclusifs deux à deux. Retirer l'un ne ré-introduit *rien*. |
| `vu implique mentionné.` | Implication (asymétrique) : appliquer `vu` ajoute aussi `mentionné`. Cible simple ou liste : `secret implique caché et invisible.` |
| `déplacé exclut intact.` | Exclusion (contradiction bilatérale) entre 2 états. Cible simple ou liste : `intact exclut déplacé et modifié.` |

**Bascule vs groupe.** Bascule = exactement 2 états, avec ré-introduction au retrait (l'élément est *toujours* dans l'un des deux). Groupe = N états mutex sans ré-introduction (l'élément peut n'être dans aucun).

**Groupe vs contradictions.** Un groupe = clique complète de contradictions deux à deux. Pour exprimer « A contredit B et C, mais B et C peuvent coexister » (cas du moteur : `intact` contredit `déplacé` et `modifié`, mais `déplacé` et `modifié` ne s'excluent pas), utilisez **deux** `exclut` séparés, pas un groupe.

```
-- Exemple complet
fissuré et intact forment une bascule.
solide, liquide et gazeux se contredisent.
brillant est un état.
brillant implique poli.
parfait exclut abimé et fendu.

La poterie est un objet intact ici.
La pierre est un objet brillant ici.        -- la pierre sera aussi poli automatiquement
```

> Un état utilisé sans déclaration explicite est créé à la volée comme **état simple** (sans bascule ni groupe). Tenter de redéclarer un état moteur (`ouvert`, `fermé`, etc.) produit une erreur.

### 5c. Négation dans les définitions

Vous pouvez retirer un état d'un élément dès sa définition, soit avec `non` inline, soit avec la forme verbale `n'est pas`. La négation s'applique **uniquement** dans les définitions — utilisez `changer` pour modifier un état pendant le jeu.

```
-- Forme inline (constructeur)
La porte nord est une porte non ouvrable.

-- Forme verbale (assertion)
La porte nord n'est pas ouvrable.
Les portes ne sont pas ouvertes.
```

Si l'état nié appartient à une bascule (ex: `ouvert/fermé`), le moteur émet un **conseil** (visible en mode débogueur dans `donjon-creer` / `donjon-compagnon`) suggérant la forme positive de l'opposé :

> *« Plutôt qu'écrire « la porte n'est pas ouverte », préférer « la porte est fermée » : ouvert/fermé forment une bascule, la forme positive de l'opposé est plus claire. »*

Pour les états simples (ex: `ouvrable`), la négation retire simplement l'état (notamment si la classe de l'élément l'aurait appliqué par défaut), sans émettre de conseil.

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
