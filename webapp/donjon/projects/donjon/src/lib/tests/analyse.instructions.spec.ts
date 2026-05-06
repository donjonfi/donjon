import { AnalyseurCommunUtils } from "../utils/compilation/analyseur/analyseur-commun-utils";
import { ExprReg } from "../utils/compilation/expr-reg";
import { GroupeNominal } from "../models/commun/groupe-nominal";
import { PhraseUtils } from "../utils/commun/phrase-utils";

describe('Epressions régulières − Instruction: verbe + complément', () => {

  // Instruction : verbe + complément

  it('[F002-T001] Phrase:  « continuer l’action »', () => {
    const result = ExprReg.xInstruction.exec("continuer l’action");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("continuer"); // verbe
    expect(result[2]).toEqual("l’action"); // complément
  });

  
  it('[F002-T002] Phrase:  « annuler 1 tour »', () => {
    const result = ExprReg.xInstruction.exec("annuler 1 tour");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("annuler"); // verbe
    expect(result[2]).toEqual("1 tour"); // complément
  });

  it('[F002-T003] Phrase:  « changer le joueur possède la canne à pèche »', () => {
    const result = ExprReg.xInstruction.exec("changer le joueur possède la canne à pèche");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("changer"); // verbe
    expect(result[2]).toEqual("le joueur possède la canne à pèche"); // complément
  });

  it('[F002-T004] Phrase:  « dire  »', () => {
    const result = ExprReg.xInstruction.exec("dire ");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('dire'); // verbe
    expect(result[2]).toBeUndefined(); // complément
  });

  it('[F002-T005] Phrase:  « dire "Bonjour !" »', () => {
    const result = ExprReg.xInstruction.exec('dire "Bonjour !"');
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('dire'); // verbe
    expect(result[2]).toEqual('"Bonjour !"'); // complément
  });

  it('[F002-T006] Phrase:  « attendre touche "Veuillez appuyer sur une touche" »', () => {
    const result = ExprReg.xInstruction.exec('attendre touche "Veuillez appuyer sur une touche"');
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('attendre'); // verbe
    expect(result[2]).toEqual('touche "Veuillez appuyer sur une touche"'); // complément
  });

  it('[F002-T007] Phrase: « changer le score augmente de 1 »', () => {
    const result = ExprReg.xInstruction.exec("changer le score augmente de 1");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("changer"); // verbe
    expect(result[2]).toEqual("le score augmente de 1"); // complément
  });

  it('[F002-T008] Phrase: « changer la liste des suspects contient "Alice" »', () => {
    const result = ExprReg.xInstruction.exec('changer la liste des suspects contient "Alice"');
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('changer'); // verbe
    expect(result[2]).toEqual('la liste des suspects contient "Alice"'); // complément
  });


  it('[F002-T009] Phrase: « Lancer un dé de 4 »', () => {
    const result = ExprReg.xInstruction.exec('Lancer un dé de 4');
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('Lancer'); // verbe
    expect(result[2]).toEqual('un dé de 4'); // complément
  });

  it('[F002-T010] Phrase:  « la pomme est verte » (💥)', () => {
    const result = ExprReg.xInstruction.exec("la pomme est verte");
    expect(result).toBeNull();
  });

  it('[F002-T011] Phrase:  « choisir parmi la liste » (💥)', () => {
    const result = ExprReg.xInstruction.exec("choisir parmi la liste");
    expect(result).toBeNull();
  });

});

describe('Epressions régulières − Complément instruction: Phrase simple avec un verbe conjugé', () => {

  // [le|la|les|...]\(1) (nom|ceci|cela)\(2) [attribut]\(3) [ne|n'|n\u2019|] ([se] verbe conjugé)(4) [pas|plus]\(5) complément(6).

  it('[F002-T012] Phrase:  « la porte secrète n’est plus fermée »', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("la porte secrète n’est plus fermée");
    expect(result).not.toEqual(null);
    expect(result[1]).toEqual("la "); // déterminant
    expect(result[2]).toEqual("porte"); // nom
    expect(result[3]).toEqual("secrète"); // attribut
    expect(result[4]).toEqual("est"); // verbe conjugué
    expect(result[5]).toEqual("plus"); // négation
    expect(result[6]).toEqual("fermée"); // complément
  });

  it('[F002-T013] Phrase:  « la canne à pèche rouge est ouverte »', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("la canne à pèche rouge est ouverte");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("la "); // déterminant
    expect(result[2]).toEqual("canne à pèche"); // nom
    expect(result[3]).toEqual("rouge"); // attribut
    expect(result[4]).toEqual("est"); // verbe conjugué
    expect(result[5]).toBeUndefined() // négation
    expect(result[6]).toEqual("ouverte"); // complément
  });

  it('[F002-T014] Phrase:  « ceci n’est plus vide »', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("ceci n’est plus vide");
    expect(result).not.toBeNull();
    expect(result[1]).toBeUndefined(); // déterminant
    expect(result[2]).toEqual("ceci"); // nom
    expect(result[3]).toBeUndefined(); // attribut
    expect(result[4]).toEqual("est"); // verbe conjugué
    expect(result[5]).toEqual("plus"); // négation
    expect(result[6]).toEqual("vide"); // complément
  });

  it('[F002-T015] Phrase:  « le score augmente de 1 »', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("le score augmente de 1");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual('le '); // déterminant
    expect(result[2]).toEqual("score"); // nom
    expect(result[3]).toBeUndefined(); // attribut
    expect(result[4]).toEqual("augmente"); // verbe conjugué
    expect(result[5]).toBeUndefined(); // négation
    expect(result[6]).toEqual("de 1"); // complément
  });

  it('[F002-T016] Phrase:  « l’action » (💥)', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec("l’action");
    expect(result).toEqual(null);
  });

  it('[F002-T017] Phrase: « touche "enfoncez enter" » (💥)', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec('touche "enfoncez enter"');
    expect(result).toEqual(null);
  });

  it('[F002-T018] Phrase: « touche "Veuillez appuyer sur une touche" » (💥)', () => {
    const result = ExprReg.xSuiteInstructionPhraseAvecVerbeConjugue.exec('touche "Veuillez appuyer sur une touche"');
    expect(result).toEqual(null);
  });

});

describe('Epressions régulières − Complément instruction (1 ou 2 éléments)', () => {

  // => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).

  it('[F002-T019] Complément:  « l\'action »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("l'action");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("l'"); // déterminant 1
    expect(result[2]).toEqual("action"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
    expect(result[4]).toBeUndefined(); // préposition
    expect(result[5]).toBeUndefined(); // déterminant 2
    expect(result[6]).toBeUndefined(); // nom 2
    expect(result[7]).toBeUndefined(); // épithète 2
  });

  it('[F002-T020] Complément:  « le trésor vers le joueur »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("le trésor vers le joueur");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("le "); // déterminant 1
    expect(result[2]).toEqual("trésor"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
    expect(result[4]).toEqual("vers"); // préposition
    expect(result[5]).toEqual("le "); // déterminant 2
    expect(result[6]).toEqual("joueur"); // nom 2
    expect(result[7]).toBeUndefined(); // épithète 2
  });


  it('[F002-T021] Complément:  « l’arc à flèches rouillé avec la flèche rouge »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("l’arc à flèches rouillé avec la flèche rouge");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("l’"); // déterminant 1
    expect(result[2]).toEqual("arc à flèches"); // nom 1
    expect(result[3]).toEqual("rouillé"); // épithète 1
    expect(result[4]).toEqual("avec"); // préposition
    expect(result[5]).toEqual("la "); // déterminant 2
    expect(result[6]).toEqual("flèche"); // nom 2
    expect(result[7]).toEqual("rouge"); // épithète 2
  });

  it('[F002-T022] Complément:  « tomate »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("tomate");
    expect(result).not.toBeNull();
    expect(result[1]).toBeUndefined(); // déterminant 1
    expect(result[2]).toEqual("tomate"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
    expect(result[4]).toBeUndefined(); // préposition
    expect(result[5]).toBeUndefined(); // déterminant 2
    expect(result[6]).toBeUndefined(); // nom 2
    expect(result[7]).toBeUndefined(); // épithète 2
  });

  it('[F002-T023] Complément:  « un dé de 4 »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("un dé de 4");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("un "); // déterminant 1
    expect(result[2]).toEqual("dé"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
    expect(result[4]).toEqual("de"); // préposition
    expect(result[5]).toBeUndefined(); // déterminant 2
    expect(result[6]).toEqual("4"); // nom 2
    expect(result[7]).toBeUndefined(); // épithète 2
  });

  it('[F002-T024] Complément:  « une action »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("une action");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("une "); // déterminant 1
    expect(result[2]).toEqual("action"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
  });

  it('[F002-T025] Complément:  « 1 tour »', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("1 tour");
    expect(result).not.toBeNull();
    expect(result[1]).toEqual("1 "); // déterminant 1
    expect(result[2]).toEqual("tour"); // nom 1
    expect(result[3]).toBeUndefined(); // épithète 1
  });
  
  it('[F002-T026] Complément:  « manger le biscuit » (💥)', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec("manger le biscuit");
    expect(result).toBeNull();
  });

  it('[F002-T027] Complément: « touche "enfoncez enter" » (💥)', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec('touche "enfoncez enter"');
    expect(result).toEqual(null);
  });

  it('[F002-T028] Complément: « touche "Veuillez appuyer sur une touche" » (💥)', () => {
    const result = ExprReg.xComplementInstruction1ou2elements.exec('touche "Veuillez appuyer sur une touche"');
    expect(result).toEqual(null);
  });

});

describe('PhrasesUtils − decomposerInstruction', () => {

  // TYPE UTILISATEUR > NOUVEAU TYPE
  // - un/une(1) nouveauType(2) est un/une typeParent(3) {attributs}(4)

  it('[F002-T029] Instruction :  « continuer l’action »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple("continuer l’action");
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("continuer");
    expect(result.sujet.determinant).toEqual("l’");
    expect(result.sujet.nom).toEqual("action");
    expect(result.sujet).toEqual(new GroupeNominal("l’", "action"));
    expect(result.complement1).toBeNull();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });


  it('[F002-T030] Instruction :  « changer le joueur possède la canne à pèche »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple("changer le joueur possède la canne à pèche");
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("changer");
    expect(result.sujet).toEqual(new GroupeNominal("le ", "joueur"));
    expect(result.verbe).toEqual("possède");
    expect(result.complement1).toBe("la canne à pèche");
    expect(result.sujetComplement1).toEqual(new GroupeNominal("la ", "canne à pèche"));
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T031] Instruction :  « changer la liste des suspects contient "Alice" »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('changer la liste des suspects contient "Alice"');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("changer");
    expect(result.sujet).toEqual(new GroupeNominal('la ', 'liste des suspects'));
    expect(result.verbe).toEqual('contient');
    expect(result.complement1).toBe('"Alice"');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T032] Instruction :  « afficher l’image donjon.png »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('afficher l’image donjon.png');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('afficher');
    expect(result.sujet).toEqual(new GroupeNominal('l’', 'image'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('donjon.png');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  // // TODO: support les chaînes de caractères dynamiques pour pouvoir choisir
  // // dynamiquement le nom de l’image.
  // it('[F002-T033] Instruction :  « afficher l’image "donjon.png" »', () => {
  //   const result = AnalyseurCommunUtils.decomposerInstructionSimple('afficher l’image "donjon.png"');
  //   expect(result).not.toBeNull();
  //   expect(result.infinitif).toEqual('afficher');
  //   expect(result.sujet).toEqual(new GroupeNominal('l’', 'image'));
  //   expect(result.verbe).toBeNull();
  //   expect(result.complement1).toEqual('"donjon.png"');
  //   expect(result.sujetComplement1).toBeUndefined();
  //   expect(result.complement2).toBeUndefined();
  //   expect(result.sujetComplement2).toBeUndefined();
  //   expect(result.sujetComplement3).toBeUndefined();
  //   expect(result.sujetComplement4).toBeUndefined();
  // });

  it('[F002-T034] Instruction :  « afficher image mon_image.gif »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('afficher image mon_image.gif');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('afficher');
    expect(result.sujet).toEqual(new GroupeNominal(undefined, 'image'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('mon_image.gif');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });


  it('[F002-T035] Instruction :  « jouer le son epee »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('jouer le son epee');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('jouer');
    expect(result.sujet).toEqual(new GroupeNominal('le ', 'son'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('epee');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T036] Instruction :  « charger le thème néon.css »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('charger le thème neon.css');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('charger');
    expect(result.sujet).toEqual(new GroupeNominal('le ', 'thème'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('neon.css');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T037] Instruction :  « jouer le son coup_d_epee.flac »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('jouer le son coup_d_epee.flac');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('jouer');
    expect(result.sujet).toEqual(new GroupeNominal('le ', 'son'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('coup_d_epee.flac');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T038] Instruction :  « jouer le son coup_d_epee.wav 3 fois »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('jouer le son coup_d_epee.wav 3 fois');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("jouer");
    expect(result.sujet).toEqual(new GroupeNominal('le ', 'son'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('coup_d_epee.wav');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toEqual("3 fois");
    expect(result.sujetComplement2).toEqual(new GroupeNominal("3 ", "fois"));
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T039] Instruction :  « jouer la musique musique_classique.ogg »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('jouer la musique musique_classique.ogg');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("jouer");
    expect(result.sujet).toEqual(new GroupeNominal('la ', 'musique'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('musique_classique.ogg');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
    expect(result.sujetComplement2).toBeUndefined();
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  it('[F002-T040] Instruction :  « jouer la musique musique_classique.mp3 en boucle »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('jouer la musique musique_classique.mp3 en boucle');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual("jouer");
    expect(result.sujet).toEqual(new GroupeNominal('la ', 'musique'));
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('musique_classique.mp3');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toEqual("en boucle");
    expect(result.sujetComplement2).toEqual(new GroupeNominal(undefined, "en boucle"));
    expect(result.sujetComplement3).toBeUndefined();
    expect(result.sujetComplement4).toBeUndefined();
  });

  
  it('[F002-T041] Instruction :  « attendre touche "Il faut appuyer à présent!" »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre touche "Il faut appuyer à présent!"');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.toString()).toEqual('une touche');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('"Il faut appuyer à présent!"');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T042] Instruction :  « attendre touche »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre touche');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.toString()).toEqual('une touche');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T043] Instruction :  « attendre 1 touche »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 1 touche');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.toString()).toEqual('une touche');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T044] Instruction :  « attendre touche "Veuillez entrer n’importe quelle touche." »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre touche "Veuillez entrer n’importe quelle touche."');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.toString()).toEqual('une touche');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toEqual('"Veuillez entrer n’importe quelle touche."');
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T045] Instruction :  « attendre 0.5 seconde »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 0.5 seconde');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.determinant).toEqual('0.5');
    expect(result.sujet.nom).toEqual('seconde');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  
  it('[F002-T046] Instruction :  « attendre 0,3 secondes »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 0,3 secondes');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.determinant).toEqual('0,3');
    expect(result.sujet.nom).toEqual('secondes');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T047] Instruction :  « attendre 1 seconde »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 1 seconde');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.determinant).toEqual('1');
    expect(result.sujet.nom).toEqual('seconde');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T048] Instruction :  « attendre 5 secondes »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 5 secondes');
    expect(result).not.toBeNull();
    expect(result.infinitif).toEqual('attendre');
    expect(result.sujet.determinant).toEqual('5');
    expect(result.sujet.nom).toEqual('secondes');
    expect(result.verbe).toBeNull();
    expect(result.complement1).toBeUndefined();
    expect(result.sujetComplement1).toBeUndefined();
    expect(result.complement2).toBeUndefined();
  });

  it('[F002-T049] Instruction :  « attendre -1 seconde »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre -1 seconde');
    expect(result).toBeNull();
  });

  it('[F002-T050] Instruction :  « attendre 0 seconde »', () => {
    const result = AnalyseurCommunUtils.decomposerInstructionSimple('attendre 0 seconde');
    expect(result).toBeNull();
  });


});
