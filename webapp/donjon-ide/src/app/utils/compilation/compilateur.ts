import { Classe, ClassesRacines, EClasseRacine } from '../../models/commun/classe';

import { Action } from '../../models/compilateur/action';
import { Analyseur } from './analyseur';
import { Definition } from '../../models/compilateur/definition';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { Monde } from '../../models/compilateur/monde';
import { Nombre } from '../../models/commun/nombre.enum';
import { Phrase } from '../../models/compilateur/phrase';
import { Regle } from '../../models/compilateur/regle';
import { ResultatCompilation } from '../../models/compilateur/resultat-compilation';
import { StringUtils } from '../commun/string.utils';

export class Compilateur {

  static verbeux = true;

  /**
   * Interpréter le code source fourni et renvoyer le jeu correspondant.
   * @param source Code à interpréter.
   */
  public static parseCode(source: string, verbeux: boolean): ResultatCompilation {

    // le monde qui est décrit
    let monde = new Monde();
    let elementsGeneriques = new Array<ElementGenerique>();
    let regles = new Array<Regle>();
    let actions = new Array<Action>();
    let typesUtilisateur: Map<string, Definition> = new Map();
    let erreurs = new Array<string>();

    Compilateur.verbeux = verbeux;
    console.warn("Compilateur.verbeux=", Compilateur.verbeux);

    // ajouter le joueur au monde
    elementsGeneriques.push(new ElementGenerique("le ", "joueur", null, "joueur", ClassesRacines.Vivant, null, Genre.m, Nombre.s, 1, null));

    // *****************************************
    // CONVERTIR LE CODE SOURCE BRUT EN PHRASES
    // *****************************************
    let phrases = Compilateur.convertirCodeSourceEnPhrases(source);

    // ********************************
    // ANALYSER LES PHRASES
    // ********************************
    Analyseur.analyserPhrases(phrases, monde, elementsGeneriques, regles, actions, typesUtilisateur, erreurs, this.verbeux);

    // ********************************
    // SÉPARER LES OBJETS ET LES LIEUX
    // ********************************
    elementsGeneriques.forEach(el => {
      el.classe = Compilateur.trouverClasse(monde.classes, el.classeIntitule);
      // objets
      if (Classe.heriteDe(el.classe, EClasseRacine.objet)) {
        monde.objets.push(el);
        // lieux
      } else if (Classe.heriteDe(el.classe, EClasseRacine.lieu)) {
        monde.lieux.push(el);
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
      if (Compilateur.verbeux) {
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
        if (Compilateur.verbeux) {
          console.log(">>> objet avec réactions :", objet);
        }
      }
    });

    //if (Compilateur.verbeux) {
    console.log("==================\n");
    console.log("monde:", monde);
    console.log("règles:", regles);
    console.log("actions:", actions);
    console.log("typesUtilisateur:", typesUtilisateur);
    console.log("==================\n");
    //}

    let resultat = new ResultatCompilation();
    resultat.monde = monde;
    resultat.regles = regles;
    resultat.actions = actions;
    resultat.erreurs = erreurs;
    return resultat;
  }

  /**
   * Convertir le code source en une tableau de phrases.
   * @param source Code source à analyser.
   */
  private static convertirCodeSourceEnPhrases(source: string) {

    // gestion des commentaires de ligne (--)
    // => si une ligne commence par «--» on ajoute automatiquement un «.» (fin d’instruction)
    // à la fin de la ligne pour éviter que l’utilisateur ne soit obligé de terminer ses
    // commentaires par un «.».
    const CommentairesCorriges = source.replace(/^--(.+)?$/mg, "--$1.");

    const ChevronsCorriges = CommentairesCorriges
      .replace(/<< /g, "« ")
      .replace(/ >>/g, " »");

    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    const blocTexte = ChevronsCorriges
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
