import { ActionsUtils } from "./actions-utils";
import { ClasseUtils } from "../commun/classe-utils";
import { ClassesRacines } from "../../models/commun/classes-racines";
import { CommandesUtils } from "./commandes-utils";
import { Commandeur } from "./commandeur";
import { Compteur } from "../../models/compilateur/compteur";
import { ContexteTour } from "../../models/jouer/contexte-tour";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Evenement } from "../../models/jouer/evenement";
import { ExprReg } from "../compilation/expr-reg";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { Instructions } from "./instructions";
import { InstructionsUtils } from "./instructions-utils";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Objet } from "../../models/jeu/objet";
import { ParamRoutine } from "../../models/compilateur/param-routine";
import { PhraseUtils } from "../commun/phrase-utils";
import { ProgrammationTemps } from "../../models/jeu/programmation-temps";
import { Resultat } from "../../models/jouer/resultat";
import { RoutineReaction } from "../../models/compilateur/routine-reaction";
import { RoutineSimple } from "../../models/compilateur/routine-simple";

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
    let reaction: RoutineReaction = null;

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
      let ctxTour = new ContexteTour(undefined, undefined);
      resultat = this.ins.executerInstructions(reaction.instructions, ctxTour, undefined, undefined);
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
      let resChercherCandidats = this.act.chercherCandidatsActionSansControle(insInfinitif, insCeci ? true : false, insCela ? true : false, true, false);

      // si verbe pas trouvé, chercher candidat en ne tenant pas compte des accents
      if (!resChercherCandidats.verbeConnu) {
        resChercherCandidats = this.act.chercherCandidatsActionSansControle(insInfinitif, insCeci ? true : false, insCela ? true : false, false, false);
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
        const sousResExecuter = this.ins.executerInstructions(action.phaseExecution, sousContexteTour, evenement, declenchements);
        const sousResTerminer = this.ins.executerInstructions(action.phaseEpilogue, sousContexteTour, evenement, declenchements);
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

  /**
   * Exécuter l’instruction « Exécuter routine nomRoutine [avec ARG1 [et ARG2]] [dans N unité] ».
   *
   * Phase 1 :
   *  - appels synchrones avec 0, 1 ou 2 arguments ;
   *  - appels différés (`dans N seconde`) **sans** arguments uniquement ;
   *  - résolution de surcharge par arité + types (cf. `bindArg` / `scoreParam`).
   */
  public executerRoutine(instruction: ElementsPhrase, nbExecutions: number, contexteTour: ContexteTour, evenement: Evenement, declenchements: number): Resultat {

    let res = new Resultat(true, "", 1);

    // décomposer le complément
    const tokens = ExprReg.xActionExecuterRoutine.exec(instruction.complement1);
    if (!tokens) {
      contexteTour.ajouterErreurInstruction(instruction, `Le nom de la routine n’est pas dans un format supporté: ${instruction.complement1}`);
      res.succes = false;
      return res;
    }

    const nomRoutine = tokens[1];
    const trailerArgs: string | undefined = tokens[2] ?? undefined;
    const temps: string | undefined = tokens[3] ?? undefined;
    const uniteTemps: string | undefined = tokens[4] ?? undefined;

    // Récupérer toutes les routines partageant le nom (surcharge)
    const candidatsParNom = this.jeu.routines.filter(x => x.nom === nomRoutine);
    if (!candidatsParNom.length) {
      contexteTour.ajouterErreurInstruction(instruction, `La routine n’a pas été trouvée : ${nomRoutine}`);
      res.succes = false;
      return res;
    }

    // Cas appel différé (« dans N seconde(s) ») : on mémorise le trailer brut tel quel ;
    // les arguments sont résolus au déclenchement (fire-time), pas à la programmation.
    if (uniteTemps) {
      this.programmerRoutine(instruction, contexteTour, nomRoutine, temps!, uniteTemps, trailerArgs);
      return res;
    }

    // Découper le trailer en arguments (séparés par « et » à profondeur 0)
    const args: string[] = trailerArgs ? this.couperTrailerArgs(trailerArgs) : [];

    // Résolution de surcharge (arité + types) — partagée avec le replay via lierAppelRoutine.
    const liaison = this.lierAppelRoutine(nomRoutine, args);
    if (liaison.erreur || !liaison.routine) {
      contexteTour.ajouterErreurInstruction(instruction, liaison.erreur ?? `La routine n’a pas pu être liée : ${nomRoutine}`);
      res.succes = false;
      return res;
    }

    // Exécuter le candidat retenu
    const sousContexteTour = new ContexteTour(liaison.ceciVal, liaison.celaVal);
    res = this.ins.executerInstructions(liaison.routine.instructions, sousContexteTour, evenement, declenchements);
    return res;
  }

  /**
   * Sépare une valeur d’étape de déclenchement ('d') en nom de routine + arguments canoniques.
   * Format : `nom` (sans argument) ou `nom avec <trailerCanonique>` (le trailer est découpé
   * via `couperTrailerArgs`, quote-aware). Utilisé par tous les sites de replay.
   */
  public parseDeclenchement(valeur: string): { nom: string, argsCanoniques: string[] } {
    const sep = ' avec ';
    const idx = valeur.indexOf(sep);
    if (idx === -1) {
      return { nom: valeur.trim(), argsCanoniques: [] };
    }
    const nom = valeur.substring(0, idx).trim();
    const trailer = valeur.substring(idx + sep.length);
    return { nom, argsCanoniques: this.couperTrailerArgs(trailer) };
  }

  /**
   * Lie un appel de routine (nom + arguments) à une routine concrète, en re-jouant la
   * résolution de surcharge (arité + types + score de spécificité). Réutilisé par l’appel
   * synchrone (`executerRoutine`) ET par tous les sites de replay (chrono, restauration,
   * magnéto) — d’où l’extraction : un simple `find` par nom exécuterait la mauvaise surcharge.
   */
  public lierAppelRoutine(nom: string, args: string[]): { routine?: RoutineSimple, ceciVal?: Intitule, celaVal?: Intitule, erreur?: string } {
    // Comparaison insensible à la casse : le chrono (ProgrammationTemps) mémorise le nom en
    // minuscules, alors que routine.nom conserve la casse déclarée — un `===` raterait le fire-time.
    const nomNorm = nom.toLocaleLowerCase();
    const candidatsParNom = this.jeu.routines.filter(x => x.nom.toLocaleLowerCase() === nomNorm);
    if (!candidatsParNom.length) {
      return { erreur: `La routine n’a pas été trouvée : ${nom}` };
    }

    // Filtrer par arité
    const candidatsArite = candidatsParNom.filter(r => {
      const arite = (r.ceci ? 1 : 0) + (r.cela ? 1 : 0);
      return arite === args.length;
    });
    if (!candidatsArite.length) {
      return { erreur: `Aucune routine ${nom} ne correspond avec ${args.length} argument(s).` };
    }

    // Tenter le binding pour chaque candidat
    type Binding = {
      routine: RoutineSimple;
      ceciVal: Intitule | undefined;
      celaVal: Intitule | undefined;
      score: number;
    };
    const bindings: Binding[] = [];
    for (const r of candidatsArite) {
      const ceciVal = r.ceci ? this.bindArg(args[0], r.paramCeci!) : undefined;
      if (r.ceci && !ceciVal) continue;
      const celaVal = r.cela ? this.bindArg(args[1], r.paramCela!) : undefined;
      if (r.cela && !celaVal) continue;
      const score = this.scoreCandidat(r);
      bindings.push({ routine: r, ceciVal, celaVal, score });
    }

    if (!bindings.length) {
      return { erreur: `Aucune routine ${nom} ne correspond aux arguments fournis (${args.join(', ')}).` };
    }

    // Trier par score décroissant
    bindings.sort((a, b) => b.score - a.score);

    // Ambiguïté : plusieurs candidats au score max
    if (bindings.length > 1 && bindings[0].score === bindings[1].score) {
      return { erreur: `Plusieurs routines ${nom} correspondent aux arguments (ambiguïté). Préciser un type plus spécifique dans le bloc {@définitions:@}.` };
    }

    const choisi = bindings[0];
    return { routine: choisi.routine, ceciVal: choisi.ceciVal, celaVal: choisi.celaVal };
  }

  /**
   * Forme canonique d’un argument lié, pour sérialisation dans une étape 'd' puis re-liaison
   * déterministe au replay. Le type du paramètre dicte la forme (pour retomber sur la même
   * surcharge) :
   *  - nombre → entier nu (`42`)
   *  - texte  → littéral entre guillemets (`"bonjour"`)
   *  - classe → intitulé de l’élément (`coffre rouge`)
   */
  public canoniserArg(val: Intitule, param: ParamRoutine): string {
    if (param.type === 'nombre') {
      return `${(val as Compteur).valeur}`;
    }
    if (param.type === 'texte') {
      // La valeur texte synthétique conserve le texte brut dans son groupe nominal.
      const brut = val.intitule ? val.intitule.nom : (val.nom ?? '');
      return `"${brut}"`;
    }
    // classe : intitulé (nom + épithète, sans déterminant) — re-résolu via resoudreElementJeu.
    return val.intitule ? val.intitule.nomEpithete : (val.nom ?? '');
  }

  /**
   * Découper le trailer d’arguments d’un appel de routine en arguments distincts.
   * Sépare sur ` et ` à profondeur de guillemets 0 (les chaînes `"…"` sont préservées).
   * Phase 1 : on s’attend à 1 ou 2 args max.
   */
  private couperTrailerArgs(trailer: string): string[] {
    const args: string[] = [];
    let dansGuillemets = false;
    let curr = '';
    let i = 0;
    while (i < trailer.length) {
      const c = trailer[i];
      if (c === '"') {
        dansGuillemets = !dansGuillemets;
        curr += c;
        i++;
      } else if (!dansGuillemets && trailer.substring(i, i + 4) === ' et ') {
        args.push(curr.trim());
        curr = '';
        i += 4;
      } else {
        curr += c;
        i++;
      }
    }
    if (curr.trim()) args.push(curr.trim());
    return args;
  }

  /**
   * Lier un argument brut à un paramètre typé.
   * Retourne un `Intitule` (potentiellement synthétique pour les types `nombre`/`texte`)
   * que la routine recevra via `ContexteTour.ceci`/`cela`.
   */
  private bindArg(argBrut: string, param: ParamRoutine): Intitule | undefined {
    const arg = argBrut.trim();

    if (param.type === 'nombre') {
      const valeur = this.resoudreValeurNombre(arg);
      if (valeur === undefined) return undefined;
      // Wrapper : un Compteur synthétique permet à `[c ceci]` et `changer ceci` de fonctionner.
      // Sa mutation interne ne propage rien à l’appelant (sémantique « par valeur »).
      return new Compteur('valeur', valeur);
    }

    if (param.type === 'texte') {
      const texte = this.resoudreValeurTexte(arg);
      if (texte === undefined) return undefined;
      return new Intitule(texte, new GroupeNominal(null, texte, null), ClassesRacines.Intitule);
    }

    // 'classe' : résoudre la classe attendue, puis l’élément, puis vérifier l’héritage.
    const classeAttendue = ClasseUtils.trouverClasse(this.jeu.classes, param.classeName!);
    if (!classeAttendue) return undefined;
    const elem = this.resoudreElementJeu(arg);
    if (!elem) return undefined;
    if (!ClasseUtils.heriteDe(elem.classe, classeAttendue.nom)) return undefined;
    return elem;
  }

  /** Tente de résoudre l’argument comme valeur entière (littéral ou valeur d’un compteur). */
  private resoudreValeurNombre(arg: string): number | undefined {
    if (/^-?\d+$/.test(arg)) return Number.parseInt(arg, 10);
    const c = this.resoudreCompteur(arg);
    if (c) return c.valeur;
    return undefined;
  }

  /** Tente de résoudre l’argument comme chaîne (littéral `"…"` ou intitulé d’un élément). */
  private resoudreValeurTexte(arg: string): string | undefined {
    if (arg.length >= 2 && arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }
    const elem = this.resoudreElementJeu(arg);
    if (elem) return elem.intitule ? elem.intitule.toString() : (elem.nom ?? undefined);
    return undefined;
  }

  /** Cherche un compteur dont l’intitulé correspond à `arg`. */
  private resoudreCompteur(arg: string): Compteur | undefined {
    const gn = PhraseUtils.getGroupeNominalDefiniOuIndefini(arg, false);
    if (!gn) return undefined;
    const [, candidats] = ElementsJeuUtils.chercherSurIntitule(gn, this.jeu.compteurs, false);
    return (candidats.length === 1) ? candidats[0] : undefined;
  }

  /** Cherche un élément (objet, lieu, compteur, concept) dont l’intitulé correspond à `arg`. */
  private resoudreElementJeu(arg: string): Intitule | undefined {
    const gn = PhraseUtils.getGroupeNominalDefiniOuIndefini(arg, false);
    if (!gn) return undefined;
    const collections: Intitule[][] = [this.jeu.objets, this.jeu.lieux, this.jeu.compteurs, this.jeu.concepts];
    for (const col of collections) {
      const [, candidats] = ElementsJeuUtils.chercherSurIntitule(gn, col, false);
      if (candidats.length === 1) return candidats[0];
    }
    return undefined;
  }

  /**
   * Score de spécificité d’un candidat de routine.
   * Tuple `(scoreCeci, scoreCela)` aplati en `scoreCeci * 10000 + scoreCela`.
   * `scoreParam` : 0 si absent, 500 si nombre/texte, 1000+ordre si classe.
   * Conséquence : un param « classe » bat toujours un param « nombre/texte »
   * indépendamment de la profondeur (kind beats depth).
   */
  private scoreCandidat(r: RoutineSimple): number {
    return this.scoreParam(r.paramCeci) * 10000 + this.scoreParam(r.paramCela);
  }

  private scoreParam(p?: ParamRoutine): number {
    if (!p) return 0;
    if (p.type === 'classe') {
      const c = ClasseUtils.trouverClasse(this.jeu.classes, p.classeName!);
      const depth = c ? (c.niveau ?? 0) : 0;
      return 1000 + depth;
    }
    return 500; // nombre / texte
  }

  private programmerRoutine(instruction: ElementsPhrase, contexteTour: ContexteTour, routine: string, temps: string, unite: string, argsTrailer?: string) {

    let tempsNombre = Number.parseInt(temps);
    let tempsMs: number;

    switch (unite.toLowerCase()) {
      case 'seconde':
        tempsMs = tempsNombre * 1000;
        break;

      case 'minute':
        tempsMs = tempsNombre * 1000 * 60;
        break;

      case 'heure':
        tempsMs = tempsNombre * 1000 * 60 * 60;
        break;

      default:
        contexteTour.ajouterErreurInstruction(instruction, `L’unité de temps n’est pas prise en charge: ${unite}. Unités valides : seconde, minute, heure.`);
        tempsMs = 0;
        break;
    }

    if (tempsMs > 0) {
      if (this.ins.restaurationPartieEnCours) {
        if (this.verbeux) {
          console.warn(`Programmation de routine ${routine} ignorée (restaurationPartieEnCours)`);
        }
      } else {
        let nouvelleProgrammation = new ProgrammationTemps(routine, tempsMs, argsTrailer);
        this.jeu.programmationsTemps.push(nouvelleProgrammation);
      }
    } else {
      contexteTour.ajouterErreurInstruction(instruction, `La programmation du chronomètre n’a pas pu être réalisée car incorrecte.`);
    }
  }

  /**  Envoyer la commande à exécuter au commandeur (l’instruction « Exécuter commande "xxxx…") */
  public envoyerCommande(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    let res = new Resultat(true, "", 1);
    const tokens = ExprReg.xActionExecuterCommande.exec(instruction.complement1);
    if (tokens) {
      // remplacer les balises éventuelles dans le texte  
      let texteCommande = CommandesUtils.nettoyerCommande(tokens[1]);
      texteCommande = this.ins.dire.calculerTexteDynamique(texteCommande, 0, undefined, contexteTour, contexteTour.commande.evenement, undefined);
      // exécuter la commande
      res.sortie = this.com.executerCommande(texteCommande, true).sortie;
    } else {
      console.error("executerCommande: format complément1 par reconnu:", instruction.complement1);
      res.succes = false;
    }
    return res;
  }

  public executerDerniereCommande(): Resultat {
    const ctxCom = this.com.executerDerniereCommande();
    if (ctxCom) {
      return new Resultat(true, ctxCom.sortie, 1);
    } else {
      return new Resultat(false, '', 0);
    }
  }


}
