// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F116] ELEMENTS-JEU-UTILS — déterminant indéfini + somme quantité ressource (fonctions pures)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Deux fonctions statiques PURES de `ElementsJeuUtils` (utils/commun/elements-jeu-utils.ts), testées
// en isolation avec des mocks minimaux castés `as any` (pas de compilation de jeu).
//
//  - `trouverDeterminantIndefini(el)` : table grammaticale genre × nombre → article indéfini/partitif.
//        pluriel (p / tp)              → « des »
//        singulier (s) + féminin       → « une »
//        singulier (s) + masc./neutre  → « un »
//        indéfini/massique (i) + fém.  → « de la » (consonne) / « de l’ » (voyelle)
//        indéfini/massique (i) + masc. → « du »    (consonne) / « de l’ » (voyelle)
//        indéfini/massique (i) + neutre→ « de l’ » (toujours, voyelle ignorée)
//    NB grammaire : les articles « pleins » portent une espace séparatrice (« du <nom> »), mais
//    l’élision « de l’ » colle au nom (« de l’eau », pas « de l’ eau ») → PAS d’espace finale.
//    L’apostrophe est U+2019 (typographique), écrite ici via ’ pour garder le code en ASCII.
//
//  - `sommeQuantiteRessource(objets, joueurId, nom, scope)` : somme les quantités des piles d’une
//        ressource selon le périmètre. -1 (illimité) l’emporte MAIS seulement parmi les piles
//        DÉJÀ filtrées par nom + scope. « possede » = piles directement dans l’inventaire du joueur ;
//        « disponible » = tout le reste (y compris une pile dans un sac porté par le joueur).

import { ElementsJeuUtils } from "../utils/commun/elements-jeu-utils";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";

// apostrophe typographique U+2019 (identique au littéral source « de l’ »)
const APO = "’";

/** Mock minimal d’ElementJeu : seuls `nombre`, `genre`, `intitule.nom` sont lus. */
function elMock(nombre: Nombre, genre: Genre, nom: string): any {
  return { nombre, genre, intitule: { nom } };
}

/** Mock minimal d’Objet : seuls `nom`, `position.cibleId`, `quantite` sont lus. */
function pileMock(nom: string, cibleId: number, quantite: number): any {
  return { nom, position: { cibleId }, quantite };
}

describe("[F116] ElementsJeuUtils.trouverDeterminantIndefini", () => {

  // ——— Pluriel : le genre n’a aucune influence ———
  it("[F116-T001] pluriel (p) → « des » (espace finale)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.p, Genre.m, "rochers"))).toBe("des ");
  });

  it("[F116-T002] pluriel (p) féminin → « des » (genre ignoré)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.p, Genre.f, "pierres"))).toBe("des ");
  });

  it("[F116-T003] toujours-pluriel (tp) → « des »", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.tp, Genre.m, "ciseaux"))).toBe("des ");
  });

  // ——— Singulier ———
  it("[F116-T004] singulier (s) féminin → « une »", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.s, Genre.f, "pomme"))).toBe("une ");
  });

  it("[F116-T005] singulier (s) masculin → « un »", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.s, Genre.m, "rocher"))).toBe("un ");
  });

  it("[F116-T006] singulier (s) neutre → « un » (traité comme masculin)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.s, Genre.n, "truc"))).toBe("un ");
  });

  // ——— Indéfini / massique (partitif) : féminin ———
  it("[F116-T007] indéfini (i) féminin + consonne → « de la » (espace finale)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.f, "farine"))).toBe("de la ");
  });

  it("[F116-T008] indéfini (i) féminin + voyelle → « de l’ » (élision, sans espace)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.f, "eau"))).toBe("de l" + APO);
  });

  // ——— Indéfini / massique (partitif) : masculin ———
  it("[F116-T009] indéfini (i) masculin + consonne → « du » (espace finale)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.m, "pain"))).toBe("du ");
  });

  it("[F116-T010] indéfini (i) masculin + voyelle → « de l’ » (élision, sans espace)", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.m, "or"))).toBe("de l" + APO);
  });

  // ——— Indéfini / massique (partitif) : neutre ———
  it("[F116-T011] indéfini (i) neutre + voyelle → « de l’ »", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.n, "eau"))).toBe("de l" + APO);
  });

  it("[F116-T012] indéfini (i) neutre + consonne → « de l’ » (voyelle ignorée pour le neutre)", () => {
    // pour le neutre la branche voyelle/consonne n’est pas consultée : toujours élision.
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.n, "machin"))).toBe("de l" + APO);
  });

  // ——— Voyelle accentuée : la regex couvre é/è/â/… ———
  it("[F116-T013] indéfini (i) masculin + voyelle accentuée (é) → « de l’ »", () => {
    expect(ElementsJeuUtils.trouverDeterminantIndefini(elMock(Nombre.i, Genre.m, "éther"))).toBe("de l" + APO);
  });

});

describe("[F116] ElementsJeuUtils.sommeQuantiteRessource", () => {

  const JOUEUR = 1;
  const SAC = 7;      // un contenant porté par le joueur (≠ joueurId)
  const LIEU = 99;    // une cible quelconque hors inventaire

  // ——— scope « possede » (par défaut) ———
  it("[F116-T020] possede : somme des piles dans l’inventaire du joueur", () => {
    const objets = [
      pileMock("or", JOUEUR, 5),
      pileMock("or", JOUEUR, 3),
      pileMock("or", LIEU, 100), // hors inventaire → ignorée
    ];
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or")).toBe(8);
  });

  it("[F116-T021] possede : scope est la valeur par défaut (paramètre omis)", () => {
    const objets = [pileMock("or", JOUEUR, 4)];
    // omettre scope doit donner le même résultat que scope='possede'
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or"))
      .toBe(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "possede"));
  });

  it("[F116-T022] possede : autre nom de ressource → 0", () => {
    const objets = [pileMock("or", JOUEUR, 10)];
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "argent")).toBe(0);
  });

  // ——— scope « disponible » ———
  it("[F116-T023] disponible : somme de tout SAUF l’inventaire direct du joueur", () => {
    const objets = [
      pileMock("or", JOUEUR, 5),  // possédée → exclue
      pileMock("or", LIEU, 20),
      pileMock("or", SAC, 7),     // dans un sac porté → « disponible » (périmètre direct)
    ];
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "disponible")).toBe(27);
  });

  it("[F116-T024] disponible : pile dans un sac porté compte comme disponible, pas possédée", () => {
    const objets = [pileMock("or", SAC, 9)];
    // cibleId du sac ≠ joueurId → pas « possede », mais « disponible »
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "possede")).toBe(0);
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "disponible")).toBe(9);
  });

  // ——— Illimité (-1) ———
  it("[F116-T025] illimité (-1) parmi les piles en scope → -1 l’emporte", () => {
    const objets = [
      pileMock("or", JOUEUR, 5),
      pileMock("or", JOUEUR, -1), // pile illimitée possédée
    ];
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "possede")).toBe(-1);
  });

  it("[F116-T026] illimité HORS scope ne force PAS -1 (filtrage avant le test -1)", () => {
    const objets = [
      pileMock("or", JOUEUR, 5),   // possédée
      pileMock("or", JOUEUR, 3),   // possédée
      pileMock("or", LIEU, -1),    // illimitée mais DISPONIBLE → hors scope « possede »
    ];
    // -1 est hors scope → ne doit pas contaminer la somme possédée.
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "possede")).toBe(8);
    // et côté disponible, la pile -1 rend bien le total illimité.
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "disponible")).toBe(-1);
  });

  // ——— Robustesse : valeurs nulles ———
  it("[F116-T027] quantite null/undefined comptée comme 0 (?? 0)", () => {
    const objets = [
      pileMock("or", JOUEUR, 4),
      { nom: "or", position: { cibleId: JOUEUR }, quantite: null } as any,
      { nom: "or", position: { cibleId: JOUEUR } } as any, // quantite absente
    ];
    expect(ElementsJeuUtils.sommeQuantiteRessource(objets, JOUEUR, "or", "possede")).toBe(4);
  });

  it("[F116-T028] liste d’objets null/undefined → 0 (?? [])", () => {
    expect(ElementsJeuUtils.sommeQuantiteRessource(null as any, JOUEUR, "or")).toBe(0);
    expect(ElementsJeuUtils.sommeQuantiteRessource(undefined as any, JOUEUR, "or")).toBe(0);
  });

  it("[F116-T029] aucune pile (liste vide) → 0", () => {
    expect(ElementsJeuUtils.sommeQuantiteRessource([], JOUEUR, "or")).toBe(0);
  });

});
