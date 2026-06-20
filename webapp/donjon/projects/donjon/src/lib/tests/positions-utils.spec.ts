// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F087] POSITIONS-UTILS — égalité de positions, objets « ici » (fonctions PURES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// PositionsUtils était à br33 (très bas). On vérifie l'égalité de positions (avec chaînage optionnel
// sur null) et le filtrage des objets présents « ici ». Positions/objets construits en minimal (cast)
// car seules cibleType / cibleId / pre sont lues.

import { PositionsUtils } from "../utils/commun/positions-utils";
import { PositionObjet } from "../models/jeu/position-objet";
import { Objet } from "../models/jeu/objet";
import { EClasseRacine } from "../models/commun/constantes";

function pos(cibleType: any, cibleId: number, pre: any): PositionObjet {
  return { cibleType, cibleId, pre } as PositionObjet;
}
function objLa(nom: string, cibleId: number): Objet {
  return { nom, position: { cibleType: EClasseRacine.lieu, cibleId } } as unknown as Objet;
}

describe('[F087] PositionsUtils.positionsIdentiques', () => {

  it('[F087-T001] positions identiques → vrai', () => {
    expect(PositionsUtils.positionsIdentiques(pos(EClasseRacine.lieu, 1, 'dans'), pos(EClasseRacine.lieu, 1, 'dans'))).toBeTrue();
  });

  it('[F087-T002] cibleId différent → faux', () => {
    expect(PositionsUtils.positionsIdentiques(pos(EClasseRacine.lieu, 1, 'dans'), pos(EClasseRacine.lieu, 2, 'dans'))).toBeFalse();
  });

  it('[F087-T003] préposition différente → faux', () => {
    expect(PositionsUtils.positionsIdentiques(pos(EClasseRacine.lieu, 1, 'dans'), pos(EClasseRacine.lieu, 1, 'sur'))).toBeFalse();
  });

  it('[F087-T004] cibleType différent → faux', () => {
    expect(PositionsUtils.positionsIdentiques(pos(EClasseRacine.lieu, 1, 'dans'), pos(EClasseRacine.objet, 1, 'dans'))).toBeFalse();
  });

  it('[F087-T005] deux positions nulles → vrai (chaînage optionnel)', () => {
    expect(PositionsUtils.positionsIdentiques(null as any, null as any)).toBeTrue();
  });

  it('[F087-T006] une seule position nulle → faux', () => {
    expect(PositionsUtils.positionsIdentiques(pos(EClasseRacine.lieu, 1, 'dans'), null as any)).toBeFalse();
  });
});

describe('[F087] PositionsUtils.getObjetsQuiSeTrouventLa', () => {

  it('[F087-T010] « ici » → uniquement les objets du lieu courant', () => {
    const objets = [objLa('pomme', 1), objLa('épée', 2), objLa('clé', 1)];
    const ici = PositionsUtils.getObjetsQuiSeTrouventLa('ici', objets, 1);
    expect(ici.map(o => o.nom)).toEqual(['pomme', 'clé']);
  });

  it('[F087-T011] objet sans position → ignoré', () => {
    const objets = [objLa('pomme', 1), { nom: 'fantôme' } as unknown as Objet];
    const ici = PositionsUtils.getObjetsQuiSeTrouventLa('ici', objets, 1);
    expect(ici.map(o => o.nom)).toEqual(['pomme']);
  });

  it('[F087-T012] aucun objet dans le lieu courant → tableau vide', () => {
    const ici = PositionsUtils.getObjetsQuiSeTrouventLa('ici', [objLa('pomme', 2)], 1);
    expect(ici).toEqual([]);
  });

  it('[F087-T013] position autre que « ici » → tableau vide (non géré)', () => {
    const ici = PositionsUtils.getObjetsQuiSeTrouventLa('nord', [objLa('pomme', 1)], 1);
    expect(ici).toEqual([]);
  });
});
