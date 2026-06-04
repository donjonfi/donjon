import { ContexteAnalyse } from "../../../models/compilateur/contexte-analyse";
import { ContexteAnalyseV8 } from "../../../models/compilateur/contexte-analyse-v8";
import { ExprReg } from "../expr-reg";
import { MotUtils } from "../../commun/mot-utils";
import { Phrase } from "../../../models/compilateur/phrase";
import { PresenceFond } from "../../../models/compilateur/presence-fond";
import { ProprieteConcept } from "../../../models/commun/propriete-element";
import { RechercheUtils } from "../../commun/recherche-utils";
import { ResultatAnalysePhrase } from "../../../models/compilateur/resultat-analyse-phrase";
import { TypeValeur } from "../../../models/compilateur/type-valeur";

export class AnalyseurFond {

  /**
   * Construire une PresenceFond à partir des groupes capturés :
   * @param porteeMot « commun » (partagé) ou « propre » (par lieu)
   * @param tousMatch groupe « à tous les lieux » / « à chaque lieu » (présent => domaine = tous)
   * @param etatMatch nom (brut) de l’état du domaine (présent => domaine filtré)
   */
  private static construirePresence(porteeMot: string, tousMatch: string | undefined, etatMatch: string | undefined): PresenceFond {
    const portee = (porteeMot.toLowerCase() === 'commun') ? 'partage' : 'parLieu';
    const tousLesLieux = !!tousMatch;
    const etatDomaine = etatMatch ? MotUtils.getSingulier(etatMatch.trim().toLowerCase()) : undefined;
    return new PresenceFond(portee, tousLesLieux, etatDomaine);
  }

  /**
   * Tester une phrase de portée de fond au pronom personnel (phrase séparée) :
   * « Il est commun à tous les lieux. », « Elle est commune dans les lieux côtiers. »,
   * « Il est propre à chaque lieu. », « Il est propre aux lieux couverts. »
   * Doit être testé AVANT les attributs (sinon « commun à tous les lieux » serait avalé en attributs).
   */
  public static testerPortee(phrase: Phrase, ctxAnalyse: ContexteAnalyse): ResultatAnalysePhrase {

    let elementTrouve: ResultatAnalysePhrase = ResultatAnalysePhrase.aucun;

    const result = ExprReg.xFondPortee.exec(phrase.morceaux[0]);
    if (result !== null && ctxAnalyse.dernierElementGenerique) {
      ctxAnalyse.dernierElementGenerique.presenceFond = AnalyseurFond.construirePresence(result[1], result[2], result[3]);
      // genre de l’élément précédent (comme pour les attributs au pronom personnel)
      ctxAnalyse.dernierElementGenerique.genre = MotUtils.getGenre(phrase.morceaux[0].split(" ")[0], null);
      elementTrouve = ResultatAnalysePhrase.fondPortee;
    }

    return elementTrouve;
  }

  /**
   * Extraire la portée d’un fond déclarée INLINE dans la définition (après « est un fond ») :
   * « Le sol est un fond propre à chaque lieu. », « La mer est un fond commun dans les lieux côtiers. »
   * @returns la PresenceFond, ou null s’il n’y a pas de portée inline.
   */
  public static extrairePorteeDeclaration(morceau: string): PresenceFond | null {
    const result = ExprReg.xFondPorteeDeclaration.exec(morceau);
    if (result === null) {
      return null;
    }
    return AnalyseurFond.construirePresence(result[1], result[2], result[3]);
  }

  /**
   * Enregistrer une SURCHARGE de propriété PAR LIEU sur un fond « propre à chaque lieu », via locateur :
   * « La description du sol situé dans la cuisine est "…" », « … situé ici … ».
   * @param loc locateur extrait (base = nom du fond, cible/ici = lieu visé)
   * @param nomPropriete nom de la propriété (« description », « aperçu », …)
   * @param valeur valeur de la propriété
   * @returns true si la surcharge a été enregistrée (base = un fond propre unique), false sinon.
   */
  public static enregistrerSurchargeParLieu(
    loc: { base: string, preposition?: string, cible?: string, ici?: boolean },
    nomPropriete: string,
    valeur: string,
    ctxAnalyse: ContexteAnalyseV8,
  ): boolean {
    // résoudre le fond (base) par nom + épithète
    const baseGn = ExprReg.xGroupeNominalArticleDefini.exec(loc.base);
    const fondNom = (baseGn && baseGn[2] ? baseGn[2] : loc.base).toLowerCase();
    const fondEpithete = (baseGn && baseGn[3]) ? baseGn[3].toLowerCase() : null;
    const fonds = ctxAnalyse.elementsGeneriques.filter(x =>
      x.nom.toLowerCase() === fondNom
      && ((x.epithete?.toLowerCase() ?? null) === fondEpithete)
      && x.presenceFond?.portee === 'parLieu');
    if (fonds.length !== 1) {
      return false;
    }
    const fond = fonds[0];

    // clé de lieu, nettoyée comme le fait getLieuID (pour matcher lieu.nom à la génération)
    let lieuKey: string | null;
    if (loc.ici) {
      lieuKey = ctxAnalyse.dernierLieu
        ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(ctxAnalyse.dernierLieu.nom)
        : null;
    } else {
      const sansArticle = loc.cible.replace(/^(le |la |les |l'|l’|du |de la |de l'|de l’|des )/i, '').trim();
      lieuKey = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(sansArticle);
    }
    if (!lieuKey) {
      return false;
    }

    if (!fond.surchargesParLieu) {
      fond.surchargesParLieu = new Map();
    }
    let entree = fond.surchargesParLieu.get(lieuKey);
    if (!entree) {
      entree = { proprietes: [], attributs: [] };
      fond.surchargesParLieu.set(lieuKey, entree);
    }
    const nom = (nomPropriete === 'apercu') ? 'aperçu' : nomPropriete;
    const existant = entree.proprietes.find(p => p.nom === nom);
    if (existant) {
      existant.valeur = valeur;
    } else {
      entree.proprietes.push(new ProprieteConcept(null, nom, TypeValeur.mots, valeur));
    }
    return true;
  }

}
