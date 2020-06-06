import { Etat } from './etat';

export class Classe {

  nom: string;
  intitule: string;
  parent: Classe;
  etats: Etat[];
}

export enum ClasseRacine {
  lieu = 'lieu',
  objet = 'objet',
  vivant = 'vivant',
  animal = 'animal',
  personne = 'personne',
  porte = 'porte',
  contenant = 'contenant',
  support = 'support',

  // types spéciaux :
  joueur = 'joueur',
  inventaire = 'inventaire',
}
