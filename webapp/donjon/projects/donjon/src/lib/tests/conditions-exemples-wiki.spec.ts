import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";
import { TypeInterruption } from "../models/jeu/interruption";

// Vérifie que les exemples testables de la référence « Conditions / si » compilent et se
// comportent comme documenté. Les corps ci-dessous sont IDENTIQUES aux .djn de
// ressources/scenarios/exemples/wiki/conditions/ (l'éditeur préfixe les actions de base).

const jouer = (corps: string, commande: string) => {
  const ctx = TestUtils.genererEtCommencerLeJeu(actions + corps);
  return ctx.com.executerCommande(commande, false).sortie;
};

const COMPARATEURS = `
Le stand de tir est un lieu.
Le score est un compteur initialisé à 5.

action évaluer:
  dire "Score : [c score].".
  si le score atteint 5, dire "Vous atteignez la cible.".
  si le score dépasse 5, dire "Vous dépassez la cible.".
  si le score n'atteint pas 5, dire "Vous restez sous la cible.".
  si le score ne dépasse pas 5, dire "Vous ne franchissez pas la cible.".
  si le score vaut 5, dire "Le score vaut exactement cinq.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/évaluer/}.".
fin règle`;

const COMBINER = `
L'atelier est un lieu.
La lampe est un objet allumé dans l'atelier.
La trappe est une porte ouverte ici.
Le diamant est un objet dans l'atelier.
La couronne est un objet dans l'atelier.

action vérifier:
  si la lampe est allumée et si la trappe est ouverte, dire "ET : les deux conditions tiennent.".
  si la lampe est éteinte ou si la trappe est ouverte, dire "OU : au moins une condition tient.".
  si (la lampe est éteinte ou si la lampe est allumée) et si la trappe est ouverte, dire "PARENTHESES : groupe vrai et trappe ouverte.".
  si la lampe est soit allumée soit éteinte, dire "SOIT : exactement un des deux états.".
  si le joueur ne possède ni le diamant ni la couronne, dire "NI : aucun des deux objets.".
  si la trappe est ouverte mais pas fermée, dire "MAISPAS : ouverte mais pas fermée.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/vérifier/}.".
fin règle`;

const BRANCHES = `
Le bureau est un lieu.
Le niveau est un compteur initialisé à 2.

action classer:
  si le niveau vaut 1:
    dire "Niveau 1 : débutant.".
  sinonsi le niveau vaut 2:
    dire "Niveau 2 : confirmé.".
  sinon
    dire "Niveau 3 ou plus : expert.".
  fin si
  si le niveau atteint 2, dire "Forme en ligne : le niveau atteint au moins 2.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/classer/}.".
fin règle`;

const ETRE = `
Le cellier est un lieu.
Le coffre est un contenant fermé dans le cellier.

action inspecter:
  si le coffre est fermé, dire "Le coffre est bien fermé.".
  si le coffre est un contenant, dire "C’est un contenant.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/inspecter/}.".
fin règle`;

const POSSEDER = `
Le vestiaire est un lieu.
La carte magnétique est un objet dans l'inventaire.
Le badge est un objet dans le vestiaire.

action contrôler:
  si le joueur possède la carte magnétique, dire "Vous avez la carte magnétique.".
  si le joueur ne possède pas le badge, dire "Il vous manque le badge.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/contrôler/}.".
fin règle`;

const SE_TROUVER = `
La cuisine est un lieu.
Le buffet est un contenant ouvert dans la cuisine.
La cuillère est un objet dans le buffet.

action localiser:
  si la cuillère se trouve dans le buffet, dire "La cuillère est dans le buffet.".
  si le joueur se trouve dans la cuisine, dire "Vous êtes dans la cuisine.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/localiser/}.".
fin règle`;

const CONTENIR = `
Le marché est un lieu.
Les achats sont une liste.
Elle contient "pain" et "lait".

action consulter:
  si les achats contiennent "pain", dire "Le pain est sur la liste.".
  si les achats ne contiennent pas "beurre", dire "Le beurre manque à la liste.".
  si les achats sont vides, dire "La liste est vide.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/consulter/}.".
fin règle`;

const EXISTER = `
La boutique est un lieu.
La potion est un objet ici.
Son prix est 8.
Le caillou est un objet ici.
Son aperçu est "Un caillou gris traîne sur le comptoir.".

action estimer ceci:
  si un prix existe pour ceci:
    dire "[Intitulé ceci] vaut [prix ceci] pièces.".
  sinon
    dire "[Intitulé ceci] n’a pas de prix affiché.".
  fin si
fin action

action jauger ceci:
  si un aperçu existe pour ceci:
    dire "Quelque chose attire l’œil.".
  sinon
    dire "Rien de spécial.".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez : {/estimer la potion/}, {/jauger le caillou/}.".
fin règle`;

const EXISTER_SORTIE = `
Le salon est un lieu.
La cave est un lieu au sud du salon.
La trappe est une porte fermée au sud du salon.

action sonder:
  si une sortie existe vers le sud:
    dire "Une sortie existe au sud.".
  fin si
  si aucune sortie accessible n’existe vers le sud:
    dire "Mais elle est bloquée par la trappe fermée.".
  fin si
  si aucune sortie n’existe vers le nord:
    dire "Aucune sortie au nord.".
  fin si
fin action

action toquer:
  si une porte existe vers le sud:
    dire "Une porte ferme le passage au sud.".
  fin si
  si aucune porte n’existe vers le nord:
    dire "Aucune porte au nord.".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez : {/sonder/}, {/toquer/}.".
fin règle`;

const SUJETS_SPECIAUX = `
Le belvédère est un lieu.
La lunette est un objet ici.

action méditer:
  si le jeu est commencé:
    dire "La partie est bel et bien commencée.".
  fin si
  si le jeu n’est pas terminé:
    dire "Et elle n’est pas encore terminée.".
  fin si
fin action

règle après prendre la lunette:
  si l’infinitif de l’action est prendre:
    dire "La règle sait que vous venez de la prendre.".
  fin si
fin règle

action abandonner:
  terminer le jeu.
  si le jeu est terminé:
    dire "La partie est finie.".
  fin si
fin action

règle avant commencer le jeu:
  dire "Essayez : {/méditer/}, {/prendre la lunette/}, {/abandonner/}.".
fin règle`;

const REPONSE_LIBRE = `
La taverne est un lieu.

action commander:
  dire "Que souhaitez-vous boire ?".
  choisir librement:
    choix "limonade":
      dire "Une limonade bien fraîche, voilà !".
    autre choix:
      si la réponse commence par "café":
        dire "Le percolateur est en panne, désolé.".
      sinonsi la réponse termine par "ade":
        dire "Une [intitulé réponse] ? Voilà !".
      sinon
        dire "Je ne connais pas la boisson « [intitulé réponse] ».".
      fin si
  fin choisir
fin action

règle avant commencer le jeu:
  dire "Essayez : {/commander/}.".
fin règle`;

// PROBE préposition : « une préposition existe pour cela » dans une action à 2 compléments.
const PREPOSITION = `
Le garage est un lieu.
La vis est un objet ici.
L’étagère est un support ici.

action visser ceci sur cela:
  si une préposition existe pour cela:
    dire "Préposition pour cela : [préposition cela].".
  sinon
    dire "Pas de préposition pour cela.".
  fin si
fin action`;

/** Répond à un « choisir librement » pendant (mime traiterChoixLibreJoueur + terminerInterruption du lecteur). */
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

describe('Exemples wiki — conditions', () => {

  it('[F060-T001] comparateurs : atteint / dépasse / n_atteint / ne_dépasse / vaut (score=5)', () => {
    const s = jouer(COMPARATEURS, 'évaluer');
    expect(s).toContain('atteignez la cible');
    expect(s).toContain('ne franchissez pas la cible');
    expect(s).toContain('vaut exactement cinq');
    expect(s).not.toContain('dépassez la cible');
    expect(s).not.toContain('restez sous la cible');
  });

  it('[F060-T002] combiner : et si / ou si / parenthèses / soit / ni / mais pas', () => {
    const s = jouer(COMBINER, 'vérifier');
    ['ET :', 'OU :', 'PARENTHESES :', 'SOIT :', 'NI :', 'MAISPAS :'].forEach(m => expect(s).toContain(m));
  });

  it('[F060-T003] branches : si / sinonsi / sinon + forme en ligne', () => {
    const s = jouer(BRANCHES, 'classer');
    expect(s).toContain('confirmé');
    expect(s).toContain('Forme en ligne');
    expect(s).not.toContain('débutant');
    expect(s).not.toContain('expert');
  });

  it('[F060-T004] verbe être : état + classe', () => {
    const s = jouer(ETRE, 'inspecter');
    expect(s).toContain('bien fermé');
    expect(s).toContain('un contenant');
  });

  it('[F060-T005] verbe possède (+ négation)', () => {
    const s = jouer(POSSEDER, 'contrôler');
    expect(s).toContain('avez la carte');
    expect(s).toContain('manque le badge');
  });

  it('[F060-T006] verbe se trouve (objet + joueur)', () => {
    const s = jouer(SE_TROUVER, 'localiser');
    expect(s).toContain('dans le buffet');
    expect(s).toContain('dans la cuisine');
  });

  it('[F060-T007] verbe contient (liste : contient / ne contient pas / vides)', () => {
    const s = jouer(CONTENIR, 'consulter');
    expect(s).toContain('pain est sur la liste');
    expect(s).toContain('beurre manque');
    expect(s).not.toContain('La liste est vide');
  });

  it('[F060-T008] verbe existe : propriété (un prix existe pour ceci + sinon)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXISTER);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('estimer la potion', false).sortie).toContain('vaut 8 pièces');
    expect(ctx.com.executerCommande('estimer le caillou', false).sortie).toContain('pas de prix affiché');
  });

  it('[F060-T009] verbe existe : aperçu (un aperçu existe pour ceci + sinon)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXISTER);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('jauger le caillou', false).sortie).toContain('attire l’œil');
    expect(ctx.com.executerCommande('jauger la potion', false).sortie).toContain('Rien de spécial');
  });

  it('[F060-T010] verbe existe : sortie (existe vers / accessible / aucune), sans erreur de tour', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXISTER_SORTIE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const s = ctx.com.executerCommande('sonder', false).sortie;
    expect(s).toContain('Une sortie existe au sud');
    expect(s).toContain('bloquée par la trappe fermée');
    expect(s).toContain('Aucune sortie au nord');
    // garde : la résolution du sujet direction ne doit pas générer
    // « Sujet de la condition pas trouvé : le sud » (fix correspondances.localisation)
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F060-T014] verbe existe : porte (existe vers / aucune), sans erreur de tour', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXISTER_SORTIE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const s = ctx.com.executerCommande('toquer', false).sortie;
    expect(s).toContain('Une porte ferme le passage au sud');
    expect(s).toContain('Aucune porte au nord');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F060-T011] sujets spéciaux : le jeu est commencé / n’est pas terminé', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + SUJETS_SPECIAUX);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const s = ctx.com.executerCommande('méditer', false).sortie;
    expect(s).toContain('bel et bien commencée');
    expect(s).toContain('pas encore terminée');
  });

  it('[F060-T012] sujets spéciaux : l’infinitif de l’action (règle après)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + SUJETS_SPECIAUX);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('prendre la lunette', false).sortie;
    expect(s).toContain('vous venez de la prendre');
  });

  it('[F060-T015] sujets spéciaux : le jeu est terminé (après « terminer le jeu »)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + SUJETS_SPECIAUX);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.com.executerCommande('abandonner', false).sortie).toContain('La partie est finie');
  });

  it('[F060-T013] réponse libre : choix reconnu / commence par / termine par / sinon', () => {
    // choix « limonade » reconnu
    let ctx = TestUtils.genererEtCommencerLeJeu(actions + REPONSE_LIBRE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('commander', false);
    expect(repondreLibrement(ctx, 'limonade')).toContain('limonade bien fraîche');
    // commence par "café"
    ctx = TestUtils.genererEtCommencerLeJeu(actions + REPONSE_LIBRE);
    ctx.com.executerCommande('commander', false);
    expect(repondreLibrement(ctx, 'café au lait')).toContain('percolateur est en panne');
    // termine par "ade" (remarque : espace insécable inséré par le moteur avant « ? » et « ! »,
    // on asserte donc sans la ponctuation)
    ctx = TestUtils.genererEtCommencerLeJeu(actions + REPONSE_LIBRE);
    ctx.com.executerCommande('commander', false);
    const sOrangeade = repondreLibrement(ctx, 'orangeade');
    expect(sOrangeade).toContain('Une orangeade');
    expect(sOrangeade).toContain('Voilà');
    // autre réponse
    ctx = TestUtils.genererEtCommencerLeJeu(actions + REPONSE_LIBRE);
    ctx.com.executerCommande('commander', false);
    expect(repondreLibrement(ctx, 'bière')).toContain('Je ne connais pas la boisson « bière »');
  });

  it('[F060-T016] verbe existe : une préposition existe pour cela (action à 2 compléments)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + PREPOSITION);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    const s = ctx.com.executerCommande('visser la vis sur l’étagère', false).sortie;
    expect(s).toContain('Préposition pour cela : sur');
  });

});
