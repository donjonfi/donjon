# Donjon DSL — Exemple complet minimal

---

## 15. Exemple complet minimal

```
-- Informations
Le titre du jeu est "La maison mystérieuse".
L'auteur du jeu est "Anonyme".

-- Lieux
Le hall est un lieu.
Sa description est "Un hall d'entrée sombre.".

Le salon est un lieu au nord du hall.
Sa description est "Un salon poussiéreux.".

La cave est un lieu en bas du hall.
Sa description est "Une cave humide et froide.".

-- Connexion avec porte
La porte du salon est une porte fermée au nord du hall.

-- Obstacle vers la cave
La trappe clouée est un obstacle en bas du hall.

-- Objet
La bougie est un objet ici.
Sa description est "Une bougie à moitié consumée.".

-- Action personnalisée
action allumer la bougie:
  phase prérequis:
    si la bougie n'est pas dans l'inventaire, refuser "Je n'ai pas la bougie.".
  phase exécution:
    changer la bougie est allumée.
    dire "Vous allumez la bougie. La flamme vacille.".
fin action
```
