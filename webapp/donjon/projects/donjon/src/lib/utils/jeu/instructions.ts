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
import { InstructionsUtils } from './instructions-utils';
import { InterruptionsUtils } from './interruptions-utils';
import { Intitule } from '../../models/jeu/intitule';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation, ELocalisation } from '../../models/jeu/localisation';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { PhraseUtils } from '../commun/phrase-utils';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';
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
    m.set('consommer', (ins, _nb, ctx, ev, _dec) => this.executerConsommer(ins, ctx, ev));
    // « créer N <unité> de X dans Y » = créer de nouvelles unités de la ressource à la destination.
    m.set('créer', (ins, _nb, ctx, ev, _dec) => this.executerCreer(ins, ctx, ev));
    m.set('creer', (ins, _nb, ctx, ev, _dec) => this.executerCreer(ins, ctx, ev));

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

    // garde-fou : sujet absent (ex. forme « depuis … vers … » mal décomposée) → échec gracieux
    if (!instruction.sujet) {
      resultat.succes = false;
      resultat.sortie = "{+[Instruction « déplacer » : sujet manquant ou forme non reconnue.]+}";
      return resultat;
    }

    // RESSOURCE : « déplacer [N <unité> de X | les <unité> de X] depuis <source> vers <dest> »
    if (instruction.preposition0 === 'depuis') {
      return this.executerDeplacerRessource(instruction, contexteTour, evenement);
    }

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

  /**
   * Instruction « consommer N <unité> de <ressource> » (DSL) : retire N unités de la ressource,
   * de préférence dans l’inventaire du joueur (sinon où qu’elle se trouve). L’exemplaire qui
   * atteint 0 est supprimé. Échoue (sans rien retirer) s’il n’y en a pas assez.
   */
  private executerConsommer(
    instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement | undefined,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    const sujet = instruction.sujet;
    if (!sujet) {
      resultat.succes = false;
      return resultat;
    }
    // quantité à consommer (déterminant numérique, ou quantitéCeci / quantitéCela)
    let quantite = MotUtils.getQuantite(sujet.determinant, 1);
    if (sujet.determinant === 'quantitéCeci ' && evenement) {
      quantite = evenement.quantiteCeci;
    } else if (sujet.determinant === 'quantitéCela ' && evenement) {
      quantite = evenement.quantiteCela;
    }
    // résoudre la ressource (résolution synonyme-aware) pour identifier son nom
    // résolution robuste au singulier/pluriel (« consommer 1 pomme » comme « consommer 2 pommes »)
    let objetsTrouves = this.eju.trouverObjetSurIntituleAvecScore(sujet, false)[1] ?? [];
    if (!objetsTrouves.length) { objetsTrouves = this.eju.trouverObjetSurIntituleAvecScore(sujet, false, Nombre.s)[1] ?? []; }
    if (!objetsTrouves.length) { objetsTrouves = this.eju.trouverObjetSurIntituleAvecScore(sujet, false, Nombre.p)[1] ?? []; }
    if (!objetsTrouves.length) {
      resultat.succes = false;
      return resultat;
    }
    const nomRessource = objetsTrouves[0].nom;
    // rassembler TOUS les exemplaires possédés de cette ressource (robuste au multi-exemplaire)
    let cibles = this.jeu.objets.filter(o => o.nom === nomRessource && o.position?.cibleId === this.jeu.joueur.id);
    if (!cibles.length) {
      cibles = objetsTrouves; // aucune en inventaire → puiser là où la ressource se trouve
    }
    // vérifier la disponibilité (sauf si une pile est illimitée)
    const illimite = cibles.some(o => o.quantite === -1);
    if (!illimite) {
      const total = cibles.reduce((somme, o) => somme + (o.quantite ?? 0), 0);
      if (total < quantite) {
        resultat.succes = false;
        return resultat;
      }
    }
    // consommer en puisant dans les exemplaires ; supprimer ceux qui atteignent 0
    let reste = quantite;
    for (const o of cibles) {
      if (reste <= 0) {
        break;
      }
      if (o.quantite === -1) {
        continue; // illimité : ne pas décrémenter
      }
      const pris = Math.min(o.quantite, reste);
      o.quantite -= pris;
      reste -= pris;
      if (o.quantite === 0) {
        const idx = this.jeu.objets.indexOf(o);
        if (idx !== -1) {
          this.jeu.objets.splice(idx, 1);
        }
      }
    }
    return resultat;
  }

  /**
   * Instruction « créer N <unité> de X dans/sur/sous <cible> » (DSL) : ajoute N unités de la
   * ressource à la destination (fusion si une pile y existe déjà), sans toucher au modèle.
   */
  private executerCreer(
    instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement | undefined,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    const sujet = instruction.sujet;
    if (!sujet) {
      resultat.succes = false;
      return resultat;
    }
    let quantite = MotUtils.getQuantite(sujet.determinant, 1);
    if (sujet.determinant === 'quantitéCeci ' && evenement) {
      quantite = evenement.quantiteCeci;
    } else if (sujet.determinant === 'quantitéCela ' && evenement) {
      quantite = evenement.quantiteCela;
    }
    if (quantite < 1) {
      quantite = 1;
    }
    // résoudre la ressource modèle (synonyme-aware ; robuste au singulier/pluriel : « créer une
    //  pomme » comme « créer 2 pommes » — on essaie indéfini, puis singulier, puis pluriel).
    const modele = this.eju.trouverObjetSurIntituleAvecScore(sujet, false)[1]?.[0]
      ?? this.eju.trouverObjetSurIntituleAvecScore(sujet, false, Nombre.s)[1]?.[0]
      ?? this.eju.trouverObjetSurIntituleAvecScore(sujet, false, Nombre.p)[1]?.[0];
    if (!modele) {
      resultat.succes = false;
      return resultat;
    }
    // résoudre la destination (lieu, contenant, support, joueur…)
    const destination = InstructionsUtils.trouverElementCible(instruction.sujetComplement1, contexteTour, this.eju, this.jeu, false);
    if (!destination || !ClasseUtils.heriteDe((destination as ElementJeu).classe, EClasseRacine.element)) {
      resultat.succes = false;
      return resultat;
    }
    const preposition = instruction.preposition1 ?? 'dans';
    // cloner le modèle, fixer la quantité, placer à destination (fusion si exemplaire présent)
    const copie = this.eju.copierObjet(modele);
    copie.id = this.jeu.nextID++;
    copie.quantite = quantite;
    this.jeu.objets.push(copie);
    resultat.succes = this.insDeplacerCopier.executerDeplacerObjetVersDestination(copie, preposition, destination as ElementJeu, quantite).succes;
    // si la copie a été entièrement fusionnée dans un exemplaire existant, la retirer
    if (copie.quantite === 0) {
      const idx = this.jeu.objets.indexOf(copie);
      if (idx !== -1) {
        this.jeu.objets.splice(idx, 1);
      }
    }
    return resultat;
  }

  /**
   * Instruction « déplacer [N <unité> de X | les <unité> de X] depuis <source> vers <dest> » :
   * prélève la ressource à l’emplacement source et la déplace vers l’emplacement destination.
   */
  private executerDeplacerRessource(
    instruction: ElementsPhrase, contexteTour: ContexteTour, evenement: Evenement | undefined,
  ): Resultat {
    const resultat = new Resultat(true, '', 1);
    const sujet = instruction.sujet;
    if (!sujet) {
      resultat.succes = false;
      return resultat;
    }
    // quantité (« les … » → -1 = tout)
    let quantite = MotUtils.getQuantite(sujet.determinant, -1);
    if (sujet.determinant === 'quantitéCeci ' && evenement) {
      quantite = evenement.quantiteCeci;
    } else if (sujet.determinant === 'quantitéCela ' && evenement) {
      quantite = evenement.quantiteCela;
    }
    // résoudre la ressource (fuzzy) — un exemplaire sert de référence (idOriginal commun)
    const exemplaires = this.eju.trouverObjetSurIntituleAvecScore(sujet, false)[1] ?? [];
    if (!exemplaires.length) {
      resultat.succes = false;
      return resultat;
    }
    // résoudre les emplacements source et destination
    const source = this.resoudreEmplacementRessource(instruction.complement2, contexteTour);
    const dest = this.resoudreEmplacementRessource(instruction.complement3, contexteTour);
    if (!source || !dest) {
      resultat.succes = false;
      return resultat;
    }
    // exemplaire présent à la source
    const exemplaireSource = this.eju.getExemplaireDejaContenu(exemplaires[0], source.prep, source.element);
    if (!exemplaireSource) {
      resultat.succes = false;
      return resultat;
    }
    // quantité réelle (bornée au disponible ; « tout » si -1 et source finie)
    let q = quantite;
    if (exemplaireSource.quantite !== -1 && (q === -1 || q > exemplaireSource.quantite)) {
      q = exemplaireSource.quantite;
    }
    // déplacer vers la destination
    const prepDest = PositionObjet.prepositionSpatialeToString(dest.prep);
    resultat.succes = this.insDeplacerCopier.executerDeplacerObjetVersDestination(exemplaireSource, prepDest, dest.element, q).succes;
    // nettoyer l’exemplaire source s’il est vidé
    if (exemplaireSource.quantite === 0) {
      const idx = this.jeu.objets.indexOf(exemplaireSource);
      if (idx !== -1) {
        this.jeu.objets.splice(idx, 1);
      }
    }
    return resultat;
  }

  /**
   * Résout un emplacement de ressource (« l’inventaire », « l’intérieur du coffre »,
   * « le dessous du lit », « le coffre », …) en (préposition spatiale, élément cible).
   */
  private resoudreEmplacementRessource(
    loc: string | undefined, contexteTour: ContexteTour,
  ): { prep: PrepositionSpatiale, element: ElementJeu } | null {
    if (!loc) {
      return null;
    }
    const t = loc.trim();
    // « (l’)inventaire » → dans le joueur
    if (/inventaire/i.test(t)) {
      return { prep: PrepositionSpatiale.dans, element: this.jeu.joueur };
    }
    let prep = PrepositionSpatiale.dans;
    let elementStr = t;
    let m: RegExpExecArray | null;
    if ((m = /^(?:à )?l(?:'|’)int[ée]rieur d(?:u |e la |e l(?:'|’)|es )(.+)$/i.exec(t))) {
      prep = PrepositionSpatiale.dans; elementStr = m[1];
    } else if ((m = /^(?:le |au[- ])?dessus d(?:u |e la |e l(?:'|’)|es )(.+)$/i.exec(t))) {
      prep = PrepositionSpatiale.sur; elementStr = m[1];
    } else if ((m = /^(?:le |au[- ])?dessous d(?:u |e la |e l(?:'|’)|es )(.+)$/i.exec(t))) {
      prep = PrepositionSpatiale.sous; elementStr = m[1];
    } else if ((m = /^(dans|sur|sous) (.+)$/i.exec(t))) {
      prep = PositionObjet.getPrepositionSpatiale(m[1]); elementStr = m[2];
    }
    const gn = PhraseUtils.getGroupeNominalDefiniOuIndefini(elementStr.trim(), true);
    if (!gn) {
      return null;
    }
    const element = InstructionsUtils.trouverElementCible(gn, contexteTour, this.eju, this.jeu, false);
    if (!element || !ClasseUtils.heriteDe((element as ElementJeu).classe, EClasseRacine.element)) {
      return null;
    }
    return { prep, element: element as ElementJeu };
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
