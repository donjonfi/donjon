# Donjon FI

*Le jeu à énigmes en mode texte*

Donjon FI vous permet d’écrire des *fictions interactives* et d’y jouer.\
Tout est en français.

Vous pouvez utiliser Donjon FI directement sur le site [donjon.fi](https://donjon.fi) . Il y a également des exemples de jeux.

## Documentation et site officiel Donjon FI

<a href="https://donjon.fi/" target="_blank">Site officiel</a> avec éditeur en ligne et exemples de jeux\
<a href="https://vimeo.com/channels/1676422" target="_blank">Chaîne vidéo</a>  avec tutoriels\
<a href="https://donjon.fi/doc/v3/" target="_blank">Wiki</a> avec documentation complète

## Publier votre jeu

Actuellement il vous faut soit compiler Donjon IDE et le publier sur votre site web soit proposer votre jeu sur [donjon.xax.be](https://donjon.xax.be) .

Une version pré-compilée de Donjon FI sera proposée prochainement.

## Compilation de Donjon FI

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

#### Bibliothèques de composants (dépendances)

Ouvrir un terminal à la racine du projet (`webapp\donjon`) et exécuter la commande suivante pour télécharger les bibliothèques de composants utilisées dans l'application :
```shell
npm install
```

### Test local

*Ouvrir un terminal* à la racine du projet (`webapp\donjon`).

1. Lancer la compilation de la librairie et attendre qu’il ait terminé.

```shell
ng build donjon --watch
```
2. Lancer l’éditeur ou le lecteur

*Dans un autre terminal :*

```shell
ng serve donjon-creer
ng serve donjon-jouer
```


Se rendre ensuite sur 
- `http://localhost:4200/` (Éditeur)
- `http://localhost:4201/` (Lecteur)



### Déploiement sur un site web

#### A. En utilisant la version pré-compilée
Voir 
[cet article](https://donjon.fi/publier.html) sur le site officiel.

#### B. En compilant soi-même l’application
Compiler l’éditeur :
```shell
ng build donjon
ng build donjon-creer --prod
```

Compiler le lecteur :
```shell
ng build donjon
ng build donjon-jouer --prod
```

Publier ensuie le contenu du dossier `dist` à la racine du site web.

Il est possible de publier l'application dans un sous-dossier du site web. Dans ce cas il faut ajouter la variable `--base-href` lors de la compilation :
```shell
--base-href=/sous-dossier/
```

