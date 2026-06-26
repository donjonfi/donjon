// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F091] ABRÉVIATIONS — pronoms « ce dernier » (l'/le/la/les, lui/leur) & débogage (si/vf)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// abreviations.ts était à br30 (88/297 branches). obtenirCommandeComplete réécrit des commandes
// abrégées. On couvre ici les branches « pronom » (retour anticipé, sans dépendance lieux/objets).
//
// ⚠️ Guard du bug B8 : la branche « l' [verbe] » espacée ne testait QUE l'apostrophe droite (deux
// fois le même littéral) ; l'apostrophe typographique « l’ » espacée tombait à travers. Corrigé.

import { Abreviations } from "../utils/jeu/abreviations";

describe('[F091] abréviations — « l\'[verbe] » collé (ce dernier)', () => {
  it('[F091-T001] sans complément', () => {
    expect(Abreviations.obtenirCommandeComplete("l'ouvrir", [])).toBe('ouvrir ce dernier');
  });
  it('[F091-T002] avec complément', () => {
    expect(Abreviations.obtenirCommandeComplete("l'ouvrir le coffre", [])).toBe('ouvrir ce dernier le coffre');
  });
  it('[F091-T003] apostrophe typographique (collé)', () => {
    expect(Abreviations.obtenirCommandeComplete("l’ouvrir le coffre", [])).toBe('ouvrir ce dernier le coffre');
  });
});

describe('[F091] abréviations — « le/la/les [verbe] » espacé (accord du pronom)', () => {
  it('[F091-T010] « l\' » espacé, apostrophe droite', () => {
    expect(Abreviations.obtenirCommandeComplete("l' ouvrir le coffre", [])).toBe('ouvrir ce dernier le coffre');
  });
  it('[F091-T011] « l’ » espacé, apostrophe typographique (BUG B8 corrigé)', () => {
    expect(Abreviations.obtenirCommandeComplete("l’ ouvrir le coffre", [])).toBe('ouvrir ce dernier le coffre');
  });
  it('[F091-T012] « la » → cette dernière', () => {
    expect(Abreviations.obtenirCommandeComplete('la fermer la porte', [])).toBe('fermer cette dernière la porte');
  });
  it('[F091-T013] « les » → ces derniers', () => {
    expect(Abreviations.obtenirCommandeComplete('les prendre', [])).toBe('prendre ces derniers');
  });
});

describe('[F091] abréviations — « lui/leur [verbe] »', () => {
  it('[F091-T020] « lui [verbe] » sans complément → avec ce dernier', () => {
    expect(Abreviations.obtenirCommandeComplete('lui parler', [])).toBe('parler avec ce dernier');
  });
  it('[F091-T021] « lui [verbe] [objet] » → [objet] à ce dernier', () => {
    expect(Abreviations.obtenirCommandeComplete('lui montrer le coffre', [])).toBe('montrer le coffre à ce dernier');
  });
  it('[F091-T022] « leur [verbe] » → ces derniers', () => {
    expect(Abreviations.obtenirCommandeComplete('leur parler', [])).toBe('parler avec ces derniers');
  });
});

describe('[F091] abréviations — débogage de condition (si / vf)', () => {
  it('[F091-T030] « si <condition> »', () => {
    expect(Abreviations.obtenirCommandeComplete('si le coffre est ouvert', []))
      .toBe('déboguer dire "[si le coffre est ouvert]vrai[sinon]faux[fin]"');
  });
  it('[F091-T031] « vf si <condition> » (vf + si redondant)', () => {
    expect(Abreviations.obtenirCommandeComplete('vf si la porte est fermée', []))
      .toBe('déboguer dire "[si la porte est fermée]vrai[sinon]faux[fin]"');
  });
  it('[F091-T032] « vf <condition> » (sans si)', () => {
    expect(Abreviations.obtenirCommandeComplete('vf le coffre est ouvert', []))
      .toBe('déboguer dire "[si le coffre est ouvert]vrai[sinon]faux[fin]"');
  });
});
