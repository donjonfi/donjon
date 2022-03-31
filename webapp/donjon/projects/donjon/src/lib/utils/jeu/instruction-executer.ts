import { ActionsUtils } from "./actions-utils";
import { ClasseUtils } from "../commun/classe-utils";
import { CommandesUtils } from "./commandes-utils";
import { Commandeur } from "./commandeur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { Instructions } from "./instructions";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Objet } from "../../models/jeu/objet";
import { Reaction } from "../../models/compilateur/reaction";
import { Resultat } from "../../models/jouer/resultat";

export class InstructionExecuter {

  // private cond: ConditionsUtils;

  private ins: Instructions;
  private com: Commandeur;
  private act: ActionsUtils;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private verbeux: boolean,
  ) {
    // this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.act = new ActionsUtils(this.jeu, this.verbeux);
  }

  /** Commandeur pour l’instruction « exécuter commande ». */
  set commandeur(commandeur: Commandeur) {
    this.com = commandeur;
  }

  /** Instructions */
  set instructions(instructions: Instructions) {
    this.ins = instructions;
  }


  /**
 * Exécuter une instruction de type "réaction".
 * @param instruction 
 * @param ceci 
 * @param cela 
 */
  public executerReaction(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(false, '', 1);

    if (instruction.complement1) {
      switch (instruction.complement1.toLocaleLowerCase()) {
        case 'réaction de ceci':
          if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(contexteTour.ceci as Objet, null);
          } else {
            console.error("Exécuter réaction de ceci: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela':
          if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(contexteTour.cela as Objet, undefined);
          } else {
            console.error("Exécuter réaction de cela: cela n'est pas un objet");
          }
          break;
        case 'réaction de ceci concernant cela':
        case 'réaction de ceci à cela':
          if (ClasseUtils.heriteDe(contexteTour.ceci.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(contexteTour.ceci as Objet, contexteTour.cela);
          } else {
            console.error("Exécuter réaction de ceci à cela: ceci n'est pas un objet");
          }
          break;
        case 'réaction de cela concernant ceci':
        case 'réaction de cela à ceci':
          if (ClasseUtils.heriteDe(contexteTour.cela.classe, EClasseRacine.objet)) {
            resultat = this.suiteExecuterReaction(contexteTour.cela as Objet, contexteTour.ceci);
          } else {
            console.error("Exécuter réaction de cela à ceci: cela n'est pas un objet");
          }
          break;

        default:
          console.error("executerReaction : sujet autre que « réaction de ceci », « réaction de cela », « réaction de ceci à cela » pas pris en charge, instruction:", instruction);
      }
    } else {
      console.error("executerReaction : pas de sujet, instruction:", instruction);
    }

    return resultat;
  }

  /**
  * Exécuter la réaction d'une personne à un sujet (ou non).
  */
  private suiteExecuterReaction(personne: ElementJeu, sujet: Intitule | undefined) {

    let resultat = new Resultat(false, '', 1);
    let reaction: Reaction = null;

    // vérifier que la personne est bien un objet
    if (!personne) {
      console.error("suiteExecuterReaction: la personne est null");
    }

    if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.personne)) {
      if (!ClasseUtils.heriteDe(personne.classe, EClasseRacine.objet)) {
        console.error("suiteExecuterReaction: la personne qui doit réagir n’est ni une personne, ni un objet:", personne);
      } else {
        console.warn("suiteExecuterReaction: la personne qui doit réagir n’est pas une personne:", personne);
      }
    }

    // réaction à un sujet
    if (sujet) {

      const nomMinuscules = sujet.intitule.nom.toLowerCase() ?? null;
      const epitheteMinuscules = sujet.intitule.epithete?.toLowerCase() ?? null;

      // rechercher s’il y a une des réaction qui comprend ce sujet
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == nomMinuscules && y.epithete == epitheteMinuscules));
      // si on n’a pas de résultat, rechercher le sujet « sujet inconnu »:
      if (!reaction) {
        reaction = (personne as Objet).reactions
          .find(x => x.sujets && x.sujets.some(y => y.nom == "sujet" && y.epithete == "inconnu"));
      }
    }
    // si pas de réaction à un sujet, prendre réaction par défaut (aucun sujet)
    if (!reaction) {
      //  console.log("suiteExecuterReaction: réaction à aucun sujet");
      reaction = (personne as Objet).reactions
        .find(x => x.sujets && x.sujets.some(y => y.nom == "aucun" && y.epithete == "sujet"));
    }
    // on a trouvé une réaction
    if (reaction) {
      // TODO: faut-il fournir ceci,cela, l’évènement et déclenchements ?
      resultat = this.ins.executerInstructions(reaction.instructions, undefined, undefined, undefined);
      // on n’a pas trouvé de réaction
    } else {
      // si aucune réaction ce n’est pas normal: soit il faut une réaction par défaut, soit il ne faut pas passer par ici.
      console.error("suiteExecuterReaction : cette personne n’a pas de réaction par défaut:", personne);
    }

    return resultat;
  }

  /** Exécuter l’instruction « Exécuter action xxxx… */
  public executerAction(instruction: ElementsPhrase, nbExecutions: number, contexteTour: ContexteTour, evenement: Evenement, declenchements: number): Resultat {

    let res = new Resultat(true, "", 1);

    // décomposer le complément
    const tokens = ExprReg.xActionExecuterAction.exec(instruction.complement1);
    if (tokens) {
      const insInfinitif = tokens[1];
      const insPrepCeci = tokens[2]; // TODO: gérer les prépositions
      const insCeci = tokens[3];
      const insPrepCela = tokens[4];
      const insCela = tokens[5];

      const actionCeci = InstructionsUtils.trouverCibleSpeciale(insCeci, contexteTour, evenement, this.eju, this.jeu);
      const actionCela = InstructionsUtils.trouverCibleSpeciale(insCela, contexteTour, evenement, this.eju, this.jeu);

      // chercher les candidats en tenant compte des accents
      let resChercherCandidats = this.act.chercherCandidatsActionSansControle(insInfinitif, insCeci ? true : false, insCela ? true : false, true);

      // si verbe pas trouvé, chercher candidat en ne tenant pas compte des accents
      if (!resChercherCandidats.verbeConnu) {
        resChercherCandidats = this.act.chercherCandidatsActionSansControle(insInfinitif, insCeci ? true : false, insCela ? true : false, false);
      }

      // action pas trouvée
      if (!resChercherCandidats.verbeConnu) {
        res.sortie = "{+[{_Exécuter Action_} : Action pas trouvée : " + insInfinitif + "]+}";
        res.succes = false;
        // aucun candidat valide trouvé
      } else if (resChercherCandidats.candidatsEnLice.length === 0) {
        res.sortie = "{+[{_Exécuter Action_} : Action pas compatible : " + insInfinitif + "]+}";
        console.error("Exécuter l’action: Action pas compatible.");
        res.succes = false;
        // exactement une action trouvée
      } else if (resChercherCandidats.candidatsEnLice.length === 1) {

        // on crée un sous contexte (afin d’éviter d’écraser le contexte original du tour)
        let sousContexteTour = new ContexteTour(actionCeci, actionCela);

        let action = resChercherCandidats.candidatsEnLice[0];
        const sousResExecuter = this.ins.executerInstructions(action.instructions, sousContexteTour, evenement, declenchements);
        const sousResTerminer = this.ins.executerInstructions(action.instructionsFinales, sousContexteTour, evenement, declenchements);
        res.sortie = res.sortie + sousResExecuter.sortie + sousResTerminer.sortie;
        res.succes = sousResExecuter.succes && sousResTerminer.succes;
        res.nombre = 1 + sousResExecuter.nombre + sousResTerminer.nombre;
        // plusieurs actions trouvées
      } else {
        // TODO: gérer plusieurs actions
        res.sortie = "{+Aïe: {_Exécuter Action_} : Plusieurs actions compatibles trouvées pour : " + insInfinitif + ".+}"
        res.succes = false;
      }

    } else {
      console.error("executerAction: format complément1 par reconnu:", instruction.complement1);
      res.succes = false;
    }

    return res;
  }


  /** Exécuter l’instruction « Exécuter commande "xxxx…" */
  public executerCommande(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    let res = new Resultat(true, "", 1);
    const tokens = ExprReg.xActionExecuterCommande.exec(instruction.complement1);
    if (tokens) {
      // remplacer les balises éventuelles dans le texte  
      let texteCommande = CommandesUtils.nettoyerCommande(tokens[1]);
      texteCommande = this.ins.dire.calculerTexteDynamique(texteCommande, 0, undefined, contexteTour, contexteTour.commande.evenement, undefined);
      // exécuter la commande
      res.sortie = this.com.executerCommande(texteCommande).sortie;
    } else {
      console.error("executerCommande: format complément1 par reconnu:", instruction.complement1);
      res.succes = false;
    }
    return res;
  }


}
