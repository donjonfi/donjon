// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F112] GENERATEUR — localisation (fonctions statiques PURES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// generateur.ts (br72) est massivement traversé par l'intégration mais sa logique de localisation
// n'était assertée par AUCUN test direct. On verrouille ici les 3 fonctions pures :
//   - getOpposePosition : bidirectionnalité des portes/voisins (6 paires + inconnu)
//   - getLocalisation   : parsing texte → ELocalisation (strip préfixe/suffixe, casse, alias)
//   - getLieuID         : résolution nom de lieu → id (exact / préfixe-unique / absent / ambigu)
//
// Valeurs attendues DÉRIVÉES de la sémantique (un opposé est correct parce qu'il est correct),
// pas copiées d'une exécution.

import { Generateur } from "../utils/compilation/generateur";
import { ELocalisation } from "../models/jeu/localisation";

describe('[F112] Generateur.getOpposePosition', () => {

  // les 6 paires symétriques : tester les deux sens verrouille la bidirectionnalité
  it('[F112-T001] est ↔ ouest', () => {
    expect(Generateur.getOpposePosition(ELocalisation.est)).toBe(ELocalisation.ouest);
    expect(Generateur.getOpposePosition(ELocalisation.ouest)).toBe(ELocalisation.est);
  });

  it('[F112-T002] nord ↔ sud', () => {
    expect(Generateur.getOpposePosition(ELocalisation.nord)).toBe(ELocalisation.sud);
    expect(Generateur.getOpposePosition(ELocalisation.sud)).toBe(ELocalisation.nord);
  });

  it('[F112-T003] nord-est ↔ sud-ouest (diagonale)', () => {
    expect(Generateur.getOpposePosition(ELocalisation.nord_est)).toBe(ELocalisation.sud_ouest);
    expect(Generateur.getOpposePosition(ELocalisation.sud_ouest)).toBe(ELocalisation.nord_est);
  });

  it('[F112-T004] nord-ouest ↔ sud-est (diagonale croisée)', () => {
    expect(Generateur.getOpposePosition(ELocalisation.nord_ouest)).toBe(ELocalisation.sud_est);
    expect(Generateur.getOpposePosition(ELocalisation.sud_est)).toBe(ELocalisation.nord_ouest);
  });

  it('[F112-T005] haut ↔ bas', () => {
    expect(Generateur.getOpposePosition(ELocalisation.haut)).toBe(ELocalisation.bas);
    expect(Generateur.getOpposePosition(ELocalisation.bas)).toBe(ELocalisation.haut);
  });

  it('[F112-T006] intérieur ↔ extérieur', () => {
    expect(Generateur.getOpposePosition(ELocalisation.interieur)).toBe(ELocalisation.exterieur);
    expect(Generateur.getOpposePosition(ELocalisation.exterieur)).toBe(ELocalisation.interieur);
  });

  it('[F112-T007] inconnu → inconnu (branche default)', () => {
    expect(Generateur.getOpposePosition(ELocalisation.inconnu)).toBe(ELocalisation.inconnu);
  });

});

describe('[F112] Generateur.getLocalisation', () => {

  // -- formes nues (sans préfixe ni suffixe) : un cas par direction cardinale --
  it('[F112-T010] formes nues cardinales', () => {
    expect(Generateur.getLocalisation('nord')).toBe(ELocalisation.nord);
    expect(Generateur.getLocalisation('sud')).toBe(ELocalisation.sud);
    expect(Generateur.getLocalisation('est')).toBe(ELocalisation.est);
    expect(Generateur.getLocalisation('ouest')).toBe(ELocalisation.ouest);
  });

  it('[F112-T011] formes nues diagonales', () => {
    expect(Generateur.getLocalisation('nord-est')).toBe(ELocalisation.nord_est);
    expect(Generateur.getLocalisation('nord-ouest')).toBe(ELocalisation.nord_ouest);
    expect(Generateur.getLocalisation('sud-est')).toBe(ELocalisation.sud_est);
    expect(Generateur.getLocalisation('sud-ouest')).toBe(ELocalisation.sud_ouest);
  });

  // -- préfixes stripés : « au … », « à l'… », « en … » --
  it('[F112-T012] préfixe « au » strippé', () => {
    expect(Generateur.getLocalisation('au nord')).toBe(ELocalisation.nord);
  });

  it("[F112-T013] préfixe « à l'» strippé (apostrophe droite)", () => {
    expect(Generateur.getLocalisation("à l'est")).toBe(ELocalisation.est);
    expect(Generateur.getLocalisation("à l'ouest")).toBe(ELocalisation.ouest);
  });

  it('[F112-T014] préfixe « en » strippé', () => {
    expect(Generateur.getLocalisation('en haut')).toBe(ELocalisation.haut);
    expect(Generateur.getLocalisation('en bas')).toBe(ELocalisation.bas);
  });

  // -- suffixe déterminant strippé (« le/la/les/du… » en fin) --
  it('[F112-T015] suffixe déterminant strippé', () => {
    // « intérieur du » → strip « du » final → « intérieur »
    expect(Generateur.getLocalisation('intérieur du')).toBe(ELocalisation.interieur);
  });

  // -- alias verticaux : dessus/dessous --
  it('[F112-T016] alias dessus = haut, dessous = bas', () => {
    expect(Generateur.getLocalisation('dessus')).toBe(ELocalisation.haut);
    expect(Generateur.getLocalisation('dessous')).toBe(ELocalisation.bas);
  });

  // -- alias intérieur/extérieur : dans / hors + variantes accentuées --
  it('[F112-T017] alias dans = intérieur, hors = extérieur', () => {
    expect(Generateur.getLocalisation('dans')).toBe(ELocalisation.interieur);
    expect(Generateur.getLocalisation('hors')).toBe(ELocalisation.exterieur);
  });

  it('[F112-T018] intérieur/extérieur : variantes accentuée et non accentuée', () => {
    expect(Generateur.getLocalisation('intérieur')).toBe(ELocalisation.interieur);
    expect(Generateur.getLocalisation('interieur')).toBe(ELocalisation.interieur);
    expect(Generateur.getLocalisation('extérieur')).toBe(ELocalisation.exterieur);
    expect(Generateur.getLocalisation('exterieur')).toBe(ELocalisation.exterieur);
  });

  // -- casse : majuscules normalisées --
  it('[F112-T019] casse indifférente (toLocaleLowerCase)', () => {
    expect(Generateur.getLocalisation('SUD')).toBe(ELocalisation.sud);
    expect(Generateur.getLocalisation('Au Nord')).toBe(ELocalisation.nord);
  });

  // -- default : direction non reconnue --
  it('[F112-T020] texte non reconnu → inconnu (branche default)', () => {
    expect(Generateur.getLocalisation('nulle part')).toBe(ELocalisation.inconnu);
  });

});

describe('[F112] Generateur.getLieuID', () => {

  // lieux minimaux : seuls .nom (minuscule normalisé) et .id sont lus
  const lieux: any = [
    { nom: 'cuisine', id: 10 },
    { nom: 'grande salle', id: 20 },
    { nom: 'salle de bain', id: 30 },
  ];

  it('[F112-T030] nom exact unique → id', () => {
    expect(Generateur.getLieuID(lieux, 'cuisine', false)).toBe(10);
  });

  it('[F112-T031] préfixe unique → id (début de sujet)', () => {
    // « grande » ne préfixe que « grande salle »
    expect(Generateur.getLieuID(lieux, 'grande', false)).toBe(20);
  });

  it('[F112-T032] préfixe ambigu (plusieurs débuts) → -1', () => {
    // « salle » préfixe « salle de bain » mais PAS « grande salle » (startsWith)
    // on rend l'ambiguïté avec deux lieux « salle … »
    const lieuxAmbigus: any = [
      { nom: 'salle de bain', id: 1 },
      { nom: 'salle de jeu', id: 2 },
    ];
    expect(Generateur.getLieuID(lieuxAmbigus, 'salle', false)).toBe(-1);
  });

  it('[F112-T033] aucun lieu correspondant → -1', () => {
    expect(Generateur.getLieuID(lieux, 'inexistant', false)).toBe(-1);
  });

  it('[F112-T034] nom exact en double → -1 (candidats.length > 1)', () => {
    // deux lieux portant exactement le même nom : la boucle exacte en trouve 2
    const lieuxDoublon: any = [
      { nom: 'cave', id: 1 },
      { nom: 'cave', id: 2 },
    ];
    expect(Generateur.getLieuID(lieuxDoublon, 'cave', false)).toBe(-1);
  });

  it('[F112-T035] casse/espaces : entrée nettoyée avant comparaison', () => {
    expect(Generateur.getLieuID(lieux, '  CUISINE  ', false)).toBe(10);
  });

});
