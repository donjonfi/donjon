import { Analyseur } from './analyseur/analyseur';
import { AnalyseurConsequences } from './Analyseur/analyseur.consequences';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { ContexteAnalyse } from '../../models/compilateur/contexte-analyse';
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

export class Compilateur {

  private static readonly infoCopyright = "Jeu créé avec Donjon FI ©2018-2021 Jonathan Claes − see MIT License";

  /**
   * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
   * @param scenario Scénario du jeu
   * @param verbeux Est-ce qu’il faut afficher beaucoup de détails dans la console ?
   * @param http service http pour récupérerles fichiers à inclure.
   */
  public static async analyserScenario(scenario: string, verbeux: boolean, http: HttpClient) {
    console.warn("analyserScenario >> verbeux=", verbeux);
    // le contexte de l’analyse
    let ctxAnalyse = new ContexteAnalyse(verbeux);
    // ajouter le joueur et l’inventaire au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "joueur", null, EClasseRacine.joueur, ClassesRacines.Vivant, null, Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("l’", "inventaire", null, EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
    // ajouter le jeu et la licence au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "jeu", null, EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("la ", "licence", null, EClasseRacine.special, null, null, Genre.f, Nombre.s, 1, null));

    // inclure les commandes de base, sauf si on les a désactivées.
    if (!
      (scenario.includes('Désactiver les commandes de base.')
        || scenario.includes('désactiver les commandes de base.'))) {
      try {
        const sourceCommandes = await http.get('assets/modeles/commandes.djn', { responseType: 'text' }).toPromise();
        Compilateur.analyserCode(sourceCommandes, ctxAnalyse);
      } catch (error) {
        console.error("Fichier « assets/modeles/commandes.djn » pas trouvé. Commandes de base pas importées.");
        ctxAnalyse.erreurs.push("Le fichier « assets/modeles/commandes.djn » n’a pas été trouvé. C’est le fichier qui contient les commandes de bases.");
      }
    }

    // rem: le point termine la dernière commande écrite par le joueur (au cas-où il l’aurait oublié).
    const regleInfoDonjon = "\n.après afficher aide: dire \"{n}{n}{+{/" + Compilateur.infoCopyright + "/}+}\"; continuer l’action.";

    // B. Interpréter le scénario
    Compilateur.analyserCode((scenario + regleInfoDonjon), ctxAnalyse);

    // ********************************************
    // PEUPLER LE MONDE À PARTIR DE L’ANALYSE
    // ********************************************
    // le monde qui est décrit
    let monde = new Monde();

    ctxAnalyse.elementsGeneriques.forEach(el => {
      el.classe = Compilateur.trouverClasse(monde.classes, el.classeIntitule);
      // objets
      if (ClasseUtils.heriteDe(el.classe, EClasseRacine.objet)) {
        monde.objets.push(el);
        // listes d’objets filtrés
        if (ClasseUtils.heriteDe(el.classe, EClasseRacine.porte)) {
          monde.portes.push(el);
        } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.joueur)) {
          monde.speciaux.push(el);
        } else {
          monde.classiques.push(el);
        }
        // lieux
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.lieu)) {
        monde.lieux.push(el);
        // spécial
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.special)) {
        monde.speciaux.push(el);
      } else {
        console.error("ParseCode >>> classe racine pas prise en charge:", el.classe);
      }
    });

    // *************************
    // SÉPARER LES CONSÉQUENCES
    // *************************
    // - DES RÈGLES
    ctxAnalyse.regles.forEach(regle => {
      if (regle.consequencesBrutes) {
        regle.instructions = AnalyseurConsequences.separerConsequences(regle.consequencesBrutes, ctxAnalyse.erreurs, -1, regle);
      }
      if (verbeux) {
        console.log(">>> regle:", regle);
      }
    });

    // - DES RÉACTIONS
    monde.objets.forEach(objet => {
      if (objet.reactions && objet.reactions.length > 0) {
        objet.reactions.forEach(reaction => {
          // si instructions brutes commencent par une chaîne, ajouter « dire » devant.
          if (reaction.instructionsBrutes.startsWith(ExprReg.caractereDebutTexte)) {
            reaction.instructionsBrutes = "dire " + reaction.instructionsBrutes;
          }
          reaction.instructions = AnalyseurConsequences.separerConsequences(reaction.instructionsBrutes, ctxAnalyse.erreurs, -1, null, reaction, objet);
        });
        if (verbeux) {
          console.log(">>> objet avec réactions :", objet);
        }
      }
    });

    // **********************************
    // AFFICHER RÉSULTAT DANS LA CONSOLE
    // **********************************

    // if (verbeux) {
    console.log("==================\n");
    console.log("monde:", monde);
    console.log("règles:", ctxAnalyse.regles);
    console.log("actions:", ctxAnalyse.actions);
    console.log("aides:", ctxAnalyse.aides);
    console.log("typesUtilisateur:", ctxAnalyse.typesUtilisateur);
    console.log("==================\n");
    // }

    let resultat = new ResultatCompilation();
    resultat.monde = monde;
    resultat.regles = ctxAnalyse.regles;
    resultat.actions = ctxAnalyse.actions;
    resultat.erreurs = ctxAnalyse.erreurs;
    resultat.aides = ctxAnalyse.aides;

    return resultat;

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
   * Convertir le code source en une tableau de phrases.
   * @param scenario Code source à analyser.
   */
  private static convertirCodeSourceEnPhrases(scenario: string) {

    // // gestion des commentaires de ligne (--)
    // // => si une ligne commence par «--» on ajoute automatiquement un «.» (fin d’instruction)
    // // à la fin de la ligne pour éviter que l’utilisateur ne soit obligé de terminer ses
    // // terminer les commentaires par un «.».
    // let CommentairesCorriges = source.replace(/^--(.+)?$/mg, "--$1.");

    // terminer par un « . » les parties, chapitre et scènes.
    const sectionsAvecPoint = scenario.replace(/^((?:partie|chapitre|scène) (?:.*?))(\.)?$/mig, "$1.");

    // on retire les commentaire mais pas les lignes car il faut
    // que les numéros de lignes de changent pas !
    const sansCommentaires = sectionsAvecPoint.replace(/^((?: *)--(?:.*))$/gm, " ");

    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    const scenarioNettoye = sansCommentaires
      .replace(/(\r\n|\r|\n)/g, ExprReg.caractereRetourLigne)
      .replace(/( +)/g, " ").trim();

    // séparer les chaines de caractères (entre " ") du code
    const blocsInstructionEtTexte = scenarioNettoye.split('"');

    let phrases = new Array<Phrase>();
    let indexPhrase = 0;
    let numeroLigne = 1;
    let premiereLigne = true;
    let phrasePrecedente: Phrase = null;
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
        if (blocSuivantEstInstruction) {
          const phrasesBrutes = bloc.split('.');
          for (let k = 0; k < phrasesBrutes.length; k++) {
            const phraseBrute = phrasesBrutes[k];
            // compte le nombre de lignes pour ne pas se décaller !
            const nbLignes = (phraseBrute.match(ExprReg.xCaractereRetourLigne) || []).length;

            // si ce n’est pas la dernière phrase elle est forcément finie
            // si c’est la fin du bloc et qu’elle se termine par un point, la phrase est finie également.
            const trimBloc = bloc.trim();
            const finie = ((k < (phrasesBrutes.length - 1)) || (trimBloc.lastIndexOf(".") === (trimBloc.length - 1)));

            // enlever le "." et remplacer les retours à la ligne par des espaces
            const phraseNettoyee = phraseBrute
              .replace('.', '')
              .replace(ExprReg.xCaractereRetourLigne, " ")
              .trim();

            // nouvelle phrase
            if (!phrasePrecedente || phrasePrecedente.finie) {
              if (phraseNettoyee !== '') {
                phrasePrecedente = new Phrase([phraseNettoyee], false, null, indexPhrase++, numeroLigne, finie);
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
          const nbLignes = (bloc.match(ExprReg.xCaractereRetourLigne) || []).length;

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
            phrasePrecedente.phrase.push(ExprReg.caractereDebutTexte + texteNettoye + ExprReg.caractereFinTexte);
          } else {
            console.error("Le scénario doit commencer par une instruction. (Il ne peut pas commencer par un texte entre guillemets.)");
          }
          numeroLigne += nbLignes; // Math.max(1, nbLignes);
        }
        // fix: il n'y a pas de retour à la ligne au début de la première ligne
        if (premiereLigne) {
          premiereLigne = false;
          numeroLigne += 1;
        }
        blocSuivantEstInstruction = !blocSuivantEstInstruction;
      }
    });

    return phrases;
  }


  private static trouverClasse(classes: Classe[], nom: string): Classe {
    const recherche = StringUtils.normaliserMot(nom);

    // console.log("TROUVER CLASSE: recherche=", recherche, "classes=", classes);

    let retVal = classes.find(x => x.nom === recherche);

    // si aucune classe trouvée, créer nouvelle classe dérivée d’un objet.
    if (retVal == null) {
      retVal = new Classe(recherche, nom, ClassesRacines.Objet, 2, []);
      classes.push(retVal);
    }

    return retVal;
  }


}
