import { CompilateurV8, EEtatsBase } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

describe('Actions mettre / enlever (vêtements)', () => {

  // ============================================================
  //  METTRE — attributs ajoutés
  // ============================================================

  it('[F001-T001] mettre une tunique enfilable → enfilé + porté', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'La tunique est un objet enfilable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const tunique = ctx.jeu.objets.find(o => o.nom === 'tunique');
    expect(tunique).toBeTruthy();

    ctx.com.executerCommande('mettre la tunique', false);

    expect(ctx.jeu.etats.possedeEtatElement(tunique, EEtatsBase.enfile, ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(tunique, EEtatsBase.porte, ctx.eju)).toBeTrue();
  });

  it('[F001-T002] mettre des bottes chaussables → chaussé + porté', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'Les bottes sont un objet chaussable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const bottes = ctx.jeu.objets.find(o => o.nom === 'bottes');
    expect(bottes).toBeTruthy();

    ctx.com.executerCommande('mettre les bottes', false);

    expect(ctx.jeu.etats.possedeEtatElement(bottes, EEtatsBase.chausse, ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(bottes, EEtatsBase.porte, ctx.eju)).toBeTrue();
  });

  it('[F001-T003] mettre un bouclier équipable → équipé + porté', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'Le bouclier est un objet équipable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const bouclier = ctx.jeu.objets.find(o => o.nom === 'bouclier');
    expect(bouclier).toBeTruthy();

    ctx.com.executerCommande('mettre le bouclier', false);

    expect(ctx.jeu.etats.possedeEtatElement(bouclier, EEtatsBase.equipe, ctx.eju)).toBeTrue();
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, EEtatsBase.porte, ctx.eju)).toBeTrue();
  });

  // ============================================================
  //  ENLEVER — attributs retirés (issue #222)
  // ============================================================

  it('[F001-T004] enlever une tunique enfilée → enfilé + porté retirés', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'La tunique est un objet enfilable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const tunique = ctx.jeu.objets.find(o => o.nom === 'tunique');
    ctx.com.executerCommande('mettre la tunique', false);
    expect(ctx.jeu.etats.possedeEtatElement(tunique, EEtatsBase.enfile, ctx.eju)).toBeTrue();

    const sortieEnlever = ctx.com.executerCommande('enlever la tunique', false);

    expect(ctx.jeu.etats.possedeEtatElement(tunique, EEtatsBase.enfile, ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(tunique, EEtatsBase.porte, ctx.eju)).toBeFalse();
    expect(sortieEnlever.sortie).toContain('Vous ne portez plus la tunique.');
  });

  it('[F001-T005] enlever des bottes chaussées → chaussé + porté retirés', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'Les bottes sont un objet chaussable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const bottes = ctx.jeu.objets.find(o => o.nom === 'bottes');
    ctx.com.executerCommande('mettre les bottes', false);
    expect(ctx.jeu.etats.possedeEtatElement(bottes, EEtatsBase.chausse, ctx.eju)).toBeTrue();

    ctx.com.executerCommande('enlever les bottes', false);

    expect(ctx.jeu.etats.possedeEtatElement(bottes, EEtatsBase.chausse, ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(bottes, EEtatsBase.porte, ctx.eju)).toBeFalse();
  });

  it('[F001-T006] enlever un bouclier équipé → équipé + porté retirés', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'Le bouclier est un objet équipable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const bouclier = ctx.jeu.objets.find(o => o.nom === 'bouclier');
    ctx.com.executerCommande('mettre le bouclier', false);
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, EEtatsBase.equipe, ctx.eju)).toBeTrue();

    ctx.com.executerCommande('enlever le bouclier', false);

    expect(ctx.jeu.etats.possedeEtatElement(bouclier, EEtatsBase.equipe, ctx.eju)).toBeFalse();
    expect(ctx.jeu.etats.possedeEtatElement(bouclier, EEtatsBase.porte, ctx.eju)).toBeFalse();
  });

  // ============================================================
  //  ENLEVER — refus si pas porté (issue #222)
  // ============================================================

  it('[F001-T007] enlever une tunique non portée → refus', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'La tunique est un objet enfilable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const sortie = ctx.com.executerCommande('enlever la tunique', false);

    expect(sortie.sortie).toContain('Vous ne portez pas la tunique.');
  });

  it('[F001-T008] enlever des bottes non portées → refus', () => {
    const scenario =
      'La chambre est un lieu. ' +
      'Les bottes sont un objet chaussable dans la chambre. ' +
      '';
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const sortie = ctx.com.executerCommande('enlever les bottes', false);

    expect(sortie.sortie).toContain('Vous ne portez pas les bottes.');
  });

});
