# Donjon DSL — Avancé : Positions, Routines, Réactions, Mémoire, Temps

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
