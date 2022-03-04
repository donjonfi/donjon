import { Analyseur } from "../utils/compilation/analyseur/analyseur";
import { AnalyseurElementPosition } from "../utils/compilation/analyseur/analyseur.element.position";
import { AnalyseurElementSimple } from "../utils/compilation/analyseur/analyseur.element.simple";
import { AnalyseurUtils } from "../utils/compilation/analyseur/analyseur.utils";
import { Compilateur } from "../utils/compilation/compilateur";
import { ContexteAnalyse } from "../models/compilateur/contexte-analyse";
import { EClasseRacine } from "../models/commun/constantes";
import { ExprReg } from "../utils/compilation/expr-reg";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";
import { PositionSujetString } from "../models/compilateur/position-sujet";
import { ResultatAnalysePhrase } from "../models/compilateur/resultat-analyse-phrase";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Epressions régulières − Groupes nominaux', () => {

  // GROUPE NOMINAL
  // - Déterminant(1), Nom(2), Épithète(3)

  it('Groupe Nominal : « La pomme de terre pourrie »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("La pomme de terre pourrie");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La "); // déterminant
    expect(result[2]).toEqual("pomme de terre"); // nom
    expect(result[3]).toEqual("pourrie"); // attribut
  });

  it('Groupe Nominal : « la canne à pèche »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("la canne à pèche");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la "); // déterminant
    expect(result[2]).toEqual("canne à pèche"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal : « le chapeau gris »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("le chapeau gris");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le "); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toEqual("gris"); // attribut
  });


  it('Groupe Nominal : « chapeau »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal : « le chapeau »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("le chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le "); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal : « l’arracheur de dents dorées »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("l’arracheur de dents dorées");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("l’"); // déterminant
    expect(result[2]).toEqual("arracheur de dents"); // nom
    expect(result[3]).toEqual("dorées"); // attribut
  });

  it('Groupe Nominal : « Bruxelles-Capitale »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("Bruxelles-Capitale");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("Bruxelles-Capitale"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal : « lettre »', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("lettre");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("lettre"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Élément générique simple: « 20 tomates » ', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("20 tomates");
    expect(result).toEqual(null);
  });

  it('Élément générique simple: « une tomate » ', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("une tomate");
    expect(result).toEqual(null);
  });

  it('Élément générique simple: « des pièces » ', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec("des pièces");
    expect(result).toEqual(null);
  });

  it('Groupe Nominal : « "texte" »  (💥)', () => {
    const result = ExprReg.xGroupeNominalArticleDefini.exec('"texte"');
    expect(result).toEqual(null);
  });


});

describe('Epressions régulières − Définition des éléments', () => {

  // ÉLÉMENT GÉNÉRIQUE SIMPLE
  // - Déterminant(1), Nom(2), Épithète(3), Féminin et autre forme(4), Classe(5), Attribut(6).


  it('Élément générique simple: « Paris est un lieu »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("Paris est un lieu");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("Paris"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("lieu"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  });


  it('Élément générique simple: « si ceci est un élément, dire "bla bla" »  (💥)', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec('si ceci est un élément, dire "bla bla"');
    expect(result).toEqual(null);
  });


  it('Élément générique simple: « La table basse est un objet »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("La table basse est un objet");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La "); // déterminant
    expect(result[2]).toEqual("table"); // nom
    expect(result[3]).toEqual("basse"); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("objet"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  })

  it('Élément générique simple: « Le champignon des bois odorant (champignons des bois) est un légume mangeable »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("Le champignon des bois odorant (champignons des bois) est un légume mangeable");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le "); // déterminant
    expect(result[2]).toEqual("champignon des bois"); // nom
    expect(result[3]).toEqual("odorant"); // épithète
    expect(result[4]).toEqual("(champignons des bois)"); // féminin et autre forme
    expect(result[5]).toEqual("légume"); // classe
    expect(result[6]).toEqual("mangeable"); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toBeUndefined(); // ici
  })

  it('Élément générique simple: « L\'apprentie sorcière (f) est une personne fatiguée »', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("L'apprentie sorcière (f) est une personne fatiguée");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("L'"); // déterminant
    expect(result[2]).toEqual("apprentie"); // nom
    expect(result[3]).toEqual("sorcière"); // épithète
    expect(result[4]).toEqual("(f)"); // féminin et autre forme
    expect(result[5]).toEqual("personne"); // classe
    expect(result[6]).toEqual("fatiguée"); // attribut
  })

  it('Élément générique simple: « Ce sont des fruits » (💥)', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("Ce sont des fruits");
    expect(result).toEqual(null);
  })

  it('Élément générique simple: « Le bucheron est une personne ici » (💥)', () => {
    const result = ExprReg.xDefinitionElementAvecType.exec("Le bucheron est une personne ici");
    expect(result).toEqual(null);
  })

  // ÉLÉMENT GÉNÉRIQUE POSITIONNÉ PAR RAPPORT À UN COMPLÉMENT
  // => determinant(1), nom(2), épithète(3) féminin et autre forme?(4), type(5), attributs(6), position(7), complément(8)

  it('Élément générique positionné: « Les torches en bois enflamées sont des objets maudits dans le jardin »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("Les torches en bois enflamées sont des objets maudits dans le jardin");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Les "); // déterminant
    expect(result[2]).toEqual("torches en bois"); // nom
    expect(result[3]).toEqual("enflamées"); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("objets"); // classe
    expect(result[6]).toEqual("maudits"); // attribut
    expect(result[7]).toEqual("dans le "); // position
    expect(result[8]).toEqual("jardin"); // complément
    expect(result[9]).toBeUndefined(); // ici

  });

  it('Élément générique positionné: « La pomme de terre (pommes de terre) est un légume pourri dans la grange encorcelée »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("La pomme de terre (pommes de terre) est un légume pourri dans la grange encorcelée");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La "); // déterminant
    expect(result[2]).toEqual("pomme de terre"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toEqual("(pommes de terre)"); // féminin et autre forme
    expect(result[5]).toEqual("légume"); // classe
    expect(result[6]).toEqual("pourri"); // attribut
    expect(result[7]).toEqual("dans la "); // position
    expect(result[8]).toEqual("grange encorcelée"); // complément
    expect(result[9]).toBeUndefined(); // ici

  });

  it('Élément générique positionné: « L’allée principale (f) est un lieu au sud du départ »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("L’allée principale (f) est un lieu au sud du départ");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("L’"); // déterminant
    expect(result[2]).toEqual("allée"); // nom
    expect(result[3]).toEqual("principale"); // épithète
    expect(result[4]).toEqual("(f)"); // féminin et autre forme
    expect(result[5]).toEqual("lieu"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toEqual("au sud du "); // position
    expect(result[8]).toEqual("départ"); // complément
    expect(result[9]).toBeUndefined(); // ici

  });

  it('Élément générique positionné: « La gare est un lieu dans Lisbonne »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("La gare est un lieu dans Lisbonne");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La "); // déterminant
    expect(result[2]).toEqual("gare"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("lieu"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toEqual("dans "); // position
    expect(result[8]).toEqual("Lisbonne"); // complément
    expect(result[9]).toBeUndefined(); // ici

  });

  it('Élément générique positionné: « Le bucheron est une personne ici »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("Le bucheron est une personne ici");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le "); // déterminant
    expect(result[2]).toEqual("bucheron"); // nom
    expect(result[3]).toBeUndefined(); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("personne"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toBeUndefined(); // position
    expect(result[8]).toBeUndefined(); // complément
    expect(result[9]).toEqual("ici"); // ici
  });

  it('Élément générique positionné: « Le cadenas bleu est dans le labo »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("Le cadenas bleu est dans le labo");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le "); // déterminant
    expect(result[2]).toEqual("cadenas"); // nom
    expect(result[3]).toEqual("bleu"); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toBeUndefined(); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toEqual("dans le "); // position
    expect(result[8]).toEqual("labo"); // complément
    expect(result[9]).toBeUndefined(); // ici
  });


  it('Élément générique positionné: « Le cadenas bleu est un objet dans le labo »', () => {
    const result = ExprReg.xPositionElementGeneriqueDefini.exec("Le cadenas bleu est un objet dans le labo");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le "); // déterminant
    expect(result[2]).toEqual("cadenas"); // nom
    expect(result[3]).toEqual("bleu"); // épithète
    expect(result[4]).toBeUndefined(); // féminin et autre forme
    expect(result[5]).toEqual("objet"); // classe
    expect(result[6]).toBeUndefined(); // attribut
    expect(result[7]).toEqual("dans le "); // position
    expect(result[8]).toEqual("labo"); // complément
    expect(result[9]).toBeUndefined(); // ici
  });

});

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [2/2] ANALYSEUR
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV

describe('Analyseur − Définition de nouveaux éléments', () => {

  // =========================================================
  // ÉLÉMENTS SANS POSITION
  // =========================================================

  it('Élément sans pos: « La cuisine est un lieu. »', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "La cuisine est un lieu."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    // tester l’analyse spécifique
    const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toEqual('la '); // déterminant
    expect(el.nom).toEqual('cuisine'); // nom
    expect(el.epithete).toBeUndefined(); // épithète pas défini
    expect(el.genre).toEqual(Genre.f); // genre
    expect(el.nombre).toEqual(Nombre.s); // nombre
    expect(el.quantite).toEqual(1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
    expect(el.positionString).toHaveSize(0); // position pas définie
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBeNull(); // desrcription pas définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(0); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('Élément sans pos: « Paris (f) est un lieu gris. "Vous êtes dans Paris.". »', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      'Paris (f) est un lieu gris. "Vous êtes dans Paris.".'
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(2); // 2 morceaux
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    // tester l’analyse spécifique
    const el = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toBeNull(); // déterminant
    expect(el.nom).toEqual('Paris'); // nom
    expect(el.epithete).toBeUndefined(); // épithète pas défini
    expect(el.genre).toEqual(Genre.f); // genre
    expect(el.nombre).toEqual(Nombre.s); // nombre
    expect(el.quantite).toEqual(1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
    expect(el.positionString).toHaveSize(0); // position pas définie
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBe('Vous êtes dans Paris.'); // desrcription définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(1); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('Élément sans pos: « La château du comte est un lieu au nord du village. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "La château du comte est un lieu au nord du village."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    // tester l’analyse spécifique
    const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
    expect(resultat).toBeNull(); // résultat PAS trouvé.
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('Élément sans pos: « Un lutin est une personne. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "Un lutin est une personne."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.type);
    // tester l’analyse spécifique
    const resultat = AnalyseurElementSimple.testerElementSansPosition(phrases[0], ctxAnalyse);
    expect(resultat).toBeNull(); // résultat PAS trouvé.
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });


  // =========================================================
  // ÉLÉMENT AVEC POSITION
  // =========================================================


  it('Élément pos: « Le château du comte est un lieu au nord du village. »', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "Le château du comte est un lieu au nord du village."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    // tester l’analyse spécifique
    const el = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toEqual('le '); // déterminant
    expect(el.nom).toEqual('château du comte'); // nom de l’élément
    expect(el.epithete).toBeUndefined(); // épithète pas défini
    expect(el.genre).toEqual(Genre.m); // genre
    expect(el.nombre).toEqual(Nombre.s); // nombre
    expect(el.quantite).toEqual(1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.lieu); // intitulé classe
    expect(el.positionString).toHaveSize(1); // position définie
    expect(el.positionString[0]).toEqual(new PositionSujetString('château du comte', 'village', 'au nord du ')); // position
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBeNull(); // desrcription pas définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(0); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('Élément pos: « Le cadenas bleu est un objet dans le labo. »', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "Le cadenas bleu est un objet dans le labo."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementAvecPosition);
    // tester l’analyse spécifique
    const el = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse); // analyser phrase
    expect(el).not.toBeNull(); // élément trouvé
    ctxAnalyse.dernierElementGenerique = el; // dernier élément trouvé
    expect(el.determinant).toEqual('le '); // déterminant
    expect(el.nom).toEqual('cadenas'); // nom de l’élément
    expect(el.epithete).toEqual('bleu'); // épithète pas défini
    expect(el.genre).toEqual(Genre.m); // genre
    expect(el.nombre).toEqual(Nombre.s); // nombre
    expect(el.quantite).toEqual(1); // quantité
    expect(el.classeIntitule).not.toBeNull(); // intitulé classe défini
    expect(el.classeIntitule).toEqual(EClasseRacine.objet); // intitulé classe
    expect(el.positionString).toHaveSize(1); // position définie
    expect(el.positionString[0]).toEqual(new PositionSujetString('cadenas bleu', 'labo', 'dans le ')); // position
    AnalyseurUtils.ajouterDescriptionDernierElement(phrases[0], ctxAnalyse); // ajout description éventuelle
    expect(el.description).toBeNull(); // desrcription pas définie
    expect(el.capacites).toHaveSize(0); // aucune capacité
    expect(el.attributs).toHaveSize(0); // aucun attribut
    expect(el.proprietes).toHaveSize(0); // aucune propriété
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });

  it('Élément pos: « Le château du comte est un lieu au nord de le village. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "Le château du comte est un lieu au nord de le village."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.aucun);
    // tester l’analyse spécifique
    const resultat = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse);
    expect(resultat).toBeNull(); // résultat PAS trouvé.
    expect(ctxAnalyse.erreurs).toHaveSize(1); // aucune erreur
  });


  it('Élément pos: « L’abri est un lieu sombre. » (💥)', () => {
    let ctxAnalyse = new ContexteAnalyse();
    let phrases = Compilateur.convertirCodeSourceEnPhrases(
      "L’abri est un lieu sombre."
    );
    expect(phrases).toHaveSize(1); // 1 phrase
    expect(phrases[0].phrase).toHaveSize(1); // 1 morceau
    // tester l’analyse complète
    expect(Analyseur.analyserPhrase(phrases[0], ctxAnalyse)).toBe(ResultatAnalysePhrase.elementSansPosition);
    // tester l’analyse spécifique
    const resultat = AnalyseurElementPosition.testerElementAvecPosition(phrases[0], ctxAnalyse);
    expect(resultat).toBeNull(); // résultat PAS trouvé.
    expect(ctxAnalyse.erreurs).toHaveSize(0); // aucune erreur

  });
});

