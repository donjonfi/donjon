import { Classe } from '../commun/classe';
import { ClassesRacines } from '../commun/classes-racines';
import { ElementGenerique } from './element-generique';

export class Monde {

  constructor() {

    // ajouter les classes de base au monde
    this.classes.push(ClassesRacines.Compteur);
    this.classes.push(ClassesRacines.Intitule);
    this.classes.push(ClassesRacines.Element);
    this.classes.push(ClassesRacines.Special);
    this.classes.push(ClassesRacines.Lieu);
    this.classes.push(ClassesRacines.Objet);
    this.classes.push(ClassesRacines.Vivant);
    this.classes.push(ClassesRacines.Animal);
    this.classes.push(ClassesRacines.Personne);
    this.classes.push(ClassesRacines.Obstacle);
    this.classes.push(ClassesRacines.Porte);
    this.classes.push(ClassesRacines.Contenant);
    this.classes.push(ClassesRacines.Support);

  }

  classes: Classe[] = [];
  lieux: ElementGenerique[] = [];
  /** tous les objets */
  objets: ElementGenerique[] = [];
  /** objets filtrés sur « porte » et « obstacle » */
  portesEtObstacles: ElementGenerique[] = [];
  /** objets filtrés sur « ni porte ni obstacle ni spécial » */
  classiques: ElementGenerique[] = [];
  /** objets filtrés sur « spécial » (joueur, jeu, licence, …) */
  speciaux: ElementGenerique[] = [];
}
