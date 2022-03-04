import { ExprReg } from "../utils/compilation/expr-reg";

// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [1/2] EXPRESSIONS RÉGULIÈRES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV


describe('Epressions régulières − Définition position d’un élément', () => {

  it('def position : « Le chat se trouve sur le divan »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Le chat se trouve sur le divan');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Le chat"); // élément
    expect(result[2]).toEqual("sur le divan"); // position
  });
  
  it('def position : « Les haricots sauvages se trouvent ici »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Les haricots sauvages se trouvent ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Les haricots sauvages"); // élément
    expect(result[2]).toEqual("ici"); // position
  });
  
  it('def position : « Bob se trouve à l’intérieur de la cabane hurlante »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Bob se trouve à l’intérieur de la cabane hurlante');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Bob"); // élément
    expect(result[2]).toEqual("à l’intérieur de la cabane hurlante"); // position
  });
  
  it('def position : « La forêt se trouve au nord du chemin et au sud de l’abri »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('La forêt se trouve au nord du chemin et au sud de l’abri');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("La forêt"); // élément
    expect(result[2]).toEqual("au nord du chemin et au sud de l’abri"); // position
  });
  
  it('def position : « Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Par rapport à la cabane, la forêt"); // élément
    expect(result[2]).toEqual("au nord, au sud et à l’ouest"); // position
  });
  
  it('def position : « Il se trouve ici »', () => {
    const result = ExprReg.xDefinirPositionElement.exec('Il se trouve ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("Il"); // élément
    expect(result[2]).toEqual("ici"); // position
  });
  
  
});

describe('Epressions régulières − Définition position d’un élément', () => {

  it('def position : « sur le divan »', () => {
    const result = ExprReg.xPositionRelative.exec('sur le divan');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("sur le "); // position suivie
    expect(result[2]).toEqual("divan"); // autre élément
    expect(result[3]).toBeFalsy(); // position solo
  });
  
  it('def position : « ici »', () => {
    const result = ExprReg.xPositionRelative.exec('ici');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("ici"); // position solo
  });
    
  it('def position : « dessus »', () => {
    const result = ExprReg.xPositionRelative.exec('dessus');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("dessus"); // position solo
  });

  it('def position : « à l’intérieur »', () => {
    const result = ExprReg.xPositionRelative.exec('à l’intérieur');
    expect(result).not.toEqual(null);
    expect(result[1]).toBeFalsy(); // position suivie
    expect(result[2]).toBeFalsy(); // autre élément
    expect(result[3]).toEqual("à l’intérieur"); // position solo
  });

  it('def position : « à l’intérieur de la cabane hurlante »', () => {
    const result = ExprReg.xPositionRelative.exec('à l’intérieur de la cabane hurlante');
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("à l’intérieur de la "); // position suivie
    expect(result[2]).toEqual("cabane hurlante"); // autre élément
    expect(result[3]).toBeFalsy(); // position solo
  });
  
  it('def position : « au nord du chemin et au sud de l’abri » (💥)', () => {
    const result = ExprReg.xPositionRelative.exec('La forêt se trouve au nord du chemin et au sud de l’abri');
    expect(result).toEqual(null);
  });
  
  it('def position : « au nord, au sud et à l’ouest » (💥)', () => {
    const result = ExprReg.xPositionRelative.exec('Par rapport à la cabane, la forêt se trouve au nord, au sud et à l’ouest');
    expect(result).toEqual(null);
  });
  
});