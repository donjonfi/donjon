import { Analyseur } from './analyseur/analyseur';
import { CompilateurCommunUtils } from './compilateur-commun-utils';
import { ContexteAnalyse } from '../../models/compilateur/contexte-analyse';
import { ContexteCompilation } from '../../models/compilateur/contexte-compilation';
import { EBlocPrincipal } from '../../models/compilateur/bloc-principal';
import { ExprReg } from './expr-reg';
import { HttpClient } from '@angular/common/http';
import { Phrase } from '../../models/compilateur/phrase';
import { Statisticien } from '../jeu/statisticien';
import { lastValueFrom } from 'rxjs';

/**
 * Il s’agit du premier compilateur Donjon FI.
 * Il était utilisé avant la sortie de la v1.0 de Donjon FI.
 */
export class CompilateurBeta {

  /**
    * Analyser le scénario d’un jeu et renvoyer le monde correspondant ansi que les actions, règles, fiches d’aide, …
    * Cette variante de l’analyse n’inclut pas les commandes de base ce qui lui permet d’être synchrone.
    * @param scenario Scénario du jeu
    * @param verbeux Est-ce qu’il faut afficher beaucoup de détails dans la console ?
    */
  public static analyserScenarioAvecCommandesFournies(scenario: string, commandes: string, verbeux: boolean) {

    let ctx = new ContexteCompilation(verbeux);

    // ajout des éléments spéciaux (joueur, inventaire, jeu, …)
    CompilateurCommunUtils.ajouterElementsSpeciaux(ctx.analyse);

    // inclure les commandes de base, sauf si on les a désactivées
    if (
      !scenario.includes('Désactiver les commandes de base.') &&
      !scenario.includes('désactiver les commandes de base.') &&
      !scenario.includes('Désactiver les actions de base.') &&
      !scenario.includes('désactiver les actions de base.')
    ) {
      if (commandes) {
        try {
          CompilateurBeta.analyserCode(commandes, ctx.analyse);
        } catch (error) {
          console.error("Une erreur s’est produite lors de l’analyse des commandes de base :", error);
        }
      } else {
        ctx.analyse.ajouterErreur(0, "(Pas d'actions fournies en plus du scénario)");
      }
    }

    // interpréter le scénario
    CompilateurBeta.analyserCode((scenario + CompilateurCommunUtils.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    CompilateurCommunUtils.peuplerLeMonde(ctx);

    // calculer les stats
    ctx.resultat.statistiques = Statisticien.calculerStatistiquesScenario(scenario);

    return ctx.resultat;

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
    CompilateurCommunUtils.ajouterElementsSpeciaux(ctx.analyse);

    // interpréter le scénario
    CompilateurBeta.analyserCode((scenario + CompilateurCommunUtils.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    CompilateurCommunUtils.peuplerLeMonde(ctx);

    // calculer les stats
    ctx.resultat.statistiques = Statisticien.calculerStatistiquesScenario(scenario);

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
    // let ctx = new ContexteCompilation(verbeux);

    // ajouter les éléments spéciaux
    CompilateurCommunUtils.ajouterElementsSpeciaux(ctx.analyse);

    // inclure les commandes de base, sauf si on les a désactivées
    if (
      !scenario.includes('Désactiver les commandes de base.') &&
      !scenario.includes('désactiver les commandes de base.') &&
      !scenario.includes('Désactiver les actions de base.') &&
      !scenario.includes('désactiver les actions de base.')
    ) {
      try {
        const sourceCommandes = await lastValueFrom(http.get('assets/modeles/commandes.djn', { responseType: 'text' }));
        try {
          CompilateurBeta.analyserCode(sourceCommandes, ctx.analyse);
        } catch (error) {
          console.error("Une erreur s’est produite lors de l’analyse des commandes de base :", error);
        }
      } catch (error) {
        console.error("Fichier « assets/modeles/commandes.djn » pas trouvé. Commandes de base pas importées.");
        ctx.analyse.erreurs.push("Le fichier « assets/modeles/commandes.djn » n’a pas été trouvé. C’est le fichier qui contient les commandes de bases.");
      }
    }

    // Interpréter le scénario
    CompilateurBeta.analyserCode((scenario + CompilateurCommunUtils.regleInfoDonjon), ctx.analyse);

    // peupler le monde
    CompilateurCommunUtils.peuplerLeMonde(ctx);

    // calculer les stats
    ctx.resultat.statistiques = Statisticien.calculerStatistiquesScenario(scenario);

    return ctx.resultat;

  }

  /**
   * Interpréter le code source fourni et ajouter le résultat à l’analyse fournie.
   * @param source Code à interpréter.
   * @param contexteAnalyse Analyse existante à compléter.
   */
  private static analyserCode(
    source: string,
    contexteAnalyse: ContexteAnalyse
  ) {

    // *****************************************
    // CONVERTIR LE SCÉNARIO BRUT EN PHRASES
    // *****************************************
    let phrases = CompilateurBeta.convertirCodeSourceEnPhrases(source);

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
   * - remplacer les éventuels espaces consécutifs par un simple espace.
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

    const scenarioNettoye = CompilateurBeta.nettoyerCodeSource(scenario);

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
                phrasePrecedente = new Phrase([phraseNettoyee], false, null, indexPhrase++, (numeroLigne + nbLignesAvantPhrase), finie, EBlocPrincipal.inconnue);
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
