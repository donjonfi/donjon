# Donjon DSL — Avancé : Positions, Routines, Réactions, Mémoire, Temps, Fonds

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

-- Options d'affichage : masquer le titre et/ou l'unité
La bourse est affichée en haut à droite sans titre.
La bourse est affichée en haut à droite sans unité.
La bourse est affichée en haut à droite sans titre sans unité.
La bourse est affichée en haut à droite sans titre et sans unité. -- « et » optionnel
-- Seules « sans titre » (alias « sans intitulé ») et « sans unité » sont valides.
-- Toute autre option « sans X » provoque une erreur d'analyse.

-- Titre libre (chaîne de caractères affichée à la place du nom dans le cartouche)
Le titre du score est "Score final".
Le titre de la bourse est "Pièces d'or".
-- Si aucun titre n'est défini, le nom du compteur est utilisé.

-- Modifier le titre à l'exécution
changer le titre du score est "Score : niveau 2".

-- Modifier l'affichage en cours de partie
changer le score n'est plus affiché.                          -- masquer
changer le score n'est pas affiché.                           -- forme équivalente
changer le score est affiché en bas à gauche sans titre.      -- repositionner et/ou changer les options
-- À chaque réaffichage, toutes les options « sans X » sont réinitialisées :
-- il faut les redéclarer explicitement si on veut les conserver.

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

-- Modifier une liste : ajouter / retirer un ou plusieurs éléments
ajouter le majordome à la liste suspects.
ajouter le majordome, la cuisinière et le jardinier à la liste suspects.
retirer le majordome de la liste suspects.
retirer le majordome, la cuisinière et le jardinier de la liste suspects.
vider les suspects.
vider la liste suspects.        -- forme alternative équivalente
vider la liste des suspects.    -- forme alternative équivalente
-- « enlever » est accepté comme synonyme de « retirer »

-- Tester
si les suspects contiennent le majordome:
  dire "Le majordome est suspect.".
fin si

-- Historique : même syntaxe avec des chaînes de texte
ajouter "grotte visitée" à la liste historique.
retirer "grotte bloquée" de la liste historique.
si l'historique contient "grotte visitée":
  dire "Vous connaissez déjà cette grotte.".
fin si

-- Afficher dans un texte dynamique
sa description est "[si l'historique contient "grotte bloquée"]Pas moyen de sortir.[sinon]On peut sortir.[fin si]".
```

### Taille d'une liste

La taille d'une liste (nombre d'éléments) s'interroge via `la taille de X`.
La forme de l'article contracté dépend du genre/nombre de l'intitulé de la liste :

| Intitulé de la liste       | Forme dans la condition             |
|----------------------------|-------------------------------------|
| `le compteur`              | `la taille du compteur`             |
| `la file`                  | `la taille de la file`              |
| `l'archive`                | `la taille de l'archive`            |
| `les éléments`             | `la taille des éléments`            |
| `le groupe actif`          | `la taille du groupe actif`         |
| `les notes importantes`    | `la taille des notes importantes`   |
| `le groupe d'accusés actifs` | `la taille du groupe d'accusés actifs` |

```
Les suspects sont une liste.
L'historique est une liste.
Le groupe actif est une liste.

-- Tester la taille (égalité)
si la taille des suspects vaut 0, dire "Aucun suspect.".
si la taille des suspects ne vaut pas 0, dire "Il y a des suspects.".

-- Tester la taille (comparaison)
si la taille des suspects atteint 3:    -- >= 3
  dire "Trois suspects ou plus.".
fin si
si la taille des suspects dépasse 5:    -- > 5
  dire "Trop de suspects !".
fin si
si la taille des suspects n'atteint pas 2:   -- < 2
  dire "Pas encore assez de suspects.".
fin si
si la taille des suspects ne dépasse pas 4:  -- <= 4
  dire "Nombre raisonnable.".
fin si

-- Afficher dans un texte dynamique
dire "Il y a [c taille des suspects] suspect[s taille des suspects].".
dire "L'archive contient [c taille de l'archive] document[s taille de l'archive].".
dire "Le groupe actif a [c taille du groupe actif] membre[s taille du groupe actif].".
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

Les appels différés acceptent aussi des **arguments** (comme un appel direct) :

```
-- Programmer une routine paramétrée
exécuter la routine alerter avec "intrus" dans 3 secondes.

routine alerter:
  définitions:
    ceci est un texte.
  exécution:
    dire "Alerte : [ceci] détecté !".
  fin routine
fin routine
```

> Les arguments sont évalués **au déclenchement** (et non à la programmation) :
> un compteur passé en argument reflète sa valeur au moment où la routine s'exécute.
> Les valeurs sont enregistrées dans les sauvegardes/enregistrements, donc le replay
> (restauration, triche, magnétoscope) reproduit l'appel à l'identique.

## 22. Découper un scénario en plusieurs fichiers

L’instruction `inclure` permet de remplacer une ligne par le contenu d’un autre fichier `.djn`.

```
-- Dans le scénario racine (jeu.djn)
inclure "intro.djn".
inclure "salle1.djn".
inclure "salle2.djn".
```

- Les chemins sont **relatifs au fichier `.djn` racine** (peu importe quel fichier porte l’instruction `inclure`).
- La résolution est **récursive** : un fichier inclus peut lui-même utiliser `inclure`.
- Les **cycles** sont détectés (`a.djn` qui inclut `b.djn` qui inclut `a.djn` produit une erreur).
- La **profondeur maximale** est de 32 niveaux d’imbrication.
- L’instruction `inclure` est résolue **avant la compilation** : le moteur ne la voit jamais. Les erreurs de compilation pointent sur le fichier d’origine et sa ligne d’origine.

**Outils** :
- VS Code (extension `donjon-fi-compagnon`) : la résolution est automatique, les diagnostics pointent au bon fichier.
- Web (`donjon-creer`) : utiliser le bouton « Ajouter fichier inclus » à côté de « Charger », puis compiler.

## 23. Fonds (décor présent dans plusieurs lieux)

Un **fond** est un objet de décor présent dans **plusieurs lieux à la fois** (le ciel, le soleil, la mer, le sol…). Un fond hérite d’`objet` : il n’est **ni contenant ni support**. On **ne peut pas le prendre**, il n’est **pas listé** parmi les objets du lieu, mais il est **examinable** et son **aperçu** (s’il en a un) s’affiche avec la description du lieu.

```
Le ciel est un fond. Il est commun à tous les lieux.
L'aperçu du ciel est "Un grand ciel bleu se déploie au-dessus de vous.".
La description du ciel est "Le ciel est limpide.".
```

### Portée d’un fond

On précise **dans quels lieux** le fond est présent, et s’il s’agit d’une instance partagée ou d’une instance par lieu. Les deux formulations sont équivalentes (phrase séparée ou inline) :

```
Le soleil est un fond. Il est commun à tous les lieux.
La mer est un fond commun dans les lieux côtiers.
Le sol est un fond propre à chaque lieu.
Le plafond est un fond propre aux lieux couverts.
```

| Formulation | Portée | Lieux concernés |
|---|---|---|
| `commun à tous les lieux` | **une seule** instance partagée | tous |
| `commun dans les lieux <état>` | une seule instance partagée | lieux possédant `<état>` |
| `propre à chaque lieu` | **une instance par lieu** | tous |
| `propre aux lieux <état>` | une instance par lieu | lieux possédant `<état>` |

- **commun** : une seule entité (mêmes description / aperçu / états partout). La présence est **dynamique** : si un lieu acquiert l’état du domaine en cours de partie, le fond y apparaît.
- **propre à chaque lieu** : chaque lieu a sa **propre** instance ; on peut donc différencier ses propriétés lieu par lieu (voir §24).

### Inaccessible

Un fond peut être déclaré **inaccessible** (on le voit, on l’examine, mais on ne peut pas l’atteindre) :

```
Le ciel est un fond inaccessible. Il est commun à tous les lieux.
```

> Le moteur ne gère pas nativement le fait de **déposer des objets sur un fond** (par ex. « poser au sol »). Si vous voulez qu’un fond reçoive des objets, programmez-le avec des règles.

## 24. Locateur spatial (désigner par la position)

On peut désigner un objet (ou l’**instance d’un fond propre**) par **où il se trouve**, avec `situé(e)(s) (dans|sur|sous) <cible>` ou `qui se trouve(nt) (dans|sur|sous) <cible>` (et `… ici`).

**Surcharge d’un fond propre, par lieu (en définition)** — chaque instance peut avoir ses propres propriétés :

```
Le sol est un fond propre à chaque lieu.
La description du sol est "Un sol de pierre.".                       -- défaut (toutes les instances)
La description du sol situé dans la cuisine est "Un carrelage gras.". -- surcharge pour la cuisine
La description du sol situé ici est "Un parquet ciré.".              -- « ici » = dernier lieu défini
```

**Dans une condition** (singulier) — préférez la forme `situé` (la forme `qui se trouve` est réservée au test de position) :

```
si le sol situé dans la cuisine est sale, dire "Le carrelage est gras.".
si la clé située sur la table est rouge, ...
```

**Dans une instruction `déplacer` / `copier`** (pluriel : agit sur tous les objets qui correspondent) :

```
déplacer les objets qui se trouvent dans le coffre vers l'inventaire.
déplacer les clés situées sur la table vers le joueur.
```

(La destination peut être `le joueur` / `l'inventaire` / `ici` / un contenant ou support.)

- `est` est réservé aux **états** ; les positions/locateurs utilisent `situé` / `se trouve`.
- En définition, sans locateur, une propriété d’un fond `propre` est la **valeur par défaut** appliquée à toutes ses instances.
