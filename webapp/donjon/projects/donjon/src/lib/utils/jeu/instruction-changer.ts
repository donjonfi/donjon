import { EClasseRacine, EEtatsBase } from "../../models/commun/constantes";
import { ElementsJeuUtils, TypeSujet } from "../commun/elements-jeu-utils";

import { ClasseUtils } from "../commun/classe-utils";
import { Compteur } from "../../models/compilateur/compteur";
import { CompteursUtils } from "./compteurs-utils";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { InstructionDeplacerCopier } from "./instruction-deplacer-copier";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Liste } from "../../models/jeu/liste";
import { Objet } from "../../models/jeu/objet";
import { PhraseUtils } from "../commun/phrase-utils";
import { PrepositionSpatiale } from "../../models/jeu/position-objet";
import { ProprieteConcept } from "../../models/commun/propriete-element";
import { RechercheUtils } from "../commun/recherche-utils";
import { Resultat } from "../../models/jouer/resultat";
import { TypeProprieteJeu } from "../../models/jeu/propriete-jeu";
import { InstructionDire } from "./instruction-dire";
import { Concept } from "../../models/compilateur/concept";
import { GroupeNominal } from "../../models/commun/groupe-nominal";

export class InstructionChanger {

  private insDeplacerCopier: InstructionDeplacerCopier;
  private insDire: InstructionDire;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) { }

  /** Instructions */
  set instructionDeplacerCopier(instructionDeplacerCopier: InstructionDeplacerCopier) {
    this.insDeplacerCopier = instructionDeplacerCopier;
  }

  set instructionDire(instructionDire: InstructionDire) {
    this.insDire = instructionDire;
  }

  /** Changer quelque chose dans le jeu */
  public executerChanger(instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement = null, declenchements: number): Resultat {

    let resultat = new Resultat(false, '', 1);

    // on veut changer un élément
    if (instruction.sujet) {
      switch (instruction.sujet.nom.toLowerCase()) {
        // joueur
        case 'joueur':
          resultat = this.changerJoueur(instruction, contexteTour);
          break;

        // lieu où se trouve le joueur
        case 'ici':
          resultat = this.changerElementJeu(this.eju.curLieu, instruction, contexteTour);
          break;

        // élément du jeu ou compteur (ceci)
        case 'ceci':
          if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.element)) {
            resultat = this.changerElementJeu(contexteTour.ceci as ElementJeu, instruction, contexteTour);
          } else if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.concept)) {
            resultat = this.changerConcept(contexteTour.ceci as ElementJeu, instruction, contexteTour);
          } else if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.compteur)) {
            resultat = this.changerCompteur(contexteTour.ceci as Compteur, instruction, contexteTour, evenement, declenchements);
          } else {
            console.error("executer changer ceci: ceci n'est pas un élément du jeu, un concept ou un compteur.");
          }
          break;

        // élément du jeu ou compteur (cela)
        case 'cela':
          if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.element)) {
            resultat = this.changerElementJeu(contexteTour.cela as ElementJeu, instruction, contexteTour);
          } else if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.concept)) {
            resultat = this.changerConcept(contexteTour.cela as ElementJeu, instruction, contexteTour);
          } else if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.compteur)) {
            resultat = this.changerCompteur(contexteTour.cela as Compteur, instruction, contexteTour, evenement, declenchements);
          } else {
            console.error("executer changer cela: cela n'est pas un élément du jeu, un concept ou un compteur.");
          }
          break;

        default:
          let correspondance = this.eju.trouverCorrespondance(instruction.sujet, TypeSujet.SujetEstNom, false, false);

          // PAS OBJET, PAS LIEU, PAS COMPTEUR et PAS LISTE
          if (correspondance.elements.length === 0 && correspondance.compteurs.length === 0 && correspondance.listes.length === 0) {
            console.error("executerChanger: pas trouvé l’élément " + instruction.sujet);
            resultat.sortie = "{+[Instruction « changer » : le sujet « " + instruction.sujet + " » n’a pas été trouvé.]+}";
            // OBJET(S) SEULEMENT
          } else if (correspondance.lieux.length === 0 && correspondance.compteurs.length === 0 && correspondance.listes.length === 0) {
            if (correspondance.objets.length === 1) {
              resultat = this.changerElementJeu(correspondance.objets[0], instruction, contexteTour);
            } else {
              console.error("executerChanger: plusieurs objets trouvés:", correspondance);
              resultat.sortie = "{n}{+[Instruction « changer » : plusieurs objets trouvés pour « " + instruction.sujet + " ».]+}";
            }
            // LIEU(X) SEULEMENT
          } else if (correspondance.objets.length === 0 && correspondance.compteurs.length === 0 && correspondance.listes.length === 0) {
            if (correspondance.lieux.length === 1) {
              resultat = this.changerElementJeu(correspondance.lieux[0], instruction, contexteTour);
            } else {
              console.error("executerChanger: plusieurs lieux trouvés:", correspondance);
              resultat.sortie = "{n}{+[Instruction « changer » : plusieurs lieux trouvés pour « " + instruction.sujet + " ».]+}";
            }
            // COMPTEUR(S) SEULEMENT
          } else if (correspondance.objets.length === 0 && correspondance.lieux.length === 0 && correspondance.listes.length === 0) {
            if (correspondance.compteurs.length === 1) {
              resultat = this.changerCompteur(correspondance.compteurs[0], instruction, contexteTour, evenement, declenchements);
            } else {
              console.error("executerChanger: plusieurs compteurs trouvés:", correspondance);
              resultat.sortie = "{n}{+[Instruction « changer » : plusieurs compteurs trouvés pour « " + instruction.sujet + " ».]+}";
            }
            // LISTE(S) SEULEMENT
          } else if (correspondance.objets.length === 0 && correspondance.lieux.length === 0 && correspondance.compteurs.length === 0) {
            if (correspondance.listes.length === 1) {
              resultat = this.changerListe(correspondance.listes[0], instruction, contexteTour, evenement, declenchements);
            } else {
              console.error("executerChanger: plusieurs listes trouvées:", correspondance);
              resultat.sortie = "{n}{+[Instruction « changer » : plusieurs listes trouvées pour « " + instruction.sujet + " ».]+}";
            }

          } else {
            console.error("executerChanger: trouvé lieu(x) ET objet(s):", correspondance);
            resultat.sortie = "{n}{+[Instruction « changer » : plusieurs éléments (lieux ET objets) trouvés pour « " + instruction.sujet + " ».]+}";
          }
          break;
      }
      // on veut changer une propriété
    } else if (instruction.proprieteSujet) {

      // cas spécial : changer les synonymes de xxx sont "a", "b" et "c"
      if (instruction.proprieteSujet.type === TypeProprieteJeu.proprieteElement
          && instruction.proprieteSujet.intituleProprieteElement?.nom === 'synonymes') {
        resultat = this.changerSynonymesDe(instruction, contexteTour);
      } else {
        switch (instruction.proprieteSujet.type) {
        // on ne peut pas changer une propriété calculée
        case TypeProprieteJeu.nombreDeClasseAttributs:
        case TypeProprieteJeu.nombreDeClasseAttributsPosition:
          resultat.succes = false;
          resultat.sortie = "{+[Je ne peux pas changer directement une propriété calculée]+}";
          break;

        // propriété d’un élément
        case TypeProprieteJeu.nombreDeProprieteElement:
        case TypeProprieteJeu.proprieteElement:
          const propSujetTrouvee = InstructionsUtils.trouverProprieteCible(instruction.proprieteSujet, contexteTour, this.eju, this.jeu) as ProprieteConcept;
          if (propSujetTrouvee) {

            switch (instruction.verbe.toLowerCase()) {
              case 'augmente':
              case 'augmentent':
                CompteursUtils.changerValeurCompteurOuPropriete(propSujetTrouvee, 'augmente', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
                break;

              case 'diminue':
              case 'diminuent':
                CompteursUtils.changerValeurCompteurOuPropriete(propSujetTrouvee, 'diminue', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
                break;

              case 'vaut':
              case 'valent':
                CompteursUtils.changerValeurCompteurOuPropriete(propSujetTrouvee, 'vaut', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
                break;

              case 'est':
              case 'sont':
                CompteursUtils.changerValeurCompteurOuPropriete(propSujetTrouvee, 'est', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
                break;

              default:
                resultat.succes = false;
                console.error("changer propriété: pas compris le verbe:", instruction.verbe, instruction, this.eju, this.jeu);
                resultat.sortie = "{n}{+[Instruction « changer » : propriété « " + instruction.proprieteSujet + " » : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
                break;
            }

            // si suite à la modification de la quantité d’un objet, la quantité atteint 0, effacer l’objet.
            if (instruction.proprieteSujet.type === TypeProprieteJeu.proprieteElement && RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(propSujetTrouvee.nom) === RechercheUtils.transformerCaracteresSpeciauxEtMajuscules('quantité')) {
              if (ClasseUtils.heriteDe(instruction.proprieteSujet.element.classe, EClasseRacine.objet) && (instruction.proprieteSujet.element as Objet).quantite === 0) {
                const indexObjet = this.jeu.objets.indexOf((instruction.proprieteSujet.element as Objet));
                if (indexObjet !== -1) {
                  this.jeu.objets.splice(indexObjet, 1);
                } else {
                  console.error("executerChanger >> pas pu retrouver l’objet à supprimer (quantité à atteint 0).");
                }
              }
            }

            resultat.succes = true;
            // console.log("propriété trouvée:", propSujetTrouvee);
          } else {
            console.error("executerChanger: propriété pas trouvée:", instruction.proprieteSujet);
            resultat.sortie = "{n}{+[Instruction « changer » : propriété pas trouvée : « " + instruction.proprieteSujet + " ».]+}";
          }
          break;

        default:
          console.error("executerChanger > Type de propriété non pris en charge:", instruction.proprieteSujet.type);
          break;
        }
      }

      // ni élément ni propriété
    } else {
      console.error("executerChanger : pas de sujet ni de propriété, instruction:", instruction);
    }
    return resultat;
  }


  /** Ajouter aux synonymes d'un élément : ajouter "a" et "b" aux synonymes de xxx
   *  OU ajouter plusieurs éléments à une liste : ajouter x, y et z à <liste>
   */
  public executerAjouter(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(false, '', 1);

    if (!instruction.complement1) {
      resultat.sortie = '{n}{+[ajouter : complément manquant.]+}';
      return resultat;
    }

    // A) ajouter "x" aux synonymes de <élément>
    const xAuxSynonymesDE = /^(.*)\baux synonymes de\b\s+(.+)$/i;
    const matchSyntaxe = xAuxSynonymesDE.exec(instruction.complement1);
    if (!matchSyntaxe) {
      // B) ajouter à <liste> : x, y et z
      const xAListe = /^(?:à\s+(le|la|l'|les)|(au)|(aux))\s+(.+?)\s*:\s*(.+)$/i;
      const matchListe = xAListe.exec(instruction.complement1);
      if (matchListe) {
        let article: string;
        if (matchListe[2]) {
          article = 'le';       // "au" → "le"
        } else if (matchListe[3]) {
          article = 'les';      // "aux" → "les"
        } else {
          article = matchListe[1]; // "à le/la/l'/les" → article seul
        }
        const sep = article.endsWith("'") ? '' : ' ';
        const listePart = article + sep + matchListe[4].trim();
        const itemsPart = matchListe[5].trim();
        return this.ajouterAListe(itemsPart, listePart, resultat, contexteTour);
      }
      resultat.sortie = `{n}{+[ajouter : syntaxe non reconnue. Attendu : ajouter "x" aux synonymes de xxx  OU  ajouter à <liste> : x, y et z.]+}`;
      return resultat;
    }

    const itemsPart = matchSyntaxe[1];
    const elementPart = matchSyntaxe[2].trim().toLowerCase();

    // résoudre l'élément cible
    let elementCible: ElementJeu | null = null;
    if (elementPart === 'ceci') {
      elementCible = contexteTour.ceci as ElementJeu;
    } else if (elementPart === 'cela') {
      elementCible = contexteTour.cela as ElementJeu;
    } else if (elementPart === 'ici') {
      elementCible = this.eju.curLieu;
    } else {
      const gnElement = PhraseUtils.getGroupeNominalDefiniOuIndefini(elementPart, false);
      if (gnElement) {
        const corresp = this.eju.trouverCorrespondance(gnElement, TypeSujet.SujetEstNom, false, false);
        if (corresp.objets.length === 1) {
          elementCible = corresp.objets[0];
        } else if (corresp.lieux.length === 1) {
          elementCible = corresp.lieux[0];
        }
      }
    }

    if (!elementCible) {
      resultat.sortie = `{n}{+[ajouter aux synonymes : élément « ${matchSyntaxe[2].trim()} » introuvable.]+}`;
      return resultat;
    }

    // ajouter chaque valeur entre guillemets comme synonyme (sans doublon)
    const xItem = /"([^"]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = xItem.exec(itemsPart)) !== null) {
      const valeur = match[1].trim();
      if (valeur && !elementCible.synonymes.some(s => s.nomEpithete === valeur)) {
        elementCible.synonymes.push(new GroupeNominal(null, valeur, null));
      }
    }

    resultat.succes = true;
    return resultat;
  }

  /** Ajouter plusieurs éléments à une liste : ajouter x, y et z à <liste> */
  private ajouterAListe(itemsPart: string, listePart: string, resultat: Resultat, contexteTour: ContexteTour): Resultat {
    const gnListe = PhraseUtils.getGroupeNominalDefiniOuIndefini(listePart, false);
    if (!gnListe) {
      resultat.sortie = `{n}{+[ajouter à liste : intitulé de liste non reconnu : « ${listePart} ».]+}`;
      return resultat;
    }
    const cor = this.eju.trouverCorrespondance(gnListe, TypeSujet.SujetEstNom, false, false);
    if (cor.listes.length !== 1) {
      resultat.sortie = `{n}{+[ajouter à liste : liste « ${listePart} » introuvable.]+}`;
      return resultat;
    }
    const liste = cor.listes[0];
    const items = PhraseUtils.separerListeIntitulesEt(itemsPart, true);
    for (const item of items) {
      const itemTrimmed = item.trim();
      if (!itemTrimmed) continue;
      if (itemTrimmed.match(ExprReg.xNombre)) {
        liste.ajouterNombre(Number.parseFloat(itemTrimmed));
      } else {
        const gnItem = PhraseUtils.getGroupeNominalDefiniOuIndefini(itemTrimmed, false);
        if (gnItem) {
          const corItem = this.eju.trouverCorrespondance(gnItem, TypeSujet.SujetEstNom, false, false);
          if (corItem.nbCor === 1) {
            liste.ajouterIntitule(corItem.unique);
          } else {
            liste.ajouterTexte(itemTrimmed);
          }
        } else {
          liste.ajouterTexte(itemTrimmed);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

  /** Enlever plusieurs éléments d'une liste : enlever de <liste> : x, y et z */
  public executerEnlever(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(false, '', 1);

    if (!instruction.complement1) {
      resultat.sortie = '{n}{+[enlever : complément manquant.]+}';
      return resultat;
    }

    const xDeListe = /^(?:de\s+(le|la|l'|les)|(du)|(des))\s+(.+?)\s*:\s*(.+)$/i;
    const matchListe = xDeListe.exec(instruction.complement1);
    if (matchListe) {
      let article: string;
      if (matchListe[2]) {
        article = 'le';       // "du" → "le"
      } else if (matchListe[3]) {
        article = 'les';      // "des" → "les"
      } else {
        article = matchListe[1]; // "de le/la/l'/les" → article seul
      }
      const sep = article.endsWith("'") ? '' : ' ';
      const listePart = article + sep + matchListe[4].trim();
      const itemsPart = matchListe[5].trim();
      return this.enleverDeListe(itemsPart, listePart, resultat, contexteTour);
    }
    resultat.sortie = `{n}{+[enlever : syntaxe non reconnue. Attendu : enlever de <liste> : x, y et z.]+}`;
    return resultat;
  }

  /** Enlever plusieurs éléments d'une liste */
  private enleverDeListe(itemsPart: string, listePart: string, resultat: Resultat, contexteTour: ContexteTour): Resultat {
    const gnListe = PhraseUtils.getGroupeNominalDefiniOuIndefini(listePart, false);
    if (!gnListe) {
      resultat.sortie = `{n}{+[enlever de liste : intitulé de liste non reconnu : « ${listePart} ».]+}`;
      return resultat;
    }
    const cor = this.eju.trouverCorrespondance(gnListe, TypeSujet.SujetEstNom, false, false);
    if (cor.listes.length !== 1) {
      resultat.sortie = `{n}{+[enlever de liste : liste « ${listePart} » introuvable.]+}`;
      return resultat;
    }
    const liste = cor.listes[0];
    const items = PhraseUtils.separerListeIntitulesEt(itemsPart, true);
    for (const item of items) {
      const itemTrimmed = item.trim();
      if (!itemTrimmed) continue;
      if (itemTrimmed.match(ExprReg.xNombre)) {
        liste.retirerNombre(Number.parseFloat(itemTrimmed));
      } else {
        const gnItem = PhraseUtils.getGroupeNominalDefiniOuIndefini(itemTrimmed, false);
        if (gnItem) {
          const corItem = this.eju.trouverCorrespondance(gnItem, TypeSujet.SujetEstNom, false, false);
          if (corItem.nbCor === 1) {
            liste.retirerIntitule(corItem.unique);
          } else {
            liste.retirerTexte(itemTrimmed);
          }
        } else {
          liste.retirerTexte(itemTrimmed);
        }
      }
    }
    resultat.succes = true;
    return resultat;
  }

  /** Remplacer les synonymes d'un élément : changer les synonymes de xxx sont "a", "b" et "c" */
  private changerSynonymesDe(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    const resultat = new Resultat(false, '', 1);

    let elementCible: ElementJeu | null = null;
    const nomElement = instruction.proprieteSujet.intituleElement?.nom?.toLowerCase();

    if (nomElement === 'ceci') {
      elementCible = contexteTour.ceci as ElementJeu;
    } else if (nomElement === 'cela') {
      elementCible = contexteTour.cela as ElementJeu;
    } else if (nomElement === 'ici') {
      elementCible = this.eju.curLieu;
    } else {
      const corresp = this.eju.trouverCorrespondance(
        instruction.proprieteSujet.intituleElement, TypeSujet.SujetEstNom, false, false
      );
      if (corresp.objets.length === 1) {
        elementCible = corresp.objets[0];
      } else if (corresp.lieux.length === 1) {
        elementCible = corresp.lieux[0];
      }
    }

    if (!elementCible) {
      resultat.sortie = `{n}{+[changer synonymes : élément « ${instruction.proprieteSujet.intituleElement} » introuvable.]+}`;
      return resultat;
    }

    // remplacer tous les synonymes existants
    elementCible.synonymes.splice(0);

    // ajouter chaque valeur entre guillemets comme nouveau synonyme
    if (instruction.complement1) {
      const xItem = /"([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = xItem.exec(instruction.complement1)) !== null) {
        const valeur = match[1].trim();
        if (valeur) {
          elementCible.synonymes.push(new GroupeNominal(null, valeur, null));
        }
      }
    }

    resultat.succes = true;
    return resultat;
  }

  /** Exécuter une instruction qui cible le joueur */
  private changerJoueur(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    let resultat = new Resultat(false, '', 1);

    switch (instruction.verbe.toLowerCase()) {

      // AJOUTER UN OBJET A L'INVENTAIRE
      case 'possède':
        // Objet classique
        if (instruction.sujetComplement1) {
          resultat = this.insDeplacerCopier.executerDeplacer(instruction.sujetComplement1, "dans", instruction.sujet, contexteTour);
          // Instruction spécifique
        } else if (instruction.complement1) {
          let objets: Objet[] = null;
          // - objets dans ceci
          if (instruction.complement1.endsWith('objets dans ceci')) {
            if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans ceci: ceci n'est as un objet.");
            }
            // - objets sur ceci
          } else if (instruction.complement1.endsWith('objets sur ceci')) {
            if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur ceci: ceci n'est as un objet.");
            }
            // - objets sous ceci
          } else if (instruction.complement1.endsWith('objets sous ceci')) {
            if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.ceci as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous ceci: ceci n'est as un objet.");
            }
            // - objets dans cela
          } else if (instruction.complement1.endsWith('objets dans cela')) {
            if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.dans);
            } else {
              console.error("Joueur possède objets dans cela: cela n'est as un objet.");
            }
            // - objets sur cela
          } else if (instruction.complement1.endsWith('objets sur cela')) {
            if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.sur);
            } else {
              console.error("Joueur possède objets sur cela: cela n'est as un objet.");
            }
            // - objets sous cela
          } else if (instruction.complement1.endsWith('objets sous cela')) {
            if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
              objets = this.eju.obtenirContenu(contexteTour.cela as Objet, PrepositionSpatiale.sous);
            } else {
              console.error("Joueur possède objets sous cela: cela n'est as un objet.");
            }
            // - objets ici
          } else if (instruction.complement1.endsWith('objets ici')) {
            objets = this.eju.obtenirContenu(this.eju.curLieu, PrepositionSpatiale.dans);
          }

          // objets contenus trouvés
          if (objets) {
            resultat.succes = true;
            objets.forEach(el => {
              resultat = (resultat.succes && this.insDeplacerCopier.executerDeplacerObjetVersDestination(el, 'dans', this.jeu.joueur, el.quantite));
            });
          }
        }
        break;

      // PORTER UN OBJET (s'habiller avec)
      case 'porte':
        let objet: Objet = InstructionsUtils.trouverObjetCible(instruction.complement1, instruction.sujetComplement1, contexteTour, this.eju, this.jeu);
        if (objet) {
          // NE porte PAS
          if (instruction.negation) {
            // l’objet n’est plus porté
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.porte, this.eju, true);
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.enfile, this.eju, true);
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.chausse, this.eju, true);
            this.jeu.etats.retirerEtatElement(objet, EEtatsBase.equipe, this.eju, true);
            resultat.succes = true;
            // PORTE
          } else {
            // déplacer l'objet vers l'inventaire
            resultat = this.insDeplacerCopier.executerDeplacerObjetVersDestination(objet, "dans", this.jeu.joueur, objet.quantite);
            // l'objet est enfilé, porté, chaussé, équipé, porté
            if (this.jeu.etats.possedeEtatElement(objet, EEtatsBase.enfilable, this.eju)) {
              this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.enfile, this.eju, true);
            } else if (this.jeu.etats.possedeEtatElement(objet, EEtatsBase.chaussable, this.eju)) {
              this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.chausse, this.eju, true);
            } else if (this.jeu.etats.possedeEtatElement(objet, EEtatsBase.equipable, this.eju)) {
              this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.equipe, this.eju, true);
            }
            // on met toujours porté
            this.jeu.etats.ajouterEtatElement(objet, EEtatsBase.porte, this.eju, true);
          }
        }
        break;

      // VERBES COMMUNS À N’IMPORTE QUEL OBJET
      case 'se trouve':
      case 'se trouvent':
      case 'est':
      case 'sont':
        resultat = this.changerElementJeu(this.jeu.joueur, instruction, contexteTour);
        break;

      default:
        console.error("executerJoueur : pas compris verbe", instruction.verbe, instruction);
        resultat.sortie = "{n}{+[Instruction « changer » : joueur : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
        break;
    }
    return resultat;
  }

  private changerCompteur(compteur: Compteur, instruction: ElementsPhrase, contexteTour: ContexteTour | undefined, evenement: Evenement = null, declenchements: number | undefined): Resultat {
    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'augmente':
      case 'augmentent':
        CompteursUtils.changerValeurCompteurOuPropriete(compteur, 'augmente', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
        break;

      case 'diminue':
      case 'diminuent':
        CompteursUtils.changerValeurCompteurOuPropriete(compteur, 'diminue', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
        break;

      case 'vaut':
      case 'valent':
        CompteursUtils.changerValeurCompteurOuPropriete(compteur, 'vaut', instruction.complement1, this.eju, this.jeu, contexteTour, evenement, declenchements, this.insDire)
        break;

      default:
        resultat.succes = false;
        console.error("changerCompteur: pas compris le verbe:", instruction.verbe, instruction);
        resultat.sortie = "{n}{+[Instruction « changer » : compteur « " + instruction.sujet + " » : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
        break;
    }

    return resultat;

  }

  private changerListe(liste: Liste, instruction: ElementsPhrase, contexteTour: ContexteTour | undefined, evenement: Evenement | undefined, declenchements: number | undefined): Resultat {
    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {

      case 'contient':
      case 'contiennent':
      case 'inclut':
      case 'incluent':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');

        //A) NOMBRE
        // tester s’il s’agit d’un nombre
        if (instruction.complement1.match(ExprReg.xNombre)) {
          const nombre = Number.parseFloat(instruction.complement1);
          // console.log("=> nombre");
          // enlever le nombre
          if (nEstPas) {
            // console.log("Je vais enlever de la liste:", nombre, instruction);
            liste.retirerNombre(nombre);
            // ajouter le nombre
          } else {
            // console.log("Je vais ajouter à la liste:", nombre, instruction);
            liste.ajouterNombre(nombre);
          }
          // B) INTITULÉ
        } else if (instruction.sujetComplement1) {
          let intitule: Intitule;
          // i) rechercher parmi les cibles spéciales (ceci, cela, …)
          const cibleSpeciale: Intitule = InstructionsUtils.trouverCibleSpeciale(instruction.sujetComplement1.nom, contexteTour, evenement, this.eju, this.jeu);
          if (cibleSpeciale) {
            intitule = cibleSpeciale;
            // ii) rechercher parmi tous les éléments du jeu
          } else {
            const cor = this.eju.trouverCorrespondance(instruction.sujetComplement1, TypeSujet.SujetEstNom, false, false);
            if (cor.nbCor == 1) {
              intitule = cor.unique;
            } else {
              intitule = cor.intitule;
            }
          }
          // enlever l’intitulé
          if (nEstPas) {
            // console.log("Je vais enlever de la liste:", cibleTrouvee, instruction);
            liste.retirerIntitule(intitule);
            // ajouter l’intitulé
          } else {
            // console.log("Je vais ajouter à la liste:", cibleTrouvee, instruction);
            liste.ajouterIntitule(intitule);
          }
          // C) TEXTE
        } else {
          // résoudre les balises
          const texteResolu = this.insDire.calculerBalise(instruction.complement1, 1, undefined, contexteTour, evenement, declenchements)
          if (nEstPas) {
            liste.retirerTexte(texteResolu);
          } else {
            liste.ajouterTexte(texteResolu);
          }
        }
        break;

      default:
        resultat.succes = false;
        console.error("changerListe: pas compris le verbe:", instruction.verbe, instruction);
        resultat.sortie = "{n}{+[Instruction « changer » : liste « " + instruction.sujet + " » : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
        break;
    }

    return resultat;

  }

  private changerConcept(element: Concept, instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
          }
          this.jeu.etats.retirerEtatElement(element, instruction.complement1, this.eju);
          // est => ajouter un état
        } else {
          // s’il s’agit en réalité d’un déplacement
          if (instruction.complement1.match(/^\b(ici|sous|sur|dans)\b/)) {
            this.eju.ajouterErreur('Il n’est pas possible de déplacer un concept.');
            resultat = this.insDeplacerCopier.executerDeplacer(instruction.sujet, instruction.preposition1 ?? 'dans', instruction.sujetComplement1, contexteTour);
            // sinon ajouter l’état
          } else {
            if (this.verbeux) {
              console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
            }
            // séparer les attributs, les séparateurs possibles sont «, », « et ».
            const attributsSepares = PhraseUtils.separerListeIntitulesEt(instruction.complement1, true);
            attributsSepares.forEach(attribut => {
              this.jeu.etats.ajouterEtatElement(element, attribut, this.eju);
            });
          }
        }
        break;

      default:
        resultat.succes = false;
        console.error("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        resultat.sortie = "{n}{+[Instruction « changer » : concept « " + instruction.sujet + " » : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
        break;
    }
    return resultat;
  }

  private changerElementJeu(element: ElementJeu, instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(true, '', 1);

    switch (instruction.verbe.toLowerCase()) {
      case 'est':
      case 'sont':
        const nEstPas = instruction.negation && (instruction.negation.trim() === 'pas' || instruction.negation.trim() === 'plus');
        // n'est pas => retirer un état
        if (nEstPas) {
          if (this.verbeux) {
            console.log("executerElementJeu: retirer l’état '", instruction.complement1, "' ele=", element);
          }
          this.jeu.etats.retirerEtatElement(element, instruction.complement1, this.eju);
          // est => ajouter un état
        } else {
          // s’il s’agit en réalité d’un déplacement
          if (instruction.complement1.match(/^\b(ici|sous|sur|dans)\b/)) {
            this.eju.ajouterConseil('Instruction « changer » : Pour modifier la position d’un objet il est conseillé d’utiliser le verbe « se trouver » plutôt que « être » (ex: « changer le ballon se trouve sur la table. ») ou encore l’instruction « déplacer ». (ex: « déplacer le joueur vers la cuisine. »)');
            resultat = this.insDeplacerCopier.executerDeplacer(instruction.sujet, instruction.preposition1 ?? 'dans', instruction.sujetComplement1, contexteTour);
            // sinon ajouter l’état
          } else {
            if (this.verbeux) {
              console.log("executerElementJeu: ajouter l’état '", instruction.complement1, "'");
            }
            // séparer les attributs, les séparateurs possibles sont «, », « et ».
            const attributsSepares = PhraseUtils.separerListeIntitulesEt(instruction.complement1, true);
            attributsSepares.forEach(attribut => {
              this.jeu.etats.ajouterEtatElement(element, attribut, this.eju);
            });
          }
        }
        break;

      case 'se trouve':
      case 'se trouvent':
        resultat = this.insDeplacerCopier.executerDeplacer(instruction.sujet, instruction.preposition1 ?? 'dans', instruction.sujetComplement1, contexteTour);
        break;

      default:
        resultat.succes = false;
        console.error("executerElementJeu: pas compris le verbe:", instruction.verbe, instruction);
        resultat.sortie = "{n}{+[Instruction « changer » : élément « " + instruction.sujet + " » : verbe pas pris en charge: « " + instruction.verbe + " ».]+}";
        break;
    }
    return resultat;
  }


}