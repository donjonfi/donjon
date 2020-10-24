import { Classe, EClasseRacine } from '../../models/commun/classe';
import { ConditionDebutee, StatutCondition, xFois } from '../../models/jouer/statut-conditions';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';

import { ConditionsUtils } from './conditions-utils';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { Jeu } from '../../models/jeu/jeu';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { Resultat } from '../../models/jouer/resultat';

export class Instructions {

  private cond: ConditionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
  }

  public executerInstructions(instructions: Instruction[], ceci: ElementJeu = null, cela: ElementJeu = null): Resultat {

    let resultat = new Resultat(true, '', 0);
    if (instructions && instructions.length > 0) {
      instructions.forEach(ins => {
        const subResultat = this.executerInstruction(ins, ceci, cela);
        resultat.nombre += subResultat.nombre;
        resultat.succes = (resultat.succes && subResultat.succes);
        resultat.sortie += subResultat.sortie;
      });
    }

    return resultat;
  }

  public executerInstruction(instruction: Instruction, ceci: ElementJeu = null, cela: ElementJeu = null): Resultat {

    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction);
    }
    // instruction conditionnelle
    if (instruction.condition) {

      const estVrai = this.cond.siEstVrai(null, instruction.condition, ceci, cela);
      if (this.verbeux) {
        console.log(">>>> estVrai=", estVrai);
        
      }
      if (estVrai) {
        sousResultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, ceci, cela);
      } else {

        sousResultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, ceci, cela);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        //if (instruction.sujet == null && instruction.verbe) {
        sousResultat = this.executerInfinitif(instruction.instruction, ceci, cela);
        // } else if (instruction.sujet) {
        // this.executerSujetVerbe(instruction);
      } else {
        console.warn("executerInstruction : pas d'infinitif :", instruction);
      }
    }
    resultat.sortie += sousResultat.sortie;

    // console.warn("exInstruction >>> instruction=", instruction, "resultat=", resultat);

    return resultat;
  }

  private interpreterContenuDire(contenu: string, ceci: ElementJeu = null, cela: ElementJeu = null) {

    // description
    if (contenu.includes("[description")) {
      if (contenu.includes("[description ici]")) {
        const descIci = this.calculerDescription(this.eju.curLieu.description, ++this.eju.curLieu.nbAffichageDescription, ceci, cela);
        contenu = contenu.replace(/\[description ici\]/g, descIci);
      }
      if (contenu.includes("[description ceci]")) {
        const descCeci = this.calculerDescription(ceci.description, ++ceci.nbAffichageDescription, ceci, cela);
        contenu = contenu.replace(/\[description ceci\]/g, descCeci);
      }
      if (contenu.includes("[description cela]")) {
        const descCela = this.calculerDescription(cela.description, ++cela.nbAffichageDescription, ceci, cela);
        contenu = contenu.replace(/\[description cela\]/g, descCela);
      }
    }

    // examen
    if (contenu.includes("[examen")) {
      if (contenu.includes("[examen ici]")) {
        const examenIci = this.calculerDescription(this.eju.curLieu.examen, ++this.eju.curLieu.nbAffichageExamen, ceci, cela);
        contenu = contenu.replace(/\[examen ici\]/g, examenIci);
      }
      if (contenu.includes("[examen ceci]")) {
        const examenCeci = this.calculerDescription(ceci.examen, ++ceci.nbAffichageExamen, ceci, cela);
        contenu = contenu.replace(/\[examen ceci\]/g, examenCeci);
      }
      if (contenu.includes("[examen cela]")) {
        const examenCela = this.calculerDescription(cela.examen, ++cela.nbAffichageExamen, ceci, cela);
        contenu = contenu.replace(/\[examen cela\]/g, examenCela);
      }
    }

    // contenu
    if (contenu.includes("[contenu")) {
      if (contenu.includes("[contenu ceci]")) {
        const contenuCeci = this.executerAfficherContenu(ceci);
        contenu = contenu.replace(/\[contenu ceci\]/g, contenuCeci.sortie);
      }
      if (contenu.includes("[contenu cela]")) {
        const contenuCela = this.executerAfficherContenu(cela);
        contenu = contenu.replace(/\[contenu cela\]/g, contenuCela.sortie);
      }
    }

    // intitulé
    if (contenu.includes("[intitulé")) {
      if (contenu.includes("[intitulé ici]")) {
        const intIci = this.eju.curLieu.intitule.determinant + this.eju.curLieu.intitule.nom + this.eju.curLieu.intitule.epithete;
        contenu = contenu.replace(/\[intitulé ici\]/g, intIci);
      }
      if (contenu.includes("[intitulé ceci]")) {
        const intCeci = ceci.intitule.determinant + ceci.intitule.nom + (ceci.intitule.epithete ? (" " + ceci.intitule.epithete) : "");
        contenu = contenu.replace(/\[intitulé ceci\]/g, intCeci);
      }
      if (contenu.includes("[intitulé cela]")) {
        const intCela = cela.intitule.determinant + cela.intitule.nom + (cela.intitule.epithete ? (" " + cela.intitule.epithete) : "");
        contenu = contenu.replace(/\[intitulé cela\]/g, intCela);
      }
    }


    // accord
    if (contenu.includes("[accord")) {
      if (contenu.includes("[accord ici]")) {
        const accordIci = (this.eju.curLieu.genre === Genre.f ? "e" : "") + (this.eju.curLieu.nombre === Nombre.p ? "s" : "");
        contenu = contenu.replace(/\[accord ici\]/g, accordIci);
      }
      if (contenu.includes("[accord ceci]")) {
        const accordCeci = (ceci.genre === Genre.f ? "e" : "") + (ceci.nombre === Nombre.p ? "s" : "");
        contenu = contenu.replace(/\[accord ceci\]/g, accordCeci);
      }
      if (contenu.includes("[accord cela]")) {
        const accordCela = (cela.genre === Genre.f ? "e" : "") + (cela.nombre === Nombre.p ? "s" : "");
        contenu = contenu.replace(/\[accord cela\]/g, accordCela);
      }
    }

    // interpréter les balises encore présentes
    if (contenu.includes("[")) {
      contenu = this.calculerDescription(contenu, 0, ceci, cela);
    }

    return contenu;

  }

  private executerInfinitif(instruction: ElementsPhrase, ceci: ElementJeu = null, cela: ElementJeu = null): Resultat {
    let resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (ceci=", ceci, "cela=", cela, ")");

    switch (instruction.infinitif.toLowerCase()) {
      case 'dire':
        // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
        const complement = instruction.complement.trim();
        let contenu = complement.slice(1, complement.length - 1).trim();
        contenu = this.interpreterContenuDire(contenu, ceci, cela);
        resultat.sortie += contenu;
        // si la chaine se termine par un espace, ajouter un saut de ligne.
        if (complement.endsWith(' "')) {
          resultat.sortie += "\n";
        }
        break;
      case 'changer':
        sousResultat = this.executerChanger(instruction, ceci, cela);
        resultat.succes = sousResultat.succes;
        break;

      case 'déplacer':
        sousResultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement, ceci as Objet, cela);
        resultat.succes = sousResultat.succes;
        break;

      case 'effacer':
        sousResultat = this.executerEffacer(ceci);
        resultat.succes = sousResultat.succes;
        break;

      case 'sauver':
        console.log("executerInfinitif >> sauver=", instruction.complement);
        if (instruction.complement) {
          this.jeu.sauvegardes.push(instruction.complement);
          resultat.succes = true;
        } else {
          resultat.succes = false;
        }
        break;

      default:
        console.warn("executerVerbe : pas compris instruction:", instruction);
        break;
    }

    return resultat;
  }



  /**
   * Afficher le contenu d'un objet ou d'un lieu.
   */
  public executerAfficherContenu(ceci: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      let els: Objet[] = null;
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id);
        resultat.succes = true;
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id);
        resultat.succes = true;
      } else {
        console.error("executerAfficherContenu: classe racine pas pris en charge:", ceci.classe);
      }

      if (resultat.succes) {
        els.forEach(el => {
          resultat.sortie += "- " + el.intitule.determinant + el.intitule.nom + (el.intitule.epithete ? (" " + el.intitule.epithete) : "") + "\n";
        });
      }

    }
    return resultat;
  }

  /**
   * Renvoyer le contenu d'un objet ou d'un lieu.
   */
  public obtenirContenu(ceci: ElementJeu): Objet[] {
    let els: Objet[] = null;
    if (ceci) {
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.objet && x.position.cibleId === ceci.id);
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        els = this.jeu.objets.filter(x => x.position && x.position.cibleType === EClasseRacine.lieu && x.position.cibleId === ceci.id);
      } else {
        console.error("obtenirContenu: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return els;
  }

  private executerDeplacer(sujet: GroupeNominal, preposition: string, complement: GroupeNominal, ceci: Objet = null, cela: ElementJeu = null): Resultat {

    console.log("executerDeplacer >>> sujet=", sujet, "preposition=", preposition, "complément=", complement, "ceci=", ceci, "cela=", cela);

    let resultat = new Resultat(false, '', 1);

    if (preposition !== "vers" && preposition !== "dans" && preposition !== 'sur') {
      console.error("executerDeplacer >>> préposition pas reconnue:", preposition);
    }

    let objet: Objet;
    let destination: ElementJeu;

    // trouver l’élément à déplacer

    switch (sujet.nom) {
      case "ceci":
        objet = ceci;
        break;
      case "joueur":
        objet = this.jeu.joueur;
        break;
      default:
        let correspondanceSujet = this.eju.trouverCorrespondance(sujet);
        // un élément trouvé
        if (correspondanceSujet.elements.length === 1) {
          objet = correspondanceSujet.objets[0];
          // aucun élément trouvé
        } else if (correspondanceSujet.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé l’objet:", sujet);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour l’objet:", sujet);
        }
        break;
    }

    switch (complement.nom) {
      case 'cela':
        destination = cela;
        break;

      case 'joueur':
        destination = this.jeu.joueur;
        break;

      case 'ici':
        destination = this.eju.curLieu;
        break;

      default:
        let correspondanceCompl = this.eju.trouverCorrespondance(complement);
        // un élément trouvé
        if (correspondanceCompl.elements.length === 1) {
          destination = correspondanceCompl.elements[0];
          // aucun élément trouvé
        } else if (correspondanceCompl.elements.length === 0) {
          console.error("executerDeplacer >>> je n’ai pas trouvé la destination:", complement);
          // plusieurs éléments trouvés
        } else {
          console.error("executerDeplacer >>> j’ai trouvé plusieurs correspondances pour la destination:", complement);
        }
        break;
    }

    // si on a trouver le sujet et la distination, effectuer le déplacement.
    if (objet && destination) {
      resultat = this.exectuterDeplacerObjetVersDestination(objet, preposition, destination);
    }

    return resultat;
  }

  private exectuterDeplacerObjetVersDestination(objet: Objet, preposition: string, destination: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);

    // TODO: vérifications
    objet.position = new PositionObjet(
      PrepositionSpatiale[preposition],
      Classe.heriteDe(destination.classe, EClasseRacine.lieu) ? EClasseRacine.lieu : EClasseRacine.objet,
      destination.id
    );

    // si l'objet à déplacer est le joueur, modifier la visibilité des objets
    if (objet.id === this.jeu.joueur.id) {
      // la visibilité des objets a changé
      this.eju.majVisibiliteDesObjets();

      // si l'objet à déplacer n'est pas le joueur
    } else {
      // si la destination est un lieu
      if (objet.position.cibleType === EClasseRacine.lieu) {
        // l'objet n'est pas possédé
        objet.possede = false;
        // si la destination est le lieu actuel, l'objet est visible
        if (objet.position.cibleId === this.eju.curLieu.id) {
          objet.visible = true;
          // si c'est un autre lieu, il n'est pas visible.
        } else {
          objet.visible = false;
        }
        // si la destination est un objet
      } else {
        // si la destination est le joueur, l'objet est visible et possédé
        if (destination.id === this.jeu.joueur.id) {
          objet.visible = true;
          objet.possede = true;
          // sinon, on va analyser le contenant qui est forcément un objet.
        } else {
          // forcément l'objet n'est pas possédé
          objet.possede = false;
          this.eju.majVisibiliteObjet(objet);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

  private executerEffacer(ceci: ElementJeu = null): Resultat {
    let resultat = new Resultat(false, '', 1);
    if (ceci) {
      // objet
      if (Classe.heriteDe(ceci.classe, EClasseRacine.objet)) {
        const indexObjet = this.jeu.objets.indexOf((ceci as Objet));
        if (indexObjet !== -1) {
          this.jeu.objets.splice(indexObjet, 1);
          resultat.succes = true;
        }
        // lieu
      } else if (Classe.heriteDe(ceci.classe, EClasseRacine.lieu)) {
        const indexLieu = this.jeu.objets.indexOf((ceci as Objet));
        if (indexLieu !== -1) {
          this.jeu.lieux.splice(indexLieu, 1);
          resultat.succes = true;
        }
      } else {
        console.error("executerEffacer: classe racine pas pris en charge:", ceci.classe);
      }
    }
    return resultat;
  }

  private executerChanger(instruction: ElementsPhrase, ceci: ElementJeu = null, cela: ElementJeu = null): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        case 'joueur':
          resultat = this.executerJoueur(instruction, ceci, cela);
          break;

        // case 'inventaire':
        //   resultat = this.executerInventaire(instruction);
        //   break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet);

          // PAS OBJET ET PAS LIEU
          if (correspondance.objets.length === 0 && correspondance.lieux.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);

            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.executerElementJeu(correspondance.objets[0], instruction);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
            }
          } else {
            console.error("executerChanger: trouvé lieu(x) ET objet(s):", correspondance);
          }
          break;
      }
    } else {
      console.error("executerChanger : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  private executerJoueur(instruction: ElementsPhrase, ceci: ElementJeu, cela: ElementJeu): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'se trouve':
        resultat = this.executerDeplacer(instruction.sujet, instruction.preposition, instruction.sujetComplement);
        break;
      case 'possède':
        console.error("POSSÈDE : ", instruction);
        if (instruction.sujetComplement) {
          resultat = this.executerDeplacer(instruction.sujetComplement, "vers", instruction.sujet);
        } else if (instruction.complement) {
          let els: Objet[] = null;
          if (instruction.complement.endsWith('contenu de ceci')) {
            els = this.obtenirContenu(ceci);
          } else if (instruction.complement.endsWith('contenu de cela')) {
            els = this.obtenirContenu(cela);
          }
          if (els) {
            els.forEach(el => {
              resultat = this.exectuterDeplacerObjetVersDestination(el, 'vers', this.jeu.joueur);
            });
          }
        }
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  // positionnerJoueur(position: string): Resultat {

  //   let resultat = new Resultat(true, '', 1);

  //   position = position.trim().replace(/^au |dans (le |la |l'|l’)|à l’intérieur (du|de l’|de l'|de la |des )|sur (le |la |l’|l'|les)/i, '');
  //   // chercher le lieu
  //   let lieuxTrouves = this.jeu.lieux.filter(x => StringUtils.normaliserMot(x.nom).startsWith(position));
  //   // si on n’a pas trouvé
  //   if (lieuxTrouves.length == 0) {
  //     console.error("positionnerJoueur : pas pu trouver le lieu correspondant à la position", position);
  //     resultat.succes = false;
  //     // si on a trouvé un lieu
  //   } else if (lieuxTrouves.length === 1) {
  //     this.jeu.position = lieuxTrouves[0].id;
  //     // si on a trouvé plusieurs lieux différents
  //   } else if (lieuxTrouves.length > 1) {
  //     // TODO: ajouter des mots en plus
  //     console.error("positionnerJoueur : plusieurs lieux trouvés pour la position", position);
  //     resultat.succes = false;
  //   }

  //   return resultat;
  // }

  // private executerInventaire(instruction: ElementsPhrase): Resultat {
  //   let resultat = new Resultat(false, '', 1);

  //   switch (instruction.verbe.toLowerCase()) {
  //     case 'contient':
  //       resultat = this.ajouterInventaire(instruction.sujetComplement);
  //       break;

  //     default:
  //       console.error("executerInventaire : pas compris verbe", instruction.verbe, instruction);
  //       break;
  //   }
  //   return resultat;
  // }

  private executerElementJeu(element: ElementJeu, instruction: ElementsPhrase): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
        // retirer un état
        if (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus') {
          console.log("executerElementJeu: retirer l’état ", instruction.complement);
          ElementsJeuUtils.retirerEtat(element, instruction.complement, null);
          // ajouter un état
        } else {
          console.log("executerElementJeu: ajouter l’état ", instruction.complement);
          ElementsJeuUtils.ajouterEtat(element, instruction.complement);
        }
        break;

      default:
        resultat.succes = false;
        console.warn("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        break;
    }
    return resultat;
  }

  // ajouterInventaire(intitule: GroupeNominal): Resultat {

  //   let resultat = new Resultat(false, '', 1);

  //   if (intitule) {
  //     let objetTrouve = this.eju.trouverElementJeu(intitule, EmplacementElement.partout, true, false);
  //     if (objetTrouve === -1) {
  //       console.warn("ajouterInventaire > plusieurs objets trouvés:", intitule);
  //     } else if (objetTrouve) {
  //       const nouvelObjet = this.eju.prendreElementJeu(objetTrouve.id);
  //       let cible = nouvelObjet;
  //       // si l'inventaire contient déjà le même objet, augmenter la quantité
  //       let objInv = this.jeu.inventaire.objets.find(x => x.id == nouvelObjet.id);
  //       if (objInv) {
  //         objInv.quantite += 1;
  //         cible = objInv;
  //       } else {
  //         this.jeu.inventaire.objets.push(nouvelObjet);
  //       }
  //       resultat.succes = true;
  //     } else {
  //       console.warn("ajouterInventaire > objet pas trouvé:", intitule);
  //     }
  //   } else {
  //     console.error("ajouterInventaire >>> intitulé est null.");
  //   }
  //   return resultat;
  // }



  calculerDescription(description: string, nbAffichage: number, ceci: ElementJeu, cela: ElementJeu) {
    let retVal = "";
    if (description) {
      const morceaux = description.split(/\[|\]/);
      let statut = new StatutCondition(nbAffichage, morceaux, 0);
      // jamais une condition au début car dans ce cas ça donne une première chaine vide.
      let suivantEstCondition = false; // description.trim().startsWith("[");
      let afficherMorceauSuivant = true;
      // console.log("$$$$$$$$$$$ morceaux=", morceaux, "suivantEstCondition=", suivantEstCondition);
      for (let index = 0; index < morceaux.length; index++) {
        statut.curMorceauIndex = index;
        const curMorceau = morceaux[index];
        if (suivantEstCondition) {
          afficherMorceauSuivant = this.estConditionRemplie(curMorceau, statut, ceci, cela);
          suivantEstCondition = false;
        } else {
          if (afficherMorceauSuivant) {
            retVal += curMorceau;
          }
          suivantEstCondition = true;
        }
      }
    } else {
      retVal = "";
    }
    return retVal;
  }


  estConditionRemplie(condition: string, statut: StatutCondition, ceci: ElementJeu, cela: ElementJeu): boolean {

    let retVal = false;
    let conditionLC = condition.toLowerCase();
    const resultFois = conditionLC.match(xFois);

    if (resultFois) {
      statut.conditionDebutee = ConditionDebutee.fois;
      const nbFois = Number.parseInt(resultFois[1], 10);
      statut.nbChoix = this.calculerNbChoix(statut);
      retVal = (statut.nbAffichage === nbFois);
      // Au hasard
      // TODO: au hasard
    } else if (conditionLC === "au hasard") {
      statut.conditionDebutee = ConditionDebutee.hasard;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = this.calculerNbChoix(statut);
      // choisir un choix au hasard
      const rand = Math.random();
      statut.choixAuHasard = Math.floor(rand * statut.nbChoix) + 1;
      retVal = (statut.choixAuHasard == 1);
    } else if (conditionLC === "en boucle") {
      statut.conditionDebutee = ConditionDebutee.boucle;
      statut.dernIndexChoix = 1;
      // compter le nombre de choix
      statut.nbChoix = this.calculerNbChoix(statut);
      retVal = (statut.nbAffichage % statut.nbChoix === 1);
    } else if (conditionLC.startsWith("si ")) {
      statut.conditionDebutee = ConditionDebutee.si;
      // TODO: vérifier le si
      statut.siVrai = this.cond.siEstVrai(conditionLC, null, ceci, cela);
      retVal = statut.siVrai;
    } else if (statut.conditionDebutee != ConditionDebutee.aucune) {
      retVal = false;
      switch (conditionLC) {

        case 'ou':
          if (statut.conditionDebutee == ConditionDebutee.hasard) {
            retVal = (statut.choixAuHasard === ++statut.dernIndexChoix);
          } else {
            console.warn("[ou] sans 'au hasard'.");
          }
          break;

        case 'puis':
          if (statut.conditionDebutee === ConditionDebutee.fois) {
            // toutes les fois suivant le dernier Xe fois
            retVal = (statut.nbAffichage > statut.plusGrandChoix);
          } else if (statut.conditionDebutee === ConditionDebutee.boucle) {
            // boucler
            statut.dernIndexChoix += 1;
            retVal = (statut.nbAffichage % statut.nbChoix === (statut.dernIndexChoix == statut.nbChoix ? 0 : statut.dernIndexChoix));
          } else {
            console.warn("[puis] sans 'fois' ou 'boucle'.");
          }
          break;

        case 'sinon':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = !statut.siVrai;
          } else {
            console.warn("[sinon] sans 'si'.");
            retVal = false;
          }
          break;

        case 'fin choix':
          if (statut.conditionDebutee == ConditionDebutee.boucle || statut.conditionDebutee == ConditionDebutee.fois || statut.conditionDebutee == ConditionDebutee.hasard) {
            retVal = true;
          } else {
            console.warn("[fin choix] sans 'fois', 'boucle' ou 'hasard'.");
          }
          break;

        case 'fin si':
          if (statut.conditionDebutee == ConditionDebutee.si) {
            retVal = true;
          } else {
            console.warn("[fin si] sans 'si'.");
          }
          break;

        default:
          console.warn("je ne sais pas quoi faire pour:", conditionLC);
          break;
      }
    }

    console.log("estConditionRemplie", condition, statut, retVal);

    return retVal;
  }



  private calculerNbChoix(statut: StatutCondition) {
    let nbChoix = 0;
    let index = statut.curMorceauIndex;
    do {
      index += 2;
      nbChoix += 1;
    } while (statut.morceaux[index] !== 'fin choix' && (index < (statut.morceaux.length - 3)));

    // si on est dans une balise fois et si il y a un "puis"
    // => récupérer le dernier élément fois pour avoir le plus élevé
    if (statut.conditionDebutee == ConditionDebutee.fois) {

      if (statut.morceaux[index - 2] == "puis") {
        const result = statut.morceaux[index - 4].match(xFois);
        if (result) {
          statut.plusGrandChoix = Number.parseInt(result[1], 10);
        } else {
          console.warn("'puis' ne suit pas un 'Xe fois'");
        }
      }
    }

    return nbChoix;
  }

}