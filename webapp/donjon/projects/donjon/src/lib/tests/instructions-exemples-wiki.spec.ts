import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";
import { TypeInterruption } from "../models/jeu/interruption";

// Exemples testables de la référence « Instructions » (dire / changer / déplacer / choisir).
// Corps identiques aux .djn de ressources/scenarios/exemples/wiki/instructions/.

const jouer = (corps: string, commande: string) => {
  const ctx = TestUtils.genererEtCommencerLeJeu(actions + corps);
  return ctx.com.executerCommande(commande, false).sortie;
};

const DIRE = `
Le belvédère est un lieu.
Le score est un compteur initialisé à 3.

action proclamer:
  dire "Bienvenue, voyageur.".
  dire "Votre score est de [c score] point[s score].".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/proclamer/}.".
fin règle`;

const CHANGER = `
Le sas est un lieu.
Le coffre est un contenant fermé et verrouillé dans le sas.
La carte est un objet dans le sas.
Le niveau est un compteur initialisé à 0.

action activer:
  changer le coffre n'est plus verrouillé.
  changer le coffre est ouvert.
  changer le joueur possède la carte.
  changer le niveau augmente de 1.
  changer l'intitulé du coffre est "coffre forcé".
  dire "Coffre : [intitulé coffre].".
  si le coffre est ouvert, dire "Le coffre est ouvert.".
  si le joueur possède la carte, dire "Vous tenez la carte.".
  si le niveau vaut 1, dire "Niveau 1 atteint.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/activer/}.".
fin règle`;

const DEPLACER = `
L'entrepôt est un lieu.
Le quai est un lieu. Il est au nord de l'entrepôt.
La caisse est un contenant ouvert dans l'entrepôt.
L'établi est un support dans l'entrepôt.
La clé est un objet dans l'entrepôt.
La lampe est un objet dans l'entrepôt.
Le colis est un objet dans l'entrepôt.
Le joueur est dans l'entrepôt.

action ranger:
  déplacer la clé dans la caisse.
  déplacer la lampe sur l'établi.
  déplacer le colis dans l'inventaire.
  si la clé se trouve dans la caisse, dire "Clé rangée dans la caisse.".
  si la lampe se trouve sur l'établi, dire "Lampe posée sur l’établi.".
  si le joueur possède le colis, dire "Colis emporté.".
fin action

action embarquer:
  déplacer le joueur dans le quai.
  si le joueur se trouve dans le quai, dire "Vous êtes sur le quai.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/ranger/} puis {/embarquer/}.".
fin règle`;

const CHOISIR = `
La taverne est un lieu.

action commander:
  dire "Que voulez-vous boire ?".
  choisir:
    choix "De l’eau":
      dire "Vous buvez de l’eau fraîche.".
    choix "Une bière":
      dire "Vous savourez une bière locale.".
    choix "Rien, merci":
      dire "Vous restez sobre.".
  fin choisir
fin action

règle avant commencer le jeu:
  dire "Essayez : {/commander/}.".
fin règle`;

describe('Exemples wiki — instructions', () => {

  it('[F062-T001] dire : texte simple + balise dynamique', () => {
    const s = jouer(DIRE, 'proclamer');
    expect(s).toContain('Bienvenue, voyageur');
    expect(s).toContain('score est de 3 points');
  });

  it('[F062-T002] changer : état, verrou, possède, compteur, intitulé', () => {
    const s = jouer(CHANGER, 'activer');
    expect(s).toContain('coffre forcé');
    expect(s).toContain('Le coffre est ouvert');
    expect(s).toContain('Vous tenez la carte');
    expect(s).toContain('Niveau 1 atteint');
  });

  it('[F062-T003] déplacer : dans contenant / sur support / inventaire / vers lieu', () => {
    const r = jouer(DEPLACER, 'ranger');
    expect(r).toContain('Clé rangée dans la caisse');
    expect(r).toContain('Lampe posée sur');
    expect(r).toContain('Colis emporté');
    const e = jouer(DEPLACER, 'embarquer');
    expect(e).toContain('sur le quai');
  });

  it('[F062-T004] choisir : crée une question à 3 choix', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + CHOISIR);
    const sortie = ctx.com.executerCommande('commander', false).sortie;
    expect(sortie).toContain('Que voulez-vous boire');
    const interruption = ctx.jeu.tamponInterruptions[0];
    expect(interruption).toBeDefined();
    expect(interruption.typeInterruption).toEqual(TypeInterruption.attendreChoix);
    expect(interruption.choix.length).toEqual(3);
  });

});
