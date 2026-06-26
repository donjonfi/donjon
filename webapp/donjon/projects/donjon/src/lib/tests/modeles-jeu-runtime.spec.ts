// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ----------------------------------------------------------------------------------------------------
//    [F120] MODELES JEU RUNTIME — PositionObjet & Intitule (tests purs en isolation)
// ----------------------------------------------------------------------------------------------------
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Ces deux classes runtime sont surtout pures :
//  - PositionObjet : statiques getPrepositionSpatiale / prepositionSpatialeToString (aucune dépendance jeu).
//  - Intitule      : getters purs (toString, nom, motsCles) sur des GroupeNominal minimaux.
//
// Valeurs attendues DERIVEES de la sémantique du code (normalisation puis switch), jamais copiées d'une
// exécution. localisation.ts est déjà couvert par localisation.spec.ts → non re-testé ici.

import { PositionObjet, PrepositionSpatiale } from "../models/jeu/position-objet";
import { Intitule } from "../models/jeu/intitule";
import { GroupeNominal } from "../models/commun/groupe-nominal";
import { Classe } from "../models/commun/classe";
import { EClasseRacine } from "../models/commun/constantes";

describe("[F120] Modèles jeu runtime — PositionObjet & Intitule", () => {

  // =================================================================================================
  //  PositionObjet.getPrepositionSpatiale — couverture exhaustive des branches
  // =================================================================================================
  describe("[F120] PositionObjet.getPrepositionSpatiale", () => {

    // --- branche « dans » : déclenchée par 'dans' OU 'intérieur' -----------------------------------

    it("[F120-T001] « dans » → PrepositionSpatiale.dans", () => {
      expect(PositionObjet.getPrepositionSpatiale("dans")).toBe(PrepositionSpatiale.dans);
    });

    it("[F120-T002] « dans le » (déterminant ignoré, premier mot seul) → dans", () => {
      // Le bloc de normalisation force preposition = "dans" dès que la chaîne contient 'dans',
      // puis prepOnly = "dans".
      expect(PositionObjet.getPrepositionSpatiale("dans le")).toBe(PrepositionSpatiale.dans);
    });

    it("[F120-T003] « à l'intérieur » contient 'intérieur' → normalisé en 'dans'", () => {
      // 'intérieur' présent → preposition := "dans" → prepOnly = "dans".
      expect(PositionObjet.getPrepositionSpatiale("à l'intérieur")).toBe(PrepositionSpatiale.dans);
    });

    it("[F120-T004] « à l'intérieur de la boite » → dans (la normalisation gagne avant le split)", () => {
      expect(PositionObjet.getPrepositionSpatiale("à l'intérieur de la boite")).toBe(PrepositionSpatiale.dans);
    });

    // --- branche « sous » --------------------------------------------------------------------------

    it("[F120-T005] « sous » → PrepositionSpatiale.sous", () => {
      expect(PositionObjet.getPrepositionSpatiale("sous")).toBe(PrepositionSpatiale.sous);
    });

    it("[F120-T006] « sous le » (déterminant) → sous", () => {
      expect(PositionObjet.getPrepositionSpatiale("sous le")).toBe(PrepositionSpatiale.sous);
    });

    // --- branche « sur » : déclenchée par 'sur' OU 'dessus' ----------------------------------------

    it("[F120-T007] « sur » → PrepositionSpatiale.sur", () => {
      expect(PositionObjet.getPrepositionSpatiale("sur")).toBe(PrepositionSpatiale.sur);
    });

    it("[F120-T008] « sur la » (déterminant) → sur", () => {
      expect(PositionObjet.getPrepositionSpatiale("sur la")).toBe(PrepositionSpatiale.sur);
    });

    it("[F120-T009] « au-dessus » contient 'dessus' → normalisé en 'sur'", () => {
      expect(PositionObjet.getPrepositionSpatiale("au-dessus")).toBe(PrepositionSpatiale.sur);
    });

    it("[F120-T010] « par dessus la table » contient 'dessus' → sur", () => {
      expect(PositionObjet.getPrepositionSpatiale("par dessus la table")).toBe(PrepositionSpatiale.sur);
    });

    // --- case 'sûr' du switch : atteignable uniquement en entrée directe ----------------------------
    // « sûr » ne contient ni intérieur/dans/sous/dessus/sur → non normalisé → prepOnly = "sûr"
    // → tombe sur le case 'sûr' (variante orthographique avec accent circonflexe) → sur.

    it("[F120-T011] « sûr » (accent circonflexe) → PrepositionSpatiale.sur (case dédié)", () => {
      expect(PositionObjet.getPrepositionSpatiale("sûr")).toBe(PrepositionSpatiale.sur);
    });

    // --- branche default : entrée inconnue → inconnu (+ console.error) ------------------------------

    it("[F120-T012] préposition inconnue « avec » → PrepositionSpatiale.inconnu", () => {
      // 'avec' ne contient aucun des marqueurs de normalisation et ne matche aucun case → default.
      spyOn(console, "error"); // la branche default logge une erreur ; on la silence.
      expect(PositionObjet.getPrepositionSpatiale("avec")).toBe(PrepositionSpatiale.inconnu);
    });

    it("[F120-T013] la branche default appelle console.error avec le premier mot", () => {
      const spy = spyOn(console, "error");
      PositionObjet.getPrepositionSpatiale("derrière le mur");
      // prepOnly = "derrière" (premier mot après split).
      expect(spy).toHaveBeenCalled();
      expect((spy.calls.mostRecent().args[0] as string)).toContain("derrière");
    });

    it("[F120-T014] chaîne vide → inconnu (default)", () => {
      spyOn(console, "error");
      expect(PositionObjet.getPrepositionSpatiale("")).toBe(PrepositionSpatiale.inconnu);
    });

    // --- garde-fou de priorité : 'dans' testé AVANT 'sous'/'sur' dans la normalisation -------------

    it("[F120-T015] « dans » prioritaire : « dans sous » (contient les deux) → dans", () => {
      // L'ordre du if/else if : 'intérieur'||'dans' est évalué en premier → "dans".
      expect(PositionObjet.getPrepositionSpatiale("dans sous")).toBe(PrepositionSpatiale.dans);
    });
  });

  // =================================================================================================
  //  PositionObjet.prepositionSpatialeToString — couverture exhaustive
  // =================================================================================================
  describe("[F120] PositionObjet.prepositionSpatialeToString", () => {

    it("[F120-T016] dans → 'dans'", () => {
      expect(PositionObjet.prepositionSpatialeToString(PrepositionSpatiale.dans)).toBe("dans");
    });

    it("[F120-T017] sous → 'sous'", () => {
      expect(PositionObjet.prepositionSpatialeToString(PrepositionSpatiale.sous)).toBe("sous");
    });

    it("[F120-T018] sur → 'sur'", () => {
      expect(PositionObjet.prepositionSpatialeToString(PrepositionSpatiale.sur)).toBe("sur");
    });

    it("[F120-T019] inconnu → '??' (default)", () => {
      expect(PositionObjet.prepositionSpatialeToString(PrepositionSpatiale.inconnu)).toBe("??");
    });

    it("[F120-T020] aller-retour string→enum→string cohérent pour les 3 prépositions", () => {
      (["dans", "sous", "sur"] as const).forEach((mot) => {
        const enumVal = PositionObjet.getPrepositionSpatiale(mot);
        expect(PositionObjet.prepositionSpatialeToString(enumVal)).toBe(mot);
      });
    });
  });

  // =================================================================================================
  //  PositionObjet — constructeur (champs publics conservés tels quels)
  // =================================================================================================
  describe("[F120] PositionObjet — constructeur", () => {

    it("[F120-T021] mémorise pre / cibleType / cibleId", () => {
      const pos = new PositionObjet(PrepositionSpatiale.dans, EClasseRacine.lieu, 42);
      expect(pos.pre).toBe(PrepositionSpatiale.dans);
      expect(pos.cibleType).toBe(EClasseRacine.lieu);
      expect(pos.cibleId).toBe(42);
    });
  });

  // =================================================================================================
  //  Intitule — getters purs sur GroupeNominal minimaux
  // =================================================================================================
  describe("[F120] Intitule — getters purs", () => {

    // Classe minimale (la valeur exacte n'est pas lue par les getters testés).
    const classeBidon = new Classe("objet", "objet", null, 0, []);

    it("[F120-T022] nom : transformé (minuscules + caractères spéciaux + trim)", () => {
      // RechercheUtils.transformerCaracteresSpeciauxEtMajuscules : lowercase + retrait accents/cédilles.
      const intitule = new Intitule("  Épée Forgée  ", null, classeBidon);
      expect(intitule.nom).toBe("epee forgee");
    });

    it("[F120-T023] nom : undefined si nom vide (constructeur ne pose pas _nom)", () => {
      const intitule = new Intitule("", null, classeBidon);
      expect(intitule.nom).toBeUndefined();
    });

    it("[F120-T024] toString : délègue à intitule.toString() quand un GN est fourni", () => {
      const gn = new GroupeNominal("la ", "table", "basse");
      const intitule = new Intitule("table", gn, classeBidon);
      // GroupeNominal.toString = déterminant + nom + (' ' + épithète).
      expect(intitule.toString()).toBe("la table basse");
    });

    it("[F120-T025] toString : retombe sur le nom (transformé) quand pas de GN", () => {
      const intitule = new Intitule("Clef", null, classeBidon);
      expect(intitule.toString()).toBe("clef");
    });

    it("[F120-T026] motsCles depuis le GN : nettoyés, déterminants retirés", () => {
      // nomEpithete = "table basse" → mots clés conservés = ['table', 'basse'].
      const gn = new GroupeNominal("la ", "table", "basse");
      const intitule = new Intitule("table", gn, classeBidon);
      expect(intitule.motsCles).toEqual(["table", "basse"]);
    });

    it("[F120-T027] motsCles depuis le nom (pas de GN) : déterminants communs retirés", () => {
      // _nom = "la lampe" → transformerEnMotsCles retire 'la' (mot trop commun) → ['lampe'].
      const intitule = new Intitule("La lampe", null, classeBidon);
      expect(intitule.motsCles).toEqual(["lampe"]);
    });

    it("[F120-T028] motsCles est mémoïsé (même référence au 2e accès)", () => {
      const intitule = new Intitule("torche", null, classeBidon);
      const premier = intitule.motsCles;
      const second = intitule.motsCles;
      expect(second).toBe(premier); // cache _motsCles : identité préservée.
    });

    it("[F120-T029] classe est conservée telle quelle", () => {
      const intitule = new Intitule("objet", null, classeBidon);
      expect(intitule.classe).toBe(classeBidon);
    });
  });

});
