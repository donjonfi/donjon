import { ClasseUtils } from '../commun/classe-utils';
import { Commandeur } from './commandeur';
import { ConditionsUtils } from './conditions-utils';
import { ContexteTour } from '../../models/jouer/contexte-tour';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../commun/elements-jeu-utils';
import { ElementsPhrase } from '../../models/commun/elements-phrase';
import { Evenement } from '../../models/jouer/evenement';
import { ExprReg } from '../compilation/expr-reg';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { Instruction } from '../../models/compilateur/instruction';
import { InstructionAfficher } from './instruction-afficher';
import { InstructionChanger } from './instruction-changer';
import { InstructionCharger } from './instruction-charger';
import { InstructionDeplacerCopier } from './instruction-deplacer-copier';
import { InstructionDire } from './instruction-dire';
import { InstructionExecuter } from './instruction-executer';
import { InstructionFlux } from './instruction-flux';
import { InstructionJouerArreter } from './instruction-jouer-arreter';
import { InstructionListes } from './instruction-listes';
import { InstructionSelectionner } from './instruction-selectionner';
import { InstructionSysteme } from './instruction-systeme';
import { InterruptionsUtils } from './interruptions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation, ELocalisation } from '../../models/jeu/localisation';
import { Resultat } from '../../models/jouer/resultat';
import { TypeChoisir } from '../../models/compilateur/bloc-instructions';
import { TypeInterruption } from '../../models/jeu/interruption';
import { Choix } from '../../models/compilateur/choix';

/** Signature commune des entrées du dispatcher d’infinitifs. */
type ExecuteurInfinitif = (
  instruction: ElementsPhrase,
  nbExecutions: number,
  contexteTour: ContexteTour,
  evenement: Evenement | undefined,
  declenchements: number,
) => Resultat;

export class Instructions {

  private cond: ConditionsUtils;
  private insDire: InstructionDire;
  private insExecuter: InstructionExecuter;
  private insChanger: InstructionChanger;
  private insJouerArreter: InstructionJouerArreter;
  private insCharger: InstructionCharger;
  private insSelectionner: InstructionSelectionner;
  private insDeplacerCopier: InstructionDeplacerCopier;
  private insListes: InstructionListes;
  private insFlux: InstructionFlux;
  private insAfficher: InstructionAfficher;
  private insSysteme: InstructionSysteme;

  /** Map infinitif (forme normalisée en minuscules) → exécuteur. */
  private dispatchInfinitif: Map<string, ExecuteurInfinitif>;

  constructor(
    private jeu: Jeu,
    private eju: ElementsJeuUtils,
    private document: Document | undefined,
    private verbeux: boolean,
  ) {
    this.cond = new ConditionsUtils(this.jeu, this.verbeux);
    this.insDire = new InstructionDire(this.jeu, this.eju, this.verbeux);
    this.insExecuter = new InstructionExecuter(this.jeu, this.eju, this.verbeux);
    this.insExecuter.instructions = this;
    this.insDeplacerCopier = new InstructionDeplacerCopier(this.jeu, this.eju, this.verbeux);
    this.insChanger = new InstructionChanger(this.jeu, this.eju, this.verbeux);
    this.insChanger.instructionDeplacerCopier = this.insDeplacerCopier;
    this.insChanger.instructionDire = this.insDire;
    this.insJouerArreter = new InstructionJouerArreter(this.jeu);
    this.insCharger = new InstructionCharger(this.jeu, this.document);
    this.insSelectionner = new InstructionSelectionner(this.verbeux);
    this.insListes = new InstructionListes(this.jeu, this.eju);
    this.insFlux = new InstructionFlux(this.jeu, this.insDire, this.verbeux);
    this.insAfficher = new InstructionAfficher(this.jeu, this.eju);
    this.insSysteme = new InstructionSysteme(this.jeu, this.eju, this.insJouerArreter);

    this.dispatchInfinitif = this.construireDispatch();
  }

  get dire() {
    return this.insDire;
  }

  /** Commandeur pour l’instruction « exécuter commande ». */
  set commandeur(commandeur: Commandeur) {
    this.insExecuter.commandeur = commandeur;
  }

  public restaurationPartieEnCours = false;

  /** Exécuter une liste d’instructions */
  public executerInstructions(instructions: Instruction[], contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): Resultat {

    let resultat = new Resultat(true, '', 0);

    for (let indexInstruction = 0; indexInstruction < instructions.length; indexInstruction++) {
      const ins = instructions[indexInstruction];
      const sousResultat = this.executerInstruction(ins, contexteTour, evenement, declenchements);
      // additionner l’instruction au résultat
      resultat.nombre += sousResultat.nombre;
      resultat.succes = (resultat.succes && sousResultat.succes);
      resultat.sortie += sousResultat.sortie;
      resultat.arreterApresRegle = resultat.arreterApresRegle || sousResultat.arreterApresRegle;
      resultat.terminerAvantRegle = resultat.terminerAvantRegle || sousResultat.terminerAvantRegle;
      resultat.terminerApresRegle = resultat.terminerApresRegle || sousResultat.terminerApresRegle;
      resultat.refuse = resultat.refuse || sousResultat.refuse;

      // on interrompt le bloc d’instructions le temps que l’utilisateur fasse un choix
      if (sousResultat.interrompreBlocInstruction) {
        InterruptionsUtils.definirProprietesInterruptionSousResultatAuResultat(resultat, sousResultat);
        if (resultat.reste?.length) {
          //le reste des instructions de la liste principale (s’il y en a un)
          if (indexInstruction < (instructions.length - 1)) {
            resultat.reste.push(...instructions.slice(indexInstruction + 1));
          }
        } else {
          resultat.reste = instructions.slice(indexInstruction + 1);
        }
        break;
      }
      // si instruction refusée: on arrête tout
      if (resultat.refuse) {
        break;
      }
    }
    return resultat;
  }

  /** Exécuter une instruction */
  private executerInstruction(instruction: Instruction, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): Resultat {

    let resultat: Resultat;

    if (!contexteTour) {
      throw new Error("executerInstruction: ContexteTour pas fourni.");
    }
    if (this.verbeux) {
      console.log(">>> ex instruction:", instruction, "contexteTour:", contexteTour);
    }
    // incrémenter le nombre de fois que l’instruction a déjà été exécutée
    instruction.nbExecutions += 1;
    // mémoriser l’instruction en cours (notamment pour le report d’erreur : ligne du scénario, etc.)
    contexteTour.derniereInstruction = instruction;

    // instruction conditionnelle
    if (instruction.condition) {
      const estVrai = this.cond.siEstVrai(null, instruction.condition, contexteTour, evenement, declenchements);
      if (estVrai) {
        resultat = this.executerInstructions(instruction.instructionsSiConditionVerifiee, contexteTour, evenement, declenchements);
      } else {
        resultat = this.executerInstructions(instruction.instructionsSiConditionPasVerifiee, contexteTour, evenement, declenchements);
      }
      // instruction choisir
    } else if (instruction.choix) {
      if (instruction.choix.length > 0) {
        resultat = new Resultat(true, "", 1);
        resultat.interrompreBlocInstruction = true;
        resultat.typeInterruption = instruction.typeChoisir == TypeChoisir.libre ? TypeInterruption.attendreChoixLibre : TypeInterruption.attendreChoix;
        resultat.choix = this.garderChoixNonVides(instruction, contexteTour, evenement, declenchements);
      } else {
        this.jeu.tamponErreurs.push("executerInstruction : choisir : aucun choix")
        resultat = new Resultat(false, '', 0);
      }
      // instruction simple
    } else {
      if (instruction.instruction.infinitif) {
        resultat = this.executerInfinitif(instruction.instruction, instruction.nbExecutions, contexteTour, evenement, declenchements);
      } else {
        this.jeu.tamponErreurs.push("executerInstruction : pas d'infinitif : « " + instruction + " »")
        resultat = new Resultat(false, '', 0);
      }
    }
    return resultat;
  }

  private garderChoixNonVides(instruction: Instruction, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number | undefined): Choix[] {
    let retVal: Choix[] = [];
    instruction.choix.forEach(curChoix => {
      // dans le cas des textes, on ne garde que ceux dont le résultat
      // n’est pas une chaîne vide (choix conditionnels)
      if (typeof curChoix.valeurs[0] === 'string') {
        let affichage = this.dire.calculerTexteDynamique(curChoix.valeurs[0], instruction.nbExecutions, undefined, contexteTour, evenement, declenchements);
        if (affichage != '""') {
          let choixResultant = new Choix([affichage], curChoix.instructions);
          retVal.push(choixResultant);
        }
      } else {
        retVal.push(curChoix);
      }
    });
    return retVal;
  }

  /**
   * Construit la table de routage des infinitifs vers leur exécuteur.
   * Chaque infinitif (et ses alias non accentués) renvoie vers la classe
   * dédiée à son thème. Les nouveaux handlers thématiques (flux, afficher,
   * système, listes) implémentent l’interface InstructionHandler ; les
   * classes existantes (dire, changer, déplacer/copier, exécuter, jouer,
   * charger, sélectionner, jouer/arrêter) sont appelées via une lambda.
   */
  private construireDispatch(): Map<string, ExecuteurInfinitif> {
    const m = new Map<string, ExecuteurInfinitif>();

    // — dire
    m.set('dire', (ins, nb, ctx, ev, dec) => this.executerDire(ins, nb, ctx, ev, dec));

    // — changer
    m.set('changer', (ins, _nb, ctx, ev, dec) => this.insChanger.executerChanger(ins, ctx, ev, dec));

    // — déplacer / copier
    m.set('déplacer', (ins, _nb, ctx, ev, _dec) => this.executerDeplacer(ins, ctx, ev));
    m.set('copier', (ins, _nb, ctx, ev, _dec) => this.executerCopier(ins, ctx, ev));

    // — exécuter (réaction / action / commande / dernière commande / routine)
    m.set('exécuter', (ins, nb, ctx, ev, dec) => this.executerExecuter(ins, nb, ctx, ev, dec));

    // — jouer / arrêter (audio)
    m.set('jouer', (ins, _nb, ctx) => this.insJouerArreter.executerJouer(ins, ctx));
    const arreter: ExecuteurInfinitif = (ins, _nb, ctx) => this.insJouerArreter.executerArreter(ins, ctx);
    m.set('arrêter', arreter);
    m.set('arreter', arreter);
    m.set('stopper', arreter);

    // — charger / décharger
    m.set('charger', (ins, _nb, ctx) => this.insCharger.executerCharger(ins, ctx));
    const decharger: ExecuteurInfinitif = (ins, _nb, ctx) => this.insCharger.executerDecharger(ins, ctx);
    m.set('décharger', decharger);
    m.set('decharger', decharger);

    // — sélectionner
    const selectionner: ExecuteurInfinitif = (ins, _nb, ctx) => this.insSelectionner.executerSelectionner(ins, ctx);
    m.set('sélectionner', selectionner);
    m.set('selectionner', selectionner);

    // — flux : refuser, annuler, commencer, interrompre, continuer, terminer
    const flux: ExecuteurInfinitif = (ins, nb, ctx, ev, dec) => this.insFlux.executer(ins, nb, ctx, ev, dec);
    m.set('refuser', flux);
    m.set('annuler', flux);
    m.set('commencer', flux);
    m.set('interrompre', flux);
    m.set('continuer', flux);
    m.set('terminer', flux);

    // — afficher / effacer
    const afficher: ExecuteurInfinitif = (ins, nb, ctx, ev, dec) => this.insAfficher.executer(ins, nb, ctx, ev, dec);
    m.set('afficher', afficher);
    m.set('effacer', afficher);

    // — système : attendre, tester, déterminer
    const systeme: ExecuteurInfinitif = (ins, nb, ctx, ev, dec) => this.insSysteme.executer(ins, nb, ctx, ev, dec);
    m.set('attendre', systeme);
    m.set('tester', systeme);
    m.set('déterminer', systeme);
    m.set('determiner', systeme);

    // — listes / inventaire : ajouter, enlever, retirer, vider
    const listes: ExecuteurInfinitif = (ins, nb, ctx, ev, dec) => this.insListes.executer(ins, nb, ctx, ev, dec);
    m.set('ajouter', listes);
    m.set('enlever', listes);
    m.set('retirer', listes);
    m.set('vider', listes);

    return m;
  }

  private executerInfinitif(instruction: ElementsPhrase, nbExecutions: number, contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number): Resultat {
    if (this.verbeux) {
      console.log("EX INF − ", instruction.infinitif.toUpperCase(), " (contexteTour=", contexteTour, "instruction=", instruction, "nbExecutions=", nbExecutions, ")");
    }

    const fn = this.dispatchInfinitif.get(instruction.infinitif.toLowerCase());
    if (fn) {
      return fn(instruction, nbExecutions, contexteTour, evenement, declenchements);
    }

    contexteTour.ajouterErreurInstruction(instruction, "exécuter instruction: verbe inconnu: « " + instruction.infinitif + " ».");
    return new Resultat(true, '', 1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Exécuteurs « dire / déplacer / copier / exécuter » : restent ici car
  // s’appuient sur l’état partagé d’Instructions (lien vers les sous-classes
  // déjà instanciées) et déléguent l’essentiel du travail à ces sous-classes.
  // ─────────────────────────────────────────────────────────────────────────

  private executerDire(
    instruction: ElementsPhrase, nbExecutions: number,
    contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    // enlever le premier et le dernier caractères (") et les espaces aux extrémités.
    const complementDire = instruction.complement1.trim();
    let contenuDire = complementDire.slice(1, complementDire.length - 1).trim();
    contenuDire = this.insDire.calculerTexteDynamique(contenuDire, nbExecutions, undefined, contexteTour, evenement, declenchements);
    resultat.sortie += contenuDire;
    return resultat;
  }

  private executerDeplacer(
    instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement | undefined,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    let sousResultat: Resultat;

    // retrouver quantité à déplacer
    let sujetDeplacement = instruction.sujet;
    if (instruction.sujet.determinant == 'quantitéCeci ') {
      sujetDeplacement = new GroupeNominal(evenement.quantiteCeci.toString(), sujetDeplacement.nom, sujetDeplacement.epithete);
    } else if (instruction.sujet.determinant == 'quantitéCela ') {
      sujetDeplacement = new GroupeNominal(evenement.quantiteCela.toString(), sujetDeplacement.nom, sujetDeplacement.epithete);
    }

    // retrouver la destination du déplacement pour détecter si spéciale
    let destinationDeplacement: ElementJeu | Intitule = null;
    if (instruction.sujetComplement1?.nom === 'ceci') {
      destinationDeplacement = contexteTour.ceci;
    } else if (instruction.sujetComplement1?.nom === 'cela') {
      destinationDeplacement = contexteTour.cela;
    } else if (instruction.sujetComplement1?.nom === 'ici') {
      destinationDeplacement = this.eju.curLieu;
    }

    // destination spéciale (ceci, cela, ici)
    if (destinationDeplacement) {
      // déplacer sujet vers DIRECTION
      if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.direction)) {
        let loc: Localisation | ELocalisation = destinationDeplacement as Localisation;
        let voisinID = this.eju.getVoisinDirectionID((loc), EClasseRacine.lieu);
        if (voisinID == -1) {
          // cas particulier : si le joueur utilise entrer/sortir quand une seule sortie visible, aller dans la direction de cette sortie
          if (loc instanceof Localisation && (loc.id == ELocalisation.exterieur /*|| loc.id == ELocalisation.interieur*/)) {
            const lieuxVoisinsVisibles = this.eju.getLieuxVoisinsVisibles(this.eju.curLieu);
            if (lieuxVoisinsVisibles.length == 1) {
              voisinID = lieuxVoisinsVisibles[0].id;
              loc = lieuxVoisinsVisibles[0].localisation;
            }
          }
        }
        if (voisinID != -1) {
          const voisin = this.eju.getLieu(voisinID);
          sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, voisin.intitule, contexteTour);
          resultat.succes = sousResultat.succes;
        } else {
          resultat.succes = false;
        }
        // déplacer sujet vers un ÉLÉMENT du jeu (lieu ou objet)
      } else if (ClasseUtils.heriteDe(destinationDeplacement.classe, EClasseRacine.element)) {
        sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, contexteTour);
        resultat.succes = sousResultat.succes;
      } else {
        console.error("Exécuter infinitif: déplacer: la destination (ceci, cela ou ici) doit être soit un lieu, soit un objet, soit une direction. \ninstruction=", instruction, "\nsujet=", instruction.sujet, "\ncontexteTour=", contexteTour, ")");
        resultat.succes = false;
      }
      // destination classique
    } else {
      sousResultat = this.insDeplacerCopier.executerDeplacer(sujetDeplacement, instruction.preposition1, instruction.sujetComplement1, contexteTour);
      resultat.succes = sousResultat.succes;
    }
    return resultat;
  }

  private executerCopier(
    instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement | undefined,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);

    // retrouver quantité à copier
    let sujetCopie = instruction.sujet;
    if (instruction.sujet.determinant == 'quantitéCeci ') {
      sujetCopie = new GroupeNominal(evenement.quantiteCeci.toString(), sujetCopie.nom, sujetCopie.epithete);
    } else if (instruction.sujet.determinant == 'quantitéCela ') {
      sujetCopie = new GroupeNominal(evenement.quantiteCela.toString(), sujetCopie.nom, sujetCopie.epithete);
    }

    // copier l’élément
    this.insDeplacerCopier.executerCopier(sujetCopie, instruction.preposition1, instruction.sujetComplement1, contexteTour);
    return resultat;
  }

  private executerExecuter(
    instruction: ElementsPhrase, nbExecutions: number,
    contexteTour: ContexteTour, evenement: Evenement | undefined, declenchements: number,
  ): Resultat {
    let resultat = new Resultat(true, '', 1);
    // rem: instruction spéciale où le sujet et les compléments ne sont pas analysés !

    if (instruction.complement1) {
      // EXÉCUTER RÉACTION
      if (instruction.complement1.startsWith('réaction ')) {
        resultat = this.insExecuter.executerReaction(instruction, contexteTour);
        // EXÉCUTER ACTION (ex: exécuter l’action pousser sur ceci avec cela)
      } else if (ExprReg.xActionExecuterAction.test(instruction.complement1)) {
        resultat = this.insExecuter.executerAction(instruction, nbExecutions, contexteTour, evenement, declenchements);
        // EXÉCUTER DERNIÈRE COMMANDE
      } else if (ExprReg.xActionExecuterDerniereCommande.test(instruction.complement1)) {
        resultat = this.insExecuter.executerDerniereCommande();
        // EXÉCUTER COMMANDE "…"
      } else if (ExprReg.xActionExecuterCommande.test(instruction.complement1)) {
        resultat = this.insExecuter.envoyerCommande(instruction, contexteTour);
        // EXÉCUTER ROUTINE
      } else if (ExprReg.xActionExecuterRoutine.test(instruction.complement1)) {
        resultat = this.insExecuter.executerRoutine(instruction, nbExecutions, contexteTour, evenement, declenchements);
      } else {
        // INCONNU
        contexteTour.ajouterErreurInstruction(instruction, "Intruction « exécuter » : complément autre que  « réaction de … », « l’action xxxx… », « la commande \"xxx…\" », « la dernière commande » ou « la routine xxx » pas pris en charge. sujet=" + instruction.sujet + ", compl=" + instruction.complement1);
        resultat.succes = false;
      }
      // SANS COMPLÉMENT
    } else {
      console.error("executerInfinitif >> exécuter >> complément autre que  « réaction de … », « l’action xxxx… », « la commande \"xxx…\" », « la dernière commande » ou « la routine xxx » pas pris en charge. sujet=", instruction.sujet);
      resultat.succes = false;
    }
    return resultat;
  }

  /** émettre un son pour que le joueur puisse vérifier ses baffles. */
  public testerSon(): Resultat {
    return this.insJouerArreter.testSon();
  }

  public onChangementAudioActif() {
    this.insJouerArreter.onChangementAudioActif();
  }

  /**
   * Wrapper conservé pour la compatibilité avec Commandeur (gestion des tours).
   * La logique vit dans InstructionSysteme.
   */
  public determinerDeplacementVers(destination: string, ctxTour: ContexteTour) {
    this.insSysteme.determinerDeplacementVers(destination, ctxTour);
  }

  public unload() {
    // éviter que le son continue à jouer après qu’on ait quitté le jeu
    this.insJouerArreter.unload();
    this.insCharger.unload();
  }

}
