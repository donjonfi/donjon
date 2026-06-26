// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F103] PROPRIETE-JEU — getDe : élision « de » / « d’ » (B11)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// ⚠️ Guard du bug B11 : getDe testait l'initiale avec /^(a|e|i|o|u|y)/i (voyelles ASCII seulement)
// → « écu » donnait « de écu » au lieu de « d’écu ». Corrigé pour inclure les voyelles accentuées.

import { ProprieteJeu } from "../models/jeu/propriete-jeu";

describe('[F103] ProprieteJeu.getDe (élision)', () => {

  it('[F103-T001] initiale consonne → « de »', () => {
    expect(ProprieteJeu.getDe('chat')).toBe('de ');
    expect(ProprieteJeu.getDe('bourse')).toBe('de ');
  });

  it('[F103-T002] initiale voyelle ASCII → « d’ »', () => {
    expect(ProprieteJeu.getDe('arbre')).toBe('d’');
    expect(ProprieteJeu.getDe('or')).toBe('d’');
  });

  it('[F103-T003] initiale voyelle ACCENTUÉE → « d’ » (BUG B11 corrigé)', () => {
    expect(ProprieteJeu.getDe('écu')).toBe('d’');
    expect(ProprieteJeu.getDe('épée')).toBe('d’');
    expect(ProprieteJeu.getDe('âme')).toBe('d’');
  });

  it('[F103-T004] majuscule voyelle → « d’ » (insensible à la casse)', () => {
    expect(ProprieteJeu.getDe('Or')).toBe('d’');
    expect(ProprieteJeu.getDe('Élan')).toBe('d’');
  });

  it('[F103-T005] « h » non élidé (aspiré/muet ambigu — comportement conservé)', () => {
    expect(ProprieteJeu.getDe('hibou')).toBe('de ');
  });

  it('[F103-T006] valeur nulle → « de » (chaînage optionnel)', () => {
    expect(ProprieteJeu.getDe(null as any)).toBe('de ');
  });
});
