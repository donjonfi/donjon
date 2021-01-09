import { Action } from '../../models/compilateur/action';
import { Aide } from '../../models/commun/aide';
import { Analyseur } from './analyseur';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Definition } from '../../models/compilateur/definition';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { HttpClient } from '@angular/common/http';
import { Monde } from '../../models/compilateur/monde';
import { Nombre } from '../../models/commun/nombre.enum';
import { Phrase } from '../../models/compilateur/phrase';
import { Regle } from '../../models/compilateur/regle';
import { ResultatCompilation } from '../../models/compilateur/resultat-compilation';
import { StringUtils } from '../commun/string.utils';

export class Compilateur {

  /**
   * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
   * @param scenario Scénario du jeu
   * @param verbeux Est-ce qu’il faut afficher beaucoup de détails dans la console ?
   * @param http service http pour récupérerles fichiers à inclure.
   */
  public static async analyserScenario(scenario: string, verbeux: boolean, http: HttpClient) {
    // le monde qui est décrit
    let monde = new Monde();
    let elementsGeneriques = new Array<ElementGenerique>();
    let regles = new Array<Regle>();
    let actions = new Array<Action>();
    let aides = new Array<Aide>();
    let typesUtilisateur: Map<string, Definition> = new Map();
    let erreurs = new Array<string>();

    console.warn("analyserScenario >> verbeux=", verbeux);

    // ajouter le joueur au monde
    elementsGeneriques.push(new ElementGenerique("le ", "joueur", null, "joueur", ClassesRacines.Vivant, null, Genre.m, Nombre.s, 1, null));
    elementsGeneriques.push(new ElementGenerique("le ", "jeu", null, EClasseRacine.special, null, null, Genre.m, Nombre.s, 1, null));
    elementsGeneriques.push(new ElementGenerique("la ", "licence", null, EClasseRacine.special, null, null, Genre.f, Nombre.s, 1, null));

    try {
      const sourceCommandes = await http.get('assets/modeles/commandes.djn', { responseType: 'text' }).toPromise();
      Compilateur.analyserCode(sourceCommandes, monde, elementsGeneriques, regles, actions, aides, typesUtilisateur, erreurs, verbeux);
    } catch (error) {
      console.error("Fichier « assets/modeles/commandes.djn » pas trouvé. Commandes de base pas importées.");
      erreurs.push("Le fichier « assets/modeles/commandes.djn » n’a pas été trouvé. C’est le fichier qui contient les commandes de bases.");
    }

    const regleInfoDonjon = "\naprès afficher aide: dire \"{n}{n}{+{/Jeu créé avec Donjon FI ©2018-2021 Jonathan Claes − see MIT License/}+}\"; continuer l’action.";

    // B. Interpréter le scénario
    Compilateur.analyserCode((scenario + regleInfoDonjon), monde, elementsGeneriques, regles, actions, aides, typesUtilisateur, erreurs, verbeux);

    // ********************************************
    // SÉPARER LES OBJETS, LES LIEUX, LES SPÉCIAUX
    // ********************************************
    elementsGeneriques.forEach(el => {
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
    regles.forEach(regle => {
      if (regle.consequencesBrutes) {
        regle.instructions = Analyseur.separerConsequences(regle.consequencesBrutes, erreurs, false);
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
          if (reaction.instructionsBrutes.startsWith(ExprReg.caractereDebutCommentaire)) {
            reaction.instructionsBrutes = "dire " + reaction.instructionsBrutes;
          }
          reaction.instructions = Analyseur.separerConsequences(reaction.instructionsBrutes, erreurs, false);
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
    console.log("règles:", regles);
    console.log("actions:", actions);
    console.log("aides:", aides);
    console.log("typesUtilisateur:", typesUtilisateur);
    console.log("==================\n");
    // }

    let resultat = new ResultatCompilation();
    resultat.monde = monde;
    resultat.regles = regles;
    resultat.actions = actions;
    resultat.erreurs = erreurs;
    resultat.aides = aides;

    return resultat;

  }

  /**
   * Interpréter le code source fourni et renvoyer le jeu correspondant.
   * @param source Code à interpréter.
   */
  private static analyserCode(
    source: string,
    monde: Monde,
    elementsGeneriques: ElementGenerique[],
    regles: Regle[],
    actions: Action[],
    aides: Aide[],
    typesUtilisateur: Map<string, Definition>,
    erreurs: string[],
    verbeux: boolean
  ) {

    // *****************************************
    // CONVERTIR LE SCÉNARIO BRUT EN PHRASES
    // *****************************************
    let phrases = Compilateur.convertirCodeSourceEnPhrases(source);

    // ********************************
    // ANALYSER LES PHRASES
    // ********************************

    Analyseur.analyserPhrases(phrases, monde, elementsGeneriques, regles, actions, aides, typesUtilisateur, erreurs, verbeux);

  }

  /**
   * Convertir le code source en une tableau de phrases.
   * @param source Code source à analyser.
   */
  private static convertirCodeSourceEnPhrases(source: string) {

    // // gestion des commentaires de ligne (--)
    // // => si une ligne commence par «--» on ajoute automatiquement un «.» (fin d’instruction)
    // // à la fin de la ligne pour éviter que l’utilisateur ne soit obligé de terminer ses
    // // terminer les commentaires par un «.».
    // let CommentairesCorriges = source.replace(/^--(.+)?$/mg, "--$1.");

    // (finalement on va interpréter les parties, chapitres, scènes plus tard.)
    // // commenter et terminer par un . les parties, chapitre et scènes
    // const sectionsCommentees = source.replace(/^((?:partie|chapitre|scène) (?:.*?))(\.)?$/mig, "-- $1.");

    // on retire les commentaire mais pas les lignes car il faut
    // que les numéros de lignes de changent pas !
    const sansCommentaires = source.replace(/^((?: *)--(?:.*))$/gm, " ");

    // corriger espaces insécables et chevrons
    const EspacesInsecablesCorriges = sansCommentaires
      .replace(/<< /g, "« ")
      .replace(/ >>/g, " »")
      .replace(/ \?/g, " ?")
      .replace(/ !/g, " !")
      .replace(/ :/g, " :")
      .replace(/\.\.\.(?!:\.)/g, "…");
    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    const blocTexte = EspacesInsecablesCorriges
      .replace(/(\r\n|\r|\n)/g, ExprReg.caractereRetourLigne)
      .replace(/( +)/g, " ").trim();

    // séparer les chaines de caractères (entre " ") du code
    const blocsCodeEtCommentaire = blocTexte.split('"');

    let phrases = new Array<Phrase>();
    let indexPhrase = 0;
    let numeroLigne = 1;
    let premiereLigne = true;
    let phrasePrecedente: Phrase = null;
    // si le bloc de texte commence par " on commence avec un bloc de commentaire
    let blocSuivantEstCode = true;
    if (blocTexte[0] === '"') {
      blocSuivantEstCode = false;
    }

    // séparer les blocs en phrases sauf les commentaires
    blocsCodeEtCommentaire.forEach(bloc => {
      if (bloc !== '') {
        // bloc de code, séparer les phrases (sur les '.')
        if (blocSuivantEstCode) {
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
                phrasePrecedente = new Phrase([phraseNettoyee], false, false, null, indexPhrase++, numeroLigne, finie);
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
          // si le bloc est un commentaire, l'ajouter tel quel :
        } else {
          // compte le nombre de lignes pour ne pas se décaller !
          const nbLignes = (bloc.match(ExprReg.xCaractereRetourLigne) || []).length;

          // // remplacer les caractereRetourLigne par des espaces
          // let phraseNettoyee = bloc.replace(ExprReg.xCaractereRetourLigne, ' ').trim();

          // pour éviter que les , et ; des commentaires soient interprétés, on les remplace par des caractères différents
          let commentaireNettoye = bloc.replace(/\,/g, ExprReg.caractereVirgule).trim();
          commentaireNettoye = commentaireNettoye.replace(/\;/g, ExprReg.caracterePointVirgule).trim();

          // le commentaire concerne toujours la phrase précédente (s'il y en a une)
          if (phrasePrecedente) {
            phrasePrecedente.phrase.push(ExprReg.caractereDebutCommentaire + commentaireNettoye + ExprReg.caractereFinCommentaire);
            // sinon, le commentaire est seul (c'est le titre)
          } else {
            phrases.push(new Phrase([bloc], true, false, null, indexPhrase++, numeroLigne, true));
          }
          numeroLigne += nbLignes; // Math.max(1, nbLignes);
        }
        // fix: il n'y a pas de retour à la ligne au début de la première ligne
        if (premiereLigne) {
          premiereLigne = false;
          numeroLigne += 1;
        }
        blocSuivantEstCode = !blocSuivantEstCode;
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
