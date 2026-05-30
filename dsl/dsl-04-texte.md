# Donjon DSL — Texte : Instructions, Balises dynamiques, Mise en forme

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
[intitulé ceci]          -- forme familière : "la pomme", "le coffre"...
[Intitulé ceci]          -- majuscule : "La pomme"
[ceci]                   -- intitulé selon l'état réel : "une pomme" (neuf) → "la pomme" (connu) ;
                         --   toujours le nombre pour les ressources : "1 pièce d'or", "4 fruits"
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
[Cest ceci]              -- "C'est" ou "Ce sont" selon le compte (majuscule)
[cest ceci]              -- "c'est" / "ce sont" (minuscule)

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

### Imbrication des blocs conditionnels

Tous les blocs ci-dessus (`[si …]`, `[Xe fois]`, `[au hasard]`, `[en boucle]`, `[initialement]`) peuvent être imbriqués les uns dans les autres. Chaque `[fin]` (ou `[fin si]` / `[fin choix]`) ferme uniquement le bloc le plus interne ; le bloc englobant reste ouvert jusqu’à son propre `[fin]`.

```
-- si dans si
[si X est Y]ouiX [si Z est T]ouiZ[sinon]nonZ[fin si][sinon]nonX[fin si]

-- si dans le sinon d’un autre si
[si X est Y]ouiX[sinon][si Z est T]nonX-ouiZ[sinon]nonX-nonZ[fin si][fin si]

-- au hasard contenant un si
[au hasard]choix1[ou][si Z est T]ouiZ[sinon]nonZ[fin si][ou]choix3[fin]

-- si contenant un Xe fois
[si X est Y][1ère fois]premier passage[puis]passages suivants[fin][sinon]hors-condition[fin si]
```

Le contenu d’un bloc imbriqué n’est rendu que si **toutes** les conditions englobantes sont elles-mêmes satisfaites.
