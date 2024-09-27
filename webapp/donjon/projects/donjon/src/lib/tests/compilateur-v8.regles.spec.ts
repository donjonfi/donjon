import { TypeRegle } from "../models/compilateur/type-regle";
import { TestUtils } from "../utils/test-utils";

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
  
  });