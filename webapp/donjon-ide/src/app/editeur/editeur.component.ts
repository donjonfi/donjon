import { ElementGenerique } from '../models/element-generique';
import { Genre } from '../models/genre.enum';
import { Nombre } from '../models/nombre.enum';
import { PositionSujet, PositionSujetString } from '../models/position-sujet';
import { Salle } from '../models/salle';
import { TypeElement } from '../models/type-element.enum';
import { Component, OnInit } from '@angular/core';
import { log } from 'util';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.css']
})
export class EditeurComponent implements OnInit {

  codeSource = `"Le nain qui voulait un trésor"

- 1 - Le jardin
Le jardin est une salle. "Vous êtes dans un beau jardin en fleurs. Le soleil brille.".
Les fleurs (f) sont des décors du jardin.
La clé rouge est dans le jardin.
L'abri de jardin est une salle à l'intérieur du jardin.
La porte rouge est une porte au sud de l'abri de jardin.
Le seau est un contenant.
Le seau est dans l'abri de jardin.
La haie est une porte au nord du jardin. Elle est fermée et ouvrable.

- 2 - La forêt et la caverne
La forêt est une salle au nord du jardin. "Vous êtes dans une forêt sombre.".
Les arbres sont des décors de la forêt.
Les fleurs (f) sont des décors de la forêt.
Le lac est un décor de la forêt.
Il contient de l'eau.
La description du seau est ici "Ce seau n'est pas troué, je peux y mettre de l'eau.".
La caverne ténébreuse est une salle sombre à l'intérieur de la forêt.
Le dragon est un animal dans la caverne.
Le trésor est dans la caverne.
  `;

  phrases: string[];
  salles: Salle[];
  generiques: Element[];

  /** salle -> déterminant, nom, féminin?, reste de la phrase */
  readonly xSujetSalle = /^(le |la |l')(.+?)(\(f\))? est une salle(.*)/gim;
  readonly xSujetContenant = /^(le |la |l')(.+?)(\(f\))? est un contenant(.*)/gim;
  readonly xSujetPorte = /^(le |la |l')(.+?)(\(f\))? est une porte(.*)/gim;
  /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), adjectif(5), position(6), genre complément(7), complément(8) */
  // readonly xPositionElementGenerique = /^(le |la |l')(.+?)(\(f\))? est (?:un|une) (.+?)(| .+) (à l'intérieur|au sud|au nord|à l'est|à l'ouest) (du |de la |de l')(.+)/i;

  /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), adjectif(5), position(6), genre complément(7), complément(8) */
  readonly xPositionElementGenerique = /^(le |la |l'|les)(.+?)(\(f\))? (?:est|sont) (?:|(?:un|une|des) (.+?)(| .+) )((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'))|(?:dans (?:la |le |l')|de (?:la |l')|du ))(.+)/i;

  /** élément générique placé dans complément -> déterminant(1), nom(2), féminin?(3), type(4), adjectif(5), position(6) complément(7)*/
  readonly xEmplacementGenerique = /^(le |la |l')(.+?)(\(f\))? est (?:|(?:(?:un|une) (.+?)(| .+)))(?:dans le |dans la |dans l'| du | de la |de l')(.+?)/i;

  constructor() { }
  ngOnInit() { }

  parseCode() {
    // découper le code source en phrases
    this.phrases = this.codeSource.replace(/(\r|\n)/g, "").split('.');
    console.log("phrases: ", this.phrases);
    // retrouver les salles dans le code source
    this.salles = new Array<Salle>();
    this.generiques = new Array<Element>();
    console.log("Analyse de la position des éléments génériques");
    let result: RegExpExecArray;
    this.phrases.forEach(phrase => {
      console.log("Analyse : ", phrase);
      result = this.xPositionElementGenerique.exec(phrase);
      if (result !== null) {
        //console.log(" ==> e générique posistionné ", result);
        let e = new ElementGenerique(
          result[1],
          result[2],
          this.getTypeElement(result[4]),
          new PositionSujetString(result[2], result[7], result[6]),
          this.getGenre(result[1], result[3]),
          Nombre.s
        );
        console.log(e);
      } else {
        // result = this.xEmplacementGenerique.exec(phrase);
        // if (result !== null) {
        //   console.log(" ==> emplacement él générique ", result);
        //   let e = new ElementGenerique(
        //     result[1],
        //     result[2],
        //     this.getTypeElement(result[4]),
        //     new PositionSujetString(result[2], result[8], result[6]),
        //     this.getGenre(result[1], result[3]),
        //     Nombre.s
        //   );
        //   console.log(" ===> ", e);
        //   }
      }


      // console.log("Analyse de la phrase (SALLE) : ", phrase);
      // let m = this.xSujetSalle.exec(phrase);
      // console.log(" ==> ", m);
      // // la phrase décrit une salle
      // if (m) {
      //   let salle = new Salle(m[2], m[1], this.getGenre(m[1], m[3]), Nombre.s);
      //   this.salles.push(salle);
      // }
    });

    console.log("SALLES: ", this.salles);

  }

  getTypeElement(typeElement: string): TypeElement {
    let retVal = TypeElement.aucun;

    if (typeElement) {
      switch (typeElement.trim().toLocaleLowerCase()) {
        case "animal":
          retVal = TypeElement.animal;
          break;
        case "contenant":
          retVal = TypeElement.contenant;
          break;
        case "décors":
        case "décor":
        case "decor":
        case "decors":
          retVal = TypeElement.decor;
          break;
        case "humain":
          retVal = TypeElement.humain;
          break;
        case "objet":
          retVal = TypeElement.objet;
          break;
        case "porte":
          retVal = TypeElement.porte;
          break;
        case "salle":
          retVal = TypeElement.salle;
          break;
        default:
          retVal = TypeElement.inconnu;
          break;
      }
    }
    return retVal;
  }

  /** Obtenir le genre d'un élément du donjon. */
  getGenre(determinant: string, feminin: string): Genre {
    let retVal = Genre.n;

    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
          retVal = Genre.m;
          break;
        case "la":
          retVal = Genre.f;
          break;
        case "l'":
          if (feminin && feminin.trim() == "(f)") {
            retVal = Genre.f;
          } else {
            retVal = Genre.m;
          }
          break;
        default:
          break;
      }
    }
    return retVal;
  }

}
