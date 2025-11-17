import { ClassesRacines } from "donjon";
import { TypeRegle } from "../models/compilateur/type-regle";
import { TestUtils } from "../utils/test-utils";

const scenarioApresManger = `        
La cuisine est un lieu.
Le chocolat est un objet mangeable ici.
Le bonbon est un objet mangeable ici.

-- changer le retour de la commande manger
règle après manger un objet:
  dire "Miam ! C’était bien bon !".
fin règle

règle après manger le chocolat:
  dire "J’en ai mis partout !".
fin règle
  `;

describe('Règle', () => {

  it('avant commencer le jeu', () => {

    const scenario = '' +
      'règle avant commencer le jeu: ' +
      '  dire "C’est le début !". ' +
      'fin règle' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.auditeurs).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].type).toBe(TypeRegle.avant);
    expect(ctx.jeu.auditeurs[0].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].evenements[0].infinitif).toBe("commencer");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCeci).toBeTrue();
    expect(ctx.jeu.auditeurs[0].evenements[0].ceci).toBe("jeu");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCela).toBeFalse();
    expect(ctx.jeu.auditeurs[0].instructions[0].instruction.infinitif).toBe('dire');
  });


  it('ouvrir la porte avec la clé (existent)', () => {

    const scenario = '' +
      'l’arc à flèche est un objet. ' +
      'règle après ouvrir la porte avec la clé: ' +
      '  changer la porte est déverrouillée. ' +
      'fin règle' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.auditeurs).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].type).toBe(TypeRegle.apres);
    expect(ctx.jeu.auditeurs[0].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].evenements[0].infinitif).toBe("ouvrir");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCeci).toBeTrue();
    expect(ctx.jeu.auditeurs[0].evenements[0].ceci).toBe("porte");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCela).toBeTrue();
    expect(ctx.jeu.auditeurs[0].evenements[0].cela).toBe("cle");
    expect(ctx.jeu.auditeurs[0].instructions[0].instruction.infinitif).toBe('changer');
  });

  it('près prendre l’arc à flèche (existe)', () => {

    const scenario = '' +
      'l’arc à flèche est un objet. ' +
      'règle après prendre l’arc à flèche: ' +
      '  changer le joueur possède l’arc à flèche. ' +
      'fin règle' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.auditeurs).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].type).toBe(TypeRegle.apres);
    expect(ctx.jeu.auditeurs[0].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].evenements[0].infinitif).toBe("prendre");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCeci).toBeTrue();
    expect(ctx.jeu.auditeurs[0].evenements[0].ceci).toBe("arc a fleche");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCela).toBeFalse();
    expect(ctx.jeu.auditeurs[0].instructions[0].instruction.infinitif).toBe('changer');
  });

  it('près prendre l’arc à flèche (existe pas)', () => {

    const scenario = '' +
      'règle après prendre l’arc à flèche: ' +
      '  changer le joueur possède l’arc à flèche. ' +
      'fin règle' +
      '';

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);

    expect(ctx.jeu.auditeurs).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].type).toBe(TypeRegle.apres);
    expect(ctx.jeu.auditeurs[0].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].evenements[0].infinitif).toBe("prendre");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCeci).toBeFalse();
    expect(ctx.jeu.auditeurs[0].evenements[0].isCela).toBeFalse();
  });

  it('après manger', () => {

    
    const ctx = TestUtils.genererEtCommencerLeJeu(scenarioApresManger);

    expect(ctx.jeu.auditeurs).toHaveSize(2);

    expect(ctx.jeu.auditeurs[0].type).toBe(TypeRegle.apres);
    expect(ctx.jeu.auditeurs[0].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[0].evenements[0].infinitif).toBe("manger");
    expect(ctx.jeu.auditeurs[0].evenements[0].isCeci).toBeTrue();
    expect(ctx.jeu.auditeurs[0].evenements[0].ceci).toBe("un objet");
    expect(ctx.jeu.auditeurs[0].evenements[0].classeCeci).toBe(ClassesRacines.Objet);
    expect(ctx.jeu.auditeurs[0].evenements[0].isCela).toBeFalse();
    expect(ctx.jeu.auditeurs[0].instructions[0].instruction.infinitif).toBe('dire');

    expect(ctx.jeu.auditeurs[1].type).toBe(TypeRegle.apres);
    expect(ctx.jeu.auditeurs[1].evenements).toHaveSize(1);
    expect(ctx.jeu.auditeurs[1].evenements[0].infinitif).toBe("manger");
    expect(ctx.jeu.auditeurs[1].evenements[0].isCeci).toBeTrue();
    expect(ctx.jeu.auditeurs[1].evenements[0].ceci).toBe("chocolat");
    expect(ctx.jeu.auditeurs[1].evenements[0].classeCeci).toBe(ClassesRacines.Objet);
    expect(ctx.jeu.auditeurs[1].evenements[0].isCela).toBeFalse();
    expect(ctx.jeu.auditeurs[1].instructions[0].instruction.infinitif).toBe('dire');
  });

});