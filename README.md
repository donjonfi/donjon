# Donjon IDE

*Le jeu à énigmes en mode texte*

Donjon IDE vous permet d’écrire des *fictions interactives* et d’y jouer.\
Tout est en français.

Vous pouvez utiliser Donjon IDE directement sur le site [donjon.xax.be](https://donjon.xax.be) . Il y a également des exemples de jeux.

## Publier votre jeu

Actuellement il vous faut soit compiler Donjon IDE et le publier sur votre site web soit proposer votre jeu sur [donjon.xax.be](https://donjon.xax.be) .

Une version pré-compilée de Donjon IDE sera proposée prochainement.

## Compilation de Donjon IDE

Donjon IDE est développé avec *Angular*.\
Les langages utilisés sont le *TypeScript*, *HTML* et *SCSS*.

### Pré-requis

#### NodeJS

Il vous faut installer [Node.js](https://nodejs.org) qui va vous permettre d'installer Angular et les bibliothèques de composants nécessaires.

#### Angular-cli

Il vous faut ensuite installer [Angular CLI](https://cli.angular.io) :
```shell
npm install -g @angular/cli
```

#### Bibliothèques de composants

Ouvrir un terminal à la racine du projet et exécuter la commande suivante pour télécharger les bibliothèques de composants utilisées dans l'application :
```shell
npm install
```

### Test local

Tester l'application localement:
```shell
ng serve donjon-creer
ng serve donjon-jouer
```
Se rendre ensuite sur `http://localhost:4200/`.

### Déploiement sur un site web

Compiler l'application:
```shell
ng build donjon
ng build donjon-creer --prod
ng build donjon-jouer --prod
```
Publier ensuie le contenu du dossier `dist` à la racine du site web.

Il est possible de publier l'application dans un sous-dossier du site web. Dans ce cas il faut ajouter la variable `baseHref` lors de la compilation :
```shell
--baseHref=/sous-dossier
```
