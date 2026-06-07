import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

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

});
