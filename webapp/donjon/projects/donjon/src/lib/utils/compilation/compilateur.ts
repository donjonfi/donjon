import { Analyseur } from './analyseur/analyseur';
import { AnalyseurInstructions } from './analyseur/analyseur.instructions';
import { AnalyseurUtils } from './analyseur/analyseur.utils';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { ContexteAnalyse } from '../../models/compilateur/contexte-analyse';
import { ContexteCompilation } from '../../models/compilateur/contexte-compilation';
import { Definition } from '../../models/compilateur/definition';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { HttpClient } from '@angular/common/http';
import { Monde } from '../../models/compilateur/monde';
import { Nombre } from '../../models/commun/nombre.enum';
import { Phrase } from '../../models/compilateur/phrase';
import { ResultatCompilation } from '../../models/compilateur/resultat-compilation';
import { StringUtils } from '../commun/string.utils';
import { lastValueFrom } from 'rxjs';

export class Compilateur {

  private static readonly infoCopyright = "Jeu créé avec Donjon FI ©2018-2022 Jonathan Claes − https://donjon.fi";
  // rem: l’espace+point termine la dernière commande écrite par le joueur (au cas-où il l’aurait oublié).
  private static readonly regleInfoDonjon = " .\naprès afficher aide: dire \"{n}{n}{+{/" + Compilateur.infoCopyright + "/}+}\"; terminer l’action avant.";

  /** Ajouter les éléments spéciaux au scénario (joueur, inventaire, jeu, ressources, …) */
  private static ajouterElementsSpeciaux(ctxAnalyse: ContexteAnalyse) {
    // ajouter le joueur et l’inventaire au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "joueur", null, EClasseRacine.joueur, ClassesRacines.Vivant, null, Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("l’", "inventaire", null, EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
    // ajouter le jeu, les ressources, la licence et le site web au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "jeu", null, EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("les ", "ressources du jeu", null, EClasseRacine.special, null, null, Genre.f, Nombre.p, -1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("la ", "licence", null, EClasseRacine.special, null, null, Genre.f, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "site", "web", EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
  }

  private static peuplerLeMonde(ctx: ContexteCompilation) {
    // ********************************************
    // PEUPLER LE MONDE À PARTIR DE L’ANALYSE
    // ********************************************
    // le monde qui est décrit
    ctx.monde = new Monde();

    // CLASSES
    // retrouver les types utilisateurs (classes)
    ctx.analyse.typesUtilisateur.forEach(def => {
      Compilateur.ajouterClasseDuTypeUtilisateur(def.intitule, ctx.analyse, ctx.monde);
    });

    // CLASSE ÉVÈNEMENTS DES RÈGLES
    // parcour des règles
    ctx.analyse.regles.forEach(regle => {
      // parcour des évènements de la règle
      regle.evenements.forEach(evenement => {
        // retrouver classe de ceci
        if (evenement.isCeci) {
          const ceciEstClasse = (evenement.ceci.match(/^un(e)? /i));
          if (ceciEstClasse) {
            evenement.classeCeci = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, evenement.ceci);
          }
        }
        // retrouver classe de cela
        if (evenement.isCela) {
          const celaEstClasse = (evenement.cela.match(/^un(e)? /i));
          if (celaEstClasse) {
            evenement.classeCela = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, evenement.cela);
          }
        }
      });
    });

    // ÉLÉMENTS
    ctx.compteurs = [];
    ctx.listes = [];
    // définir la classe des éléments génériques et les trier.
    ctx.analyse.elementsGeneriques.forEach(el => {
      el.classe = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, el.classeIntitule);
      // objets
      if (ClasseUtils.heriteDe(el.classe, EClasseRacine.objet)) {
        ctx.monde.objets.push(el);
        // listes d’objets filtrés
        if (ClasseUtils.heriteDe(el.classe, EClasseRacine.obstacle)) {
          ctx.monde.portesEtObstacles.push(el);
        } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.joueur)) {
          ctx.monde.speciaux.push(el);
        } else {
          ctx.monde.classiques.push(el);
        }
        // lieux
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.lieu)) {
        ctx.monde.lieux.push(el);
        // spécial
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.special)) {
        // spécial: sous-dossier pour les ressources du jeu
        if (el.nom.toLowerCase() == 'ressources du jeu' && el.positionString) {
          if (el.positionString.complement.toLowerCase().startsWith('dossier ') && el.positionString.position.toLowerCase().startsWith("dans")) {
            el.positionString.position = 'dans le dossier';
            el.positionString.complement = el.positionString.complement.slice('dossier '.length);

            const nomDossierNonSecurise = el.positionString.complement;
            const nomDossierSecurise = StringUtils.nomDeDossierSecurise(nomDossierNonSecurise);
            if (nomDossierSecurise.length && nomDossierSecurise == nomDossierNonSecurise) {
              ctx.monde.speciaux.push(el);
            } else {
              AnalyseurUtils.ajouterErreur(ctx.analyse, undefined, 'Ressources du jeu: le nom du dossier ne peut contenir que lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Exemple: « mon_dossier ».');
            }
          } else {
            AnalyseurUtils.ajouterErreur(ctx.analyse, undefined, 'Ressources du jeu: utiliser la formulation « Les ressources du jeu se trouvent dans le dossier abc_def. »');
          }
          // autres éléments spéciaux
        } else {
          ctx.monde.speciaux.push(el);
        }
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.compteur)) {
        ctx.compteurs.push(el);
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.liste)) {
        ctx.listes.push(el);
      } else {
        console.error("ParseCode >>> classe racine pas prise en charge:", el.classe, el);
      }
    });


    // *************************
    // SÉPARER LES INSTRUCTIONS
    // *************************
    // - DES RÈGLES
    ctx.analyse.regles.forEach(regle => {
      if (regle.instructionsBrutes) {
        regle.instructions = AnalyseurInstructions.separerInstructions(regle.instructionsBrutes, ctx.analyse, -1, regle);
      }
      if (ctx.verbeux) {
        console.log(">>> regle:", regle);
      }
    });

    // - DES RÉACTIONS
    ctx.monde.objets.forEach(objet => {
      if (objet.reactions && objet.reactions.length > 0) {
        objet.reactions.forEach(reaction => {
          // si instructions brutes commencent par une chaîne, ajouter « dire » devant.
          if (reaction.instructionsBrutes.startsWith(ExprReg.caractereDebutTexte)) {
            reaction.instructionsBrutes = "dire " + reaction.instructionsBrutes;
          }
          reaction.instructions = AnalyseurInstructions.separerInstructions(reaction.instructionsBrutes, ctx.analyse, -1, null, reaction, objet);
        });
        if (ctx.verbeux) {
          console.log(">>> objet avec réactions :", objet);
        }
      }
    });

    // **********************************
    // AFFICHER RÉSULTAT DANS LA CONSOLE
    // **********************************

    if (ctx.verbeux) {
      console.log("==================\n");
      console.log("ctx.monde:", ctx.monde);
      console.log("règles:", ctx.analyse.regles);
      console.log("actions:", ctx.analyse.actions);
      console.log("abréviations:", ctx.analyse.abreviations);
      console.log("compteurs:", ctx.compteurs);
      console.log("listes:", ctx.listes);
      console.log("aides:", ctx.analyse.aides);
      console.log("typesUtilisateur:", ctx.analyse.typesUtilisateur);
      console.log("==================\n");
    }

    ctx.resultat = new ResultatCompilation();
    ctx.resultat.monde = ctx.monde;
    ctx.resultat.regles = ctx.analyse.regles;
    ctx.resultat.actions = ctx.analyse.actions;
    ctx.resultat.abreviations = ctx.analyse.abreviations;
    ctx.resultat.compteurs = ctx.compteurs;
    ctx.resultat.listes = ctx.listes;
    ctx.resultat.erreurs = ctx.analyse.erreurs;
    ctx.resultat.aides = ctx.analyse.aides;
    ctx.resultat.parametres = ctx.analyse.parametres;

  }

  /**
   * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
   * Cette variante de l’analyse n’inclut pas les commandes de base ce qui lui permet d’être synchrone.
   * @param scenario Scénario du jeu
   * @param verbeux Est-ce qu’il faut afficher beaucoup de détails dans la console ?
   */
  public static analyserScenarioSansChargerCommandes(scenario: string, verbeux: boolean) {

    let ctx = new ContexteCompilation(verbeux);

    // ajout des éléments spéciaux (joueur, inventaire, jeu, …)
    Compilateur.ajouterElementsSpeciaux(ctx.analyse);

    // interpréter le scénario
    Compilateur.analyserCode((scenario + Compilateur.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    Compilateur.peuplerLeMonde(ctx);

    return ctx.resultat;

  }

  /**
   * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
   * @param scenario Scénario du jeu
   * @param verbeux Est-ce qu’il faut afficher beaucoup de détails dans la console ?
   * @param http service http pour récupérer le fichier commandes.djn, si pas fourni il ne sera pas récupéré.)
   */
  public static async analyserScenario(scenario: string, verbeux: boolean, http: HttpClient) {

    let ctx = new ContexteCompilation(verbeux);

    // ajouter les éléments spéciaux
    Compilateur.ajouterElementsSpeciaux(ctx.analyse);

    // inclure les commandes de base, sauf si on les a désactivées
    if (!scenario.includes('Désactiver les commandes de base.') && !scenario.includes('désactiver les commandes de base.')) {
      try {
        const sourceCommandes = await lastValueFrom(http.get('assets/modeles/commandes.djn', { responseType: 'text' }));
        try {
          Compilateur.analyserCode(sourceCommandes, ctx.analyse);
        } catch (error) {
          console.error("Une erreur s’est produite lors de l’analyse des commandes de base :", error);
        }
      } catch (error) {
        console.error("Fichier « assets/modeles/commandes.djn » pas trouvé. Commandes de base pas importées.");
        ctx.analyse.erreurs.push("Le fichier « assets/modeles/commandes.djn » n’a pas été trouvé. C’est le fichier qui contient les commandes de bases.");
      }
    }

    // Interpréter le scénario
    Compilateur.analyserCode((scenario + Compilateur.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    Compilateur.peuplerLeMonde(ctx);

    return ctx.resultat;

  }

  /**
   * Interpréter le code source fourni et renvoyer le jeu correspondant.
   * @param source Code à interpréter.
   */
  private static analyserCode(
    source: string,
    contexteAnalyse: ContexteAnalyse
  ) {

    // *****************************************
    // CONVERTIR LE SCÉNARIO BRUT EN PHRASES
    // *****************************************
    let phrases = Compilateur.convertirCodeSourceEnPhrases(source);

    // ********************************
    // ANALYSER LES PHRASES
    // ********************************
    Analyseur.analyserPhrases(phrases, contexteAnalyse);

  }

  /**
   * Nettoyer le scénario :
   * - ajouter des points aux sections
   * - retirer les commentaires
   * - échaper les retours à la ligne
   */
  public static nettoyerCodeSource(scenario: string): string {
    // terminer par un « . » les parties, chapitre et scènes.
    const sectionsAvecPoint = scenario.replace(/^(?:[ \t]*)((?:partie|chapitre|scène) (?:.*?))(\.)?$/mig, "$1.");

    // on retire les commentaire mais pas les lignes car il faut
    // que les numéros de lignes de changent pas !
    const sansCommentaires = sectionsAvecPoint.replace(/^((?: *)--(?:.*))$/gm, " ");

    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    const scenarioNettoye = sansCommentaires
      .replace(/(\r\n|\r|\n)/g, ExprReg.caractereRetourLigne)
      .replace(/( +)/g, " ")
      .trim();

    return scenarioNettoye;
  }

  /**
   * Convertir le code source en une tableau de phrases.
   * @param scenario Code source à analyser.
   */
  public static convertirCodeSourceEnPhrases(scenario: string): Phrase[] {

    const scenarioNettoye = Compilateur.nettoyerCodeSource(scenario);

    // séparer les chaines de caractères (entre " ") du code
    const blocsInstructionEtTexte = scenarioNettoye.split('"');

    let phrases = new Array<Phrase>();
    let indexPhrase = 0;
    let numeroLigne = 1;
    let phrasePrecedente: Phrase = null;
    let prochainBlocEstSousTexte: boolean = false;
    let blocPrecedentEstSousTexte: boolean = false;
    // si le bloc commence par " on commence avec un bloc texte
    let blocSuivantEstInstruction: boolean;
    if (scenarioNettoye[0] === '"') {
      blocSuivantEstInstruction = false;
      /// sinon on commence par un bloc instruction
    } else {
      blocSuivantEstInstruction = true;
    }

    // séparer les blocs en phrases sauf à l’intérieur des textes.
    blocsInstructionEtTexte.forEach(bloc => {
      if (bloc !== '') {
        // bloc instruction, séparer les phrases (sur les '.')
        if (blocSuivantEstInstruction && !prochainBlocEstSousTexte) {
          // séparer sur les points qui terminent un mot.
          const phrasesBrutes = bloc.split(/\.(?!\w|_)/);
          for (let k = 0; k < phrasesBrutes.length; k++) {
            const phraseBrute = phrasesBrutes[k];
            // compte le nombre de lignes pour ne pas se décaller !
            const nbLignes = phraseBrute.match(ExprReg.xCaractereRetourLigne)?.length ?? 0;
            let nbLignesAvantPhrase = 0;
            if (nbLignes > 0) {
              const phraseSansLigneAvant = phraseBrute.replace(ExprReg.xCaractereRetourLigneDebutPhrase, '');
              const nbLignesSansLigneAvant = phraseSansLigneAvant.match(ExprReg.xCaractereRetourLigne)?.length ?? 0;
              nbLignesAvantPhrase = nbLignes - nbLignesSansLigneAvant;
            }
            // si ce n’est pas la dernière phrase elle est forcément finie
            // si c’est la fin du bloc et qu’elle se termine par un point, la phrase est finie également.
            const trimBloc = bloc.trim();
            const finie = ((k < (phrasesBrutes.length - 1)) || (trimBloc.lastIndexOf(".") === (trimBloc.length - 1)));



            // enlever le "." et remplacer les retours à la ligne par des espaces
            const phraseNettoyee = phraseBrute
              .replace(/\.$/, '')
              .replace(ExprReg.xCaractereRetourLigne, " ")
              .trim();

            // nouvelle phrase
            if (!phrasePrecedente || phrasePrecedente.finie) {
              if (phraseNettoyee !== '') {
                phrasePrecedente = new Phrase([phraseNettoyee], false, null, indexPhrase++, (numeroLigne + nbLignesAvantPhrase), finie);
                phrases.push(phrasePrecedente);
              }
              // suite de la phrase précédente
            } else {
              if (phraseNettoyee !== '') {
                phrasePrecedente.phrase.push(phraseNettoyee);
              }
              phrasePrecedente.finie = finie;
            }

            numeroLigne += nbLignes; //Math.max(1, nbLignes);
          }
          // si le bloc est un texte, l'ajouter tel quel :
        } else {

          // compte le nombre de lignes pour ne pas se décaller !
          const nbLignes = bloc.match(ExprReg.xCaractereRetourLigne)?.length ?? 0;

          // pour éviter que les , et ; des textes soient interprétés, on les remplace par des caractères différents
          let texteNettoye = bloc.replace(/\,/g, ExprReg.caractereVirgule).trim();
          texteNettoye = texteNettoye.replace(/\;/g, ExprReg.caracterePointVirgule).trim();

          // corriger espaces insécables et chevrons
          texteNettoye = texteNettoye
            .replace(/<< /g, "« ")
            .replace(/ >>/g, " »")
            .replace(/ \?/g, " ?")
            .replace(/ !/g, " !")
            // .replace(/ :/g, " :") // pause un souci avec les si/sinon
            .replace(/\.\.\.(?!:\.)/g, "…");


          // le texte concerne toujours la phrase précédente (s'il y en a une)
          if (phrasePrecedente) {
            const blocActuelEstSousTexte = prochainBlocEstSousTexte;
            if (prochainBlocEstSousTexte) {
              // pas de guillets dans ce cas-ci car déjà ajoutés par les blocs de texte qui entourent le bloc forcé
              prochainBlocEstSousTexte = false;
            } else {
              // si on a un crochet non fermé dans le texte actuel, le code suivant est en réalité la suite du texte
              prochainBlocEstSousTexte = Compilateur.dernierCrochetEstOuvert(texteNettoye);
            }
            // GESTION DES GUILLEMETS
            // cas le plus commun:
            // le bloc précédent n’est pas un sous texte et  le bloc suivant n’est pas un sous texte
            if (!blocPrecedentEstSousTexte && !prochainBlocEstSousTexte) {
              // on est dans un sous-texte:
              //  ne pas mettre de guillemets (ils sont ajoutés par les blocs qui l’entourent)
              if (blocActuelEstSousTexte) {
                phrasePrecedente.phrase.push(texteNettoye);
                // on est dans un texte principal:
                //  on met des guillemets ouvrant et fermant autours du texte
              } else {
                phrasePrecedente.phrase.push(ExprReg.caractereDebutTexte + texteNettoye + ExprReg.caractereFinTexte);
              }
              // autre cas:
              //  le bloc précédent n’est pas un sous texte, on commence par un guillemet ouvrant
              //  le bloc suivant est un sous texte, on termine sur un guillemet ouvrant
            } else if (!blocPrecedentEstSousTexte && prochainBlocEstSousTexte) {
              phrasePrecedente.phrase.push(ExprReg.caractereDebutTexte + texteNettoye + ExprReg.caractereDebutTexte);
              // autre cas:
              //  le bloc précédent est un sous texte, on commence par un guillemet fermant
              //  le bloc suivant n’est pas un sous texte, on termine sur un guillemet fermant
            } else if (blocPrecedentEstSousTexte && !prochainBlocEstSousTexte) {
              phrasePrecedente.phrase.push(ExprReg.caractereFinTexte + texteNettoye + ExprReg.caractereFinTexte);
              // autre cas:
              //  le bloc précédent est un sous texte, on commence par un guillemet fermant
              //  le bloc suivant est un sous texte, on termine sur un guillemet ouvrant
            } else {
              phrasePrecedente.phrase.push(ExprReg.caractereFinTexte + texteNettoye + ExprReg.caractereDebutTexte);
            }

            // si on est actuellement dans un sous-texte, le prochain bloc suivra un sous-texte.
            blocPrecedentEstSousTexte = blocActuelEstSousTexte;

          } else {
            console.error("Le scénario doit commencer par une instruction. (Il ne peut pas commencer par un texte entre guillemets.)");
          }
          numeroLigne += nbLignes; // Math.max(1, nbLignes);
        }
        blocSuivantEstInstruction = !blocSuivantEstInstruction;
      }
    });

    return phrases;
  }

  /**
    * Retourne 'true' si le dernier crochet rencontré est un crochet ouvert.
    */
  public static dernierCrochetEstOuvert(texte: string): boolean {
    let dernierEstOuvert = false;
    if (texte) {
      for (let index = 0; index < texte.length; index++) {
        const char = texte[index];
        if (char == '[') {
          dernierEstOuvert = true;
        } else if (char == ']') {
          dernierEstOuvert = false;
        }
      }
    }
    return (dernierEstOuvert);
  }


  private static ajouterClasseDuTypeUtilisateur(nomTypeUtilisateur, ctxAnalyse: ContexteAnalyse, monde: Monde): Classe {

    // > NOM
    const nom = StringUtils.normaliserMot(nomTypeUtilisateur);

    // > DEFINITION
    let def: Definition = null;
    // retrouver la définition du type
    if (ctxAnalyse.typesUtilisateur.has(nom)) {
      def = ctxAnalyse.typesUtilisateur.get(nom);
      // définition pas trouvé => hériter de objet par défaut
    } else {
      def = new Definition(nomTypeUtilisateur, EClasseRacine.objet, Nombre.s, []);
    }

    // > INTITULÉ
    const intitule = def.intitule;

    // > PARENT
    let parent = monde.classes.find(x => x.nom === StringUtils.normaliserMot(def.typeParent));
    // si parent pas encore présent, le définir
    if (!parent) {
      parent = Compilateur.ajouterClasseDuTypeUtilisateur(def.typeParent, ctxAnalyse, monde);
    }

    // > NIVEAU
    const niveau = parent.niveau + 1;

    // > CRÉATION
    // vérifier si existe déjà
    let retVal = monde.classes.find(x => x.nom == nom);
    // existe déjà
    if (retVal) {
      // AnalyseurUtils.ajouterErreur(ctxAnalyse, 0, ("Type défini plusieurs fois : " + retVal.intitule));
      // n’existe pas encore
    } else {
      retVal = new Classe(nom, intitule, parent, niveau, def.etats);
      // ajouter une nouvelle classe pour ce type utilisateur
      monde.classes.push(retVal);
    }

    return retVal;
  }


}
