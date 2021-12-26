import { ProprieteJeu, TypeProprieteJeu } from "../../models/jeu/propriete-jeu";

import { Capacite } from "../../models/commun/capacite";
import { ClasseUtils } from "../commun/classe-utils";
import { Compteur } from "../../models/compilateur/compteur";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { Evenement } from "../../models/jouer/evenement";
import { GroupeNominal } from "../../models/commun/groupe-nominal";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { Nombre } from "../../models/commun/nombre.enum";
import { Objet } from "../../models/jeu/objet";
import { PrepositionSpatiale } from "../../models/jeu/position-objet";
import { ProprieteElement } from "../../models/commun/propriete-element";
import { TypeValeur } from "../../models/compilateur/type-valeur";

export class InstructionsUtils {

  /** Retrouver la cible spéciale sur base de son texte (ici, ceci, cela, quantitéCeci, quantitéCela, inventaire, joueur) */
  public static trouverCibleSpeciale(cibleString: string, ceci: ElementJeu | Intitule, cela: ElementJeu | Intitule, evenement: Evenement, eju: ElementsJeuUtils, jeu: Jeu): ElementJeu {
    let cible: ElementJeu = null;
    if (cibleString) {
      // retrouver la cible
      switch (cibleString.toLowerCase()) {
        case 'ici':
          cible = eju.curLieu;
          // afficherObjetsCaches = false;
          break;
        case 'ceci':
          cible = ceci as ElementJeu;
          break;
        case 'ceci?':
          cible = ceci ? ceci as ElementJeu : null;
          break;
        case 'cela':
          cible = cela as ElementJeu;
          break;
        case 'cela?':
          cible = cela ? cela as ElementJeu : null;
          break;
        case 'quantitéceci':
          cible = InstructionsUtils.copierElementTemp(ceci as Objet);
          // on ne peut pas prendre un nombre illimité d’objets => on n’en prend qu’un seul.
          if (cible.quantite === -1 && evenement.quantiteCeci === -1) {
            cible.quantite = 1;
            // sinon on prend la quantité demandée
          } else {
            cible.quantite = evenement.quantiteCeci;
          }
          // nombre
          //     => multiple
          if (cible.quantite > 1) {
            cible.nombre = Nombre.p;
            // => identique à l’original (sauf si original est illimité)
          } else if (cible.quantite == -1) {
            if ((ceci as Objet).quantite == -1) {
              cible.nombre = Nombre.s; // TODO: indénombrables
            } else {
              cible.nombre = (ceci as Objet).nombre;
            }
            // => 0 ou 1
          } else {
            cible.nombre = Nombre.s;
          }
          break;
        case 'quantitécela':
          cible = InstructionsUtils.copierElementTemp(cela as Objet);
          // on ne peut pas prendre un nombre illimité d’objets => on n’en prend qu’un seul.
          if (cible.quantite === -1 && evenement.quantiteCeci === -1) {
            cible.quantite = 1;
            // sinon on prend la quantité demandée
          } else {
            cible.quantite = evenement.quantiteCela;
          }
          // nombre
          //     => multiple
          if (cible.quantite > 1) {
            cible.nombre = Nombre.p;
            // => identique à l’original (sauf si original est illimité)
          } else if (cible.quantite == -1) {
            if ((cela as Objet).quantite == -1) {
              cible.nombre = Nombre.s; // TODO: indénombrables
            } else {
              cible.nombre = (cela as Objet).nombre;
            }
            // => 0 ou 1
          } else {
            cible.nombre = Nombre.s;
          }
          break;
        case 'inventaire':
        case 'joueur':
          cible = jeu.joueur;
          break;
      }
    }
    return cible;
  }

  /**
  * Trouver l’élément du jeu spécifié (par ex la destination d’une copie, l’élémen cible d’une propriété, …)
  */
  public static trouverElementCible(recherche: GroupeNominal, ceci: ElementJeu | Intitule = null, cela: ElementJeu | Intitule = null, eju: ElementsJeuUtils, jeu: Jeu): ElementJeu {

    let resultat: ElementJeu = null;

    // A) trouver ÉLÉMENT SPÉCIAL
    const cibleTrouvee = InstructionsUtils.trouverCibleSpeciale(recherche.nom, ceci, cela, null, eju, jeu);
    if (cibleTrouvee) {
      if (ClasseUtils.heriteDe(cibleTrouvee.classe, EClasseRacine.element)) {
        resultat = cibleTrouvee as ElementJeu;
      } else {
        console.error("Instructions > trouverElementCible > la cible n’est pas un élément:", recherche);
      }
      // B) retrouver ÉLÉMENT CLASSIQUE
    } else {
      let correspondanceCompl = eju.trouverCorrespondance(recherche, false, false);
      // un élément trouvé
      if (correspondanceCompl.elements.length === 1) {
        resultat = correspondanceCompl.elements[0];
        // aucun élément trouvé
      } else if (correspondanceCompl.elements.length === 0) {
        console.error("trouverElementCible >>> je n’ai pas trouvé l’élément:", recherche);
        // plusieurs éléments trouvés
      } else {
        console.error("trouverElementCible >>> j’ai trouvé plusieurs correspondances pour l’élément:", recherche, correspondanceCompl);
      }
    }
    return resultat;
  }

  /**
   * Retrouver l’objet cible de l’instruction.
   * @param brute « ceci » et « cela » sont gérés.
   * @param intitule un objet à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  public static trouverObjetCible(brute: string, intitule: GroupeNominal, ceci: Intitule | ElementJeu, cela: Intitule | ElementJeu, eju: ElementsJeuUtils, jeu: Jeu): Objet {
    let objetCible: Objet = null;

    // A) retrouver OBJET SPÉCIAL
    const cibleTrouvee = InstructionsUtils.trouverCibleSpeciale(brute, ceci, cela, null, eju, jeu);
    if (cibleTrouvee) {
      if (ClasseUtils.heriteDe(cibleTrouvee.classe, EClasseRacine.objet)) {
        objetCible = cibleTrouvee as Objet;
      } else {
        console.error("Instructions > trouverObjetCible > la cible n’est pas un objet:", brute);
      }
      // B) retrouver OBJET CLASSIQUE
    } else if (intitule) {
      const objetsTrouves = eju.trouverObjet(intitule, false);
      if (objetsTrouves.length == 1) {
        objetCible = objetsTrouves[0];
      } else {
        console.warn("Instructions > trouverObjetCible > plusieurs correspondances trouvées pour :", brute);
      }
    } else {
      console.error("Instructions > trouverObjetCible > objet spécial pas pris en change :", brute);
    }
    if (!objetCible) {
      console.warn("Instructions > trouverObjetCible > pas pu trouver :", brute);
    }
    return objetCible;
  }

  /**
   * Retrouver la propriété cible de l’instruction.
   * @param recherche à retrouver
   * @param ceci pour le cas où brute vaut « ceci ».
   * @param cela pour le cas où brute vaut « cela ».
   */
  public static trouverProprieteCible(recherche: ProprieteJeu, ceci: Intitule | ElementJeu, cela: Intitule | ElementJeu, eju: ElementsJeuUtils, jeu: Jeu): ProprieteElement | Compteur {
    let resultat: ProprieteElement | Compteur = null;

    // retrouver l’élément cible
    if (recherche.intituleElement) {
      recherche.element = InstructionsUtils.trouverElementCible(recherche.intituleElement, ceci, cela, eju, jeu);
      if (!recherche.element) {
        console.error("trouverProprieteCible > élément pas trouvé:", recherche.intituleElement);
      }
    }
    // retrouver la classe
    if (recherche.intituleClasse) {
      recherche.classe = ClasseUtils.trouverClasse(jeu.classes, recherche.intituleClasse)
      if (!recherche.classe) {
        console.error("trouverProprieteCible > classe pas trouvée:", recherche.intituleClasse);
      }
    }
    let elementsOkEtapePrecedente: ElementJeu[] = null;

    switch (recherche.type) {
      // A. NOMBRE DE: CLASSE AVEC ATTRIBUTS
      case TypeProprieteJeu.nombreDeClasseAttributs:
        // 1) FILTRER SUR LA CLASSE
        // si la classe hérite de objet
        if (ClasseUtils.heriteDe(recherche.classe, EClasseRacine.objet)) {
          // retrouver les objets ayant la classe spécifiée
          elementsOkEtapePrecedente = jeu.objets.filter(x => ClasseUtils.heriteDe(x.classe, recherche.classe.nom));
          // si la classe hérite de lieu
        } else if (ClasseUtils.heriteDe(recherche.classe, EClasseRacine.lieu)) {
          // retrouver les objets ayant la classe spécifiée
          elementsOkEtapePrecedente = jeu.lieux.filter(x => ClasseUtils.heriteDe(x.classe, recherche.classe.nom));
          // si la classe n’hérite ni d’objet ni de lieu
        } else {
          console.error("trouverProprieteCible > nombreDeClasseAttributs > la classe n’hérite pas de « élément »: ", recherche.classe.intitule);
        }

        // 2) FILTRER SUR LES ÉTATS ÉVENTUELS
        elementsOkEtapePrecedente = InstructionsUtils.filtrerElementsSurEtats(elementsOkEtapePrecedente, recherche.nomsEtats, jeu);

        // 3) GÉNÉRER UN COMPTEUR POUR LA VALEUR
        if (elementsOkEtapePrecedente) {
          resultat = new Compteur("propriété calculée", elementsOkEtapePrecedente.length);
        }
        break;
      // B. NOMBRE DE: CLASSE AVEC ATTRIBUTS + POSITION
      case TypeProprieteJeu.nombreDeClasseAttributsPosition:
        // si la classe rechechée hérite de objet
        if (ClasseUtils.heriteDe(recherche.classe, EClasseRacine.objet)) {
          // si la classe de l’élément cible hérite de objet
          if (ClasseUtils.heriteDe(recherche.element.classe, EClasseRacine.objet)) {
            elementsOkEtapePrecedente = eju.trouverContenu(recherche.element, true, true, true, recherche.prepositionSpatiale);
            // si la classe de l’élément cible hérite de lieu
          } else if (ClasseUtils.heriteDe(recherche.element.classe, EClasseRacine.lieu)) {
            elementsOkEtapePrecedente = eju.trouverContenu(recherche.element, true, true, true, PrepositionSpatiale.dans);
          }
          // si la classe recherchée n’hérite pas de objet
        } else {
          console.error("trouverProprieteCible > nombreDeClasseAttributsPosition > la classe n’hérite pas de « objet »: ", recherche.classe.intitule);
        }

        // 2) FILTRER SUR LES ÉTATS ÉVENTUELS
        elementsOkEtapePrecedente = InstructionsUtils.filtrerElementsSurEtats(elementsOkEtapePrecedente, recherche.nomsEtats, jeu);

        // 3) GÉNÉRER UN COMPTEUR POUR LA VALEUR
        if (elementsOkEtapePrecedente) {
          resultat = new Compteur("propriété calculée", elementsOkEtapePrecedente.length);
        }
        break;

      // C. (NOMBRE DE) PROPRIÉTÉ ÉLÉMENT
      case TypeProprieteJeu.nombreDeProprieteElement:
        // trouver la propriete
        recherche.proprieteElement = recherche.element.proprietes.find(x => x.nom == recherche.intituleProprieteElement.nom);
        if (!recherche.proprieteElement) {
          console.error("trouverProprieteCible > nombreDeProprieteElement > propriété non trouvée : ", recherche.intituleProprieteElement.nom, "=>", recherche.element.nom);
          // vérifier s’il s’agit bien d’un nombre
        } else if (recherche.proprieteElement.type !== TypeValeur.nombre) {
          console.error("trouverProprieteCible > nombreDeProprieteElement > la propriété n’est pas un nombre : ", recherche.intituleProprieteElement.nom, "=>", recherche.element.nom);
          // trouvé propriété
        } else {
          resultat = recherche.proprieteElement;
        }
        break;

      case TypeProprieteJeu.proprieteElement:
        // trouver la propriete
        recherche.proprieteElement = recherche.element.proprietes.find(x => x.nom == recherche.intituleProprieteElement.nom);
        if (!recherche.proprieteElement) {
          console.error("trouverProprieteCible > proprieteElement > propriété non trouvée : ", recherche.intituleProprieteElement.nom, "=>", recherche.element.nom);
        } else {
          // trouvé propriété
          resultat = recherche.proprieteElement;
        }
        break;

      default:
        console.error("trouverProprieteCible > type de propriété inconnu : ", recherche.type);
        break;
    }

    return resultat;
  }

  /** Ne garder que les éléments qui possèdes les états spécifiés. */
  private static filtrerElementsSurEtats(elements: ElementJeu[], nomsEtats: string[], jeu: Jeu) {
    let elementsOkEtapePrecedente = elements?.slice();
    if (elementsOkEtapePrecedente?.length) {
      // parcourir les états
      nomsEtats.forEach(nomEtat => {
        let elementsOkCurEtape: ElementJeu[] = [];
        // retrouver l’état
        const etat = jeu.etats.trouverEtat(nomEtat);
        if (etat) {
          // vérifier si les éléments possède cet état
          elementsOkEtapePrecedente.forEach(el => {
            if (jeu.etats.possedeEtatIdElement(el, etat.id)) {
              elementsOkCurEtape.push(el);
            }
          });
        } else {
          console.error("trouverProprieteCible > nombreDeClasseAttributs > état non trouvé: ", nomEtat);
        }
        elementsOkEtapePrecedente = elementsOkCurEtape;
      });
    }
    return elementsOkEtapePrecedente;
  }

  /**
   * Dupliquer l’élément du jeu pour utilisation temporaire (sans l’ajouter au jeu ni lui donner d’ID.)
   * 
   * Remarques:
   *  - Sert uniquement à pouvoir modifier des propriétés sans endomager l’original.
   * - Ne pas utiliser l’élément dans le jeu ensuite ! Pour cela utiliser copierObjet !
   * 
   * @param original élément à dupliquer.
   * @returns copie de l’élément
   */
  private static copierElementTemp(original: ElementJeu) {
    let copie = new ElementJeu(0, original.nom, original.intitule, original.classe);
    copie.nombre = original.nombre;
    copie.genre = original.genre;
    copie.intituleS = original.intituleS;
    copie.intituleP = original.intituleP;

    // copier les états
    original.etats.forEach(etat => {
      copie.etats.push(etat);
    });

    // copier les capacités
    original.capacites.forEach(cap => {
      copie.capacites.push(new Capacite(cap.verbe, cap.complement));
    });

    // copier les propriétés
    original.proprietes.forEach(prop => {
      copie.proprietes.push(new ProprieteElement(prop.nom, prop.type, prop.valeur, prop.nbAffichage));
    });

    // TODO: faut-il copier le contenu (support/contenant/…) ?
    return copie;
  }

  public static corrigerQuantite(objetSource: Objet, quantite: number): number {
    // console.log(">> quantité demandée=", quantite);
    // console.log(">> quantité disponible=", objetSource.quantite);
    // corriger la quantité
    // -1 => si nombre de copies pas précisé, on prend tous les exemplaires, sauf si illimité.
    if (quantite < 1) {
      if (objetSource.quantite != -1) {
        quantite = objetSource.quantite;
      } else {
        quantite = 1;
      }

      // si quantité demandée dépasse nombre d’exemplaires (et que le nombre d’exemplaire n’est pas infini), déplacer ce qu’il y a.
    } else if (quantite > objetSource.quantite && objetSource.quantite !== -1) {
      quantite = objetSource.quantite;
    }
    // console.log(">> quantité corrigée=", quantite);
    return quantite;
  }


}
