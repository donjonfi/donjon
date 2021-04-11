import { ExprReg } from "../utils/compilation/expr-reg";

describe('Epressions régulières − Définition des éléments du monde', () => {

  // VERBE À L’INFINITIF
  // - verbe(1)

  it('Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('Verbe infinitif :  « partir »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("partir");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("partir"); // infinitif
  });

  it('Verbe infinitif :  « boire »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("boire");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("boire"); // infinitif
  });

  it('Verbe infinitif :  « marcher »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("marcher");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("marcher"); // infinitif
  });

  it('Verbe infinitif :  « se brosser »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("se brosser");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("se brosser"); // infinitif
  });

  it('Verbe infinitif :  « s’égosiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s’égosiller");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("s’égosiller"); // infinitif
  })

  it('Verbe infinitif :  « s\'éveiller »', () => {
    const result = ExprReg.xVerbeInfinitif.exec("s'éveiller");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("s'éveiller"); // infinitif
  });

  it('Verbe infinitif : « oiseau » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("oiseau");
    expect(result).toEqual(null);
  });

  it('Verbe infinitif : « un boucher » (💥)', () => {
    const result = ExprReg.xVerbeInfinitif.exec("un boucher");
    expect(result).toEqual(null);
  });

  // GROUPE NOMINAL
  // - Déterminant(1), Nom(2), Épithète(3)

  it('Groupe Nominal :  « La pomme de terre pourrie »', () => {
    const result = ExprReg.xGroupeNominal.exec("La pomme de terre pourrie");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La "); // déterminant
    expect(result[2]).toEqual("pomme de terre"); // nom
    expect(result[3]).toEqual("pourrie"); // attribut
  });

  it('Groupe Nominal :  « la canne à pèche »', () => {
    const result = ExprReg.xGroupeNominal.exec("la canne à pèche");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la "); // déterminant
    expect(result[2]).toEqual("canne à pèche"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal :  « le chapeau gris »', () => {
    const result = ExprReg.xGroupeNominal.exec("le chapeau gris");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le "); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toEqual("gris"); // attribut
  });


  it('Groupe Nominal :  « chapeau »', () => {
    const result = ExprReg.xGroupeNominal.exec("chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal :  « le chapeau »', () => {
    const result = ExprReg.xGroupeNominal.exec("le chapeau");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("le "); // déterminant
    expect(result[2]).toEqual("chapeau"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

  it('Groupe Nominal :  « l’arracheur de dents dorées »', () => {
    const result = ExprReg.xGroupeNominal.exec("l’arracheur de dents dorées");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("l’"); // déterminant
    expect(result[2]).toEqual("arracheur de dents"); // nom
    expect(result[3]).toEqual("dorées"); // attribut
  });

  it('Groupe Nominal :  « Bruxelles-Capitale »', () => {
    const result = ExprReg.xGroupeNominal.exec("Bruxelles-Capitale");
    expect(result).not.toEqual(null);
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("Bruxelles-Capitale"); // nom
    expect(result[3]).toBeUndefined(); // attribut
  });

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
  });


  // TYPE UTILISATEUR > NOUVEAU TYPE
  // - un/une(1) nouveauType(2) est un/une typeParent(3) {attributs}(4)

  it('Nouveau type :  « Un meuble est un objet »', () => {
    const result = ExprReg.xNouveauType.exec("Un meuble est un objet");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Un"); // déterminant
    expect(result[2]).toEqual("meuble"); // nouveau type
    expect(result[3]).toEqual("objet"); // type parent
    expect(result[4]).toBeUndefined(); // attribut(s)
  })

  it('Nouveau type :  « Un fruit est un objet mangeable, léger et périssable »', () => {
    const result = ExprReg.xNouveauType.exec("Un fruit est un objet mangeable, léger et périssable");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Un"); // déterminant
    expect(result[2]).toEqual("fruit"); // nouveau type
    expect(result[3]).toEqual("objet"); // type parent
    expect(result[4]).toEqual("mangeable, léger et périssable"); // attribut(s)
  });

  it('Nouveau type :  « un lutin est une personne bavarde »', () => {
    const result = ExprReg.xNouveauType.exec("un lutin est une personne bavarde");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("un"); // déterminant
    expect(result[2]).toEqual("lutin"); // nouveau type
    expect(result[3]).toEqual("personne"); // type parent
    expect(result[4]).toEqual("bavarde"); // attribut(s)
  });

  
  it('Nouveau type :  « le lutin est une personne bavarde » (💥)', () => {
    const result = ExprReg.xNouveauType.exec("le lutin est une personne bavarde");
    expect(result).toEqual(null);
  });

  it('Nouveau type :  « Un meuble est fixé » (💥)', () => {
    const result = ExprReg.xNouveauType.exec("Un meuble est fixé");
    expect(result).toEqual(null);
  });

  // TYPE UTILISATEUR > PRÉCISION TYPE
  // - un/une(1) type(2) est {attributs}(3)

  it('Précision type :  « Un meuble est fixé »', () => {
    const result = ExprReg.xPrecisionType.exec("Un meuble est fixé");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Un"); // déterminant
    expect(result[2]).toEqual("meuble"); // nouveau type
    expect(result[3]).toEqual("fixé"); // attribut(s)
  });

  it('Précision type :  « un chien est affectueux et poilu »', () => {
    const result = ExprReg.xPrecisionType.exec("un chien est affectueux et poilu");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("un"); // déterminant
    expect(result[2]).toEqual("chien"); // nouveau type
    expect(result[3]).toEqual("affectueux et poilu"); // attribut(s)
  });

  it('Précision type :  « Un lutin est bavard, peureux et farceur »', () => {
    const result = ExprReg.xPrecisionType.exec("Un lutin est bavard, peureux et farceur");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Un"); // déterminant
    expect(result[2]).toEqual("lutin"); // nouveau type
    expect(result[3]).toEqual("bavard, peureux et farceur"); // attribut(s)
  });

  it('Précision type :  « Un meuble est un objet » (💥)', () => {
    const result = ExprReg.xPrecisionType.exec("Un meuble est un objet");
    expect(result).toEqual(null);
  });

  it('Précision type :  « Un fruit est un objet mangeable, léger et périssable » (💥)', () => {
    const result = ExprReg.xPrecisionType.exec("Un fruit est un objet mangeable, léger et périssable");
    expect(result).toEqual(null);
  });

  it('Précision type :  « Un lutin est une personne bavarde » (💥)', () => {
    const result = ExprReg.xPrecisionType.exec("Un lutin est une personne bavarde");
    expect(result).toEqual(null);
  });

  it('Précision type :  « Le meuble est fixé » (💥)', () => {
    const result = ExprReg.xPrecisionType.exec("Le meuble est fixé");
    expect(result).toEqual(null);
  });

});