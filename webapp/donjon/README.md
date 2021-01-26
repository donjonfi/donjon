# Donjon FI

Pour créer et joueur à des fictions interractives en Français.

## Tester les applications

Il faut créer un terminal pour chacun car ces instructions sont blocantes :

```
ng build donjon --watch
ng serve donjon-jouer
ng serve donjon-creer
```
Les 2 applications sont alors disponibles sur les adresses suivantes: `http://localhost:4200/` et `http://localhost:4201/`.

## Compilation en production

```
ng build donjon
ng build donjon-jouer --base-href /jouer/ --prod
ng build donjon-creer --base-href /creer/ --prod
```

## Wiki et site officiel Donjon FI

[Site officiel Donjon FI](https://donjon.fi)\
[Wiki Donjon FI](https://donjon.fi/wiki)
