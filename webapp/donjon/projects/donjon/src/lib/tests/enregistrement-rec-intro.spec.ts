import { ElementRef } from "@angular/core";

import { FichierEnregistrement, LecteurComponent } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { TypeInterruption } from "../models/jeu/interruption";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

/**
 * Tests dédiés à l’interaction entre la phase d’intro (action « commencer »)
 * et le mode magnéto, pour 3 cas particuliers :
 *  1. l’intro appelle une routine
 *  2. l’intro contient une instruction `attendre touche`
 *  3. l’intro contient un bloc `choisir ... fin choisir`
 *
 * On vérifie que :
 *  - la sortie d’intro est déterministe (record == replay)
 *  - `initialiserMagneto` se lance bien (même si l’intro a été interrompue)
 *  - aucune divergence d’intro fantôme n’est levée
 */
describe('Enregistrement (.rec) — intro spéciale (routine / attendre / choisir)', () => {

  /**
   * Construit une partie « fraîche » à partir d’un scénario, en évitant
   * le flag `jeu.commence = true` posé par TestUtils.genererEtCommencerLeJeu
   * (qui empêcherait ensuite l’exécution effective de l’action commencer).
   */
  function nouvellePartie(scenario: string): ContextePartie {
    const jeu = TestUtils['genererLeJeu'](scenario, false);
    const ctx = new ContextePartie(jeu);
    ctx.nouvelleGraineAleatoire();
    ctx.eju.majPresenceDesObjets();
    ctx.eju.majAdjacenceLieux();
    return ctx;
  }

  /**
   * Joue l’intro en simulant ce que le lecteur fait pour `commencer le jeu` :
   * exécute la commande (ajoute pas à l’historique, comme intro réelle) et
   * accumule la sortie dans `_sortieIntro` via `enregistrerSortieEtapeCourante`.
   * Si une action commencer ceci existe (cas standard), elle appelle déjà
   * « regarder » en interne ; ne pas dupliquer côté lecteur ni ici.
   */
  function jouerIntroDirect(ctx: ContextePartie): void {
    const a = ctx.com.executerCommande('commencer le jeu', false);
    ctx.enregistrerSortieEtapeCourante(a?.sortie ?? '');
  }

  /**
   * Crée un LecteurComponent suffisamment équipé pour exécuter ngOnChanges
   * sans accéder au DOM. Si `fichier` est fourni, prépare le mode magnéto :
   * `initialiserMagneto` sera appelé par `initialiserJeu` après l’intro.
   */
  function instancierLecteurComplet(jeu: any, fichier?: FichierEnregistrement): LecteurComponent {
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement('div')));
    lecteur.jeu = jeu;
    spyOn(lecteur as any, 'scrollSortie');
    spyOn(lecteur as any, 'focusCommande');
    spyOn(lecteur as any, 'definirIFID');
    spyOn(lecteur as any, 'verifierChrono');
    spyOn(lecteur as any, 'verifierTamponErreurs');
    // neutralise l'accès à jeu.statistiques (non initialisé dans ce contexte de test).
    spyOn(lecteur as any, 'ajouterTexteAIgnorerAuxStatistiques');
    if (fichier) {
      (lecteur as any).enregistrementEnCours = fichier;
      (lecteur as any).enregistrementEnAttente = true;
    }
    lecteur.ngOnChanges({});
    return lecteur;
  }

  // ============================================================
  //  Cas 1 : intro appelle une routine
  // ============================================================

  it('[F050-MAG-INTRO-T001] intro avec routine : sortieIntro contient le texte produit par la routine', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  exécuter la routine intro_routine.
fin règle
routine intro_routine:
  dire "Bonjour aventurier!".
fin routine
` + actions;

    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);

    expect(ctx.sortieIntro).toContain('Bonjour aventurier');
  });

  it('[F050-MAG-INTRO-T002] intro avec routine : sortieIntro déterministe (2 runs)', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  exécuter la routine intro_routine.
fin règle
routine intro_routine:
  dire "Bonjour aventurier!".
fin routine
` + actions;

    const ctxA = nouvellePartie(scenario);
    jouerIntroDirect(ctxA);

    const ctxB = nouvellePartie(scenario);
    jouerIntroDirect(ctxB);

    expect(ctxA.sortieIntro).toEqual(ctxB.sortieIntro);
  });

  it('[F050-MAG-INTRO-T003] intro avec routine : magnéto démarre sans divergence d’intro', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  exécuter la routine intro_routine.
fin règle
routine intro_routine:
  dire "Bonjour aventurier!".
fin routine
` + actions;

    // Recording
    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();

    // Replay
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    expect(lecteur.enregistrementActif).toBeTrue();
    expect(lecteur.magnetoDivergenceIntro).toBeNull();
  });

  // ============================================================
  //  Cas 2 : intro contient « attendre touche »
  // ============================================================

  it('[F050-MAG-INTRO-T010] intro avec « attendre touche » : l’intro produit une interruption attendreTouche', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;
    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);

    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toBe(TypeInterruption.attendreTouche);
    expect(ctx.sortieIntro).toContain('Bienvenue');
  });

  it('[F050-MAG-INTRO-T013] intro avec « attendre touche » : le magnéto bypass l’attente et complète sortieIntro avant la comparaison', () => {
    // Reproduit le bug réel reporté par un utilisateur (sortie magneto_intro_attendre.djn) :
    //   sortieIntro enregistré = "Bienvenue!{N}\nAllons-y!{N}..." (contenu post-touche inclus,
    //     parce que pendant le recording l’utilisateur a pressé une touche → continuation jouée)
    //   sortieIntro produit par le replay sans bypass = "Bienvenue!{N}" (intro bloquée sur touche)
    //   → divergence d’intro fantôme.
    // Comportement attendu (alignement avec mode triche) : initialiserMagneto consomme les
    // attendreTouche d’intro AVANT le diff pour que les sorties matchent.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;

    // On construit côté recording une sortieIntro représentative du cas réel : pour cela,
    // on demande à un 1er lecteur de lancer l’intro (le helper du magnéto bypass déjà la
    // touche → continuation jouée → sortieIntro complète). On capture l’état et on l’injecte
    // dans un fichier .rec utilisé par un 2e lecteur (= le replay sous test).
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    expect(fichier.sortieIntro ?? '').withContext('recording complet (post-touche inclus)').toContain('Allons-y');

    // Replay sur un lecteur frais
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    expect(lecteur.enregistrementActif).toBeTrue();
    expect(lecteur.magnetoDivergenceIntro)
      .withContext('le magnéto doit bypass l’attendre touche pour finaliser sortieIntro avant le diff')
      .toBeNull();
  });

  it('[F050-MAG-INTRO-T011] intro avec « attendre touche » : magnéto se lance malgré l’interruption pendante', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;

    // Recording représentatif du cas réel : on bypass la touche pendant le recording
    // pour que sortieIntro contienne la continuation post-touche (cf. T013).
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    // Replay : lecteur frais — le magnéto bypass aussi la touche à l’init.
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    expect(lecteur.enregistrementActif).withContext('magnéto doit être actif même si intro interrompue').toBeTrue();
    expect(lecteur.magnetoDivergenceIntro).withContext('sorties d’intro identiques (toutes deux post-bypass)').toBeNull();
  });

  // ============================================================
  //  Cas 3 : intro contient « choisir »
  // ============================================================

  it('[F050-MAG-INTRO-T020] intro avec « choisir » : l’intro produit une interruption attendreChoix', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;
    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);

    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toBe(TypeInterruption.attendreChoix);
    expect(ctx.sortieIntro).toContain('Quel est ton choix');
  });

  it('[F050-MAG-INTRO-T012] intro avec « attendre touche » : l’attente est consommée DÈS l’init du magnéto (avant le 1er Pas suivant)', () => {
    // Régression : auparavant l’attente persistait jusqu’au 1er Pas suivant et la
    // sortieIntro restait incomplète → faux diff. Désormais initialiserMagneto
    // appelle terminerInterruptionsBloquantesPourMagneto avant le diff d’intro.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;

    // On utilise un recording « complet » pour pouvoir lancer le magnéto sans divergence.
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    expect(lecteur.enregistrementActif).toBeTrue();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext('attendre touche d’intro doit déjà être consommée à l’init')
      .not.toBe(TypeInterruption.attendreTouche);
    expect((lecteur as any).partie.sortieIntro)
      .withContext('sortieIntro post-bypass doit contenir le texte après touche')
      .toContain('Allons-y');
  });

  it('[F050-MAG-INTRO-T022] intro avec « choisir » : Pas suivant sur r:a route la réponse vers le choisir (pas vers une commande)', () => {
    // Bug réel : magnetoPasSuivant sur une étape r:a alors qu'une interruption attendreChoix
    // est pendante envoyait 'a' à envoyerCommande → exécuté comme une commande inconnue
    // ("Vous voulez ? je ne comprends pas a") au lieu d'être interprété comme la réponse
    // au choisir → divergence systématique sur la 1re étape post-intro.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    // Recording : on simule un utilisateur qui répond 'a' au choisir d'intro.
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    expect(lecteurRec.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreChoix);
    (lecteurRec as any).commande = 'a';
    (lecteurRec as any).traiterChoixStatiqueJoueur();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    // L'étape 'r:a' doit avoir une sortie capturée (la continuation après choisir).
    const etapeR = fichier.etapes.find(e => e.type === 'r');
    expect(etapeR).withContext('recording : étape r:a capturée').toBeDefined();
    expect(etapeR!.sortie).withContext('recording : sortie post-choisir capturée').toContain('Vous choisissez A');

    // Replay
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    expect(lecteur.enregistrementActif).toBeTrue();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext('attendreChoix d’intro doit rester pendant le replay (non bypassée)')
      .toBe(TypeInterruption.attendreChoix);

    lecteur.magnetoPasSuivant();

    expect(lecteur.magnetoDivergence)
      .withContext('r:a doit résoudre le choisir, pas être exécuté comme commande')
      .toBeNull();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext('choisir résolu après Pas suivant sur r:a')
      .not.toBe(TypeInterruption.attendreChoix);
    // Label UI : « Choix : a » et non « Commande exécutée : a ».
    expect(lecteur.magnetoEtapeCouranteEstReponse)
      .withContext('libellé UI doit être Choix : et non Commande exécutée :')
      .toBeTrue();
    expect(lecteur.magnetoEtapeCouranteEstRoutine).toBeFalse();
  });

  it('[F050-MAG-INTRO-T021] intro avec « choisir » : magnéto se lance malgré l’interruption pendante', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    // Recording : on capture la sortie observable à la pause sur le choisir.
    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();
    // On ajoute une étape r pour la réponse au choix (1ère commande post-intro).
    fichier.etapes.push({ type: 'r', valeur: 'a', sortie: '' });

    // Replay
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    expect(lecteur.enregistrementActif).withContext('magnéto doit être actif même si intro interrompue').toBeTrue();
    expect(lecteur.magnetoDivergenceIntro).withContext('sorties d’intro identiques → pas de divergence').toBeNull();
  });

  // ============================================================
  //  Précédent : retour en arrière depuis un état post-intro
  // ============================================================

  it('[F050-MAG-INTRO-T030] Précédent juste après init magnéto (aucun Pas suivant joué) : no-op (pas d’annuler envoyé)', () => {
    // Cas pivot : juste après l’initialisation du magnéto, AUCUN Pas suivant n’a été
    // joué. magnetoPrecedent doit être inerte — il ne doit pas envoyer « annuler »
    // au moteur (il n’y a rien à annuler ; aucune c/r n’a encore été exécutée).
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  exécuter la routine intro_routine.
fin règle
routine intro_routine:
  dire "Bonjour aventurier!".
fin routine
` + actions;

    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    const idxInitial = lecteur.magnetoIdx;

    // Remplacer envoyerCommande par un spy pour observer les appels post-intro.
    const sentinel = jasmine.createSpy('envoyerCommandePostIntro');
    (lecteur as any).envoyerCommande = sentinel;

    lecteur.magnetoPrecedent();

    expect(lecteur.magnetoIdx).toBe(idxInitial);
    expect(sentinel).not.toHaveBeenCalled();
  });

  it('[F050-MAG-INTRO-T031] Précédent après 1 Pas suivant (intro avec routine) : envoie « annuler » et recule magnetoIdx d’une c/r', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  exécuter la routine intro_routine.
fin règle
routine intro_routine:
  dire "Bonjour aventurier!".
fin routine
` + actions;

    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    // À ce stade, magnetoIdx pointe sur la 1re c (après l’étape 'g' initiale).
    // On simule un Pas suivant : pousse 'c:attendre' dans la pile et avance d’une étape.
    const idxAvantPasSuivant = lecteur.magnetoIdx;
    const calls: string[] = [];
    (lecteur as any).envoyerCommande = (commandeBrute: string, commandeNettoyee: string) => {
      calls.push(commandeNettoyee);
    };
    (lecteur as any).partie.ajouterCommandeDansSauvegarde('attendre');
    (lecteur as any).magnetoIdx = idxAvantPasSuivant + 1;

    lecteur.magnetoPrecedent();

    expect(calls).toContain('annuler');
    expect(lecteur.magnetoIdx).toBe(idxAvantPasSuivant);
  });

  it('[F050-MAG-INTRO-T032] Précédent après 1 Pas suivant (intro avec attendre touche) : trim des ‘d’ trailing AVANT d’envoyer annuler', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;

    // Recording complet (touche bypass'ée → continuation jouée) pour reproduire les
    // conditions réelles dans lesquelles Précédent est utilisé.
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);

    // Simulation d’un Pas suivant qui aurait : (a) consommé l’attendreTouche d’intro,
    // (b) poussé un 'd' fantôme via les tampons, (c) exécuté la commande.
    const idxAvantPasSuivant = lecteur.magnetoIdx;
    let etatPileAuAnnuler: string[] | null = null;
    (lecteur as any).envoyerCommande = (commandeBrute: string, commandeNettoyee: string) => {
      if (commandeNettoyee === 'annuler') {
        etatPileAuAnnuler = [...(lecteur as any).partie.etapesPartie];
      }
    };
    (lecteur as any).partie.ajouterCommandeDansSauvegarde('attendre');
    (lecteur as any).partie.ajouterDeclenchementDansSauvegarde('post_touche_fantome');
    (lecteur as any).magnetoIdx = idxAvantPasSuivant + 1;

    lecteur.magnetoPrecedent();

    expect(etatPileAuAnnuler).not.toBeNull();
    // Au moment de l’envoi d’annuler, plus aucun 'd' en fin de pile : sinon le reload
    // post-annuler ré-injecterait la routine fantôme à l’écran.
    expect(etatPileAuAnnuler!.some(e => e.startsWith('d:'))).withContext('d trailing doit être trim avant annuler').toBeFalse();
    expect(lecteur.magnetoIdx).toBe(idxAvantPasSuivant);
  });

  it('[F050-MAG-INTRO-T033] Précédent après 1 Pas suivant (intro avec choisir) : envoie « annuler » et recule sur la r/c précédente', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();
    fichier.etapes.push({ type: 'r', valeur: 'a', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    expect(lecteur.enregistrementActif).toBeTrue();

    const idxAvantPasSuivant = lecteur.magnetoIdx;
    const calls: string[] = [];
    (lecteur as any).envoyerCommande = (commandeBrute: string, commandeNettoyee: string) => {
      calls.push(commandeNettoyee);
    };
    (lecteur as any).partie.ajouterReponseDansSauvegarde('a');
    (lecteur as any).magnetoIdx = idxAvantPasSuivant + 1;

    lecteur.magnetoPrecedent();

    expect(calls).toContain('annuler');
    expect(lecteur.magnetoIdx).toBe(idxAvantPasSuivant);
  });

  // ============================================================
  //  Smoke tests : les scénarios .djn livrés dans ressources/scenarios/tests/
  //  doivent rester compilables (contenu inline pour ne pas dépendre du FS dans
  //  l’environnement karma).
  // ============================================================

  it('[F050-MAG-INTRO-T040] magneto_intro_routine.djn compile et l’intro produit la sortie attendue', () => {
    const scenario = `Le titre du jeu est "Test magnéto − intro avec routine".
L'auteur du jeu est "DonjonFI".
L'antichambre est un lieu.
Sa description est "Une antichambre faiblement éclairée.".
La torche est un objet vu dans l'antichambre.
routine annonce_intro:
  dire "{_Bonjour, aventurier !_}{n}Vous pénétrez dans la sombre antichambre.".
fin routine
règle avant commencer le jeu:
  exécuter la routine annonce_intro.
fin règle
` + actions;
    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);
    expect(ctx.sortieIntro).toContain('Bonjour, aventurier');
  });

  it('[F050-MAG-INTRO-T041] magneto_intro_attendre.djn compile et l’intro produit une interruption attendreTouche', () => {
    const scenario = `Le titre du jeu est "Test magnéto − intro avec attendre touche".
L'auteur du jeu est "DonjonFI".
Le hall est un lieu.
Sa description est "Un hall d'entrée glacial.".
règle avant commencer le jeu:
  dire "Bienvenue dans le hall.".
  attendre touche.
  dire "Vos yeux s'habituent à la pénombre.".
fin règle
` + actions;
    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toBe(TypeInterruption.attendreTouche);
  });

  it('[F050-MAG-INTRO-T042] magneto_intro_choisir.djn compile et l’intro produit une interruption attendreChoix', () => {
    const scenario = `Le titre du jeu est "Test magnéto − intro avec choisir".
L'auteur du jeu est "DonjonFI".
Le carrefour est un lieu.
Sa description est "Un carrefour brumeux.".
La boussole est un objet vu dans le carrefour.
règle avant commencer le jeu:
  dire "Bienvenue, voyageur. Avant de commencer, choisissez votre destinée :".
  choisir:
    choix "voie du sage":
      dire "Vous embrassez la voie du sage. La sagesse vous guidera.".
    choix "voie du guerrier":
      dire "Vous embrassez la voie du guerrier. La force sera votre alliée.".
  fin choisir
fin règle
` + actions;
    const ctx = nouvellePartie(scenario);
    jouerIntroDirect(ctx);
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toBe(TypeInterruption.attendreChoix);
  });

  // ============================================================
  //  setEnregistrement quand l’intro est en pause (touche / choisir)
  // ============================================================

  it('[F050-MAG-INTRO-T060] setEnregistrement pendant que l’intro est en pause sur attendre touche : ouvre la modale RAZ', () => {
    // Bug réel : charger un .rec alors que le jeu est en cours et que l’intro
    // est en pause sur « attendre touche » n’affichait rien — ni la modale RAZ,
    // ni le magnéto. setEnregistrement testait seulement `jeu.commence` qui est
    // false dans cet état → branche « jeu pas encore démarré » → on attendait
    // un ngOnChanges qui n’arriverait jamais.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue!".
  attendre touche.
  dire "Allons-y!".
fin règle
` + actions;

    // Lecteur sans fichier : l’intro se lance, pause sur touche.
    const jeu = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeu, undefined);
    expect(lecteur.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreTouche);
    expect(lecteur.jeu.commence).withContext('jeu.commence reste false tant que l’intro est interrompue').toBeFalse();

    // L’utilisateur charge maintenant un .rec.
    const fichierComplet = (() => {
      const jeuRec = TestUtils['genererLeJeu'](scenario, false);
      const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
      (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();
      return (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    })();
    lecteur.setEnregistrement(fichierComplet);

    // L’une des deux issues doit être déclenchée : modale RAZ ou magnéto lancé.
    // Sans le fix, NI l’un NI l’autre : enregistrementEnAttente=true et c’est tout.
    const declenche = lecteur.magnetoDemanderRaz || lecteur.enregistrementActif;
    expect(declenche).withContext('setEnregistrement doit ouvrir la modale RAZ ou lancer le magnéto, pas rester muet').toBeTrue();
  });

  it('[F050-MAG-INTRO-T061] setEnregistrement pendant que l’intro est en pause sur choisir : ouvre la modale RAZ', () => {
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "A".
    choix "Option B":
      dire "B".
  fin choisir
fin règle
` + actions;
    const jeu = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeu, undefined);
    expect(lecteur.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreChoix);

    const fichierMinimal = (lecteur as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    lecteur.setEnregistrement(fichierMinimal);

    const declenche = lecteur.magnetoDemanderRaz || lecteur.enregistrementActif;
    expect(declenche).toBeTrue();
  });

  // ============================================================
  //  Modifier une réponse 'r' (réponse à un choisir)
  // ============================================================

  it('[F050-MAG-INTRO-T070] Modifier une r:a en r:b : type r préservé (PAS converti en c) et routage via handler de choix', () => {
    // Bug réel : modifier une réponse au choisir d'intro produisait une c:b à la place
    // (la réponse était envoyée à envoyerCommande qui traitait 'b' comme commande,
    // et l'étape était écrite en hard-codé `type: 'c'`).
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).commande = 'a';
    (lecteurRec as any).traiterChoixStatiqueJoueur();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: '' }); // sentinelle

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    lecteur.magnetoPasSuivant(); // résout l'attendreChoix via r:a

    // Le curseur est sur la r:a qui vient d'être exécutée.
    expect(lecteur.magnetoEtapeCouranteEstReponse).toBeTrue();

    lecteur.magnetoEntrerModification();
    expect(lecteur.magnetoEdition).toBe('modifier');
    expect((lecteur as any).magnetoEditionTypeOriginal)
      .withContext('type d’origine retenu pour préserver r').toBe('r');
    expect(lecteur.magnetoSaisieCommande).toBe('a');

    // Spy sur les helpers pour confirmer le routage : la valeur doit passer par
    // executerReponseChoix (handler de choix), JAMAIS par executerCommandeAffichee.
    spyOn(lecteur as any, 'executerReponseChoix').and.returnValue('Vous choisissez B.{N}');
    const spyCmd = spyOn(lecteur as any, 'executerCommandeAffichee').and.callThrough();

    lecteur.magnetoSaisieCommande = 'b';
    lecteur.magnetoValiderSaisie();

    expect((lecteur as any).executerReponseChoix).withContext('réponse routée vers handler choix').toHaveBeenCalledWith('b');
    // executerCommandeAffichee n'est PAS appelée pour la valeur 'b' (seulement éventuellement
    // pour des annuler internes, jamais avec 'b').
    const cmdCalls = spyCmd.calls.allArgs().map(args => args[0]);
    expect(cmdCalls).not.toContain('b');

    // L'étape modifiée doit rester de type 'r' (pas 'c').
    const idxR = fichier.etapes.findIndex(e => e.valeur === 'b');
    const modifiee = fichier.etapes[idxR];
    expect(modifiee.type).withContext('type r doit être préservé').toBe('r');
    expect(modifiee.valeur).toBe('b');

    (lecteur as any).enregistrementActif = false;
  });

  it('[F050-MAG-INTRO-T071] magnetoMiniListe : étape r porte estReponse=true (icône dédiée distincte des c et d)', () => {
    const fichier = Object.assign(new FichierEnregistrement(), {
      version: 1, scenario: '', graine: 'g',
      declenchementsFuturs: [],
      etapes: [
        { type: 'g', valeur: 'g' },
        { type: 'c', valeur: 'tester', sortie: 'Q?' },
        { type: 'r', valeur: 'a', sortie: 'A!' },
        { type: 'c', valeur: 'attendre', sortie: '' },
      ],
    }) as FichierEnregistrement;
    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement('div')));
    (lecteur as any).enregistrementEnCours = fichier;
    (lecteur as any).enregistrementActif = true;
    (lecteur as any).magnetoIdx = 3; // après c:tester et r:a → curseur sur c:attendre
    (lecteur as any).magnetoDivergence = null;
    (lecteur as any).magnetoDivergenceIntro = null;
    (lecteur as any).magnetoEdition = 'aucun';
    (lecteur as any).magnetoIdxEnEdition = null;
    (lecteur as any).magnetoDernierTest = null;

    const liste = lecteur.magnetoMiniListe;
    const itemR = liste.find(m => m.commande === 'a');
    const itemC = liste.find(m => m.commande === 'tester');
    const itemAttendre = liste.find(m => m.commande === 'attendre');
    expect(itemR).toBeDefined();
    expect((itemR as any).estReponse).withContext('r:a doit avoir estReponse=true').toBeTrue();
    expect((itemR as any).estDeclenchement).toBeFalse();
    expect((itemC as any).estReponse).withContext('c:tester n’est pas une réponse').toBeFalse();
    expect((itemAttendre as any).estReponse).toBeFalse();
  });

  // ============================================================
  //  Bout-en-bout : générer enregistrement → recharger en magnéto
  // ============================================================

  it('[F050-MAG-INTRO-T050] cycle complet pour intro avec « attendre touche » : générer enregistrement puis re-jouer en magnéto sans divergence', () => {
    // Reproduit le flux utilisateur (cf. magneto_intro_attendre.djn) :
    //  (a) lancer le jeu — l’intro pause sur « attendre touche »
    //  (b) le joueur appuie sur une touche → continuation (« Vos yeux... »)
    //  (c) le joueur joue 2 commandes
    //  (d) « générer enregistrement » produit un .rec (sortieIntro complet)
    //  (e) recharger ce .rec dans un nouveau lecteur en mode magnéto
    //  (f) magnéto démarre sans divergence d’intro fantôme (bypass du touche à l’init).
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Bienvenue dans le hall.".
  attendre touche.
  dire "Vos yeux s'habituent à la pénombre.".
fin règle
` + actions;

    // (a)+(b) : lecteur d’enregistrement.
    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    expect(lecteurRec.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreTouche);
    (lecteurRec as any).terminerInterruptionsBloquantesPourMagneto();

    // (c) : 2 commandes joueur. On les envoie via le pipeline réel pour reproduire fidèlement
    // ce qui finit dans etapesPartie + sortiesParEtape.
    const ctxRec = (lecteurRec as any).partie as ContextePartie;
    ctxRec.ajouterCommandeDansSauvegarde('attendre');
    ctxRec.enregistrerSortieEtapeCourante(ctxRec.com.executerCommande('attendre', false)?.sortie ?? '');
    ctxRec.ajouterCommandeDansSauvegarde('regarder');
    ctxRec.enregistrerSortieEtapeCourante(ctxRec.com.executerCommande('regarder', false)?.sortie ?? '');

    // (d) : « générer enregistrement ».
    const fichier = ctxRec.creerFichierEnregistrement();
    expect(fichier.type).toBe('enregistrement');
    expect(fichier.sortieIntro).toContain('Bienvenue dans le hall');
    expect(fichier.sortieIntro).withContext('continuation post-touche capturée').toContain("Vos yeux");
    const commandes = fichier.etapes.filter(e => e.type === 'c').map(e => e.valeur);
    expect(commandes).toEqual(['attendre', 'regarder']);

    // Round-trip JSON pour reproduire un sauvegarde/import disque.
    const fichierImporte = JSON.parse(JSON.stringify(fichier)) as FichierEnregistrement;

    // (e)+(f) : nouveau lecteur, magnéto à partir du .rec importé.
    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteurReplay = instancierLecteurComplet(jeuReplay, fichierImporte);
    expect(lecteurReplay.enregistrementActif).toBeTrue();
    expect(lecteurReplay.magnetoDivergenceIntro)
      .withContext('intro identique des 2 côtés → pas de divergence')
      .toBeNull();
    expect((lecteurReplay as any).partie.sortieIntro)
      .withContext('replay : continuation post-touche bypassée')
      .toContain("Vos yeux");
  });

  it('[F050-MAG-INTRO-T035] Précédent après Pas suivant sur r:a (choisir en jeu) : magnetoIdx recule sur la c source et c est replanifiée', () => {
    // Bug réel : après avoir répondu 'rouge' à un choisir en jeu, Précédent envoyait
    // 'annuler' qui retire c+r ensemble (la r est dans le même tour que la c), mais
    // magnetoIdx restait sur la r → le replay auto post-reload n'avait pas re-joué la c
    // → l'interruption attendreChoix n'était plus pendante → la r n'avait plus de choisir
    // à résoudre.
    // Correctif : reculer magnetoIdx jusqu'à la c qui précède la r, et programmer un
    // magnetoPasSuivant post-reload pour ramener le choisir pendant (cf. pattern
    // divergence-d, F050-MAG-T034).
    const scenario = `La salle est un lieu.
action tester:
  dire "Rouge ou bleu ?".
  choisir:
    choix "rouge":
      dire "Action.".
    choix "bleu":
      dire "Calme.".
  fin choisir
fin action
` + actions;

    const ctx = TestUtils.genererEtCommencerLeJeu(scenario, false);
    const fichier = Object.assign(new FichierEnregistrement(), {
      version: 1, scenario: '', graine: '',
      declenchementsFuturs: [],
      etapes: [
        { type: 'c', valeur: 'tester', sortie: 'Rouge ou bleu ?{N}' },
        { type: 'r', valeur: 'a', sortie: 'Action.{N}' },
      ],
    }) as FichierEnregistrement;

    const lecteur = new LecteurComponent(document, new ElementRef(document.createElement('div')));
    (lecteur as any).partie = ctx;
    (lecteur as any).jeu = ctx.jeu;
    (lecteur as any).enregistrementEnCours = fichier;
    (lecteur as any).enregistrementActif = true;
    (lecteur as any).enregistrementActions = [];
    (lecteur as any).enregistrementCompteurs = { acceptations: 0, retraits: 0, modifications: 0, ajouts: 0 };
    // Simule l'état post-Pas-suivant sur les deux étapes (c:tester puis r:a).
    ctx.ajouterCommandeDansSauvegarde('tester');
    ctx.ajouterReponseDansSauvegarde('a');
    (lecteur as any).magnetoIdx = 2;

    const calls: string[] = [];
    spyOn(lecteur as any, 'envoyerCommande').and.callFake((_brute: string, n: string) => { calls.push(n); });

    lecteur.magnetoPrecedent();

    expect(calls).withContext('annuler doit être envoyé').toContain('annuler');
    // Avec le fix : magnetoIdx recule sur la c source (idx 0), pas sur la r (idx 1).
    expect(lecteur.magnetoIdx).withContext('magnetoIdx doit pointer sur la c qui originait le choisir').toBe(0);

    (lecteur as any).enregistrementActif = false; // neutralise le setTimeout post-reload
  });

  it('[F050-MAG-INTRO-T036] Précédent après Pas suivant sur r:a (choisir en intro) : magnetoIdx recule sur la r, intro re-fournira le choisir', () => {
    // Cas intro-only : la r est la 1re étape jouable (pas de c source). Précédent recule
    // simplement sur la r ; après reload, l'intro re-pose le choisir et la r résout.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).commande = 'a';
    (lecteurRec as any).traiterChoixStatiqueJoueur();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    // Sentinelle : empêche afficherRecap (qui désactiverait enregistrementActif) après Pas suivant.
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    lecteur.magnetoPasSuivant();
    const idxR = (lecteur as any).magnetoIdxCommande; // position de la r qui vient d'être exécutée

    const calls: string[] = [];
    spyOn(lecteur as any, 'envoyerCommande').and.callFake((_brute: string, n: string) => { calls.push(n); });

    lecteur.magnetoPrecedent();

    expect(calls).toContain('annuler');
    // Pas de c source en amont → magnetoIdx reste sur la r elle-même.
    expect(lecteur.magnetoIdx).toBe(idxR);

    (lecteur as any).enregistrementActif = false;
  });

  it('[F050-MAG-INTRO-T038] lancerAutoTriche en magnéto ne termine PAS l’interruption courante (sinon le choisir d’intro re-posé serait écrasé)', () => {
    // Bug réel reporté par l'utilisateur : après Précédent dans l'intro choisir, le reload
    // re-pose le choisir mais lancerAutoTriche (déclenché par interruptionEnCoursAvantAnnulation)
    // exécutait `this.interruptionEnCours = interruptionEnCoursAvantAnnulation;
    // terminerInterruption(undefined);` → l'attendreChoix fraîchement posée par l'intro
    // était remplacée par l'annulerTour résiduel, puis terminée → la r suivante était
    // traitée comme commande ('a' = abréviation de 'aller').
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;
    const jeu = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeu, undefined);
    // L'intro s'est mise en pause sur attendreChoix.
    expect(lecteur.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreChoix);

    // Simule l'état post-annuler : enregistrementActif est true + interruptionEnCoursAvantAnnulation set.
    (lecteur as any).enregistrementActif = true;
    (lecteur as any).interruptionEnCoursAvantAnnulation = { typeInterruption: 'a', typeContexte: 'tour', tour: {} };
    spyOn(lecteur as any, 'terminerInterruption');

    // Forcer le code à parcourir le chemin "sauvegarde vide" puis la finalisation.
    (lecteur as any).lancerAutoTriche();

    // En magnéto, on ne touche pas à l'interruption courante.
    expect((lecteur as any).terminerInterruption).not.toHaveBeenCalled();
    expect(lecteur.interruptionEnCours?.typeInterruption)
      .withContext('attendreChoix d’intro doit subsister malgré lancerAutoTriche')
      .toBe(TypeInterruption.attendreChoix);
    expect((lecteur as any).interruptionEnCoursAvantAnnulation)
      .withContext('le résidu d’annulerTour doit être effacé pour éviter une 2e tentative')
      .toBeUndefined();
  });

  it('[F050-MAG-INTRO-T039] lancerAutoTriche sauvegarde vide en magnéto : pas de conseil « sauvegarde vide » ni d’avertissement « Aucune commande à exécuter »', () => {
    // En magnéto, ces messages sont du bruit (cas normal post-annuler) et perturbent
    // l'utilisateur (cf. retour de bug : "Aucune commande à exécuter / sauvegarde vide").
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "A".
    choix "Option B":
      dire "B".
  fin choisir
fin règle
` + actions;
    const jeu = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeu, undefined);
    (lecteur as any).enregistrementActif = true;
    (lecteur as any).interruptionEnCoursAvantAnnulation = { typeInterruption: 'a', typeContexte: 'tour', tour: {} };

    spyOn(lecteur as any, 'ajouterConseil');
    spyOn(lecteur as any, 'ajouterContenuHtmlAvecTagsDonjon');

    (lecteur as any).lancerAutoTriche();

    const conseilCalls = ((lecteur as any).ajouterConseil as jasmine.Spy).calls.allArgs();
    const htmlCalls = ((lecteur as any).ajouterContenuHtmlAvecTagsDonjon as jasmine.Spy).calls.allArgs();
    expect(conseilCalls.flat().some((s: any) => typeof s === 'string' && s.includes('sauvegarde vide')))
      .withContext('"sauvegarde vide" ne doit pas être affiché en magnéto').toBeFalse();
    expect(htmlCalls.flat().some((s: any) => typeof s === 'string' && s.includes('Aucune commande à exécuter')))
      .withContext('"Aucune commande à exécuter" ne doit pas être affiché en magnéto').toBeFalse();
  });

  it('[F050-MAG-INTRO-T037] Précédent après Pas suivant sur r:a (choisir intro) : annuler envoyé + magnetoIdx revient sur la r', () => {
    // Invariant vérifiable côté magnéto, sans simuler le reload parent (qui implique
    // recompilation + auto-triche, hors scope unitaire) : après Pas suivant sur la r,
    // Précédent doit envoyer 'annuler' et replacer magnetoIdx sur la r elle-même.
    // Le test manuel correspondant est dans magneto_intro_choisir.djn (cycle Pas suivant
    // → Précédent → Pas suivant doit ramener à la même sortie sans divergence).
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "Vous choisissez A.".
    choix "Option B":
      dire "Vous choisissez B.".
  fin choisir
fin règle
` + actions;

    const jeuRec = TestUtils['genererLeJeu'](scenario, false);
    const lecteurRec = instancierLecteurComplet(jeuRec, undefined);
    (lecteurRec as any).commande = 'a';
    (lecteurRec as any).traiterChoixStatiqueJoueur();
    const fichier = (lecteurRec as any).partie.creerFichierEnregistrement() as FichierEnregistrement;
    // sentinelle pour éviter afficherRecap après Pas suivant.
    fichier.etapes.push({ type: 'c', valeur: 'attendre', sortie: 'Vous attendez.{N}' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    expect(lecteur.interruptionEnCours?.typeInterruption).toBe(TypeInterruption.attendreChoix);

    lecteur.magnetoPasSuivant();
    const idxR = (lecteur as any).magnetoIdxCommande; // position de la r qui vient d'être exécutée

    const calls: string[] = [];
    spyOn(lecteur as any, 'envoyerCommande').and.callFake((_b: string, n: string) => { calls.push(n); });

    lecteur.magnetoPrecedent();

    expect(calls).withContext('annuler envoyé').toContain('annuler');
    // Pas de c source en amont (intro-only) → magnetoIdx revient sur la r.
    expect(lecteur.magnetoIdx).withContext('magnetoIdx reste sur la r d’intro (pas de c source)').toBe(idxR);

    (lecteur as any).enregistrementActif = false;
  });

  it('[F050-MAG-INTRO-T034] Précédent sur divergence intro : ferme le panneau sans envoyer annuler ni modifier sortieIntro', () => {
    // Garantit que reculer sur une divergence d’intro est inoffensif : la sortie d’intro
    // attendue (du .rec) reste intacte ; aucun « annuler » n’est envoyé au moteur.
    const scenario = `La salle est un lieu.
règle avant commencer le jeu:
  dire "Quel est ton choix ?".
  choisir:
    choix "Option A":
      dire "A".
    choix "Option B":
      dire "B".
  fin choisir
fin règle
` + actions;

    const ctxRec = nouvellePartie(scenario);
    jouerIntroDirect(ctxRec);
    const fichier = ctxRec.creerFichierEnregistrement();
    // Forcer une sortie d’intro différente de celle produite par le replay pour ouvrir la
    // divergence intro à l’initialisation du magnéto.
    const sortieRecAttendue = fichier.sortieIntro;
    fichier.sortieIntro = (sortieRecAttendue ?? '') + ' DIVERGENCE-FORCEE';
    fichier.etapes.push({ type: 'r', valeur: 'a', sortie: '' });

    const jeuReplay = TestUtils['genererLeJeu'](scenario, false);
    const lecteur = instancierLecteurComplet(jeuReplay, fichier);
    expect(lecteur.magnetoDivergenceIntro).not.toBeNull();

    const calls: string[] = [];
    (lecteur as any).envoyerCommande = (commandeBrute: string, commandeNettoyee: string) => {
      calls.push(commandeNettoyee);
    };
    const sortieAvant = fichier.sortieIntro;

    lecteur.magnetoPrecedent();

    expect(lecteur.magnetoDivergenceIntro).toBeNull();
    expect(fichier.sortieIntro).toBe(sortieAvant);
    expect(calls).not.toContain('annuler');
  });

});
