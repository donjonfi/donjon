import { GroupeNominal } from "../models/commun/groupe-nominal";
import { decomposerGroupeNominal, xDefinitionElement1GN, xDefinitionRessource1GN } from "../models/commun/gn-fragments";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//   [F077] GROUPES NOMINAUX — analyseur central (déterminant + attribut avant + nom + attribut après)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// Le nouvel analyseur doit :
//  - garder le comportement existant (1 attribut postposé mono-mot, noms composés) ;
//  - accepter un attribut ANTÉPOSÉ (lexique fermé) : « le grand chat » ;
//  - accepter des attributs postposés COORDONNÉS : « chaton rouge et blanc » ;
//  - combiner les deux : « le grand chat poilu ».

describe("[F077] Analyseur de groupe nominal", () => {

  // ----------------------------------------------------------------------------------------------
  //  Comportement historique préservé (régression)
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T001] comportement historique", () => {

    it("« le chat » → det=le, nom=chat, sans attribut", () => {
      const d = decomposerGroupeNominal("le chat", false, true);
      expect(d).toBeDefined();
      expect(d!.determinant).toBe("le ");
      expect(d!.epithetesAvant).toEqual([]);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBeUndefined();
    });

    it("« le chat poilu » → nom=chat, après=poilu", () => {
      const d = decomposerGroupeNominal("le chat poilu", false, true);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBe("poilu");
      expect(d!.epithetesAvant).toEqual([]);
    });

    it("« la tache de sang séché » → nom composé, après=séché", () => {
      const d = decomposerGroupeNominal("la tache de sang séché", false, true);
      expect(d!.determinant).toBe("la ");
      expect(d!.nom).toBe("tache de sang");
      expect(d!.epithete).toBe("séché");
      expect(d!.epithetesAvant).toEqual([]);
    });

    it("« la salle de bain » → nom composé sans attribut", () => {
      const d = decomposerGroupeNominal("la salle de bain", false, true);
      expect(d!.nom).toBe("salle de bain");
      expect(d!.epithete).toBeUndefined();
    });

    it("« le cadenas bleu » → nom=cadenas, après=bleu", () => {
      const d = decomposerGroupeNominal("le cadenas bleu", false, true);
      expect(d!.nom).toBe("cadenas");
      expect(d!.epithete).toBe("bleu");
    });
  });

  // ----------------------------------------------------------------------------------------------
  //  Attribut ANTÉPOSÉ (avant le nom)
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T010] attribut antéposé", () => {

    it("« le grand chat » → avant=[grand], nom=chat", () => {
      const d = decomposerGroupeNominal("le grand chat", false, true);
      expect(d!.determinant).toBe("le ");
      expect(d!.epithetesAvant).toEqual(["grand"]);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBeUndefined();
    });

    it("« le grand chat poilu » → avant=[grand], nom=chat, après=poilu", () => {
      const d = decomposerGroupeNominal("le grand chat poilu", false, true);
      expect(d!.epithetesAvant).toEqual(["grand"]);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBe("poilu");
    });

    it("« la belle salle de bain » → avant=[belle], nom composé", () => {
      const d = decomposerGroupeNominal("la belle salle de bain", false, true);
      expect(d!.epithetesAvant).toEqual(["belle"]);
      expect(d!.nom).toBe("salle de bain");
      expect(d!.epithete).toBeUndefined();
    });

    it("« le grand » seul → nom=grand (pas d’attribut avant : rétrogradation)", () => {
      const d = decomposerGroupeNominal("le grand", false, true);
      expect(d!.epithetesAvant).toEqual([]);
      expect(d!.nom).toBe("grand");
    });
  });

  // ----------------------------------------------------------------------------------------------
  //  Attributs postposés COORDONNÉS
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T020] attributs coordonnés", () => {

    it("« chaton rouge et blanc » → après=rouge et blanc", () => {
      const d = decomposerGroupeNominal("chaton rouge et blanc", false, true);
      expect(d!.nom).toBe("chaton");
      expect(d!.epithete).toBe("rouge et blanc");
    });

    it("« le chat poilu et galeux » → après=poilu et galeux", () => {
      const d = decomposerGroupeNominal("le chat poilu et galeux", false, true);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBe("poilu et galeux");
    });

    it("« le drapeau rouge, blanc et bleu » → après coordonné par virgules", () => {
      const d = decomposerGroupeNominal("le drapeau rouge, blanc et bleu", false, true);
      expect(d!.nom).toBe("drapeau");
      expect(d!.epithete).toBe("rouge, blanc et bleu");
    });

    it("« le grand chat poilu et galeux » → avant + après coordonné", () => {
      const d = decomposerGroupeNominal("le grand chat poilu et galeux", false, true);
      expect(d!.epithetesAvant).toEqual(["grand"]);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBe("poilu et galeux");
    });
  });

  // ----------------------------------------------------------------------------------------------
  //  Déterminants indéfinis
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T030] déterminants", () => {

    it("« un grand chat poilu » (indéfini autorisé) → det=un, avant=[grand]", () => {
      const d = decomposerGroupeNominal("un grand chat poilu", true, true);
      expect(d!.determinant).toBe("un ");
      expect(d!.epithetesAvant).toEqual(["grand"]);
      expect(d!.nom).toBe("chat");
      expect(d!.epithete).toBe("poilu");
    });

    it("« un chat » rejeté en mode défini-seul", () => {
      const d = decomposerGroupeNominal("un chat", false, true);
      expect(d).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------------------------------------
  //  Modèle GroupeNominal : reconstruction et mots-clés
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T040] GroupeNominal.analyser + reconstruction", () => {

    it("analyser(« le grand chat poilu ») reconstruit nom/épithète et toString", () => {
      const gn = GroupeNominal.analyser("le grand chat poilu", { forcerMinuscules: true })!;
      expect(gn.determinant).toBe("le ");
      expect(gn.epithetesAvant).toEqual(["grand"]);
      expect(gn.nom).toBe("chat");
      expect(gn.epithete).toBe("poilu");
      expect(gn.nomEpithete).toBe("grand chat poilu");
      expect(gn.toString()).toBe("le grand chat poilu");
    });

    it("mots-clés de « le grand chat poilu » = [grand, chat, poilu]", () => {
      const gn = GroupeNominal.analyser("le grand chat poilu", { forcerMinuscules: true })!;
      expect(gn.motsCles).toEqual(["grand", "chat", "poilu"]);
    });

    it("mots-clés de « chaton rouge et blanc » = [chaton, rouge, blanc] (et/ou filtrés)", () => {
      const gn = GroupeNominal.analyser("chaton rouge et blanc", { forcerMinuscules: true })!;
      expect(gn.motsCles).toEqual(["chaton", "rouge", "blanc"]);
    });

    it("compat : liste d’états postposée préservée (nomEpithete inchangé)", () => {
      // cas CibleAction : epithete = liste d’états brute, pas d’attribut antéposé
      const gn = new GroupeNominal("un ", "objet", "déverrouillable, ouvrable et verrouillé");
      expect(gn.nomEpithete).toBe("objet déverrouillable, ouvrable et verrouillé");
      expect(gn.epithetesAvant).toEqual([]);
    });
  });

  // ----------------------------------------------------------------------------------------------
  //  Regex de DÉFINITION en 1 groupe (GN re-parsé via analyser) — étape 4
  // ----------------------------------------------------------------------------------------------
  describe("[F077-T050] regex de définition (GN en 1 groupe)", () => {

    function reparse(re: RegExp, phrase: string) {
      const r = re.exec(phrase);
      if (!r) { return null; }
      const gn = GroupeNominal.analyser(r[1], { indefini: true });
      return { gn, forme: r[2], type: r[3], attrs: r[4], init: r[5], unite: r[6], uniteGenre: r[7] };
    }

    it("« Le chat est un objet » → nom=chat, type=objet", () => {
      const d = reparse(xDefinitionElement1GN, "Le chat est un objet")!;
      expect(d).not.toBeNull();
      expect(d.gn!.nom).toBe("chat");
      expect(d.gn!.epithetesAvant).toEqual([]);
      expect(d.type).toBe("objet");
    });

    it("« La table basse est un objet » → nom=table, après=basse (postposé)", () => {
      const d = reparse(xDefinitionElement1GN, "La table basse est un objet")!;
      expect(d.gn!.nom).toBe("table");
      expect(d.gn!.epithete).toBe("basse");
      expect(d.gn!.epithetesAvant).toEqual([]);
      expect(d.type).toBe("objet");
    });

    it("« Le grand chat poilu est un objet » → avant=[grand], nom=chat, après=poilu", () => {
      const d = reparse(xDefinitionElement1GN, "Le grand chat poilu est un objet")!;
      expect(d.gn!.epithetesAvant).toEqual(["grand"]);
      expect(d.gn!.nom).toBe("chat");
      expect(d.gn!.epithete).toBe("poilu");
      expect(d.type).toBe("objet");
    });

    it("« Le chat rouge et blanc est un objet » → après coordonné s’arrête avant « est »", () => {
      const d = reparse(xDefinitionElement1GN, "Le chat rouge et blanc est un objet")!;
      expect(d.gn!.nom).toBe("chat");
      expect(d.gn!.epithete).toBe("rouge et blanc");
      expect(d.type).toBe("objet");
    });

    it("« La pomme de terre pourrie est un légume » → nom composé + après", () => {
      const d = reparse(xDefinitionElement1GN, "La pomme de terre pourrie est un légume")!;
      expect(d.gn!.nom).toBe("pomme de terre");
      expect(d.gn!.epithete).toBe("pourrie");
      expect(d.type).toBe("légume");
    });

    it("« Le champignon est un légume mangeable » → type + attribut d’état", () => {
      const d = reparse(xDefinitionElement1GN, "Le champignon est un légume mangeable")!;
      expect(d.gn!.nom).toBe("champignon");
      expect(d.type).toBe("légume");
      expect(d.attrs).toBe("mangeable");
    });

    it("« Le score est un compteur initialisé à 100 »", () => {
      const d = reparse(xDefinitionElement1GN, "Le score est un compteur initialisé à 100")!;
      expect(d.gn!.nom).toBe("score");
      expect(d.type).toBe("compteur");
      expect(d.init).toBe("initialisé à 100");
    });

    it("« Une pomme est une ressource » (ressource)", () => {
      const d = reparse(xDefinitionRessource1GN, "Une pomme est une ressource")!;
      expect(d).not.toBeNull();
      expect(d.gn!.determinant).toBe("Une "); // casse d’origine conservée (le consommateur applique toLowerCase)
      expect(d.gn!.nom).toBe("pomme");
      expect(d.type).toBe("ressource");
    });

    it("« Une pièce (f) est une ressource exprimée en pièces » (ressource + unité)", () => {
      const d = reparse(xDefinitionRessource1GN, "Une pièce (f) est une ressource exprimée en pièces")!;
      expect(d.gn!.nom).toBe("pièce");
      expect(d.forme).toBe("(f)");
      expect(d.type).toBe("ressource");
      expect(d.unite).toBe("pièces");
    });

    it("l’élément générique ne matche PAS un/une (réservés aux ressources)", () => {
      expect(xDefinitionElement1GN.exec("Une pomme est un objet")).toBeNull();
    });
  });
});
