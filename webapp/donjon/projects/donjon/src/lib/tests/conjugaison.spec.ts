// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F090] CONJUGAISON — verbes réguliers (1er/2e/3e groupe), participe passé, temps composés
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Conjugaison était à br35 sans assertion directe. Le moteur conjugue à la 3e personne (sing./plur.)
// pour la narration auto (cf. instruction-dire calculerConjugaison).
//
// ⚠️ Ce spec accompagne la correction des bugs B3 + B4 du plan d'audit :
//   - B3 : getRadical (2e groupe) utilisait `Notification.length` (global navigateur ≈ 1) → radical vide
//          → toute conjugaison du 2e groupe renvoyait « forme pas prise en charge ».
//   - B4 : la terminaison utilisait toujours la table `er` → la table `ir` était morte.
// Correctif appliqué : radical du 2e groupe = infinitif sans « ir », table `ir` réécrite sur ce radical
// (it/issent/issait…), et sélection de table rendue dépendante du groupe.

import { Conjugaison } from "../utils/jeu/conjugaison";

describe('[F090] Conjugaison.getGroupe', () => {
  it('[F090-T001] 1er groupe (ER sauf aller)', () => {
    expect(Conjugaison.getGroupe('parler')).toBe(1);
    expect(Conjugaison.getGroupe('manger')).toBe(1);
    expect(Conjugaison.getGroupe('aller')).toBe(3); // exception : aller n'est PAS du 1er groupe
  });
  it('[F090-T002] 2e groupe (IR de la liste)', () => {
    expect(Conjugaison.getGroupe('finir')).toBe(2);
    expect(Conjugaison.getGroupe('choisir')).toBe(2);
  });
  it('[F090-T003] 3e groupe (IR hors liste, RE, irréguliers)', () => {
    expect(Conjugaison.getGroupe('partir')).toBe(3);
    expect(Conjugaison.getGroupe('courir')).toBe(3);
    expect(Conjugaison.getGroupe('vendre')).toBe(3);
  });
});

describe('[F090] Conjugaison.verbeDans2eGroupe', () => {
  it('[F090-T010] verbes du 2e groupe → vrai', () => {
    expect(Conjugaison.verbeDans2eGroupe('finir')).toBeTrue();
    expect(Conjugaison.verbeDans2eGroupe('choisir')).toBeTrue();
    expect(Conjugaison.verbeDans2eGroupe('réussir')).toBeTrue();
  });
  it('[F090-T011] IR du 3e groupe → faux', () => {
    expect(Conjugaison.verbeDans2eGroupe('partir')).toBeFalse();
    expect(Conjugaison.verbeDans2eGroupe('courir')).toBeFalse();
  });
  it('[F090-T012] entrée vide → faux', () => {
    expect(Conjugaison.verbeDans2eGroupe(null as any)).toBeFalse();
  });
});

describe('[F090] Conjugaison 1er groupe (régression — chemin le plus utilisé)', () => {
  it('[F090-T020] présent', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'ipr', '3ps', false)).toBe('parle');
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'ipr', '3pp', false)).toBe('parlent');
  });
  it('[F090-T021] imparfait', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'iimp', '3ps', false)).toBe('parlait');
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'iimp', '3pp', false)).toBe('parlaient');
  });
  it('[F090-T022] futur', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'ifus', '3ps', false)).toBe('parlera');
  });
  it('[F090-T023] conditionnel présent', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'cpr', '3pp', false)).toBe('parleraient');
  });
});

describe('[F090] Conjugaison 2e groupe (B3+B4 corrigés)', () => {
  it('[F090-T030] présent : finit / finissent', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'ipr', '3ps', false)).toBe('finit');
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'ipr', '3pp', false)).toBe('finissent');
  });
  it('[F090-T031] imparfait : finissait / finissaient', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'iimp', '3ps', false)).toBe('finissait');
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'iimp', '3pp', false)).toBe('finissaient');
  });
  it('[F090-T032] passé simple : finit / finirent', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'ipas', '3pp', false)).toBe('finirent');
  });
  it('[F090-T033] futur / conditionnel : finira / finirait', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'ifus', '3ps', false)).toBe('finira');
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'cpr', '3ps', false)).toBe('finirait');
  });
  it('[F090-T034] subjonctif présent / imparfait : finissent / finît', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'spr', '3pp', false)).toBe('finissent');
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'simp', '3ps', false)).toBe('finît');
  });
  it('[F090-T035] autres verbes du 2e groupe', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('choisir', 'ipr', '3pp', false)).toBe('choisissent');
    expect(Conjugaison.getConjugaigonVerbeRegulier('réussir', 'ipr', '3ps', false)).toBe('réussit');
  });
});

describe('[F090] Conjugaison.tempsAvecAuxiliaire & temps composés', () => {
  it('[F090-T040] détection des temps à auxiliaire', () => {
    expect(Conjugaison.tempsAvecAuxiliaire('ipac')).toBeTrue();  // passé composé
    expect(Conjugaison.tempsAvecAuxiliaire('ipr')).toBeFalse();  // présent
  });
  it('[F090-T041] passé composé avec « avoir »', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'ipac', '3ps', false)).toBe('a parlé');
    expect(Conjugaison.getConjugaigonVerbeRegulier('finir', 'ipac', '3ps', false)).toBe('a fini');
    expect(Conjugaison.getConjugaigonVerbeRegulier('parler', 'ipac', '3pp', false)).toBe('ont parlé');
  });
  it('[F090-T042] passé composé avec « être » (verbe de mouvement)', () => {
    expect(Conjugaison.getConjugaigonVerbeRegulier('tomber', 'ipac', '3ps', false)).toBe('est tombé');
  });
});

describe('[F090] Conjugaison.getParticipePasse', () => {
  it('[F090-T050] réguliers 1er/2e groupe', () => {
    expect(Conjugaison.getParticipePasse('parler')).toBe('parlé');
    expect(Conjugaison.getParticipePasse('finir')).toBe('fini');
    expect(Conjugaison.getParticipePasse('choisir')).toBe('choisi');
  });
  it('[F090-T051] irréguliers connus (table pp)', () => {
    expect(Conjugaison.getParticipePasse('prendre')).toBe('pris');
    expect(Conjugaison.getParticipePasse('dire')).toBe('dit');
    expect(Conjugaison.getParticipePasse('avoir')).toBe('eu');
    expect(Conjugaison.getParticipePasse('être')).toBe('été');
    expect(Conjugaison.getParticipePasse('mourir')).toBe('mort');
    expect(Conjugaison.getParticipePasse('ouvrir')).toBe('ouvert');
  });
});

describe('[F090] Conjugaison.verbeAvecAuxiliaireEtre', () => {
  it('[F090-T060] verbes de mouvement (DR & MRS VANDERTRAMP) → être', () => {
    expect(Conjugaison.verbeAvecAuxiliaireEtre('tomber', false)).toBeTrue();
    expect(Conjugaison.verbeAvecAuxiliaireEtre('mourir', false)).toBeTrue();
    expect(Conjugaison.verbeAvecAuxiliaireEtre('aller', false)).toBeTrue();
  });
  it('[F090-T061] verbes ordinaires → avoir', () => {
    expect(Conjugaison.verbeAvecAuxiliaireEtre('parler', false)).toBeFalse();
    expect(Conjugaison.verbeAvecAuxiliaireEtre('finir', false)).toBeFalse();
  });
  it('[F090-T062] pronominaux → être (drapeau ou préfixe se/s’)', () => {
    expect(Conjugaison.verbeAvecAuxiliaireEtre('laver', true)).toBeTrue();
    expect(Conjugaison.verbeAvecAuxiliaireEtre("s'évader", false)).toBeTrue();
  });
});
