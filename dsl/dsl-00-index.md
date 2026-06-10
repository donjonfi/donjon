# Donjon DSL — Index

> Document destiné aux IAs pour générer du code Donjon FI correct.  
> Donjon FI est un moteur de fiction interactive en **français**.  
> La syntaxe est du français naturel structuré, chaque phrase se termine par un point.

---

## Charger uniquement le(s) fichier(s) pertinents

| Fichier | Contenu | Charger quand… |
|---|---|---|
| `dsl-01-monde.md` | Structure, Lieux, Objets, Ressources, Portes/Obstacles | Créer la carte, les lieux, les objets, les ressources |
| `dsl-02-elements.md` | États, Propriétés, Paramètres du jeu | Configurer des éléments, activer/désactiver des options |
| `dsl-03-logique.md` | Synonymes, Actions personnalisées, Règles avant/après | Écrire la logique de jeu |
| `dsl-04-texte.md` | Instructions courantes, Balises dynamiques, Balises de mise en forme | Rédiger les sorties texte |
| `dsl-05-avance.md` | Positions, Routines, Réactions (PNJ), Compteurs, Listes, Temps, `inclure` (multi-fichiers), Interface tactile (mode mobile), Fonds (décor multi-lieux), Locateur spatial | PNJ, mémoire, compteurs, temps, découper en plusieurs fichiers, actions principales/secondaires du menu tactile, décor présent dans plusieurs lieux (ciel/sol/mer), désigner par la position |
| `dsl-06-exemple.md` | Exemple complet minimal | Voir un scénario fonctionnel de référence |

---

## Ce que le moteur gère automatiquement

- Bidirectionnalité des sorties entre lieux.
- Description par défaut pour les lieux sans `Sa description est` (ex : « Vous êtes dans le salon. »).
- Description du lieu affichée automatiquement au démarrage et après chaque déplacement du joueur.
- Listing automatique des objets visibles dans la description du lieu. Si l'objet a un `aperçu`, celui-ci est utilisé à la place de la mention automatique.
- Affichage des portes visibles dans `regarder` (ouverte/fermée).
- Affichage des sorties avec statut d'obstruction.
- Actions de base : `regarder`, `examiner`, `prendre`, `poser`, `inventaire`, `aller`, `ouvrir`, `fermer`, `parler à`, `donner`... (si le fichier d'actions est inclus).
- Accord grammatical automatique selon le genre et le nombre des éléments.
- Gestion des états `vu`, `présent`, `adjacent`, `visité` automatiquement lors des déplacements.
