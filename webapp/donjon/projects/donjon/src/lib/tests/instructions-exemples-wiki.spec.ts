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

const COPIER = `
La forge est un lieu.
Le moule est un contenant ouvert ici.
La médaille est un objet dans le moule.

action mouler:
  copier la médaille dans le moule.
  dire "Une médaille de plus dans le moule.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/mouler/}, puis {/examiner le moule/}.".
fin règle`;

const EXECUTER = `
La crypte est un lieu.
La stèle est un objet ici.
Sa description est "Des runes anciennes y sont gravées.".

action balayer:
  dire "Vous époussetez la crypte du regard :".
  exécuter l'action regarder.
fin action

action réciter:
  exécuter la commande "examiner la stèle".
fin action

action répéter:
  dire "(Vous recommencez.)".
  exécuter la dernière commande.
fin action

règle avant commencer le jeu:
  dire "Essayez : {/balayer/}, {/réciter/}, {/répéter/}.".
fin règle`;

const ECRANS = `
Le bureau est un lieu.

action consulter le journal:
  afficher l'écran temporaire.
  dire "— Journal de bord — Jour 12 : rien à signaler.".
  attendre une touche.
  afficher l'écran précédent.
fin action

règle avant commencer le jeu:
  dire "Essayez : {/consulter le journal/}.".
fin règle`;

const AUDIO = `
activer l'audio.

La scène est un lieu.

action sonner:
  jouer le son bulle.mp3.
  dire "Un tintement résonne.".
fin action

action ambiancer:
  jouer la musique musique_classique.mp3 en boucle.
  dire "La musique s’installe.".
fin action

action couper:
  arrêter la musique progressivement.
  dire "La musique s’éteint.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/sonner/}, {/ambiancer/}, {/couper/}.".
fin règle`;

const ATTENDRE = `
L'observatoire est un lieu.

action contempler:
  dire "Première vision.".
  attendre une touche.
  dire "Seconde vision.".
fin action

action patienter:
  dire "Pssssht…".
  attendre 1 seconde.
  dire "KABOOM !".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/contempler/}, {/patienter/}.".
fin règle`;

const IMAGE = `
Le musée est un lieu.
La statue est un objet ici.
Sa description est "Une réplique de la tour du logo : [image logo.png] Impressionnant.".

action admirer:
  afficher l'image affiche.png.
  dire "L’affiche du musée apparaît à l’écran.".
fin action

règle avant commencer le jeu:
  dire "Essayez : {/admirer/}, {/examiner la statue/}.".
fin règle`;

/** Reprend le tour interrompu (mime terminerInterruption du lecteur, sans choix). */
const continuerApresInterruption = (ctx: any): string => {
  const interruption = ctx.jeu.tamponInterruptions.shift();
  expect(interruption).toBeDefined();
  return ctx.com.continuerLeTourInterrompu(interruption.tour);
};

/** Exécute une commande puis reprend le tour après chaque interruption (écran, touche, délai)
 *  jusqu'à épuisement ; renvoie la sortie concaténée et les types d'interruption rencontrés. */
const executerEnDrainant = (ctx: any, commande: string): { sortie: string, types: string[] } => {
  let sortie = ctx.com.executerCommande(commande, false).sortie ?? '';
  const types: string[] = [];
  let garde = 10;
  while (ctx.jeu.tamponInterruptions.length && garde-- > 0) {
    types.push(ctx.jeu.tamponInterruptions[0].typeInterruption);
    sortie += continuerApresInterruption(ctx) ?? '';
  }
  return { sortie, types };
};

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

  it('[F062-T005] copier : duplication dans un contenant, piles regroupées au pluriel', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + COPIER);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('mouler', false).sortie).toContain('Une médaille de plus');
    ctx.com.executerCommande('mouler', false);
    expect(ctx.com.executerCommande('examiner le moule', false).sortie).toContain('il y a 3 médailles');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F062-T006] exécuter : l’action (unique) / la commande "…" / la dernière commande', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXECUTER);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    ctx.com.executerCommande('regarder', false);
    // exécuter l'action regarder : saute prérequis et règle avant, va à la phase exécution
    const sAction = ctx.com.executerCommande('balayer', false).sortie;
    expect(sAction).toContain('Vous époussetez');
    expect(sAction).toContain('Vous êtes dans la crypte');
    // exécuter la commande "…" : comme si le joueur l'avait tapée
    expect(ctx.com.executerCommande('réciter', false).sortie).toContain('runes anciennes');
    // exécuter la dernière commande : rejoue la commande précédente (ici « réciter »)
    const sDerniere = ctx.com.executerCommande('répéter', false).sortie;
    expect(sDerniere).toContain('(Vous recommencez.)');
    expect(sDerniere).toContain('runes anciennes');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  // garde de calibration : « exécuter l'action <verbe> ceci » échoue si le verbe a des
  // surcharges (ex. examiner dans les actions de base) — « Plusieurs actions compatibles ».
  // La doc wiki ne recommande donc cette forme que pour une action sans surcharge.
  it('[F062-T007] exécuter l’action avec ceci : échec contrôlé si surcharges', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + EXECUTER + `
action palper ceci:
  dire "Vous palpez [intitulé ceci] :".
  exécuter l'action examiner ceci.
fin action`);
    ctx.com.executerCommande('regarder', false);
    expect(ctx.com.executerCommande('palper la stèle', false).sortie)
      .toContain('Plusieurs actions compatibles');
  });

  it('[F062-T008] afficher l’écran temporaire / attendre une touche / écran précédent', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + ECRANS);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const { sortie, types } = executerEnDrainant(ctx, 'consulter le journal');
    expect(sortie).toContain('Journal de bord');
    expect(types).toContain(TypeInterruption.changerEcran);
    expect(types).toContain(TypeInterruption.attendreTouche);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  // ATTENTION : ne PAS exécuter « jouer … » ici — l'instruction lance réellement l'audio,
  // et Chrome headless rejette play() sans interaction utilisateur (NotAllowedError,
  // unhandled rejection → ERROR/DISCONNECTED Karma). On vérifie compilation + arrêter.
  it('[F062-T009] audio : le scénario compile (activer l’audio) et arrêter est sans danger', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + AUDIO);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.jeu.parametres.activerAudio).toBeTrue();
    expect(ctx.com.executerCommande('couper', false).sortie).toContain('La musique s’éteint');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F062-T011] afficher l’image + balise [image …] dans une description', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + IMAGE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    const s1 = ctx.com.executerCommande('admirer', false).sortie;
    expect(s1).toContain('@@image:affiche.png@@');
    expect(s1).toContain('affiche du musée');
    ctx.com.executerCommande('regarder', false);
    const s2 = ctx.com.executerCommande('examiner la statue', false).sortie;
    expect(s2).toContain('@@image:logo.png@@');
    expect(s2).toContain('Impressionnant');
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
  });

  it('[F062-T010] attendre une touche / attendre 1 seconde (interruptions + reprise)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + ATTENDRE);
    expect(ctx.jeu.tamponErreurs).toHaveSize(0);
    expect(ctx.com.executerCommande('contempler', false).sortie).toContain('Première vision');
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toEqual(TypeInterruption.attendreTouche);
    expect(continuerApresInterruption(ctx)).toContain('Seconde vision');
    expect(ctx.com.executerCommande('patienter', false).sortie).toContain('Pssssht');
    expect(ctx.jeu.tamponInterruptions[0]?.typeInterruption).toEqual(TypeInterruption.attendreSecondes);
    expect(ctx.jeu.tamponInterruptions[0]?.nbSecondesAttendre).toEqual(1);
    expect(continuerApresInterruption(ctx)).toContain('KABOOM');
  });

});
