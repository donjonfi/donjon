# Donjon DSL — Logique : Synonymes, Actions, Règles

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

### Remplacer une action existante (`règle remplacer`)

Pour écraser une action déjà définie (par exemple une action héritée de `actions.djn` via `inclure`), utiliser un bloc `règle remplacer <signature>:`. Le bloc remplace entièrement l'action d'origine (description, phases, balises, etc.). Le bloc se ferme par `fin action`.

```
règle remplacer sauter:
  phase épilogue:
    dire "Vous bondissez comme un cabri.".
fin action
```

La signature doit correspondre exactement à l'action ciblée : `règle remplacer sauter:` ne remplace pas `action sauter sur ceci:` et inversement.

```
règle remplacer sauter sur ceci:
  phase épilogue:
    dire "Hop, vous voilà perché sur [le ceci].".
fin action
```

**Désambiguïsation par `définitions:`** — plusieurs actions du moteur partagent le même infinitif et la même arité. Par exemple, `actions.djn` définit quatre `action examiner ceci:` distinctes (une pour une direction, une pour un lieu, une pour un objet, une pour un spécial). Le bloc de remplacement doit reproduire le bloc `définitions:` de la version visée pour lever l'ambiguïté :

```
règle remplacer examiner ceci:
  définitions:
    ceci est un objet prioritairement visible et mentionné.
  phase épilogue:
    dire "Rien d'intéressant à signaler sur [le ceci].".
fin action
```

Si plusieurs actions correspondent à la signature fournie sans pouvoir être désambiguïsées, une erreur de compilation est émise. Si aucune action existante ne correspond, un conseil non bloquant est ajouté (visible dans l'éditeur Donjon FI) et la règle crée une nouvelle action.

**Doublons d'actions** — deux blocs `action <signature>:` avec la même signature (même infinitif, même arité ceci/cela, mêmes prépositions, même `définitions:`) sont refusés : une erreur de compilation invite à utiliser `règle remplacer` si l'intention était bien de modifier le comportement existant. Deux blocs `règle remplacer` ciblant la même action sont également refusés (une seule règle de remplacement par action).

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

### Sortie d'une règle « après » : remplacer, précéder ou suivre

Par défaut, une **règle après** *remplace* la sortie de l'action déclenchante.
Deux instructions permettent de réintroduire la sortie standard, selon l'ordre voulu :

| Instruction                  | Effet                                                       |
|------------------------------|-------------------------------------------------------------|
| `continuer l'action avant.`  | la sortie standard s'affiche **avant** le texte de la règle |
| `continuer l'action après.`  | la sortie standard s'affiche **après** le texte de la règle |

```
-- La description du nouveau lieu s'affiche AVANT le murmure
règle après aller dans la crypte:
  continuer l'action avant.
  dire "Une voix murmure : « Sans le feu, tu ne survivras pas ici… »".
fin règle

-- La cinématique s'affiche AVANT la description du nouveau lieu
règle après aller dans la crypte:
  dire "Vous descendez prudemment dans l'obscurité.".
  continuer l'action après.
fin règle
```

Sans aucune de ces deux instructions, la sortie standard est totalement remplacée par celle de la règle (utile pour les cinématiques qui se substituent à la description automatique).
