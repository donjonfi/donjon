import { Abreviations } from "../utils/jeu/abreviations";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

// Vérifie que l'exemple testable des pages wiki « Débogage » compile et que les
// commandes de débogage documentées fonctionnent. Le corps ci-dessous est IDENTIQUE
// au .djn de ressources/scenarios/exemples/wiki/debogage/ (l'éditeur préfixe les
// actions de base).
//
// Particularité : « déboguer changer/déplacer/effacer/vider/dire » exige que le
// débogueur soit actif (ContextePartie debogueur=true, comme dans l'éditeur) ;
// l'inspection « déboguer <élément> » fonctionne sans. Les raccourcis (deb, si,
// cd, mv…) sont étendus par Abreviations.obtenirCommandeComplete (côté lecteur).

const TERRAIN_ESSAI = `
La cabane est un lieu.
Sa description est "Une cabane de jardinier. Le jardin est au nord.".
Le jardin est un lieu au nord de la cabane.
Sa description est "Un petit jardin en friche.".
La pomme est un objet mangeable dans la cabane.
Sa description est "Une belle pomme rouge.".
Le coffre est un contenant fermé et ouvrable dans la cabane.
La bille est un objet dans le coffre.

règle avant commencer le jeu:
  dire "Commandes de débogage à essayer : {/deb pomme/}, {/deb coffre/}, {/si le coffre est ouvert/}, {/deb changer le coffre est ouvert/}, {/cd jardin/}, {/mv pomme vers jardin/}, {/deb effacer la bille/}.".
fin règle`;

/** Démarrer la partie avec le débogueur actif (comme dans l'éditeur). */
const commencerAvecDebogueur = (scenario: string): ContextePartie => {
  const jeu = TestUtils.genererLeJeu(scenario);
  const ctx = new ContextePartie(jeu, undefined, false, true);
  HorlogeUtils.reinitialiser();
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  ctx.jeu.commence = true;
  return ctx;
};

/** Étendre les raccourcis comme le fait le lecteur, puis exécuter la commande. */
const executerAvecRaccourcis = (ctx: ContextePartie, commande: string): string => {
  const commandeComplete = Abreviations.obtenirCommandeComplete(commande, ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets);
  return ctx.com.executerCommande(commandeComplete, false).sortie;
};

describe('Exemples wiki — débogage', () => {

  it('[F072-T001] « deb <élément> » — fiche d’inspection d’un objet', () => {
    const ctx = commencerAvecDebogueur(actions + TERRAIN_ESSAI);
    const sortie = executerAvecRaccourcis(ctx, 'deb pomme');
    expect(sortie).withContext(sortie).toContain('pomme');
    expect(sortie.toLowerCase()).withContext(sortie).toContain('mangeable');
  });

  it('[F072-T002] « deb changer » + « si <condition> » — modifier un état puis évaluer une condition', () => {
    const ctx = commencerAvecDebogueur(actions + TERRAIN_ESSAI);
    // au départ le coffre est fermé
    expect(executerAvecRaccourcis(ctx, 'si le coffre est ouvert')).toContain('faux');
    // forcer l'état puis re-tester
    executerAvecRaccourcis(ctx, 'deb changer le coffre est ouvert');
    expect(executerAvecRaccourcis(ctx, 'si le coffre est ouvert')).toContain('vrai');
  });

  it('[F072-T003] « cd <lieu> » et « mv <objet> vers <lieu> » — téléporter le joueur, déplacer un objet', () => {
    const ctx = commencerAvecDebogueur(actions + TERRAIN_ESSAI);
    expect(Abreviations.obtenirCommandeComplete('cd jardin', ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets))
      .toEqual('déboguer changer le joueur se trouve dans le jardin');
    executerAvecRaccourcis(ctx, 'cd jardin');
    expect(executerAvecRaccourcis(ctx, 'si le joueur se trouve dans le jardin')).toContain('vrai');
    executerAvecRaccourcis(ctx, 'mv pomme vers jardin');
    expect(executerAvecRaccourcis(ctx, 'si la pomme se trouve dans le jardin')).toContain('vrai');
  });

  it('[F072-T004] « deb dire » — afficher une propriété au runtime', () => {
    const ctx = commencerAvecDebogueur(actions + TERRAIN_ESSAI);
    const sortie = ctx.com.executerCommande('déboguer dire "[description pomme]"', false).sortie;
    expect(sortie).withContext(sortie).toContain('Une belle pomme rouge.');
  });

  it('[F072-T005] « déboguer changer » est inactif quand le débogueur ne l’est pas (jeu publié)', () => {
    const ctx = TestUtils.genererEtCommencerLeJeu(actions + TERRAIN_ESSAI);
    ctx.com.executerCommande('déboguer changer le coffre est ouvert', false);
    // le coffre est resté fermé : l'instruction de débogage n'a pas été exécutée
    const ctxDeb = ctx.com.executerCommande('ouvrir le coffre', false).sortie;
    expect(ctxDeb).withContext(ctxDeb).not.toContain('déjà ouvert');
  });

});
