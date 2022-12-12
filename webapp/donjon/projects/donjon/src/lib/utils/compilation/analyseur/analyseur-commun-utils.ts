import { ElementsPhrase } from "../../../models/commun/elements-phrase";
import { ExprReg } from "../expr-reg";
import { GroupeNominal } from "../../../models/commun/groupe-nominal";
import { Instruction } from "../../../models/compilateur/instruction";
import { PhraseUtils } from "../../commun/phrase-utils";

export class AnalyseurCommunUtils {

  /** 
   * Nettoyer l’instruction (guillemets, espaces multiples, point, …)
   * Remarque: les virgule, point-virgule et deux points qui ont été échapés dans les textes ne seront pas restaurés ici.
   */
  public static nettoyerInstruction(instruction: string): string {
    // NETTOYER INSTRUCTION
    let insBruNettoyee = instruction
      // convertir marque commentaire
      .replace(ExprReg.xCaractereDebutCommentaire, ' "')
      .replace(ExprReg.xCaractereFinCommentaire, '" ')
      // enlever les espaces multiples
      .replace(/( +)/g, " ")
      .trim();
    // enlever le point final ou le point virgule final)
    if (insBruNettoyee.endsWith(';') || insBruNettoyee.endsWith('.')) {
      insBruNettoyee = insBruNettoyee.slice(0, insBruNettoyee.length - 1);
    }

    return insBruNettoyee;
  }

  /** Décompser une instruction (verbe + complément) 
 * (sans le ";" ou le ".")
 */
  public static decomposerInstructionSimple(instruction: string): ElementsPhrase {

    let els: ElementsPhrase = null;

    // infinitif, complément
    const resInfinitifCompl = ExprReg.xInstruction.exec(instruction);

    if (resInfinitifCompl) {

      const infinitif = resInfinitifCompl[1].toLocaleLowerCase(); // toujours mettre l’infinitif en minuscules
      const complement = resInfinitifCompl[2] ?? null;

      els = new ElementsPhrase(infinitif, null, null, null, complement);

      // s’il y a un complément qui suit l’infinitif, essayer de le décomposer
      if (els.complement1) {
        els.complement1 = els.complement1.trim();
        // Ne PAS essayer de décomposer le complément s’il commence par « " » ou s’il s’agit de l’instruction exécuter.)
        if (!els.complement1.startsWith('"') && els.infinitif !== 'exécuter') {

          // JOUER un son/une musique
          if (els.infinitif == 'jouer') {
            const suiteJouer = ExprReg.xSuiteInstructionJouer.exec(els.complement1);
            if (suiteJouer) {
              const leSonOuLaMusique = suiteJouer[1];
              const fichier = suiteJouer[2];
              const optionEnBoucle = suiteJouer[5] ? true : false;
              const optionNombreFois = suiteJouer[3] ?? undefined;
              els.sujet = PhraseUtils.getGroupeNominalDefiniOuIndefini(leSonOuLaMusique, true);
              // complémnent 1: fichier
              els.complement1 = fichier;
              els.sujetComplement1 = undefined;
              // complément 2: option (en boucle ou nombre de fois)
              if (optionEnBoucle) {
                els.complement2 = "en boucle";
                els.sujetComplement2 = new GroupeNominal(undefined, "en boucle");
              } else if (optionNombreFois) {
                els.complement2 = optionNombreFois + "fois";
                els.sujetComplement2 = new GroupeNominal(optionNombreFois, "fois");
              }
            } else {
              console.error("Instruction « jouer » pas complète.");
              els = null;
            }
            // AFFICHER une image, un écran
          } else if (els.infinitif == 'afficher') {
            const suiteAfficherImage = ExprReg.xSuiteInstructionAfficherImage.exec(els.complement1);
            if (suiteAfficherImage) {
              const limage = suiteAfficherImage[1];
              const fichier = suiteAfficherImage[2];
              els.sujet = PhraseUtils.getGroupeNominalDefini(limage, true);
              // complément 1: fichier
              els.complement1 = fichier;
              els.sujetComplement1 = undefined;
            } else {
              const suiteAfficherEcran = ExprReg.xSuiteInstructionAfficherEcran.exec(els.complement1);
              if (suiteAfficherEcran) {
                // TODO: adapter instruction afficher l’écran xxx
              } else {
                console.error("Instruction « afficher » pas complète.");
                els = null;  
              }
            }
            // CHARGER le thème
          } else if (els.infinitif == 'charger') {
            const suiteCharger = ExprReg.xSuiteInstructionCharger.exec(els.complement1);
            if (suiteCharger) {
              const letheme = suiteCharger[1];
              const fichier = suiteCharger[2];
              els.sujet = PhraseUtils.getGroupeNominalDefini(letheme, true);
              // complément 1: fichier
              els.complement1 = fichier;
              els.sujetComplement1 = undefined;
            } else {
              console.error("Instruction « charger » pas complète.");
              els = null;
            }
            // ATTENDRE
          } else if (els.infinitif == 'attendre') {
            const suiteAttendre = ExprReg.xSuiteInstructionAttendre.exec(els.complement1);
            if (suiteAttendre) {
              const touche = suiteAttendre[1];
              const texteTouche = suiteAttendre[2];
              const nbSecondes = suiteAttendre[3];
              const secondes = suiteAttendre[4];

              // => touche
              if (touche) {
                els.sujet = new GroupeNominal("une ", touche);
                els.complement1 = texteTouche ?? undefined;
                // => secondes
              } else {
                els.sujet = new GroupeNominal(nbSecondes, secondes);
                els.complement1 = undefined;
              }
            } else {
              console.error("Instruction « attendre » pas complète.");
              els = null;
            }


            // AUTRE INFINITF
          } else {
            // tester si le sujet est une propriéter à changer
            const restChangerPropriete = ExprReg.xChangerPropriete.exec(els.complement1);
            if (restChangerPropriete) {
              const propriete = restChangerPropriete[1];
              // ne garder que le premier mot de verbe (retirer du/de la/…)
              const verbe = restChangerPropriete[2].split(" ")[0];
              const nouvelleValeur = restChangerPropriete[3];

              // trouver la propriété correspondante à la valeur1
              const proprieteValeur1 = PhraseUtils.trouverPropriete(propriete);

              // si la valeur1 est bien une propriété
              if (proprieteValeur1) {
                // propriété à changer
                els.proprieteSujet = proprieteValeur1;
                // verbe
                els.verbe = verbe;
                // complément (nouvelle valeur)
                els.complement1 = nouvelleValeur;
                // trouver la propriété correspondante à la valeur2
                const proprieteValeur2 = PhraseUtils.trouverPropriete(nouvelleValeur);
                els.proprieteComplement1 = proprieteValeur2;
              }
            }

            // si le sujet n’est pas une propriété à changer
            if (!restChangerPropriete || !els.proprieteSujet) {

              // tester si le complément est une phrase simple
              // ex: le joueur ne se trouve plus dans la piscine.
              const resSuite = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec(els.complement1);
              if (resSuite) {
                let sujDet = resSuite[1] ?? null;
                let sujNom = resSuite[2];
                let sujAtt = resSuite[3] ?? null;
                els.sujet = new GroupeNominal(sujDet, sujNom, sujAtt);
                els.verbe = resSuite[4]?.trim() ?? null;
                els.negation = resSuite[5]?.trim() ?? null;
                els.complement1 = resSuite[6]?.trim() ?? null;
                // décomposer le nouveau complément si possible              
                const resCompl = GroupeNominal.xPrepositionDeterminantArticleNomEpithete.exec(els.complement1);
                if (resCompl) {
                  // els.complement1 = null;
                  els.sujetComplement1 = new GroupeNominal(resCompl[2], resCompl[3], (resCompl[4] ? resCompl[4] : null));
                  els.preposition1 = resCompl[1] ? resCompl[1] : null;
                }
                // tester si le complément est une instruction à 1 ou 2 compléments
                // ex: déplacer le trésor vers le joueur.
              } else {
                const res1ou2elements = ExprReg.xComplementInstruction1ou2elements.exec(els.complement1);

                if (res1ou2elements) {

                  const determinant1 = res1ou2elements[1] ?? null;
                  const nom1 = res1ou2elements[2];
                  const epithete1 = res1ou2elements[3] ?? null;
                  const preposition = res1ou2elements[4] ?? null;
                  const determinant2 = res1ou2elements[5] ?? null;
                  const nom2 = res1ou2elements[6] ?? null;
                  const epithete2 = res1ou2elements[7] ?? null;

                  els.verbe = null;
                  els.negation = null;
                  els.sujet = new GroupeNominal(determinant1, nom1, epithete1);
                  els.preposition1 = preposition;
                  if (nom2) {
                    els.sujetComplement1 = new GroupeNominal(determinant2, nom2, epithete2);
                  } else {
                    els.complement1 = null;
                  }
                }
              }
            }
          }
        }
      }
    }

    return els;
  }

  /**
   * Créer une Instruction à partir d’une instruction décomposée en ElementsPhrase.
   */
  public static creerInstructionSimple(instruction: ElementsPhrase): Instruction {
    if (instruction.complement1) {
      // si le complément est un Texte (entre " "), garder les retours à la ligne
      if (instruction.complement1.startsWith('"') && instruction.complement1.endsWith('"')) {
        instruction.complement1 = instruction.complement1
          // remettre les retours à la ligne
          .replace(ExprReg.xCaractereRetourLigne, '\n')
          // remettre les virgules, point virgules et deux points initiaux dans les textes
          .replace(ExprReg.xCaracterePointVirgule, ';')
          .replace(ExprReg.xCaractereVirgule, ',')
          .replace(ExprReg.xCaractereDeuxPointsDouble, ':');
        // sinon remplacer les retours à la ligne par des espaces
      } else {
        instruction.complement1 = instruction.complement1.replace(ExprReg.xCaractereRetourLigne, ' ');
      }
    }
    return new Instruction(instruction);
  }

}
