import { ConditionsUtils, GroupeNominal } from "../../public-api";

import { Jeu } from "../models/jeu/jeu";
import { Liste } from "../models/jeu/liste";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/1] OPPÉRATIONS SUR LES LISTES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Liste − Déclarer une liste vide', () => {

  // définir un jeu avec une liste 'historique' vide
  let jeu: Jeu = new Jeu();
  let historique = new Liste("historique", new GroupeNominal("l’", "historique"));
  jeu.listes.push(historique);
  const condUtils = new ConditionsUtils(jeu, false);
  
  it('vérifier que la taille de la liste (vaut 0)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier que la taille de la liste (vaut 1)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier que la liste est vide (est vide)', () => {
    expect(condUtils.siEstVrai('l’historique est vide', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "élément pas présent"', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "élément pas présent"', null, null, null, null, 0)).toBeTrue();
  });

});

describe('Liste − Déclarer une liste remplie', () => {

  // définir un jeu avec une liste 'historique' vide
  let jeu: Jeu = new Jeu();
  let historique = new Liste("historique", new GroupeNominal("l’", "historique"));
  historique.ajouterTexte('"bougie allumée"');
  jeu.listes.push(historique);
  const condUtils = new ConditionsUtils(jeu, false);

  it('vérifier que la taille de la liste (vaut 0)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 0', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier que la taille de la liste (vaut 1)', () => {
    expect(condUtils.siEstVrai('la taille de l’historique vaut 1', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier que la liste est vide (est vide)', () => {
    expect(condUtils.siEstVrai('l’historique est vide', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "élément pas présent"', null, null, null, null, 0)).toBeFalse();
  });

  it('vérifier un élément qui ne se trouve pas dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "élément pas présent"', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (contient)', () => {
    expect(condUtils.siEstVrai('l’historique contient "bougie allumée"', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (inclut)', () => {
    expect(condUtils.siEstVrai('l’historique inclut "bougie allumée"', null, null, null, null, 0)).toBeTrue();
  });

  it('vérifier un élément qui se trouve dans la liste (ne contient pas)', () => {
    expect(condUtils.siEstVrai('l’historique ne contient pas "bougie allumée"', null, null, null, null, 0)).toBeFalse();
  });
  
  it('vérifier un élément qui se trouve dans la liste (n’inclut pas)', () => {
    expect(condUtils.siEstVrai('l’historique n’inclut pas "bougie allumée"', null, null, null, null, 0)).toBeFalse();
  });

});