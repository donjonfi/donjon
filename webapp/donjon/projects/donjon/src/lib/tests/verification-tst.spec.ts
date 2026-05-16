import { ElementRef } from "@angular/core";

import { EtapeTest, FichierTest, LecteurComponent } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

describe('Fichier de vérification (.tst) — résolution commande joueur', () => {

  it('[F050-TR001] la commande joueur « générer vérification » est reconnue', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const r = ctx.com.executerCommande('générer vérification', false);
    expect(r.sortie).toContain('@générer-vérification@');
  });

  it('[F050-TR002] la commande joueur « générer solution » est reconnue (témoin)', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const r = ctx.com.executerCommande('générer solution', false);
    expect(r.sortie).toContain('@générer-solution@');
  });

});

describe('Fichier de vérification (.tst)', () => {

  /**
   * Joue quelques commandes en simulant ce que fait LecteurComponent
   * (ajout d'étape + exécution + capture de sortie).
   */
  function jouer(ctx: ContextePartie, commandes: string[]): string[] {
    const sorties: string[] = [];
    for (const cmd of commandes) {
      ctx.ajouterCommandeDansSauvegarde(cmd);
      const ctxCmd = ctx.com.executerCommande(cmd, false);
      const sortie = ctxCmd?.sortie ?? '';
      ctx.enregistrerSortieEtapeCourante(sortie);
      sorties.push(sortie);
    }
    return sorties;
  }

  it('[F050-T001] creerFichierTest produit etapesTest avec sortie pour chaque commande', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.
       action tester ceci:
         dire "Je teste [intitulé ceci]."
       fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const sorties = jouer(ctx, ['tester le cube', 'tester le cube']);

    const fichier = ctx.creerFichierTest();

    expect(fichier.type).toEqual('test');
    expect(fichier.etapesTest).toBeDefined();

    const cEtapes = fichier.etapesTest.filter(e => e.type === 'c');
    expect(cEtapes.length).toBe(2);
    expect(cEtapes[0].valeur).toBe('tester le cube');
    expect(cEtapes[0].sortie).toBe(sorties[0]);
    expect(cEtapes[1].sortie).toBe(sorties[1]);
  });

  it('[F050-T002] round-trip : fichier généré → JSON → re-parse conserve les sorties', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.
       action tester ceci:
         dire "Je teste [intitulé ceci]."
       fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    jouer(ctx, ['tester le cube']);

    const fichier = ctx.creerFichierTest();
    const json = JSON.stringify(fichier);
    const reparse = JSON.parse(json) as FichierTest;

    expect(reparse.type).toBe('test');
    const cEtape = reparse.etapesTest.find(e => e.type === 'c');
    expect(cEtape).toBeDefined();
    expect(cEtape!.valeur).toBe('tester le cube');
    expect(cEtape!.sortie).toBeDefined();
    expect(cEtape!.sortie!.length).toBeGreaterThan(0);
  });

  it('[F050-T003] etapes g/d n’ont pas de sortie', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.
       action tester ceci:
         dire "Je teste [intitulé ceci]."
       fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    jouer(ctx, ['tester le cube']);

    const fichier = ctx.creerFichierTest();

    for (const etape of fichier.etapesTest) {
      if (etape.type === 'g' || etape.type === 'd') {
        expect(etape.sortie).toBeUndefined();
      }
    }
  });

  it('[F050-T004] première étape g porte la graine initiale', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);

    const fichier = ctx.creerFichierTest();

    expect(fichier.graine).toBeDefined();
    const premiere = fichier.etapesTest[0];
    expect(premiere.type).toBe('g');
    expect(premiere.valeur).toBe(fichier.graine);
  });

  it('[F050-T005] replay synthétique : rejouer les commandes produit les mêmes sorties', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.
       action tester ceci:
         dire "Je teste [intitulé ceci]."
       fin action`;
    const ctxOrigine = TestUtils.genererEtCommencerLeJeu(scenario, false);
    jouer(ctxOrigine, ['tester le cube', 'tester le cube']);
    const fichier = ctxOrigine.creerFichierTest();

    // Reprendre depuis zéro et vérifier que chaque c: produit bien sortie.
    const ctxRejeu = TestUtils.genererEtCommencerLeJeu(scenario, false);
    let ignorerPremiereGraine = true;
    for (const etape of fichier.etapesTest) {
      if (etape.type === 'g' && ignorerPremiereGraine) {
        ignorerPremiereGraine = false;
        continue;
      }
      if (etape.type === 'g') {
        ctxRejeu.nouvelleGraineAleatoire(etape.valeur);
      } else if (etape.type === 'c') {
        const ctxCmd = ctxRejeu.com.executerCommande(etape.valeur, false);
        expect(ctxCmd?.sortie ?? '').toBe(etape.sortie);
      }
    }
  });


  it('[F050-T010] enregistrerSortieEtapeCourante ne touche pas aux slots g/d', () => {
    const scenario =
      `La salle est un lieu.
       le cube est un objet vu ici.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctx.ajouterCommandeDansSauvegarde('tester');
    // pousser une étape g entre les deux pour simuler une nouvelle graine
    ctx.nouvelleGraineAleatoire('42');
    ctx.enregistrerSortieEtapeCourante('SORTIE_C');

    const fichier = ctx.creerFichierTest();
    const cEtapes = fichier.etapesTest.filter(e => e.type === 'c');
    expect(cEtapes[0].sortie).toBe('SORTIE_C');
    const gEtapes = fichier.etapesTest.filter(e => e.type === 'g' && e.valeur === '42');
    expect(gEtapes[0].sortie).toBeUndefined();
  });

});

describe('Fichier de vérification (.tst) — mode magnéto', () => {

  function creerLecteurMagneto(ctx: ContextePartie, fichier: FichierTest): LecteurComponent {
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement('div')));
    (lecteur as any).partie = ctx;
    (lecteur as any).jeu = ctx.jeu;
    (lecteur as any).fichierTestEnCours = fichier;
    (lecteur as any).verificationActive = true;
    (lecteur as any).verificationActions = [];
    (lecteur as any).verificationCompteurs = { acceptations: 0, retraits: 0, modifications: 0, ajouts: 0 };
    (lecteur as any).magnetoIdx = 0;
    (lecteur as any).magnetoDivergence = null;
    (lecteur as any).magnetoEdition = 'aucun';
    (lecteur as any).magnetoSaisieCommande = '';
    (lecteur as any).magnetoDernierTest = null;
    spyOn(lecteur as any, 'envoyerCommande').and.callFake((_commandeBrute: string, commandeNettoyee: string) => {
      const ctxCmd = ctx.com.executerCommande(commandeNettoyee, false);
      ctx.enregistrerSortieEtapeCourante(ctxCmd?.sortie ?? '');
    });
    return lecteur;
  }

  function fichierMinimal(etapes: EtapeTest[]): FichierTest {
    return Object.assign(new FichierTest(), {
      version: 1, scenario: '', graine: '',
      declenchementsFuturs: [],
      etapesTest: etapes,
    });
  }

  it('[F050-MAG-T001] pas suivant sans divergence : avance', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence).toBeNull();
    expect(lecteur.magnetoIdx).toBeGreaterThanOrEqual(1);
  });

  it('[F050-MAG-T002] pas suivant avec sortie attendue erronée : ouvre divergence', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'SORTIE_FAUSSE' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence).not.toBeNull();
    expect(lecteur.magnetoDivergence!.idx).toBe(0);
  });

  it('[F050-MAG-T003] valider sur divergence : sortie mise à jour', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'SORTIE_FAUSSE' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);
    lecteur.magnetoPasSuivant();

    lecteur.magnetoValider();

    expect(lecteur.magnetoDivergence).toBeNull();
    expect(fichier.etapesTest[0].sortie).not.toBe('SORTIE_FAUSSE');
    expect(lecteur.verificationCompteurs.acceptations).toBe(1);
  });

  it('[F050-MAG-T004] supprimer commande : étape retirée du .tst, annuler joué', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'FAUX' },
      { type: 'c', valeur: 'attendre', sortie: 'AUTRE' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);
    lecteur.magnetoPasSuivant();

    lecteur.magnetoSupprimerCommande();

    expect(lecteur.magnetoDivergence).toBeNull();
    expect(fichier.etapesTest.length).toBe(1);
    expect(lecteur.verificationCompteurs.retraits).toBe(1);
    expect((lecteur as any).envoyerCommande).toHaveBeenCalledWith('annuler', 'annuler', true, true, true, false);
  });

  it('[F050-MAG-T005] valider saisie (modifier) : étape mise à jour, modifications comptées', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'FAUX' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);
    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerModification();
    lecteur.magnetoSaisieCommande = 'attendre';

    lecteur.magnetoValiderSaisie();

    expect(lecteur.magnetoDivergence).toBeNull();
    expect(fichier.etapesTest[0].valeur).toBe('attendre');
    expect(fichier.etapesTest[0].sortie).toBeDefined();
    expect(lecteur.verificationCompteurs.modifications).toBe(1);
  });

  it('[F050-MAG-T006] insérer après : nouvelle étape ajoutée à idx+1', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'FAUX' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);
    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerInsertion();
    lecteur.magnetoSaisieCommande = 'attendre';

    lecteur.magnetoValiderSaisie();

    expect(fichier.etapesTest.length).toBe(2);
    expect(fichier.etapesTest[1].valeur).toBe('attendre');
    expect(lecteur.verificationCompteurs.ajouts).toBe(1);
  });

  it('[F050-MAG-T007] quitter : verificationActive devient false', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: '' }]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoQuitter();

    expect(lecteur.verificationActive).toBeFalse();
    expect(lecteur.fichierTestEnCours).toBeNull();
  });

  it('[F050-MAG-T008] compteur c+r ignore g/d', () => {
    const scenario = `La salle est un lieu.`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'g', valeur: '0.1' },
      { type: 'c', valeur: 'a', sortie: 'A' },
      { type: 'g', valeur: '0.2' },
      { type: 'c', valeur: 'b', sortie: 'B' },
      { type: 'r', valeur: 'oui', sortie: 'OK' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    expect(lecteur.magnetoCompteurTotal).toBe(3);
  });

  /**
   * Variante de creerLecteurMagneto qui reproduit FIDÈLEMENT la branche de
   * `envoyerCommande` qui pousse la commande dans `_etapesPartie` de la partie.
   * Production : `this.partie.ajouterCommandeDansSauvegarde(this.commande)`
   * (utilise `this.commande`, PAS la commande passée en argument).
   * Indispensable pour démontrer le bug d'alimentation de la pile en mode magnéto.
   */
  function creerLecteurMagnetoFidele(ctx: ContextePartie, fichier: FichierTest): LecteurComponent {
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement('div')));
    (lecteur as any).partie = ctx;
    (lecteur as any).jeu = ctx.jeu;
    (lecteur as any).fichierTestEnCours = fichier;
    (lecteur as any).verificationActive = true;
    (lecteur as any).verificationActions = [];
    (lecteur as any).verificationCompteurs = { acceptations: 0, retraits: 0, modifications: 0, ajouts: 0 };
    (lecteur as any).magnetoIdx = 0;
    (lecteur as any).magnetoDivergence = null;
    (lecteur as any).magnetoEdition = 'aucun';
    (lecteur as any).magnetoSaisieCommande = '';
    (lecteur as any).magnetoDernierTest = null;
    (lecteur as any).commande = '';
    spyOn(lecteur as any, 'envoyerCommande').and.callFake(
      (commandeBrute: string, commandeNettoyee: string, ajouterDansHistorique: boolean) => {
        if (ajouterDansHistorique && !commandeNettoyee.startsWith('déboguer triche')) {
          // Reproduit la branche de production qui pousse dans `_etapesPartie`.
          ctx.ajouterCommandeDansSauvegarde(commandeBrute);
        }
        const ctxCmd = ctx.com.executerCommande(commandeNettoyee, false);
        ctx.enregistrerSortieEtapeCourante(ctxCmd?.sortie ?? '');
      }
    );
    return lecteur;
  }

  it('[F050-MAG-T009] magnetoPasSuivant pousse la commande du .tst dans _etapesPartie de la partie', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagnetoFidele(ctx, fichier);

    lecteur.magnetoPasSuivant();
    lecteur.magnetoPasSuivant();

    // La pile d'instructions (lue par le DSL `annuler N tour(s)` et `creerFichierTest`)
    // doit refléter les commandes effectivement jouées par le magnéto.
    const commandes = ctx.etapesPartie.filter(e => e.startsWith('c:'));
    expect(commandes).toEqual(['c:attendre', 'c:attendre']);
  });

  it('[F050-MAG-T011] supprimer sans divergence : retire l’étape courante sans annuler', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    // Nouvelle sémantique : supprimer agit sur la commande qui vient d'être exécutée.
    lecteur.magnetoPasSuivant();
    lecteur.magnetoSupprimerCommande();

    expect(fichier.etapesTest.length).toBe(1);
    expect(lecteur.verificationCompteurs.retraits).toBe(1);
    // « annuler » est envoyé pour rembobiner avant le splice.
    expect((lecteur as any).envoyerCommande).toHaveBeenCalledWith('annuler', 'annuler', true, true, true, false);
  });

  it('[F050-MAG-T012] entrer modification : la commande exécutée est rejouable', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerModification();

    expect(lecteur.magnetoEdition).toBe('modifier');
    expect(lecteur.magnetoSaisieCommande).toBe('attendre');
    expect((lecteur as any).envoyerCommande).toHaveBeenCalledWith('annuler', 'annuler', true, true, true, false);
  });

  it('[F050-MAG-T013] entrer insertion (avant) : mode inserer, saisie vide, annuler envoyé', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerInsertion('avant');

    expect(lecteur.magnetoEdition).toBe('inserer');
    expect(lecteur.magnetoSaisieCommande).toBe('');
    expect((lecteur as any).envoyerCommande).toHaveBeenCalledWith('annuler', 'annuler', true, true, true, false);
  });

  it('[F050-MAG-T014] valider modification : étape remplacée, avance, enchaîne Suivant', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerModification();
    lecteur.magnetoSaisieCommande = 'regarder';

    lecteur.magnetoValiderSaisie();

    expect(fichier.etapesTest.length).toBe(2);
    expect(fichier.etapesTest[0].valeur).toBe('regarder');
    expect(fichier.etapesTest[0].sortie).toBeDefined();
    expect(lecteur.magnetoIdx).toBeGreaterThanOrEqual(1);
    expect(lecteur.verificationCompteurs.modifications).toBe(1);
  });

  it('[F050-MAG-T015] valider insertion (avant) : étape insérée juste avant la commande exécutée', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();
    lecteur.magnetoEntrerInsertion('avant');
    lecteur.magnetoSaisieCommande = 'regarder';

    lecteur.magnetoValiderSaisie();

    // L'originale [0] est repoussée à idx=1 ; la nouvelle prend la place 0.
    expect(fichier.etapesTest.length).toBe(3);
    expect(fichier.etapesTest[0].valeur).toBe('regarder');
    expect(fichier.etapesTest[1].valeur).toBe('attendre');
    expect(lecteur.magnetoIdx).toBeGreaterThanOrEqual(1);
    expect(lecteur.verificationCompteurs.ajouts).toBe(1);
  });

  it('[F050-MAG-T016] recapActionsAffichables masque les actions « reculé »', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();   // pousse une étape ; le récap s'affiche
    lecteur.recapReculer();        // pousse une action « reculé »

    expect(lecteur.verificationActions.some(a => a.action === 'reculé')).toBeTrue();
    expect(lecteur.recapActionsAffichables.some(a => a.action === 'reculé')).toBeFalse();
  });

  it('[F050-MAG-T017] recapReculer ré-active la vérification, ferme le récap et envoie « annuler »', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagneto(ctx, fichier);

    lecteur.magnetoPasSuivant();   // unique étape jouée → récap affiché
    expect(lecteur.recapAffiche).toBeTrue();
    expect(lecteur.verificationActive).toBeFalse();

    lecteur.recapReculer();

    expect(lecteur.recapAffiche).toBeFalse();
    expect(lecteur.verificationActive).toBeTrue();
    expect((lecteur as any).envoyerCommande).toHaveBeenCalledWith('annuler', 'annuler', true, true, true, false);
  });

  it('[F050-MAG-T021] Précédent + Pas suivant : tirage aléatoire identique (snapshot PRNG restauré)', () => {
    const scenario =
      `La salle est un lieu.
       action lancer:
         dire "Tirage : [au hasard]un[ou]deux[ou]trois[ou]quatre[ou]cinq[ou]six[fin]."
       fin action`;

    const ctxRef = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxRef.nouvelleGraineAleatoire('verif-graine');
    const sortieAttendue = ctxRef.com.executerCommande('lancer', false)?.sortie ?? '';
    expect(sortieAttendue).toMatch(/un|deux|trois|quatre|cinq|six/);

    const ctxMag = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxMag.nouvelleGraineAleatoire('verif-graine');
    // Sentinelle pour éviter afficherRecap après le 1er pas suivant.
    const fichier: FichierTest = Object.assign(new FichierTest(), {
      version: 1, scenario: '', graine: 'verif-graine',
      declenchementsFuturs: [],
      etapesTest: [
        { type: 'c', valeur: 'lancer', sortie: sortieAttendue },
        { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      ],
    });
    const lecteur = creerLecteurMagnetoFidele(ctxMag, fichier);

    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('1er pas suivant').toBeNull();
    lecteur.magnetoPrecedent();
    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('2e pas suivant après Précédent').toBeNull();
  });

  it('[F050-MAG-T022] Précédent ré-applique la dernière graine en amont (graine mid-game)', () => {
    const scenario =
      `La salle est un lieu.
       action lancer:
         dire "Tirage : [au hasard]un[ou]deux[ou]trois[ou]quatre[ou]cinq[ou]six[fin]."
       fin action`;

    const ctxRef = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxRef.nouvelleGraineAleatoire('graine-A');
    const sortieA = ctxRef.com.executerCommande('lancer', false)?.sortie ?? '';
    ctxRef.nouvelleGraineAleatoire('graine-B');
    const sortieB = ctxRef.com.executerCommande('lancer', false)?.sortie ?? '';

    const fichier: FichierTest = Object.assign(new FichierTest(), {
      version: 1, scenario: '', graine: 'graine-A',
      declenchementsFuturs: [],
      etapesTest: [
        { type: 'g', valeur: 'graine-A' },
        { type: 'c', valeur: 'lancer', sortie: sortieA },
        { type: 'g', valeur: 'graine-B' },
        { type: 'c', valeur: 'lancer', sortie: sortieB },
        { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' }, // sentinelle
      ],
    });
    const ctxMag = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxMag.nouvelleGraineAleatoire('graine-A');
    const lecteur = creerLecteurMagnetoFidele(ctxMag, fichier);
    (lecteur as any).magnetoIdx = 1; // sauter la 1re 'g' déjà appliquée

    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('1er lancer (graine-A)').toBeNull();
    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('2e lancer (graine-B)').toBeNull();

    lecteur.magnetoPrecedent();
    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('2e lancer après Précédent').toBeNull();
  });

  it('[F050-MAG-T023] hasard cumulatif : Précédent sur la 2e c restaure le PRNG via snapshot', () => {
    const scenario =
      `La salle est un lieu.
       action lancer:
         dire "Tirage : [au hasard]un[ou]deux[ou]trois[ou]quatre[ou]cinq[ou]six[fin]."
       fin action`;

    const ctxRef = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxRef.nouvelleGraineAleatoire('mag-multi');
    const sortie1 = ctxRef.com.executerCommande('lancer', false)?.sortie ?? '';
    const sortie2 = ctxRef.com.executerCommande('lancer', false)?.sortie ?? '';

    const fichier: FichierTest = Object.assign(new FichierTest(), {
      version: 1, scenario: '', graine: 'mag-multi',
      declenchementsFuturs: [],
      etapesTest: [
        { type: 'c', valeur: 'lancer', sortie: sortie1 },
        { type: 'c', valeur: 'lancer', sortie: sortie2 },
        { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' }, // sentinelle
      ],
    });
    const ctxMag = TestUtils.genererEtCommencerLeJeu(scenario, false);
    ctxMag.nouvelleGraineAleatoire('mag-multi');
    const lecteur = creerLecteurMagneto(ctxMag, fichier);

    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('1er lancer').toBeNull();
    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('2e lancer').toBeNull();

    // Sans snapshot, le PRNG serait au-delà de l'état requis pour reproduire sortie2.
    lecteur.magnetoPrecedent();
    lecteur.magnetoPasSuivant();
    expect(lecteur.magnetoDivergence).withContext('2e lancer après Précédent (snapshot PRNG)').toBeNull();
  });

  it('[F050-MAG-T010] magnetoPrecedent envoie « annuler » et alimente _etapesPartie', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    // 2 étapes : on s'arrête après la 1re pour éviter `afficherRecap` (qui désactive `verificationActive`).
    const fichier = fichierMinimal([
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
      { type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' },
    ]);
    const lecteur = creerLecteurMagnetoFidele(ctx, fichier);

    lecteur.magnetoPasSuivant();      // doit pousser « attendre »
    lecteur.magnetoPrecedent();       // doit pousser « annuler »

    const commandes = ctx.etapesPartie.filter(e => e.startsWith('c:'));
    expect(commandes).toEqual(['c:attendre', 'c:annuler']);
  });

  it('[F050-MAG-T020] précédent sur divergence intro : ferme le panneau sans modifier la sortie d\'intro du .tst', () => {
    const scenario = `La salle est un lieu.\n` + actions;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = fichierMinimal([{ type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' }]);
    fichier.sortieIntro = 'Intro attendue.';
    const lecteur = creerLecteurMagnetoFidele(ctx, fichier);
    (lecteur as any).magnetoDivergenceIntro = {
      sortie: 'Intro attendue.',
      sortieObtenue: 'Intro différente.',
      diffAttendu: [], diffObtenue: [],
    };

    lecteur.magnetoPrecedent();

    expect((lecteur as any).magnetoDivergenceIntro).toBeNull();
    expect(fichier.sortieIntro).toBe('Intro attendue.');
  });

});

describe('Magnéto — surlignage des sections divergentes (diff)', () => {

  it('[F050-TD001] textes identiques → aucun segment marqué diff', () => {
    const { gauche, droite } = LecteurComponent.calculerDiffSorties('Vous êtes dans la salle.', 'Vous êtes dans la salle.');
    expect(gauche.every(s => !s.diff)).toBeTrue();
    expect(droite.every(s => !s.diff)).toBeTrue();
    expect(gauche.map(s => s.texte).join('')).toBe('Vous êtes dans la salle.');
    expect(droite.map(s => s.texte).join('')).toBe('Vous êtes dans la salle.');
  });

  it('[F050-TD002] mot remplacé → marqué diff à gauche ET à droite, segments communs intacts', () => {
    const { gauche, droite } = LecteurComponent.calculerDiffSorties('Vous voyez un chat.', 'Vous voyez un chien.');
    expect(gauche.map(s => s.texte).join('')).toBe('Vous voyez un chat.');
    expect(droite.map(s => s.texte).join('')).toBe('Vous voyez un chien.');
    const diffsGauche = gauche.filter(s => s.diff).map(s => s.texte).join('');
    const diffsDroite = droite.filter(s => s.diff).map(s => s.texte).join('');
    expect(diffsGauche).toContain('chat');
    expect(diffsDroite).toContain('chien');
    expect(gauche.filter(s => !s.diff).map(s => s.texte).join('')).toContain('Vous voyez un');
  });

  it('[F050-TD003] mot ajouté à droite → marqué diff uniquement à droite', () => {
    const { gauche, droite } = LecteurComponent.calculerDiffSorties('Vous voyez un chat.', 'Vous voyez un gros chat.');
    expect(gauche.every(s => !s.diff)).toBeTrue();
    const diffsDroite = droite.filter(s => s.diff).map(s => s.texte).join('');
    expect(diffsDroite).toContain('gros');
  });

  it('[F050-TD004] mot supprimé à droite → marqué diff uniquement à gauche', () => {
    const { gauche, droite } = LecteurComponent.calculerDiffSorties('Vous voyez un gros chat.', 'Vous voyez un chat.');
    expect(droite.every(s => !s.diff)).toBeTrue();
    const diffsGauche = gauche.filter(s => s.diff).map(s => s.texte).join('');
    expect(diffsGauche).toContain('gros');
  });

  it('[F050-TD005] sortie attendue vide → tout le texte obtenu est marqué diff', () => {
    const { gauche, droite } = LecteurComponent.calculerDiffSorties('', 'Bienvenue dans le jeu.');
    expect(gauche.length).toBe(0);
    expect(droite.length).toBeGreaterThan(0);
    expect(droite.every(s => s.diff)).toBeTrue();
    expect(droite.map(s => s.texte).join('')).toBe('Bienvenue dans le jeu.');
  });

});
