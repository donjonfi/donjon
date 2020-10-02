import { Classe, ClassesRacines } from '../commun/classe';

import { ElementGenerique } from './element-generique';

export class Monde {

  constructor() {

    // ajouter les classes de base au monde
    this.classes.push(ClassesRacines.Element);
    this.classes.push(ClassesRacines.Lieu);
    this.classes.push(ClassesRacines.Objet);
    this.classes.push(ClassesRacines.Vivant);
    this.classes.push(ClassesRacines.Animal);
    this.classes.push(ClassesRacines.Personne);
    this.classes.push(ClassesRacines.Porte);
    this.classes.push(ClassesRacines.Contenant);
    this.classes.push(ClassesRacines.Support);

  }

  titre: string;

  classes: Classe[] = [];

  lieux: ElementGenerique[] = [];
  // decors: ElementGenerique[] = [];
  // contenants: ElementGenerique[] = [];
  portes: ElementGenerique[] = [];
  // cles: ElementGenerique[] = [];
  // animaux: ElementGenerique[] = [];
  objets: ElementGenerique[] = [];
  joueurs: ElementGenerique[] = [];
  inventaires: ElementGenerique[] = [];

}