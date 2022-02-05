import { PhraseUtils } from "../../public-api";

describe('ObtenirLesCommandesPossibles', () => {

  it('commande « sauter »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('sauter');
    expect(resultats.length).toBe(1); // nombre de candidats attendus
    expect(resultats[0].els.infinitif).toEqual('sauter');
    expect(resultats[0].els.preposition0).toBeUndefined();
    expect(resultats[0].els.sujet).toBeUndefined();
  });

  it('commande « donner couteau à fromage »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('donner couteau à fromage');
    expect(resultats.length).toBe(2); // nombre de candidats attendus

    expect(resultats[0].els.infinitif).toEqual('donner');
    expect(resultats[0].els.preposition0).toBeUndefined();
    expect(resultats[0].els.sujet.determinant).toBeUndefined();
    expect(resultats[0].els.sujet.nom).toEqual('couteau à fromage');
    expect(resultats[0].els.preposition1).toBeUndefined();
    expect(resultats[0].els.sujetComplement1).toBeUndefined();
  
    expect(resultats[1].els.infinitif).toEqual('donner');
    expect(resultats[1].els.preposition0).toBeUndefined();
    expect(resultats[1].els.sujet.determinant).toBeUndefined();
    expect(resultats[1].els.sujet.nom).toEqual('couteau');
    expect(resultats[1].els.preposition1).toEqual('à');
    expect(resultats[1].els.sujetComplement1.nom).toEqual('fromage');
  });

  it('commande « poser une question »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('poser une question');
    expect(resultats.length).toBe(1);
    expect(resultats[0].els.infinitif).toEqual('poser');
    expect(resultats[0].els.preposition0).toBeFalsy()
    expect(resultats[0].els.sujet.determinant).toEqual('une ');
    expect(resultats[0].els.sujet.nom).toEqual('question');
  });


  it('commande « commander à manger »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('commander à manger');
    expect(resultats.length).toBe(1);
    expect(resultats[0].els.infinitif).toEqual('commander');
    expect(resultats[0].els.preposition0).toEqual('à');
    expect(resultats[0].els.sujet.determinant).toBeFalsy();
    expect(resultats[0].els.sujet.nom).toEqual('manger');
  });

  it('commande « prendre une pomme »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('prendre une pomme');
    expect(resultats.length).toBe(1);
    expect(resultats[0].els.infinitif).toEqual('prendre');
    expect(resultats[0].els.preposition0).toBeFalsy()
    expect(resultats[0].els.sujet.determinant).toEqual('une ');
    expect(resultats[0].els.sujet.nom).toEqual('pomme');
  });

  it('commande « sauter sur la table »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('sauter sur la table');
    expect(resultats.length).toBe(1);
    expect(resultats[0].els.infinitif).toEqual('sauter');
    expect(resultats[0].els.preposition0).toEqual('sur');
    expect(resultats[0].els.sujet.determinant).toEqual('la ');
    expect(resultats[0].els.sujet.nom).toEqual('table');
  });

  it('commande « parler avec la table de papa »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('parler avec la table de papa');
    expect(resultats.length).toBe(2);

    expect(resultats[0].els.infinitif).toEqual('parler');
    expect(resultats[0].els.preposition0).toEqual('avec');
    expect(resultats[0].els.sujet.determinant).toEqual('la ');
    expect(resultats[0].els.sujet.nom).toEqual('table de papa');
    expect(resultats[0].els.preposition1).toBeUndefined();
    expect(resultats[0].els.sujetComplement1).toBeUndefined();
    
    expect(resultats[1].els.infinitif).toEqual('parler');
    expect(resultats[1].els.preposition0).toEqual('avec');
    expect(resultats[1].els.sujet.determinant).toEqual('la ');
    expect(resultats[1].els.sujet.nom).toEqual('table');
    expect(resultats[1].els.preposition1).toEqual('de');
    expect(resultats[1].els.sujetComplement1.nom).toEqual('papa');
  });

  it('commande « parler avec papa de la table de papa »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('parler avec papa de la table de papa');
    expect(resultats.length).toBe(2);

    expect(resultats[0].els.infinitif).toEqual('parler');
    expect(resultats[0].els.preposition0).toEqual('avec');
    expect(resultats[0].els.sujet.determinant).toBeUndefined();
    expect(resultats[0].els.sujet.nom).toEqual('papa');
    expect(resultats[0].els.preposition1).toEqual('de');
    expect(resultats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(resultats[0].els.sujetComplement1.nom).toEqual('table de papa');
    
    expect(resultats[1].els.infinitif).toEqual('parler');
    expect(resultats[1].els.preposition0).toEqual('avec');
    expect(resultats[1].els.sujet.determinant).toBeUndefined();
    expect(resultats[1].els.sujet.nom).toEqual('papa de la table');
    expect(resultats[1].els.preposition1).toEqual('de');
    expect(resultats[1].els.sujetComplement1.determinant).toBeUndefined()
    expect(resultats[1].els.sujetComplement1.nom).toEqual('papa');
  });

  it('commande « parler avec la salle de classe de la salle de bain »', () => {
    const resultats = PhraseUtils.obtenirLesCommandesPossibles('parler avec la salle de classe de la salle de bain');
    expect(resultats.length).toBe(1);

    expect(resultats[0].els.infinitif).toEqual('parler');
    expect(resultats[0].els.preposition0).toEqual('avec');
    expect(resultats[0].els.sujet.determinant).toEqual('la ');
    expect(resultats[0].els.sujet.nom).toEqual('salle de classe');
    expect(resultats[0].els.preposition1).toEqual('de');
    expect(resultats[0].els.sujetComplement1.determinant).toEqual('la ');
    expect(resultats[0].els.sujetComplement1.nom).toEqual('salle de bain');
  });

});
