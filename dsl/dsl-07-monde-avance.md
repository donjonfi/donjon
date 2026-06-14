# Donjon DSL — Monde avancé : `inclure`, Interface tactile, Fonds, Locateur spatial

---

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

---

## 23. Interface tactile (mode mobile)

Sur écran tactile (smartphone), le lecteur rend les éléments du jeu cliquables et propose un menu listant les actions applicables à l’élément touché.

### Actions principales et secondaires

Le menu affiche d’abord les **actions principales** (infinitifs seuls), puis un bouton « Plus d’actions… » révèle les **actions secondaires**, et enfin « Toutes les actions ». Les listes se définissent pour une classe d’éléments (éventuellement restreinte à un état) ou pour un élément précis — **infinitifs seuls, jamais de préposition** :

```
Les actions principales pour les objets sont examiner et prendre.
Les actions secondaires pour les personnes sont montrer et donner.
Les actions principales du bandit sont attaquer et parler.
L’action principale pour les lieux est regarder.
Les actions principales supplémentaires pour les portes sont ouvrir et fermer.
Les actions principales pour les objets ouvrables sont ouvrir et fermer.
```

- **Héritage** : la déclaration la plus précise gagne (élément > classe + état > classe > classe parente > défauts du moteur).
- **`supplémentaires`** : complète la liste héritée au lieu de la remplacer (équivaut à « Ajouter … aux actions … »).
- **Classe + état** (« les objets ouvrables ») : ne s’applique qu’aux éléments possédant l’état, et prime sur la classe seule.
- **Défauts du moteur** (fichier d’actions de base) : objets → examiner, prendre ; personnes → parler, montrer, donner ; portes et objets ouvrables → + ouvrir, fermer ; directions → aller, regarder.
- **Compléter** la liste héritée (en définition ou en instruction dans une action/règle) :

```
Ajouter attaquer et insulter aux actions principales du bandit.
```

- **Remplacer** une liste en cours de partie (instruction) :

```
changer les actions principales du bandit sont attaquer et fuir.
```

Un infinitif qui ne correspond à aucune action du jeu n’est pas proposé dans le menu (un conseil est émis dans l’éditeur). Le menu n’affiche qu’un bouton par infinitif : l’appui affiche les **variantes** sous forme de commandes complètes, incluant l’élément cliqué et le **dernier élément mentionné** (« ouvrir le coffre », « ouvrir le coffre avec la clé », « ouvrir le coffre avec … ») ; s’il n’y a qu’une forme possible, elle est exécutée immédiatement. Le constructeur global (⚡) liste les 5 dernières actions utilisées puis toutes les actions par ordre alphabétique, et propose un bouton « Taper une commande… » (saisie clavier ponctuelle).

Cas automatiques (sans déclaration) :

- une action définie pour un **élément précis** (`ceci est le fauteuil`) est proposée d’office dans les actions **secondaires** de cet élément (sauf si l’auteur l’a classée lui-même) ;
- une action sur un **intitulé** (`ceci est un intitulé`, ex. `taper {code}`) est proposée dans le **constructeur global** (bouton ⚡) avec un champ de saisie libre pour le complément.

#### Anti-spoiler : actions visant un sujet précis

Quand une action vise un **sujet précis** dans son en-tête (`action coincer la rame dans la grille`, ou une surcharge d’un verbe intégré comme `action prendre la médaille avec la rame`), le menu ne propose **pas** seulement le sujet attendu : il propose **tous les éléments visibles de la même classe** que ce sujet (pour `ceci` comme pour `cela`). Sinon le joueur devinerait immédiatement que ce verbe va avec cet objet.

💡 Le périmètre des leurres est donc piloté par la **classe** du sujet : pour proposer plusieurs candidats crédibles, regroupez vos objets dans une classe commune (`Un outil est une sorte d’objet. La rame est un outil. Le tournevis est un outil.`). Un sujet **seul de sa classe** ne peut, par construction, proposer aucun leurre ; un sujet **générique** (`un objet`) élargit au contraire à tous les objets visibles. Seuls les éléments **visibles** au moment du clic sont proposés.

Les **sorties** sont aussi cliquables (y compris `monter`/`descendre`/`entrer`/`sortir`) et ouvrent un menu propre aux directions — par défaut `aller` et `regarder` (défini dans actions.djn) :

```
Les actions principales pour les directions sont aller et regarder.
```

### Désactiver le mode mobile

```
Désactiver le mode mobile.
```

L’interface tactile est active par défaut sur les appareils tactiles ; cette déclaration la désactive pour ce jeu (variantes acceptées : `l’interface tactile`, `le mode tactile`, `l’interface mobile`).

---

## 24. Fonds (décor présent dans plusieurs lieux)

Un **fond** est un objet de décor présent dans **plusieurs lieux à la fois** (le ciel, le soleil, la mer, le sol…). Un fond hérite d’`objet` : il n’est **ni contenant ni support**. On **ne peut pas le prendre**, il n’est **pas listé** parmi les objets du lieu, mais il est **examinable** et son **aperçu** (s’il en a un) s’affiche avec la description du lieu.

```
Le ciel est un fond. Il est commun à tous les lieux.
L’aperçu du ciel est "Un grand ciel bleu se déploie au-dessus de vous.".
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
- **propre à chaque lieu** : chaque lieu a sa **propre** instance ; on peut donc différencier ses propriétés lieu par lieu (voir §25).

### Inaccessible

Un fond peut être déclaré **inaccessible** (on le voit, on l’examine, mais on ne peut pas l’atteindre) :

```
Le ciel est un fond inaccessible. Il est commun à tous les lieux.
```

> Le moteur ne gère pas nativement le fait de **déposer des objets sur un fond** (par ex. « poser au sol »). Si vous voulez qu’un fond reçoive des objets, programmez-le avec des règles.

## 25. Locateur spatial (désigner par la position)

On peut désigner un objet (ou l’**instance d’un fond propre**) par **où il se trouve**, avec `situé(e)(s) (dans|sur|sous) <cible>` ou `qui se trouve(nt) (dans|sur|sous) <cible>` (et `… ici`).

**Surcharge d’un fond propre, par lieu (en définition)** — chaque instance peut avoir ses propres propriétés :

```
Le sol est un fond propre à chaque lieu.
La description du sol est "Un sol de pierre.".                       -- défaut (toutes les instances)
La description du sol situé dans la cuisine est "Un carrelage gras.". -- surcharge pour la cuisine
La description du sol situé ici est "Un parquet ciré.".              -- « ici » = dernier lieu défini
```

**Dans une condition** (singulier) — utilisez **uniquement** la forme `situé` : la forme `qui se trouve` n’y est pas reconnue (conflit avec le verbe « se trouver » du test de position) et la condition serait silencieusement fausse. Le locateur choisit l’instance, puis `est` teste son état :

```
si le sol situé dans la cuisine est sale, dire "Le carrelage est gras.".
si la clé située sur la table est rouge, ...
```

Note : l’état d’une instance d’un fond `propre` ne se fixe pas par lieu en définition (`Le sol situé dans X est sale.` est sans effet) ; donnez l’état par défaut à la classe puis faites diverger une instance au runtime avec `changer le sol est …` (instance du lieu courant).

**Dans une instruction `déplacer` / `copier`** (pluriel : agit sur tous les objets qui correspondent) :

```
déplacer les objets qui se trouvent dans le coffre vers l’inventaire.
déplacer les clés situées sur la table vers le joueur.
```

(La destination peut être `le joueur` / `l’inventaire` / `ici` / un contenant ou support.)

**Dans une règle, modifier une instance précise avec `changer`** (runtime) — le locateur cible **une seule** instance, les autres restent inchangées :

```
règle après ouvrir le robinet:
    changer la description du sol situé dans la cuisine est "Le carrelage est trempé.".
    changer la description du sol situé ici est "Le sol est mouillé.".   -- « ici » = lieu courant
```

- `est` est réservé aux **états** ; les positions/locateurs utilisent `situé` / `se trouve`.
- En définition, sans locateur, une propriété d’un fond `propre` est la **valeur par défaut** appliquée à toutes ses instances.
