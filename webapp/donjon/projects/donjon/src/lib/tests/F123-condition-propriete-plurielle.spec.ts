// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F123] CONDITION SUR PROPRIÉTÉ NUMÉRIQUE AU PLURIEL (issue #256)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// « Les charges de la batterie valent 0. » se déclare, s'affiche et se modifie, mais la condition
// « si les charges de la batterie valent 0: » plantait à l'exécution
// (TypeError: Cannot read properties of null (reading 'nomEpithete') dans siEstVraiSansLien).

import { AnalyseurCondition } from "../utils/compilation/analyseur/analyseur.condition";
import { TestUtils } from "../utils/test-utils";
import { TypeValeur } from "../models/compilateur/type-valeur";
import { TypeInterruption } from "../models/jeu/interruption";
import { actions } from "./scenario_actions";

const declarationsBatterie = `
le salon est un lieu.
le joueur se trouve dans le salon.
la batterie est un objet dans le salon.
les charges de la batterie valent 0.
`;

/** Joue l'action « tester » dont le corps pose l'état « marqué » si la condition est vraie. */
function marqueApresTester(corpsSi: string, avant: string = ''): { marque: boolean, erreurs: string[] } {
  const scenario = `
${declarationsBatterie}
action tester:
  ${avant}
  ${corpsSi}
    changer le joueur est marqué.
  fin si
fin action`;
  const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
  ctx.com.executerCommande("tester", false);
  return {
    marque: ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju),
    erreurs: ctx.jeu.tamponErreurs,
  };
}

describe('[F123] condition propriété plurielle — analyse', () => {

  function conditionSolo(brute: string) {
    const result = AnalyseurCondition.getConditionMulti(brute);
    expect(result).not.toBeNull();
    return result.condition ?? result.sousConditions?.[0]?.condition;
  }

  it('[F123-T001] « les charges de la batterie valent 0 » → sujet non null', () => {
    const cond = conditionSolo('les charges de la batterie valent 0');
    expect(cond).toBeTruthy();
    expect(cond.sujet).toBeTruthy();
    expect(cond.sujet.nomEpithete).toContain('charges');
    expect(cond.verbe).toEqual('valent');
    expect(cond.complement).toEqual('0');
  });

  it('[F123-T002] « les charges de la batterie vaut 0 » → sujet non null', () => {
    const cond = conditionSolo('les charges de la batterie vaut 0');
    expect(cond?.sujet).toBeTruthy();
    expect(cond.verbe).toEqual('vaut');
  });

  it('[F123-T003] « les charges de la batterie dépassent 2 » → sujet non null', () => {
    const cond = conditionSolo('les charges de la batterie dépassent 2');
    expect(cond?.sujet).toBeTruthy();
    expect(cond.verbe).toEqual('dépassent');
  });

  it('[F123-T004] « les charges de la batterie atteignent 2 » → sujet non null', () => {
    const cond = conditionSolo('les charges de la batterie atteignent 2');
    expect(cond?.sujet).toBeTruthy();
    expect(cond.verbe).toEqual('atteignent');
  });

  it('[F123-T005] référence singulier : « l’énergie de la batterie vaut 0 »', () => {
    const cond = conditionSolo('l’énergie de la batterie vaut 0');
    expect(cond?.sujet).toBeTruthy();
    expect(cond.verbe).toEqual('vaut');
  });

  it('[F123-T006] déclaration « les charges de la batterie valent 0. » → propriété de type nombre', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(declarationsBatterie);
    const batterie = ctx.jeu.objets.find(o => o.nom === 'batterie');
    const charges = batterie?.proprietes.find(p => p.nom === 'charges');
    expect(charges).toBeTruthy();
    expect(charges.type).toEqual(TypeValeur.nombre);
    expect(charges.valeur).toEqual('0');
  });

});

describe('[F123] condition propriété plurielle — évaluation', () => {

  it('[F123-T010] « valent 0 » vrai (valeur initiale 0)', () => {
    const res = marqueApresTester('si les charges de la batterie valent 0:');
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T011] « valent 3 » faux (valeur initiale 0)', () => {
    expect(marqueApresTester('si les charges de la batterie valent 3:').marque).toBeFalse();
  });

  it('[F123-T012] « valent 3 » vrai après « changer … valent 3 »', () => {
    expect(marqueApresTester('si les charges de la batterie valent 3:', 'changer les charges de la batterie valent 3.').marque).toBeTrue();
  });

  it('[F123-T013] « vaut 0 » (singulier toléré) vrai', () => {
    expect(marqueApresTester('si les charges de la batterie vaut 0:').marque).toBeTrue();
  });

  it('[F123-T014] « ne valent pas 0 » faux (valeur initiale 0)', () => {
    expect(marqueApresTester('si les charges de la batterie ne valent pas 0:').marque).toBeFalse();
  });

  it('[F123-T015] « dépassent 2 » vrai après « changer … valent 3 »', () => {
    expect(marqueApresTester('si les charges de la batterie dépassent 2:', 'changer les charges de la batterie valent 3.').marque).toBeTrue();
  });

  it('[F123-T016] « dépassent 2 » faux (valeur initiale 0)', () => {
    expect(marqueApresTester('si les charges de la batterie dépassent 2:').marque).toBeFalse();
  });

  it('[F123-T017] « atteignent 3 » vrai après « changer … valent 3 »', () => {
    expect(marqueApresTester('si les charges de la batterie atteignent 3:', 'changer les charges de la batterie valent 3.').marque).toBeTrue();
  });

});

describe('[F123] condition propriété plurielle — scénario complet (issue #256)', () => {

  it('[F123-T020] recharger / utiliser la batterie', () => {
    const scenario = `
${declarationsBatterie}
action recharger:
  si les charges de la batterie valent 0:
    changer les charges de la batterie valent 3.
    dire "Vous rechargez la batterie ([charges batterie] charges).".
  sinon
    dire "La batterie est déjà chargée.".
  fin si
fin action

action utiliser:
  si les charges de la batterie valent 0:
    dire "La batterie est vide.".
  sinon
    changer les charges de la batterie diminuent de 1.
    dire "Il reste [charges batterie] charges.".
  fin si
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    expect(ctx.jeu.tamponErreurs).toEqual([]);

    expect(ctx.com.executerCommande('utiliser', false).sortie).toContain('La batterie est vide.');
    expect(ctx.com.executerCommande('recharger', false).sortie).toContain('Vous rechargez la batterie (3 charges).');
    expect(ctx.com.executerCommande('recharger', false).sortie).toContain('La batterie est déjà chargée.');
    expect(ctx.com.executerCommande('utiliser', false).sortie).toContain('Il reste 2 charges.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});

/** Comme marqueApresTester, avec une balle dont la couleur (propriété texte) est donnée. */
function marqueBalle(corpsSi: string, couleur: string = 'rouge'): { marque: boolean, erreurs: string[] } {
  const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
la balle est un objet dans le salon.
la couleur de la balle est "${couleur}".
action tester:
  ${corpsSi}
    changer le joueur est marqué.
  fin si
fin action`;
  const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
  ctx.com.executerCommande("tester", false);
  return {
    marque: ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju),
    erreurs: ctx.jeu.tamponErreurs,
  };
}

describe('[F123] condition « vaut » sur une propriété texte', () => {

  it('[F123-T030] « vaut rouge » vrai', () => {
    const res = marqueBalle('si la couleur de la balle vaut rouge:');
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T031] « vaut bleu » faux', () => {
    const res = marqueBalle('si la couleur de la balle vaut bleu:');
    expect(res.marque).toBeFalse();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T032] « ne vaut pas bleu » vrai', () => {
    expect(marqueBalle('si la couleur de la balle ne vaut pas bleu:').marque).toBeTrue();
  });

});

describe('[F123] condition « vaut » avec une chaîne entre guillemets', () => {

  // Les guillemets indiquent une chaîne de caractères (et non un intitulé) :
  // ils sont ignorés lors de la comparaison.

  it('[F123-T033] « vaut "rouge" » vrai', () => {
    const res = marqueBalle('si la couleur de la balle vaut "rouge":');
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T034] « vaut "bleu" » faux', () => {
    const res = marqueBalle('si la couleur de la balle vaut "bleu":');
    expect(res.marque).toBeFalse();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T035] « ne vaut pas "bleu" » vrai', () => {
    expect(marqueBalle('si la couleur de la balle ne vaut pas "bleu":').marque).toBeTrue();
  });

  it('[F123-T036] « ne vaut pas "rouge" » faux', () => {
    expect(marqueBalle('si la couleur de la balle ne vaut pas "rouge":').marque).toBeFalse();
  });

  it('[F123-T037] chaîne de plusieurs mots : « vaut "rouge vif" » vrai', () => {
    const res = marqueBalle('si la couleur de la balle vaut "rouge vif":', 'rouge vif');
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T038] chaîne de plusieurs mots : « vaut "rouge" » faux si la valeur est « rouge vif »', () => {
    expect(marqueBalle('si la couleur de la balle vaut "rouge":', 'rouge vif').marque).toBeFalse();
  });

});

describe('[F123] exemples du wiki (forme courte « si …, dire …; »)', () => {

  it('[F123-T040] pluriel et chaîne entre guillemets en forme courte', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
la balle est un objet dans le salon.
la couleur de la balle est "rouge vif".
la batterie est un objet dans le salon.
les charges de la batterie valent 0.
action tester:
  si les charges de la batterie valent 0, dire "La batterie est vide.".
  si la couleur de la balle vaut "rouge", dire "C’est la balle rouge.".
  si la couleur de la balle ne vaut pas "rouge vif", dire "Ce n’est pas la bonne teinte.".
  si la couleur de la balle vaut "rouge vif", dire "Teinte correcte.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).toContain('La batterie est vide.');
    expect(sortie).not.toContain('C’est la balle rouge.');
    expect(sortie).not.toContain('Ce n’est pas la bonne teinte.');
    expect(sortie).toContain('Teinte correcte.');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});

describe('[F123] non-régression — conditions sur un intitulé', () => {

  /** Comme marqueApresTester, sans déclaration (le sujet est l'infinitif de l'action « tester »). */
  function marqueInfinitif(corpsSi: string): { marque: boolean, erreurs: string[] } {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
action tester:
  ${corpsSi}
    changer le joueur est marqué.
  fin si
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    ctx.com.executerCommande("tester", false);
    return {
      marque: ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju),
      erreurs: ctx.jeu.tamponErreurs,
    };
  }

  // --- infinitif de l'action (intitulé avec groupe nominal) ---

  it('[F123-T050] infinitif « vaut tester » (sans guillemets) vrai', () => {
    const res = marqueInfinitif("si l'infinitif de l'action vaut tester:");
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T051] infinitif « vaut sauter » (sans guillemets) faux', () => {
    const res = marqueInfinitif("si l'infinitif de l'action vaut sauter:");
    expect(res.marque).toBeFalse();
    expect(res.erreurs).toEqual([]);
  });

  it('[F123-T052] infinitif « ne vaut pas sauter » vrai', () => {
    expect(marqueInfinitif("si l'infinitif de l'action ne vaut pas sauter:").marque).toBeTrue();
  });

  it('[F123-T053] infinitif « vaut "tester" » (guillemets) vrai', () => {
    expect(marqueInfinitif(`si l'infinitif de l'action vaut "tester":`).marque).toBeTrue();
  });

  it('[F123-T054] infinitif « vaut "sauter" » (guillemets) faux', () => {
    expect(marqueInfinitif(`si l'infinitif de l'action vaut "sauter":`).marque).toBeFalse();
  });

  it('[F123-T055] infinitif « commence par "tes" » vrai / « "sau" » faux', () => {
    expect(marqueInfinitif(`si l'infinitif de l'action commence par "tes":`).marque).toBeTrue();
    expect(marqueInfinitif(`si l'infinitif de l'action commence par "sau":`).marque).toBeFalse();
  });

  it('[F123-T056] infinitif « termine par "ter" » vrai / « "ger" » faux', () => {
    expect(marqueInfinitif(`si l'infinitif de l'action termine par "ter":`).marque).toBeTrue();
    expect(marqueInfinitif(`si l'infinitif de l'action termine par "ger":`).marque).toBeFalse();
  });

  // --- propriété texte (intitulé désormais construit avec un groupe nominal) ---

  it('[F123-T060] propriété texte « commence par "rou" » vrai / « "ble" » faux', () => {
    expect(marqueBalle(`si la couleur de la balle commence par "rou":`).marque).toBeTrue();
    expect(marqueBalle(`si la couleur de la balle commence par "ble":`).marque).toBeFalse();
  });

  it('[F123-T061] propriété texte « termine par "vif" » vrai / « "pâle" » faux', () => {
    expect(marqueBalle(`si la couleur de la balle termine par "vif":`, 'rouge vif').marque).toBeTrue();
    expect(marqueBalle(`si la couleur de la balle termine par "pâle":`, 'rouge vif').marque).toBeFalse();
  });

  it('[F123-T062] propriété texte « est définie » vrai', () => {
    const res = marqueBalle('si la couleur de la balle est définie:');
    expect(res.marque).toBeTrue();
    expect(res.erreurs).toEqual([]);
  });

});

describe('[F123] exemples du wiki — page valoir', () => {

  it('[F123-T041] exemples « Valeur exacte » (forme courte terminée par un point)', () => {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
le score est un compteur initialisé à 100.
le nombre de tours est un compteur initialisé à 3.
action tester:
  si le score vaut 100, dire "C’est un score parfait !".
  si le score ne vaut pas 100, dire "Bien joué ! Sachez qu’il y a moyen de faire encore mieux.".
  si le nombre de tours vaut 15, dire "Le terrible Croquelesgens vous rattrape et vous mange.".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande('tester', false).sortie;
    expect(sortie).toContain('score parfait');
    expect(sortie).not.toContain('Bien joué');
    expect(sortie).not.toContain('Croquelesgens');
    expect(ctx.jeu.tamponErreurs).toEqual([]);
  });

});

describe('[F123] non-régression — intitulés « réponse » et « préposition »', () => {

  /** Répond à un « choisir librement » (copie du helper de conditions-exemples-wiki.spec.ts). */
  const repondreLibrement = (ctx: any, reponse: string): string => {
    const interruption = ctx.jeu.tamponInterruptions.shift();
    expect(interruption?.typeInterruption).toEqual(TypeInterruption.attendreChoixLibre);
    const reponseNettoyee = reponse.trim().toLowerCase();
    let choix = interruption.choix.find((x: any) => x.valeursNormalisees.includes(reponseNettoyee));
    if (choix) {
      const indexValeur = choix.valeursNormalisees.findIndex((x: string) => x == reponseNettoyee);
      interruption.tour.reponse = choix.valeurs[indexValeur];
    } else {
      choix = interruption.choix.find((x: any) => x.valeursNormalisees.includes('autre choix'));
      interruption.tour.reponse = reponse.trim();
    }
    if (choix?.instructions?.length) {
      interruption.tour.reste.unshift(...choix.instructions);
    }
    return ctx.com.continuerLeTourInterrompu(interruption.tour);
  };

  /** Joue « commander », répond librement, et renvoie la sortie (OUI si la condition est vraie). */
  function reponseCondition(condition: string, reponse: string): { sortie: string, erreurs: string[] } {
    const scenario = `
La taverne est un lieu.
action commander:
  dire "Que souhaitez-vous boire ?".
  choisir librement:
    autre choix:
      ${condition}
        dire "OUI".
      sinon
        dire "NON".
      fin si
  fin choisir
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + scenario);
    ctx.com.executerCommande('commander', false);
    const sortie = repondreLibrement(ctx, reponse);
    return { sortie, erreurs: ctx.jeu.tamponErreurs };
  }

  it('[F123-T070] réponse « vaut bière » (sans guillemets) : vrai si « bière », faux si « vin »', () => {
    const oui = reponseCondition('si la réponse vaut bière:', 'bière');
    expect(oui.sortie).toContain('OUI');
    expect(oui.erreurs).toEqual([]);
    expect(reponseCondition('si la réponse vaut bière:', 'vin').sortie).toContain('NON');
  });

  it('[F123-T071] réponse « vaut "bière" » (guillemets) : vrai si « bière », faux si « vin »', () => {
    expect(reponseCondition('si la réponse vaut "bière":', 'bière').sortie).toContain('OUI');
    expect(reponseCondition('si la réponse vaut "bière":', 'vin').sortie).toContain('NON');
  });

  it('[F123-T072] réponse « ne vaut pas "bière" » : vrai si « vin »', () => {
    expect(reponseCondition('si la réponse ne vaut pas "bière":', 'vin').sortie).toContain('OUI');
    expect(reponseCondition('si la réponse ne vaut pas "bière":', 'bière').sortie).toContain('NON');
  });

  /** Joue « visser la vis sur l’étagère » avec la condition donnée. */
  function prepositionCondition(condition: string): { sortie: string, erreurs: string[] } {
    const scenario = `
Le garage est un lieu.
La vis est un objet ici.
L’étagère est un support ici.

action visser ceci sur cela:
  ${condition}
    dire "OUI".
  sinon
    dire "NON".
  fin si
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + scenario);
    ctx.com.executerCommande('regarder', false);
    const sortie = ctx.com.executerCommande('visser la vis sur l’étagère', false).sortie;
    return { sortie, erreurs: ctx.jeu.tamponErreurs };
  }

  it('[F123-T075] préposition de cela « vaut sur » vrai / « vaut dans » faux', () => {
    const oui = prepositionCondition('si la préposition de cela vaut sur:');
    expect(oui.sortie).toContain('OUI');
    expect(oui.erreurs).toEqual([]);
    expect(prepositionCondition('si la préposition de cela vaut dans:').sortie).toContain('NON');
  });

  it('[F123-T076] préposition de cela « vaut "sur" » (guillemets) vrai / « "dans" » faux', () => {
    expect(prepositionCondition('si la préposition de cela vaut "sur":').sortie).toContain('OUI');
    expect(prepositionCondition('si la préposition de cela vaut "dans":').sortie).toContain('NON');
  });

});

describe('[F123] sujet introuvable — erreur claire au lieu d’un plantage', () => {

  /** Joue « tester » ; renvoie la sortie, les erreurs, et si la branche a été prise. */
  function jouerSujetInconnu(corpsSi: string): { sortie: string, erreurs: string[], marque: boolean } {
    const scenario = `
le salon est un lieu.
le joueur se trouve dans le salon.
action tester:
  ${corpsSi}
    changer le joueur est marqué.
  fin si
  dire "FIN".
fin action`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const sortie = ctx.com.executerCommande("tester", false).sortie;
    return {
      sortie,
      erreurs: ctx.jeu.tamponErreurs,
      marque: ctx.jeu.etats.possedeEtatElement(ctx.jeu.joueur, 'marqué', ctx.eju),
    };
  }

  it('[F123-T080] « le nombre de tours vaut 15 » sans compteur déclaré → pas de plantage, erreur signalée', () => {
    let res: { sortie: string, erreurs: string[], marque: boolean };
    expect(() => res = jouerSujetInconnu('si le nombre de tours vaut 15:')).not.toThrow();
    expect(res.marque).toBeFalse();
    expect(res.sortie).toContain('FIN');
    expect(res.erreurs.join('\n')).toContain('le sujet de la condition n’est pas défini');
    expect(res.erreurs.join('\n')).toContain('nombre de tours');
  });

  it('[F123-T081] « le nombre de tours ne vaut pas 15 » sans compteur déclaré → pas de plantage, erreur signalée', () => {
    let res: { sortie: string, erreurs: string[], marque: boolean };
    expect(() => res = jouerSujetInconnu('si le nombre de tours ne vaut pas 15:')).not.toThrow();
    expect(res.sortie).toContain('FIN');
    expect(res.erreurs.join('\n')).toContain('le sujet de la condition n’est pas défini');
    expect(res.erreurs.join('\n')).toContain('nombre de tours');
  });

  it('[F123-T082] « le nombre de charges de la licorne vaut 0 » (élément inconnu) → pas de plantage, erreur signalée', () => {
    let res: { sortie: string, erreurs: string[], marque: boolean };
    expect(() => res = jouerSujetInconnu('si le nombre de charges de la licorne vaut 0:')).not.toThrow();
    expect(res.marque).toBeFalse();
    expect(res.sortie).toContain('FIN');
    expect(res.erreurs.join('\n')).toContain('le sujet de la condition n’est pas défini');
    expect(res.erreurs.join('\n')).toContain('licorne');
  });

  it('[F123-T083] « le nombre d’objets dans la licorne vaut 0 » (élément inconnu) → pas de plantage, erreur signalée', () => {
    let res: { sortie: string, erreurs: string[], marque: boolean };
    expect(() => res = jouerSujetInconnu('si le nombre d’objets dans la licorne vaut 0:')).not.toThrow();
    expect(res.marque).toBeFalse();
    expect(res.sortie).toContain('FIN');
    expect(res.erreurs.join('\n')).toContain('le sujet de la condition n’est pas défini');
    expect(res.erreurs.join('\n')).toContain('licorne');
  });

});
