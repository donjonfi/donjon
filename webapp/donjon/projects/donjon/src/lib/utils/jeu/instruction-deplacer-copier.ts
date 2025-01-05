import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";
import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";
import { PositionObjet, PrepositionSpatiale } from "../../models/jeu/position-objet";

import { ClasseUtils } from "../commun/classe-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { MotUtils } from "../commun/mot-utils";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";
import { PositionsUtils } from "../commun/positions-utils";
import { Resultat } from "../../models/jouer/resultat";

export class InstructionDeplacerCopier {

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) { }

  /** Déplacer (ceci, joueur) vers (cela, joueur, ici). */
  public executerDeplacer(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, contexteTour: ContexteTour | undefined): Resultat {

    if (this.verbeux) {
      console.log("executerDeplacer >>> \nsujet=", sujet, "\npreposition=", preposition, "\ncomplément=", complement, "\ncontexteTour=", contexteTour);
    }
    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur' && preposition != 'sous') {
      console.error("executerDeplacer >>> préposition pas reconnue:", preposition);
    }

    // trouver l’élément à déplacer
    const objets = this.trouverObjetsDeplacementCopie(sujet, contexteTour);

    // retrouver le nombre d’occurrence (quantité) à déplacer
    let quantiteSujet = MotUtils.getQuantite(sujet.determinant, 1);

    // console.log(">> sujet.determinant=", sujet.determinant);
    // console.log(">> quantiteSujet=", quantiteSujet);


    // trouver la destination
    const destination = InstructionsUtils.trouverElementCible(complement, contexteTour, this.eju, this.jeu);

    if (destination && ClasseUtils.heriteDe(destination.classe, EClasseRacine.element)) {
      // si on a trouver le sujet et la destination, effectuer le déplacement.
      if (objets?.length == 1) {
        const curQuantite = InstructionsUtils.corrigerQuantite(objets[0], quantiteSujet);
        resultat = this.executerDeplacerObjetVersDestination(objets[0], preposition, destination as ElementJeu, curQuantite);
        // si on a trouvé le sujet (liste d’objets) et la destination, effectuer les déplacements. 
      } else if (objets?.length > 1) {
        resultat.succes = true;
        // objets contenus trouvés
        objets.forEach(el => {
          const curQuantite = InstructionsUtils.corrigerQuantite(el, quantiteSujet);
          resultat.succes = (resultat.succes && this.executerDeplacerObjetVersDestination(el, preposition, destination as ElementJeu, curQuantite).succes);
        });
      }
    }

    return resultat;
  }

  /** Copier sujet (ceci) vers complément (cela, joueur, ici). */
  public executerCopier(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, contexteTour: ContexteTour): Resultat {

    if (this.verbeux) {
      console.log("executerCopier >>> \nsujet=", sujet, "\npreposition=", preposition, "\ncomplément=", complement, "\ncontexteTour=", contexteTour);
    }
    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur' && preposition != 'sous') {
      console.error("executerCopier >>> préposition pas reconnue:", preposition);
    }

    // trouver l’élément à copier
    const objets = this.trouverObjetsDeplacementCopie(sujet, contexteTour);

    // retrouver le nombre d’occurrence (quantité) à copier
    let quantiteSujet = MotUtils.getQuantite(sujet.determinant, 1);

    // trouver la destination
    const destination = InstructionsUtils.trouverElementCible(complement, contexteTour, this.eju, this.jeu);

    if (destination && ClasseUtils.heriteDe(destination.classe, EClasseRacine.element)) {
      // si on a trouvé le sujet et la destination, effectuer la copie.
      if (objets?.length == 1) {
        resultat = this.executerCopierObjetVersDestination(objets[0], preposition, destination as ElementJeu, quantiteSujet);
        // si on a trouvé le sujet (liste d’objets) et la destination, effectuer les déplacements. 
      } else if (objets?.length > 1) {
        resultat.succes = true;
        // objets contenus trouvés
        objets.forEach(el => {
          resultat.succes = (resultat.succes && this.executerCopierObjetVersDestination(el, preposition, destination as ElementJeu, quantiteSujet).succes);
        });
      }
    }

    return resultat;
  }

  /**
   * Déplacer un élément du jeu.
   */
  public executerDeplacerObjetVersDestination(objetSource: Objet, preposition: string, destination: ElementJeu, quantite: number): Resultat {

    let resultat = new Resultat(false, '', 1);
    let objetDeplace: Objet = null;

    // interpréter "vers" comme "dans".
    if (preposition == 'vers') {
      // support => sur
      if (ClasseUtils.heriteDe(destination.classe, EClasseRacine.support)) {
        preposition = "sur";
        // contenant, joueur, lieu, ...
      } else {
        preposition = "dans";
      }
    }

    // TODO: vérifications
    const nouvellePosition = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // regarder si un exemplaire de l’objet existe déjà à la destination
    let exemplaireDejaContenu = this.eju.getExemplaireDejaContenu(objetSource, nouvellePosition.pre, destination);

    // console.warn("?? quantite=", quantite);
    // console.warn("?? objetSource.quantite=", objetSource.quantite);

    // si on déplace tout et qu’il n’y a pas encore d’exemplaire
    if (quantite === objetSource.quantite && !exemplaireDejaContenu) {
      // console.log("exectuterDeplacerObjetVersDestination > cas 1");
      // déplacer simplement l’objet vers sa nouvelle destination
      objetSource.position = nouvellePosition;
      objetDeplace = objetSource;
      // console.log("exectuterDeplacerObjetVersDestination > fin 1");
      // si on copie seulement une partie ou qu’on copie tout dans un endroit qui en contient déjà
    } else {
      // si l’objet n’est pas encore contenu dans la nouvelle distination, il faut le dupliquer
      if (!exemplaireDejaContenu) {
        // console.log("exectuterDeplacerObjetVersDestination > cas 2");
        // copier l’objet
        let copie = this.eju.copierObjet(objetSource);
        // ajouter l’objet aux objets du jeu et lui définir un ID unique
        this.jeu.objets.push(copie);
        copie.id = this.jeu.nextID++; // définir l’ID de la copie
        // définir la quantité et le nombre de la copie
        copie.quantite = quantite;
        copie.nombre = (quantite === 1) ? Nombre.s : Nombre.p; // quantité ne devrait jamais valoir 0 !
        if (objetSource.nombre === Nombre.tp) {
          copie.nombre = Nombre.tp;
        }
        // définir la position de la copie
        copie.position = nouvellePosition;
        objetDeplace = copie;
        // si l’objet est déjà présent à cet endroit, augmenter la quantité
      } else {
        // si la quantité de l’exemplaire de destination n’est pas encore infinie
        if (exemplaireDejaContenu.quantite !== -1) {
          // si la quantité à copier est infinie
          if (quantite === -1 && objetSource.quantite === -1) {
            // console.log("exectuterDeplacerObjetVersDestination > cas 3a");
            exemplaireDejaContenu.quantite = -1;
            exemplaireDejaContenu.nombre = Nombre.p;
            // si quantité augmente normalement => augmenter quantité de l’original
          } else {
            // console.log("exectuterDeplacerObjetVersDestination > cas 3b");
            exemplaireDejaContenu.quantite += quantite;
            exemplaireDejaContenu.nombre = Nombre.p;
          }
          if (objetSource.nombre === Nombre.tp) {
            exemplaireDejaContenu.nombre = Nombre.tp;
          }
        } else {
          // console.log("exectuterDeplacerObjetVersDestination > cas 3c");
        }
        objetDeplace = exemplaireDejaContenu;
      }

      // si on a déplacé tous les exemplaires de l’objetSource et que l’objet déplacé final n’est pas l’objetSource
      // effacer l’objet source
      if (objetDeplace !== objetSource && quantite === objetSource.quantite) {
        // console.log("exectuterDeplacerObjetVersDestination > fin 2");
        // effacer l’objet à déplacer (puisqu’on a augmenté la quantité à la place)
        const indexObjet = this.jeu.objets.indexOf(objetSource);
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
        } else {
          console.error("exectuterDeplacerObjetVersDestination >> pas pu retrouver l’objet à supprimer.");
        }
        // sinon diminuer la quantité
      } else {
        // console.log("exectuterDeplacerObjetVersDestination > fin 3");
        // diminuer quantité
        objetSource.quantite -= quantite;
        // vérifier le genre
        if (objetSource.quantite === 1 && objetSource.nombre != Nombre.tp) {
          objetSource.nombre = Nombre.s;
        }
      }

    }

    // si l'objet déplacé est le joueur, modifier la visibilité des objets
    if (objetDeplace.id === this.jeu.joueur.id) {

      // la présence des objets a changé
      this.eju.majPresenceDesObjets();

      // l’adjacence des lieux a changé
      this.eju.majAdjacenceLieux();

      // si l'objet déplacé n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objetDeplace.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est plus possédé ni porté
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.possede, this.eju, true);
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.porte, this.eju, true);
        // l’objet n’est plus caché (car on n’est pas sensé examiner directement un lieu)
        this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.cache, this.eju, true);
        // si la destination est le lieu actuel, l'objet est présent
        if (objetDeplace.position.cibleId === this.eju.curLieu.id) {
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.present, this.eju, true);
          // si c'est un autre lieu, l’objet n'est plus présent.
        } else {
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.present, this.eju, true);
        }
        // l’élément est disponible puisque ni porté ni occupé par un autre vivant
        this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.disponible, this.eju, true);
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est présent, possédé, a été vu par le joueur et n’est plus caché
        if (destination.id === this.jeu.joueur.id) {
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.present, this.eju, true);
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.possede, this.eju, true);
          // (retrait auto de caché quand vu)
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.vu, this.eju, true);
          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé ni porté
          // TODO: un objet dans un contenant possédé est-il possédé ?
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.possede, this.eju, true);
          // TODO: un objet dans un contenant porté est-il porté ?
          this.jeu.etats.retirerEtatElement(objetDeplace, EEtatsBase.porte, this.eju, true);
          // L’objet est disponible
          // TODO: statut « occupé » si le contenant est un être vivant.
          this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.disponible, this.eju, true);
          this.eju.majPresenceObjet(objetDeplace);
        }
      }

      // si l’objet déplacé est un contenant ou un support, il faut màj les objets contenus
      let contenu: Objet[] = [];
      if (ClasseUtils.heriteDe(objetDeplace.classe, EClasseRacine.support)) {
        contenu = this.eju.obtenirContenu(objetDeplace, PrepositionSpatiale.sur);
      } else if (ClasseUtils.heriteDe(objetDeplace.classe, EClasseRacine.contenant)) {
        contenu = this.eju.obtenirContenu(objetDeplace, PrepositionSpatiale.dans);
      }
      if (contenu?.length > 0) {
        contenu.forEach(curObj => {
          this.eju.majPresenceObjet(curObj);
        });
      }

    }

    // l’objet source a été modifié
    this.jeu.etats.ajouterEtatElement(objetSource, EEtatsBase.modifie, this.eju, true);
    // l’objet déplacé a été déplacé
    this.jeu.etats.ajouterEtatElement(objetDeplace, EEtatsBase.deplace, this.eju, true);
    // la destination a été modifiée
    this.jeu.etats.ajouterEtatElement(destination, EEtatsBase.modifie, this.eju, true);

    resultat.succes = true;
    return resultat;
  }

  /**
   * Copier un élément du jeu.
   */
  private executerCopierObjetVersDestination(original: Objet, preposition: string, destination: ElementJeu, quantite: number): Resultat {
    let resultat = new Resultat(false, '', 1);

    // interpréter "vers" comme "dans".
    if (preposition == 'vers') {
      // support => sur
      if (ClasseUtils.heriteDe(destination.classe, EClasseRacine.support)) {
        preposition = "sur";
        // contenant, joueur, lieu, ...
      } else {
        preposition = "dans";
      }
    }

    // corriger la quantité
    // -1 => si nombre de copies pas précisé, on prend 1 seul exemplaire
    if (quantite < 1) {
      quantite = 1;
    }

    // si l’objet à copier est le joueur, refuser !
    if (original.id === this.jeu.joueur.id) {
      console.error("exectuterCopierObjetVersDestination >> Le joueur ne peut pas être copié !");
    }

    // TODO: vérifications
    const positionCopie = new PositionObjet(
      PrepositionSpatiale[preposition],
      ClasseUtils.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    let copie = this.eju.copierObjet(original);

    // si la destination de la copie est la même que celle de l’original, augmenter la quantité
    if (PositionsUtils.positionsIdentiques(original.position, positionCopie)) {
      // si la quantité n’est pas infinie, augmenter de la quantité à copier
      if (original.quantite !== -1) {
        original.quantite += quantite;
        original.nombre = Nombre.p;
      }
      // destination de la copie est différente
    } else {

      // si cet objet est déjà présent à cet endroit, augmenter la quantité
      let exemplaireDejaContenu = this.eju.getExemplaireDejaContenu(original, positionCopie.pre, destination);

      // déjà présent
      if (exemplaireDejaContenu !== null) {
        // => destination: on augmente la quantité de l’objet
        // si la quantité n’est pas infinie, augmenter de la quantité à copier
        if (exemplaireDejaContenu.quantite !== -1) {
          exemplaireDejaContenu.quantite += quantite;
          exemplaireDejaContenu.nombre = Nombre.p;
        }
        // pas encore présent => on ajoute la copie aux objets
      } else {
        this.jeu.objets.push(copie);
        copie.quantite = quantite; // définir la quantité
        copie.id = this.jeu.nextID++; // définir l’ID de la copie
        // remarque: on utilise la méthode déplacer afin de mettre à jour tous les attributs de l’objet et du contenant.
        this.executerDeplacerObjetVersDestination(copie, preposition, destination, copie.quantite);
      }
    }
    resultat.succes = true;
    return resultat;
  }

  /**
   * Trouver les objets à déplacer ou à copier.
   */
  private trouverObjetsDeplacementCopie(sujet: GroupeNominal, contexteTour: ContexteTour) {
    let objet: Objet = null;
    let objets: Objet[] = null;

    // si on déplace ceci, vérifier si ceci est un objet
    if ((sujet.nom.endsWith(" ceci") || sujet.nom === 'ceci') && (!ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet))) {
      console.error("Copier/Déplacer ceci ou contenu ceci: ceci n'est pas un objet.");
    }
    // si on déplace cela, vérifier si cela est un objet
    else if ((sujet.nom.endsWith(" cela") || sujet.nom === 'cela') && (!ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet))) {
      console.error("Copier/Déplacer cela ou contenu cela: cela n'est pas un objet.");
    } else {
      switch (sujet.nom) {
        case "ceci":
          objet = contexteTour.ceci as Objet;
          break;
        case "cela":
          objet = contexteTour.cela as Objet;
          break;
        case "joueur":
          objet = this.jeu.joueur;
          break;
        case "objets dans ceci":
          objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.dans);
          break;
        case "objets sur ceci":
          objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.sur);
          break;
        case "objets sous ceci":
          objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.sous);
          break;
        case "objets dans cela":
          objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.dans);
          break;
        case "objets sur cela":
          objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.sur);
          break;
        case "objets sous cela":
          objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.sous);
          break;
        case "objets ici":
          objets = this.eju.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
          break;

        default:
          let correspondanceSujet = this.eju.trouverCorrespondance(sujet, TypeSujet.SujetEstNom, false, false);
          // un élément trouvé
          if (correspondanceSujet.elements.length === 1) {
            objet = correspondanceSujet.objets[0];
            // aucun élément trouvé
          } else if (correspondanceSujet.elements.length === 0) {
            console.error("trouverObjetsDeplacementCopie >>> je n’ai pas trouvé l’objet:", sujet);
            // plusieurs éléments trouvés
          } else {
            console.error("trouverObjetsDeplacementCopie >>> j’ai trouvé plusieurs correspondances pour l’objet:", sujet);
          }
          break;
      }
    }

    // si un seul objet, le mettre dans un tableau pour le retour
    if (objet) {
      objets = [];
      objets.push(objet);
    }

    return objets;
  }


}