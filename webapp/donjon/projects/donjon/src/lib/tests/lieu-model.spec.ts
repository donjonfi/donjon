// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F121] LIEU (modèle) — ajouterVoisin : ajout + déduplication
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// `Lieu.ajouterVoisin(v)` (models/jeu/lieu.ts) n’ajoute un voisin que s’il n’existe pas déjà.
// L’identité d’un voisin = triplet (id, localisation, type). Deux voisins ne sont des doublons
// que si les TROIS coïncident ; sinon ils coexistent dans la liste `voisins`.

import { Lieu } from "../models/jeu/lieu";
import { Voisin } from "../models/jeu/voisin";
import { ELocalisation } from "../models/jeu/localisation";
import { EClasseRacine } from "../models/commun/constantes";

/** Construit un Lieu nu (intitulé/titre indifférents pour ces tests). */
function lieuNu(): Lieu {
  return new Lieu(1, "salle", null, "Salle");
}

describe("[F121] Lieu.ajouterVoisin", () => {

  it("[F121-T001] un Lieu neuf n’a aucun voisin", () => {
    expect(lieuNu().voisins.length).toBe(0);
  });

  it("[F121-T002] ajoute un voisin → présent une fois", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    expect(lieu.voisins.length).toBe(1);
    expect(lieu.voisins[0].id).toBe(2);
  });

  it("[F121-T003] doublon exact (id+localisation+type identiques) → ignoré", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    expect(lieu.voisins.length).toBe(1);
  });

  it("[F121-T004] même id+localisation mais type différent → ajouté (pas un doublon)", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.porte, ELocalisation.nord));
    expect(lieu.voisins.length).toBe(2);
  });

  it("[F121-T005] même id+type mais localisation différente → ajouté", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.sud));
    expect(lieu.voisins.length).toBe(2);
  });

  it("[F121-T006] id différent (même localisation+type) → ajouté", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.est));
    lieu.ajouterVoisin(new Voisin(3, EClasseRacine.lieu, ELocalisation.est));
    expect(lieu.voisins.length).toBe(2);
  });

  it("[F121-T007] plusieurs ajouts, un seul doublon parmi eux", () => {
    const lieu = lieuNu();
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord));
    lieu.ajouterVoisin(new Voisin(3, EClasseRacine.lieu, ELocalisation.sud));
    lieu.ajouterVoisin(new Voisin(2, EClasseRacine.lieu, ELocalisation.nord)); // doublon de T-1er
    lieu.ajouterVoisin(new Voisin(4, EClasseRacine.porte, ELocalisation.est));
    expect(lieu.voisins.length).toBe(3);
    expect(lieu.voisins.map(v => v.id)).toEqual([2, 3, 4]);
  });

});
