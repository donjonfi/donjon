# Donjon DSL — Mémoire et temps : Compteurs, Listes, Programmation

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
