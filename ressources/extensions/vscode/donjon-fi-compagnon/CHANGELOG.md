# Historique des versions

## [3.5.0] - 08/05/2026
Première version publiée. Compagnon VS Code pour Donjon FI 3.5.0.

### Fonctionnalités

- **Onglets** : Analyse, Jeu, Visualisation, Aperçu
- **Sélection automatique de l'onglet** après chaque compilation : **Analyse** s'il y a des erreurs, **Jeu** sinon
- **Webview Angular** intégrée, partagée avec les outils web Donjon FI (lecteur, visualisation, aperçu du monde)
- **Résolution des `inclure`** : un fichier maître peut intégrer d'autres fichiers `.djn` ; les erreurs sont remontées sur les bonnes lignes des bons fichiers
- **Diagnostics VS Code** : erreurs / problèmes / conseils visibles dans le panneau « Problèmes »
- **Bouton « Analyser »** (baguette magique, `fa-wand-magic-sparkles`, partagé avec donjon-creer) pour (re)compiler le scénario à la demande, à partir de la version sur disque (recompilation manuelle, pas à chaque sauvegarde) — disponible :
  - dans la barre d'onglets de la webview compagnon
  - dans la barre de titre de l'éditeur VS Code (icône ▶) quand un fichier `.djn` est ouvert
  - via la palette de commandes : « Tester le jeu Donjon FI »
- **Résolution `actions.djn`** en trois niveaux : adjacent au `.djn` → paramètre `donjon.actionsFile` → version par défaut livrée avec l'extension (synchronisée depuis `ressources/scenarios/actions.djn` au build)
- **Paramètre `donjon.compagnonViewColumn`** : `"active"` (défaut, nouvel onglet du même groupe) ou `"beside"` (vue côte-à-côte)
- **Style clair** aligné sur la palette Donjon FI (scrollbars incluses), indépendant du thème VS Code

----------------------

All notable changes to the "donjon-fi-compagnon" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.
