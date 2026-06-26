// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F122] ELEMENTS-JEU-UTILS — intitulés (écho ressource, générique) + capacité action/cible (statiques purs)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Trois fonctions statiques PURES d’`ElementsJeuUtils` (utils/commun/elements-jeu-utils.ts), testées en
// isolation avec des mocks minimaux castés `as any` (pas de compilation de jeu) :
//
//  - `intituleEchoRessource(obj, quantite)` : intitulé d’une ressource pour l’écho de commande.
//        sans unité : « les <pluriel> » (qte -1/null) | « N <sing|plur> » selon |qte|≤1.
//        avec unité : liaison « d’ » (voyelle) / « de » (consonne) ; « les <unités> de <nom> » (qte -1/null)
//        | « N <unité|unités> de <nom> ».
//  - `calculerIntituleGenerique(ceci, forcerMajuscule)` : déterminant + antéposés + nom + épithète,
//        majuscule initiale optionnelle ; repli « ??? » si ni nom ni intitulé.
//  - `possedeCapaciteActionCible(ej, actionA, actionB, cible)` : vrai si une capacité matche
//        (verbe == actionA OU actionB) ET (complément == cible), insensible casse/espaces.
//
// L’apostrophe des littéraux attendus est U+2019 (typographique), écrite via ’.

import { ElementsJeuUtils } from "../utils/commun/elements-jeu-utils";

// ———————————————————————————————————————————————————————————————————————
//  intituleEchoRessource
// ———————————————————————————————————————————————————————————————————————

/** Mock ressource SANS unité (comptée par son nom). */
function resSansUnite(nomS: string, nomP: string): any {
  return { intituleS: { nom: nomS }, intituleP: { nom: nomP }, nom: nomS };
}
/** Mock ressource AVEC unité de comptage. */
function resAvecUnite(nom: string, unite: string, unites?: string): any {
  return { intituleS: { nom }, nom, unite, unites };
}

describe("[F122] ElementsJeuUtils.intituleEchoRessource", () => {

  it("[F122-T001] sans unité, qte -1 → « les <pluriel> »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resSansUnite("pomme", "pommes"), -1)).toBe("les pommes");
  });

  it("[F122-T002] sans unité, qte null → « les <pluriel> »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resSansUnite("pomme", "pommes"), null)).toBe("les pommes");
  });

  it("[F122-T003] sans unité, qte 1 → singulier « 1 pomme »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resSansUnite("pomme", "pommes"), 1)).toBe("1 pomme");
  });

  it("[F122-T004] sans unité, qte 3 → pluriel « 3 pommes »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resSansUnite("pomme", "pommes"), 3)).toBe("3 pommes");
  });

  it("[F122-T005] avec unité (consonne), qte 2 → « 2 litres de vin »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resAvecUnite("vin", "litre", "litres"), 2)).toBe("2 litres de vin");
  });

  it("[F122-T006] avec unité (voyelle → liaison « d’ »), qte -1 → « les litres d’eau »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resAvecUnite("eau", "litre", "litres"), -1)).toBe("les litres d’eau");
  });

  it("[F122-T007] avec unité, qte 1 → unité au singulier « 1 litre d’eau »", () => {
    expect(ElementsJeuUtils.intituleEchoRessource(resAvecUnite("eau", "litre", "litres"), 1)).toBe("1 litre d’eau");
  });

  it("[F122-T008] avec unité sans pluriel d’unité (unites absent) → unite réutilisée", () => {
    // unites omis → la forme plurielle retombe sur `unite`
    expect(ElementsJeuUtils.intituleEchoRessource(resAvecUnite("bois", "unité"), 8)).toBe("8 unité de bois");
  });

});

// ———————————————————————————————————————————————————————————————————————
//  calculerIntituleGenerique
// ———————————————————————————————————————————————————————————————————————

/** Mock Intitule : `nom` (repli) + `intitule` (GroupeNominal). */
function intMock(nom: string, gn: any): any {
  return { nom, intitule: gn };
}

describe("[F122] ElementsJeuUtils.calculerIntituleGenerique", () => {

  it("[F122-T020] sans intitulé → repli sur le nom brut", () => {
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", null), false)).toBe("rocher");
  });

  it("[F122-T021] déterminant + nom", () => {
    const gn = { determinant: "le ", nom: "rocher" };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", gn), false)).toBe("le rocher");
  });

  it("[F122-T022] déterminant + nom + épithète (postposé)", () => {
    const gn = { determinant: "le ", nom: "rocher", epithete: "rouge" };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", gn), false)).toBe("le rocher rouge");
  });

  it("[F122-T023] attributs antéposés entre déterminant et nom", () => {
    const gn = { determinant: "le ", nom: "rocher", epithetesAvant: ["grand"] };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", gn), false)).toBe("le grand rocher");
  });

  it("[F122-T024] antéposé(s) + postposé combinés", () => {
    const gn = { determinant: "le ", nom: "rocher", epithetesAvant: ["grand", "vieux"], epithete: "rouge" };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", gn), false)).toBe("le grand vieux rocher rouge");
  });

  it("[F122-T025] sans déterminant (nom propre) → nom seul", () => {
    const gn = { determinant: "", nom: "Merlin" };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("Merlin", gn), false)).toBe("Merlin");
  });

  it("[F122-T026] forcerMajuscule met la première lettre en capitale", () => {
    const gn = { determinant: "le ", nom: "rocher" };
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock("rocher", gn), true)).toBe("Le rocher");
  });

  it("[F122-T027] ni nom ni intitulé → repli « ??? »", () => {
    expect(ElementsJeuUtils.calculerIntituleGenerique(intMock(null, null), false)).toBe("???");
  });

});

// ———————————————————————————————————————————————————————————————————————
//  possedeCapaciteActionCible
// ———————————————————————————————————————————————————————————————————————

/** Mock ElementJeu : seule la liste `capacites` (verbe/complement) est lue. */
function ejCap(...caps: Array<[string, string]>): any {
  return { capacites: caps.map(([verbe, complement]) => ({ verbe, complement })) };
}

describe("[F122] ElementsJeuUtils.possedeCapaciteActionCible", () => {

  it("[F122-T040] verbe == actionA et complément == cible → true", () => {
    const ej = ejCap(["ouvrir", "porte"]);
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ej, "ouvrir", null, "porte")).toBe(true);
  });

  it("[F122-T041] verbe == actionB (actionA ne matche pas) → true", () => {
    const ej = ejCap(["fermer", "porte"]);
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ej, "ouvrir", "fermer", "porte")).toBe(true);
  });

  it("[F122-T042] verbe matche mais cible différente → false", () => {
    const ej = ejCap(["ouvrir", "coffre"]);
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ej, "ouvrir", null, "porte")).toBe(false);
  });

  it("[F122-T043] aucune capacité ne matche → false", () => {
    const ej = ejCap(["examiner", "tableau"]);
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ej, "ouvrir", "fermer", "porte")).toBe(false);
  });

  it("[F122-T044] insensible à la casse et aux espaces", () => {
    const ej = ejCap(["  Ouvrir ", "  PORTE "]);
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ej, "OUVRIR", null, "porte")).toBe(true);
  });

  it("[F122-T045] élément non défini (null) → false", () => {
    expect(ElementsJeuUtils.possedeCapaciteActionCible(null as any, "ouvrir", null, "porte")).toBe(false);
  });

  it("[F122-T046] liste de capacités vide → false", () => {
    expect(ElementsJeuUtils.possedeCapaciteActionCible(ejCap(), "ouvrir", null, "porte")).toBe(false);
  });

});
