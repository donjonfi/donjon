# Propositions de prépositions pour `actions.djn`

> **But** : pour chaque action acceptant une préposition, déclarer ses **probables**
> (séparateurs attendus — la 1re est la forme de base affichée) et ses **possibles**
> (acceptés mais moins sûrs, p. ex. ambigus avec un mot composé). Au découpage d'une
> commande joueur : probable > possible > imprévue.
>
> **Comment éditer** : modifie les colonnes **Probables** / **Possibles**, puis renvoie-moi
> le fichier. Probables comme possibles peuvent être des **listes**.
>
> **Syntaxe DSL cible** (bloc `définitions:`) :
> ```
> prépositions cela probables: dans et sur.
> prépositions cela possibles: sous.
> ```
>
> **Rappels (vérifiés dans le moteur)**
> - ✅ **Contractions genre/nombre automatiques** : on ne déclare que la **forme de base**
>   (`à`, `de`). Le moteur reconnaît `au`/`aux` ≡ `à` et `du`/`des`/`d'` ≡ `de`, et contracte
>   à l'affichage selon le genre de la cible (`à`+`le`→`au`…). ⇒ ne plus lister `au/aux/du/des`.
> - 🚫 Seules les prépositions connues du découpage sont utiles. Master set : `à, avec,
>   concernant, contre, dans, de, en, hors, par, pour, sous, sur, vers, à propos de`. Le reste
>   (`après`, `par-dessus`, `au sujet de`, `à l'aide de`, `au moyen de`…) est **inerte** tant
>   qu'on n'étend pas le master regex.
> - ⚠️ La famille **parler / interroger / demander / donner / montrer** canonicalise déjà ses
>   prépositions en dur → y déclarer des possibles est largement **redondant** (laissé à titre
>   indicatif). Le gain réel est sur les autres verbes.

## Actions à 1 complément

| Infinitif (en-tête) | Compl. | Probables | Possibles |
|---|---|---|---|
| `parler avec ceci`  | ceci | avec | à |
| `crier sur ceci`    | ceci | sur  | contre |
| `sauter sur ceci`   | ceci | sur  | dans |
| `dormir sur ceci`   | ceci | sur  | dans, sous |
| `penser à ceci`     | ceci | à    | — |

## Actions à 2 compléments

| Infinitif (en-tête) | Compl. | Probables | Possibles |
|---|---|---|---|
| `afficher ceci pour cela`             | cela | pour          | de |
| `demander ceci à cela`                | cela | à             | — |
| `donner ceci à cela`                  | cela | à             | — |
| `montrer ceci à cela`                 | cela | à             | — |
| `raconter ceci à cela`                | cela | à             | — |
| `interroger ceci concernant cela`     | cela | concernant    | sur |
| `parler avec ceci concernant cela`    | ceci | avec          | à |
| `parler avec ceci concernant cela`    | cela | concernant    | sur, de |
| `mettre ceci dans cela`               | cela | **dans, sur, sous** | |
| `poser ceci sur cela`                 | cela | sur           | dans, sous, contre |
| `utiliser ceci sur cela`              | cela | **sur, avec, contre** | dans |
| `jeter ceci vers cela`                | cela | **vers, contre**  | sur, à, dans |
| `ouvrir ceci avec cela`               | cela | avec          | — |
| `déverrouiller ceci avec cela`        | cela | avec          | — |
| `verrouiller ceci avec cela`          | cela | avec          | — |

> **En gras** : exemples de **probables en liste** — deux séparateurs co-attendus.
> `mettre … dans/sur …` (l'action gère contenant ET support) et `utiliser … sur/avec …`
> (« utiliser la clé sur/avec la porte »). À valider : garder la liste, ou rétrograder le
> 2e en possible ?

## Actions à objet direct (aucune préposition — pour mémoire)

`afficher`, `assommer`, `boire`, `brûler`, `casser`, `commencer`, `continuer`,
`demander ceci`, `déplacer`, `écouter`, `énerver`, `enlacer`, `enlever`, `examiner`,
`effacer`, `faire`, `fermer`, `frapper`, `insulter`, `interroger ceci`, `jeter ceci`,
`lâcher`, `lire`, `manger`, `mettre ceci`, `ouvrir ceci`, `poser ceci`, `pousser`,
`prendre`, `prier`, `raconter ceci`, `regarder ceci`, `répéter`, `secouer`, `tirer`,
`toucher`, `tuer`, `utiliser ceci`.

> Note : `examiner` / `regarder` gèrent déjà « sous / dans / derrière … » via la
> préposition **portée par l'objet** (mécanisme distinct) — ne pas dupliquer ici.
