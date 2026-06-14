# Donjon DSL — Comportement : Positions, Routines, Réactions, Cartouche

---

## 14. Positions du joueur

```
-- Le joueur démarre dans le premier lieu défini par défaut.
-- Cette instruction n'est utile que lorsqu'il y a plusieurs lieux
-- et que le lieu de départ n'est pas le premier déclaré.
Le joueur se trouve dans le salon.
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

### 17 bis. Paramètres de routine

Une routine peut déclarer des paramètres typés `ceci` (et éventuellement `cela`)
dans un bloc `définitions:`, suivi d'un bloc `exécution:` qui contient les
instructions. La forme courte (sans étiquette, comme ci-dessus) reste valide
pour les routines sans paramètre.

**Types acceptés** :

| Type        | Sémantique                                              | Ce qu'on peut passer à l'appel                                         |
|-------------|----------------------------------------------------------|-------------------------------------------------------------------------|
| `nombre`    | valeur entière, capturée à l'appel (lecture seule)      | un littéral (`5`), la valeur d'un compteur, une propriété numérique     |
| `texte`     | chaîne, capturée à l'appel (lecture seule)              | une chaîne `"…"`, l'intitulé d'un élément                               |
| `compteur`  | référence à un compteur (modifiable par la routine)     | un compteur                                                              |
| `<classe>`  | référence à un élément/objet/personne/lieu/...          | un élément dont la classe hérite de `<classe>` (`objet`, `lieu`, `vivant`, ou n'importe quelle classe utilisateur — `dragon`, `arme`, …) |
| `élément`   | catchall : n'importe quel élément du jeu                | objet, lieu, personne (mais pas un compteur — voir « compteur » à part) |

L'article admis est `un` ou `une` (paramètre singulier). `des` est refusé.

**Exemples** :

```
-- Routine avec un objet et un nombre
routine LancerObjet:
  définitions:
    ceci est un objet.
    cela est un nombre.
  exécution:
    dire "Vous lancez [intitulé ceci] avec [c cela] points de force.".
fin routine

-- Routine qui modifie un compteur passé en paramètre
routine ajusterScore:
  définitions:
    ceci est un compteur.
  exécution:
    changer ceci augmente de 10.
    dire "Bonus ! Score : [c ceci].".
fin routine

-- Routine avec un texte
routine notifier:
  définitions:
    ceci est un texte.
  exécution:
    dire "[ceci]".
fin routine

-- Forme courte (sans paramètre)
routine sonner:
  dire "DING !".
fin routine
```

**Appels** (forme positionnelle — `avec X` pour 1 param, `avec X et Y` pour 2) :

```
exécuter routine sonner.
exécuter routine notifier avec "Bienvenue !".
exécuter routine ajusterScore avec le score.
exécuter routine LancerObjet avec la potion et 5.
exécuter routine LancerObjet avec la potion et le score.
```

**Vérification de type** :
- Bloc `définitions:` présent → arité et types vérifiés à l'appel.
- Bloc `définitions:` absent → la routine n'attend aucun paramètre.
  `exécuter routine X avec 5` sur une routine sans bloc `définitions:` est une erreur.

**Balises d'interpolation utiles dans le corps** :
- Paramètre de classe `objet`/`lieu`/`personne`/... : `[intitulé ceci]`,
  `[le ceci]`, `[nom ceci]`, `[description ceci]`, etc. (comme pour les actions).
- Paramètre `nombre` ou `compteur` : `[c ceci]` (valeur), `[s ceci]` (« s » si != 1).
- Paramètre `texte` : `[ceci]` substitue la chaîne capturée.

### 17 ter. Surcharge de routines

Plusieurs routines peuvent partager le même nom si leur signature diffère
(arité ou types des paramètres). Le moteur choisit automatiquement la
variante la **plus spécifique** à l'appel.

```
-- Trois variantes du nom « attaquer »
routine attaquer:
  dire "Vous frappez dans le vide.".
fin routine

routine attaquer:
  définitions:
    ceci est un vivant.
  exécution:
    dire "Vous frappez [intitulé ceci].".
fin routine

routine attaquer:
  définitions:
    ceci est un vivant.
    cela est un nombre.
  exécution:
    dire "Vous frappez [intitulé ceci] pour [c cela] dégât[s cela].".
fin routine

-- À l'appel, le moteur sélectionne la bonne variante :
exécuter routine attaquer.                     -- variante 0 arg
exécuter routine attaquer avec la goule.       -- variante (un vivant)
exécuter routine attaquer avec la goule et 5.  -- variante 2 args
```

**Règles de spécificité** :
- Un paramètre de type **classe** bat toujours un paramètre `nombre`/`texte`
  sur le même argument (« kind beats depth »). Conséquence pratique : si on
  surcharge `nombre` et `compteur` pour le même nom, passer un compteur à
  l'appel choisit la variante `compteur`.
- Entre deux paramètres de type classe, la classe la plus profonde dans
  la hiérarchie gagne (`dragon` > `vivant` > `objet` > `élément`).

**Ambiguïté** : si plusieurs variantes ont la même spécificité maximale, le
moteur renvoie une erreur ; il faut alors préciser un type plus spécifique.

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

## 18bis. Cartouche : afficher le lieu courant

Le cartouche est la barre fixe en haut et/ou en bas du lecteur.
Le titre du lieu actuel peut y être affiché (par défaut dans le cartouche du haut, à gauche).

```
-- Activer / désactiver l'affichage du lieu (en dehors de toute action ou règle)
afficher le lieu dans le cartouche.              -- défaut : cartouche du haut
afficher le titre du lieu dans le cartouche.     -- forme équivalente
afficher le lieu dans le cartouche du bas.
ne pas afficher le lieu dans le cartouche.
ne pas afficher le lieu dans le cartouche du haut.

-- Modifier l'affichage en cours de partie
changer le lieu n'est plus affiché.                          -- masquer
changer le lieu n'est plus affiché dans le cartouche.        -- forme équivalente
changer le lieu est affiché dans le cartouche du bas.        -- repositionner
changer le lieu est affiché dans le cartouche du haut.
```

Le lieu et les compteurs positionnés à la même verticalité-latéralité (p. ex. `haut-gauche`) partagent la même zone du cartouche.
