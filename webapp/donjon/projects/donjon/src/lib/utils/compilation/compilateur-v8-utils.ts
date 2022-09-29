import { CompilateurCommunUtils } from "./compilateur-commun-utils";
import { ERoutine } from "../../models/compilateur/routine";
import { ExprReg } from "./expr-reg";
import { Phrase } from "../../models/compilateur/phrase";

/**
 * Utilitaires utilisés par le compilateur V8.
 */
export class CompilateurV8Utils {

  /**
   * On prépare le code source afin de pouvoir l’analyser plus facilement.
   *  - ajouter des points aux sections
   *  - ajouter un point aux fin bloc
   *  - ajouter deux points au sinon
   *  - retirer les commentaires
   *  - échaper les retours à la ligne
   *  - remplacer les éventuels espaces consécutifs par un simple espace.
   * @param source 
   */
  public static preparerCodeSource(source: string) {

    // terminer par un « . » les parties, chapitre et scènes.
    let resultat = source.replace(/^(?:[ \t]*)((?:partie|chapitre|scène) (?:.*?))(\.)?$/mig, "$1.");

    // remplacer regle/régle par règle
    resultat = resultat.replace(/\bfin (regle|régle)\b/gm, "fin règle");
    resultat = resultat.replace(/\b(regle|régle)\b(?= (avant|après|apres))/gm, "règle");
    // remplacer règle aprés|apres par après
    resultat = resultat.replace(/\brègle (apres|aprés)\b/gm, "règle après");

    // terminer par un « . » les « fin bloc »
    resultat = resultat.replace(/([ \t]*fin(?: )?(?:si|règle|action|choix|choisir|routine)\b)(?!])(\.)?/mig, "$1.");
    // terminer par un « . » les « fin erreur » s’ils sont seuls sur la ligne
    resultat = resultat.replace(/^([ \t]*fin [\wéèêà]+)(?!\.|])(\.)?[ \t]*$/ig, "$1.");
    
    // terminer par un « : » les « sinon »
    resultat = resultat.replace(/([ \t]*sinon\b)(:)?(?!])/mig, "$1:");

    // terminer par un « : » les « choisir » directement suivis d’un choix.
    resultat = resultat.replace(/([ \t]*choisir)\b(?:[ \t]*)(?!parmis|librement)(:)?([ \t\n]*)(?=choix)/mig, "$1:$3");

    // terminer par un « . » les « dire "bla bla" » et les refuser "".
    resultat = resultat.replace(/((dire|refuser) "[\S\s]*?") *\.*/mig, "$1.");

    // on retire les commentaire mais pas les lignes car il faut
    // que les numéros de lignes de changent pas !
    resultat = resultat.replace(/^((?: *)--(?:.*))$/gm, " ");

    // remplacer les retours à la ligne par un caractereRetourLigne.
    // remplacer les deux points par un caractereDeuxPointsDouble (en effet lors de la découpe en phrases, on va perdre le caractère « : » mais on souhaite le garder)
    // remplacer les éventuels espaces consécutifs par un simple espace.
    // retirer les espaces avant et après le bloc de texte.
    resultat = resultat
      .replace(/(\r\n|\r|\n)/g, ExprReg.caractereRetourLigne)
      .replace(/(:)/g, ExprReg.caractereDeuxPointsDouble)
      .replace(/( +)/g, " ")
      .trim();

    return resultat;
  }

    /**
   * Convertir le code source en une tableau de phrases.
   * @param scenario Code source à analyser.
   */
     public static convertirCodeSourceEnPhrases(scenario: string): Phrase[] {

      const scenarioNettoye = CompilateurV8Utils.preparerCodeSource(scenario);
  
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
            // séparer sur les points (.) qui terminent un mot et les doubles points (:)
            // TODO: prendre en charge le point-virgule (;) ?
            const phrasesBrutes = bloc.split(/(?:\.|:)(?!\w|_)/);
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
  
  
  
              // - enlever le "."
              // - remplacer les retours à la ligne par des espaces
              // - remettre les :
              const phraseNettoyee = phraseBrute
                .replace(/\.$/, '')
                .replace(ExprReg.xCaractereRetourLigne, " ")
                .replace(ExprReg.xCaractereDeuxPoints, ":")
                .trim();
  
              // nouvelle phrase
              if (!phrasePrecedente || phrasePrecedente.finie) {
                if (phraseNettoyee !== '') {
                  phrasePrecedente = new Phrase([phraseNettoyee], false, null, indexPhrase++, (numeroLigne + nbLignesAvantPhrase), finie, ERoutine.inconnue);
                  phrases.push(phrasePrecedente);
                }
                // suite de la phrase précédente
              } else {
                if (phraseNettoyee !== '') {
                  phrasePrecedente.morceaux.push(phraseNettoyee);
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
              // .replace(/ :/g, " :") // pose un souci avec les si/sinon
              .replace(/\.\.\.(?!:\.)/g, "…");
  
  
            // le texte concerne toujours la phrase précédente (s'il y en a une)
            if (phrasePrecedente) {
              const blocActuelEstSousTexte = prochainBlocEstSousTexte;
              if (prochainBlocEstSousTexte) {
                // pas de guillets dans ce cas-ci car déjà ajoutés par les blocs de texte qui entourent le bloc forcé
                prochainBlocEstSousTexte = false;
              } else {
                // si on a un crochet non fermé dans le texte actuel, le code suivant est en réalité la suite du texte
                prochainBlocEstSousTexte = CompilateurCommunUtils.dernierCrochetEstOuvert(texteNettoye);
              }
              // GESTION DES GUILLEMETS
              // cas le plus commun:
              // le bloc précédent n’est pas un sous texte et  le bloc suivant n’est pas un sous texte
              if (!blocPrecedentEstSousTexte && !prochainBlocEstSousTexte) {
                // on est dans un sous-texte:
                //  ne pas mettre de guillemets (ils sont ajoutés par les blocs qui l’entourent)
                if (blocActuelEstSousTexte) {
                  phrasePrecedente.morceaux.push(texteNettoye);
                  // on est dans un texte principal:
                  //  on met des guillemets ouvrant et fermant autours du texte
                } else {
                  phrasePrecedente.morceaux.push(ExprReg.caractereDebutTexte + texteNettoye + ExprReg.caractereFinTexte);
                }
                // autre cas:
                //  le bloc précédent n’est pas un sous texte, on commence par un guillemet ouvrant
                //  le bloc suivant est un sous texte, on termine sur un guillemet ouvrant
              } else if (!blocPrecedentEstSousTexte && prochainBlocEstSousTexte) {
                phrasePrecedente.morceaux.push(ExprReg.caractereDebutTexte + texteNettoye + ExprReg.caractereDebutTexte);
                // autre cas:
                //  le bloc précédent est un sous texte, on commence par un guillemet fermant
                //  le bloc suivant n’est pas un sous texte, on termine sur un guillemet fermant
              } else if (blocPrecedentEstSousTexte && !prochainBlocEstSousTexte) {
                phrasePrecedente.morceaux.push(ExprReg.caractereFinTexte + texteNettoye + ExprReg.caractereFinTexte);
                // autre cas:
                //  le bloc précédent est un sous texte, on commence par un guillemet fermant
                //  le bloc suivant est un sous texte, on termine sur un guillemet ouvrant
              } else {
                phrasePrecedente.morceaux.push(ExprReg.caractereFinTexte + texteNettoye + ExprReg.caractereDebutTexte);
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

}