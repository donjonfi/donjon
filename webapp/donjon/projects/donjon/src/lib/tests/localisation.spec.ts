// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F113] LOCALISATION (modèle) — getLocalisation + toString (PUR)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// models/jeu/localisation.ts (br33) n'avait AUCUN test direct. On verrouille la table statique
// ELocalisation → instance Localisation (12 directions + default throw) et le toString().
// Chaque instance porte le bon déterminant et le bon nom (élision pour est/ouest/intérieur/extérieur).

import { Localisation, ELocalisation } from "../models/jeu/localisation";

describe('[F113] Localisation.getLocalisation', () => {

  // table exhaustive : id → instance + nom attendu (dérivé de la sémantique des directions)
  const cas: [ELocalisation, Localisation, string][] = [
    [ELocalisation.nord, Localisation.Nord, 'nord'],
    [ELocalisation.nord_est, Localisation.NordEst, 'nord-est'],
    [ELocalisation.est, Localisation.Est, 'est'],
    [ELocalisation.sud_est, Localisation.SudEst, 'sud-est'],
    [ELocalisation.sud, Localisation.Sud, 'sud'],
    [ELocalisation.sud_ouest, Localisation.SudOuest, 'sud-ouest'],
    [ELocalisation.ouest, Localisation.Ouest, 'ouest'],
    [ELocalisation.nord_ouest, Localisation.NordOuest, 'nord-ouest'],
    [ELocalisation.haut, Localisation.Haut, 'haut'],
    [ELocalisation.bas, Localisation.Bas, 'bas'],
    [ELocalisation.interieur, Localisation.Interieur, 'intérieur'],
    [ELocalisation.exterieur, Localisation.Exterieur, 'extérieur'],
  ];

  cas.forEach(([id, instance, nom], i) => {
    const num = String(i + 1).padStart(3, '0');
    it(`[F113-T${num}] ${nom} → instance singleton + nom correct`, () => {
      const loc = Localisation.getLocalisation(id);
      expect(loc).toBe(instance);          // même singleton statique
      expect(loc.id).toBe(id);
      expect(loc.intitule.nom).toBe(nom);
    });
  });

  it('[F113-T013] id inconnu → throw (branche default)', () => {
    expect(() => Localisation.getLocalisation(ELocalisation.inconnu)).toThrowError(/Localisation inconnue/);
  });

});

describe('[F113] Localisation déterminants (élision)', () => {

  it('[F113-T014] déterminant « le » pour les directions consonne-initiale', () => {
    expect(Localisation.Nord.intitule.determinant).toBe('le ');
    expect(Localisation.Sud.intitule.determinant).toBe('le ');
    expect(Localisation.Haut.intitule.determinant).toBe('le ');
    expect(Localisation.Bas.intitule.determinant).toBe('le ');
  });

  it("[F113-T015] déterminant élidé « l'» pour est/ouest/intérieur/extérieur (voyelle initiale)", () => {
    expect(Localisation.Est.intitule.determinant).toBe("l'");
    expect(Localisation.Ouest.intitule.determinant).toBe("l'");
    expect(Localisation.Interieur.intitule.determinant).toBe("l'");
    expect(Localisation.Exterieur.intitule.determinant).toBe("l'");
  });

});

describe('[F113] Localisation.toString', () => {

  it('[F113-T016] toString() renvoie le nom (sans déterminant)', () => {
    expect(Localisation.Nord.toString()).toBe('nord');
    expect(Localisation.Est.toString()).toBe('est');
    expect(Localisation.NordOuest.toString()).toBe('nord-ouest');
  });

});
