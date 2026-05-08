# Donjon FI Compagnon — Extension VS Code

Aperçu, visualisation, analyse et test du jeu pour les scénarios [Donjon FI](https://donjon.fi) (fichiers `*.djn`), directement dans VS Code.

## Fonctionnalités

- **Analyse** : liste des erreurs, problèmes et conseils de compilation, avec badge de comptage et lien vers la ligne du fichier source (`inclure` résolu)
- **Jeu** : test du scénario en direct dans une webview — l'onglet est sélectionné automatiquement après chaque compilation réussie
- **Visualisation** : exploration interactive du monde compilé (lieux, objets, classes, règles, actions)
- **Aperçu** : vue d'ensemble du monde compilé (résumé textuel)
- **Bouton « Analyser »** (baguette magique, identique à donjon-creer) : (re)compile le scénario depuis la version sur disque, à la demande. La sauvegarde du fichier ne déclenche **pas** de recompilation automatique. Disponible dans la barre d'onglets du compagnon **et** dans la barre de titre de l'éditeur VS Code (icône ▶)
- **Sélection auto de l'onglet** après chaque compilation : **Analyse** s'il y a des erreurs, **Jeu** sinon
- **Diagnostics VS Code** : les messages de compilation sont remontés dans le panneau « Problèmes »

## Utilisation

1. Ouvrir un fichier `.djn`
2. Lancer la commande **« Ouvrir le compagnon Donjon FI »** (Ctrl+F5, ou via le menu de l'éditeur)
3. Le compagnon s'ouvre en panneau latéral et compile une première fois automatiquement
4. Après modification du `.djn`, sauvegarder puis cliquer sur **Analyser** (baguette magique dans la webview, ou ▶ dans la barre de titre de l'éditeur) pour recompiler

### Fichier `actions.djn`

Le compagnon résout `actions.djn` dans cet ordre :

1. **`actions.djn` à côté du `.djn` édité** (mêmes répertoire que le scénario)
2. **Paramètre `donjon.actionsFile`** — chemin absolu ou relatif au workspace
3. **Version par défaut livrée avec l'extension** — automatiquement utilisée si aucune des deux premières sources n'est disponible

La version livrée avec l'extension est synchronisée à chaque build depuis le dossier canonique `ressources/scenarios/actions.djn` du repo, donc les utilisateurs profitent toujours de la dernière version stable.

### Position du panneau compagnon

Par défaut, le compagnon s'ouvre dans **un nouvel onglet du même groupe** que le `.djn` actif (paramètre `donjon.compagnonViewColumn` = `"active"`). Pour le faire s'ouvrir en vue côte-à-côte (groupe à droite), passer ce paramètre à `"beside"`.

## Pour aller plus loin

- [Site web](https://donjon.fi)
- [Documentation](https://donjon.fi/doc/v3/start)

## Extensions associées

- **Donjon FI Language** — coloration syntaxique, sémantique et navigation
