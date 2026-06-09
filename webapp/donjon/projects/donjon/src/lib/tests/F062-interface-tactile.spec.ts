import { CompilateurV8, EEtatsBase } from "../../public-api";

import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { LiensElementsUtils } from "../utils/jeu/tactile/liens-elements-utils";
import { VerbesElementsUtils } from "../utils/jeu/tactile/verbes-elements-utils";
import { actions } from "./scenario_actions";

describe('Interface tactile — enrichissement de la sortie en liens', () => {

  it('[F062-T001] le libellé le plus long est prioritaire (« clé rouillée » avant « clé »)', () => {
    const cibles = [
      { ref: 'E1', libelles: ['clé rouillée', 'clé'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>Il y a une clé rouillée ici.</p>', cibles);
    expect(resultat).toEqual('<p>Il y a une <a class="djn-lien-tactile" href="#E1" role="button">clé rouillée</a> ici.</p>');
  });

  it('[F062-T002] correspondance insensible à la casse, texte original préservé', () => {
    const cibles = [
      { ref: 'E1', libelles: ['clé'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>Clé en vue. Une clé brille.</p>', cibles);
    expect(resultat).toEqual('<p><a class="djn-lien-tactile" href="#E1" role="button">Clé</a> en vue. Une <a class="djn-lien-tactile" href="#E1" role="button">clé</a> brille.</p>');
  });

  it('[F062-T003] l’intérieur des balises (attributs) n’est pas enrichi', () => {
    const cibles = [
      { ref: 'E1', libelles: ['clé'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p><img alt="clé" src="clé.png">la clé</p>', cibles);
    expect(resultat).toEqual('<p><img alt="clé" src="clé.png">la <a class="djn-lien-tactile" href="#E1" role="button">clé</a></p>');
  });

  it('[F062-T004] l’intérieur des liens existants et des échos de commande n’est pas enrichi', () => {
    const cibles = [
      { ref: 'E1', libelles: ['clé'] },
    ];
    // lien existant
    let resultat = LiensElementsUtils.enrichirLiens('<p><a href="#L12">clé</a></p>', cibles);
    expect(resultat).toEqual('<p><a href="#L12">clé</a></p>');
    // écho de commande (avec span imbriqué)
    resultat = LiensElementsUtils.enrichirLiens('<p><span class="t-commande"> &gt; prendre la <span>clé</span></span> et la clé</p>', cibles);
    expect(resultat).toEqual('<p><span class="t-commande"> &gt; prendre la <span>clé</span></span> et la <a class="djn-lien-tactile" href="#E1" role="button">clé</a></p>');
  });

  it('[F062-T005] frontières de mots : pas de lien au milieu d’un mot ou d’un mot composé', () => {
    const cibles = [
      { ref: 'D-n', libelles: ['nord'] },
      { ref: 'E1', libelles: ['clé'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>Au nord-est, Clément garde la clémentine.</p>', cibles);
    expect(resultat).toEqual('<p>Au nord-est, Clément garde la clémentine.</p>');
  });

  it('[F062-T006] frontières de mots : l’apostrophe et les accents sont gérés', () => {
    const cibles = [
      { ref: 'E1', libelles: ['épée'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>Vous voyez l’épée du roi.</p>', cibles);
    expect(resultat).toEqual('<p>Vous voyez l’<a class="djn-lien-tactile" href="#E1" role="button">épée</a> du roi.</p>');
  });

});

describe('Interface tactile — cibles et verbes sur une partie', () => {

  function commencerPartie(): ContextePartie {
    const scenario = `
      Le salon est un lieu. "Vous êtes dans le salon."
      La cuisine est un lieu au nord du salon.
      La clé rouillée est un objet dans le salon.
      Le coffre est un contenant fixé, ouvrable et fermé dans le salon.
      La table est un support dans le salon.
      Le garde est une personne dans le salon.
      La fourchette est un objet dans la cuisine.
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    expect(rc.erreurs.length).toEqual(0);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);
    return ctx;
  }

  it('[F062-T101] construireCibles : objets visibles du lieu et sorties, pas les objets d’ailleurs', () => {
    const ctx = commencerPartie();
    const cibles = LiensElementsUtils.construireCibles(ctx.jeu, ctx.eju);

    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const fourchette = ctx.jeu.objets.find(o => o.nom === 'fourchette');

    // la clé du salon est cliquable, avec son libellé complet en premier
    const cibleCle = cibles.find(c => c.ref === 'E' + cle.id);
    expect(cibleCle).toBeTruthy();
    expect(cibleCle.libelles).toEqual(['clé rouillée', 'clé']);

    // la fourchette est dans la cuisine : pas cliquable
    expect(cibles.some(c => c.ref === 'E' + fourchette.id)).toBeFalse();

    // la sortie vers le nord est cliquable
    const cibleNord = cibles.find(c => c.ref === 'D-n');
    expect(cibleNord).toBeTruthy();
    expect(cibleNord.libelles).toEqual(['nord']);

    // le joueur n’est pas cliquable
    expect(cibles.some(c => c.ref === 'E' + ctx.jeu.joueur.id)).toBeFalse();
  });

  it('[F062-T102] listerVerbes : verbes applicables selon les états (donner seulement si possédée)', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');

    // clé posée dans le salon : examiner et prendre proposés, donner pas encore
    let suggestions = VerbesElementsUtils.listerVerbes(cle, ctx.jeu, ctx.eju);
    let infinitifs = suggestions.map(s => s.infinitif);
    expect(infinitifs).toContain('examiner');
    expect(infinitifs).toContain('prendre');
    expect(infinitifs).not.toContain('donner');

    // la commande proposée pour examiner est complète
    const examiner = suggestions.find(s => s.infinitif === 'examiner');
    expect(examiner.attendCela).toBeFalse();
    expect(examiner.commande).toEqual('examiner la clé rouillée');

    // une fois la clé possédée, donner devient disponible (avec second complément)
    ctx.com.executerCommande('prendre la clé', false);
    expect(ctx.jeu.etats.possedeEtatElement(cle, EEtatsBase.possede, ctx.eju)).toBeTrue();

    suggestions = VerbesElementsUtils.listerVerbes(cle, ctx.jeu, ctx.eju);
    const donner = suggestions.find(s => s.infinitif === 'donner');
    expect(donner).toBeTruthy();
    expect(donner.attendCela).toBeTrue();
    expect(donner.prepositionCela).toEqual('à');
  });

  it('[F062-T103] listerVerbes : les deux variantes d’un verbe sont proposées (simple avant 2 compléments)', () => {
    const ctx = commencerPartie();
    const coffre = ctx.jeu.objets.find(o => o.nom === 'coffre');

    const suggestions = VerbesElementsUtils.listerVerbes(coffre, ctx.jeu, ctx.eju);
    // « ouvrir ceci » et « ouvrir ceci avec cela » existent : les deux variantes sont
    // proposées (sinon le constructeur de phrase serait inaccessible pour « ouvrir avec »),
    // la variante simple d’abord
    const ouvrir = suggestions.filter(s => s.infinitif === 'ouvrir');
    expect(ouvrir.length).toEqual(2);
    expect(ouvrir[0].attendCela).toBeFalse();
    expect(ouvrir[1].attendCela).toBeTrue();
    expect(ouvrir[1].prepositionCela).toEqual('avec');
  });

  it('[F062-T104] listerCandidatsCela : candidats visibles, sans ceci ni le joueur', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const garde = ctx.jeu.objets.find(o => o.nom === 'garde');

    ctx.com.executerCommande('prendre la clé', false);
    const donner = VerbesElementsUtils.listerVerbes(cle, ctx.jeu, ctx.eju).find(s => s.infinitif === 'donner');

    const candidats = VerbesElementsUtils.listerCandidatsCela(donner.action, cle, ctx.jeu, ctx.eju);
    expect(candidats.some(c => c.id === garde.id)).toBeTrue();
    expect(candidats.some(c => c.id === cle.id)).toBeFalse();
    expect(candidats.some(c => c.id === ctx.jeu.joueur.id)).toBeFalse();
  });

  it('[F062-T105] construireCommande : prépositions contractées et commande comprise par le moteur', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const garde = ctx.jeu.objets.find(o => o.nom === 'garde');

    ctx.com.executerCommande('prendre la clé', false);
    const donner = VerbesElementsUtils.listerVerbes(cle, ctx.jeu, ctx.eju).find(s => s.infinitif === 'donner');

    const commande = VerbesElementsUtils.construireCommande(donner.action, cle, garde);
    expect(commande).toEqual('donner la clé rouillée au garde');

    // la commande générée est comprise et exécutée par le moteur
    ctx.com.executerCommande(commande, false);
    expect(ctx.jeu.etats.possedeEtatElement(cle, EEtatsBase.possede, ctx.eju)).toBeFalse();
    expect(cle.position.cibleId).toEqual(garde.id);
  });

  it('[F062-T107] listerVerbesGlobaux : actions sans complément directes + actions avec complément si candidat', () => {
    const ctx = commencerPartie();
    const suggestions = VerbesElementsUtils.listerVerbesGlobaux(ctx.jeu, ctx.eju);

    // action sans complément : commande directe
    const attendre = suggestions.find(s => s.infinitif === 'attendre');
    expect(attendre).toBeTruthy();
    expect(attendre.attendCeci).toBeFalse();
    expect(attendre.commande).toEqual('attendre');

    // action avec complément : proposée car des objets visibles correspondent
    const prendre = suggestions.find(s => s.infinitif === 'prendre');
    expect(prendre).toBeTruthy();
    expect(prendre.attendCeci).toBeTrue();

    // les candidats du premier complément sont les éléments visibles compatibles
    const candidats = VerbesElementsUtils.listerCandidatsCible(prendre.action.cibleCeci, ctx.jeu, ctx.eju);
    expect(candidats.some(c => c.intitule.nom === 'clé')).toBeTrue();
    expect(candidats.some(c => c.intitule.nom === 'fourchette')).toBeFalse();

    // « donner » n’est pas proposé : aucun objet possédé
    expect(suggestions.some(s => s.infinitif === 'donner')).toBeFalse();
  });

  it('[F062-T108] préposition spatiale adaptée à la cible (sur un support, dans un contenant)', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const table = ctx.jeu.objets.find(o => o.nom === 'table');
    const coffre = ctx.jeu.objets.find(o => o.nom === 'coffre');

    ctx.com.executerCommande('prendre la clé', false);
    const mettre = VerbesElementsUtils.listerVerbes(cle, ctx.jeu, ctx.eju)
      .find(s => s.infinitif === 'mettre' && s.attendCela);
    expect(mettre).toBeTruthy();

    // le moteur ne tient pas compte de la préposition (« mettre ceci sur/dans/sous cela ») :
    // la commande générée s’adapte à la cible
    expect(VerbesElementsUtils.construireCommande(mettre.action, cle, table)).toEqual('mettre la clé rouillée sur la table');
    expect(VerbesElementsUtils.construireCommande(mettre.action, cle, coffre)).toEqual('mettre la clé rouillée dans le coffre');
    // préposition forcée par le joueur (sélecteur de l’aperçu)
    expect(VerbesElementsUtils.construireCommande(mettre.action, cle, table, 'sous')).toEqual('mettre la clé rouillée sous la table');
    // les 3 prépositions spatiales sont proposées pour cette action
    expect(VerbesElementsUtils.prepositionsCelaPossibles(mettre.action)).toEqual(['dans', 'sur', 'sous']);

    // la commande adaptée est comprise et exécutée par le moteur
    ctx.com.executerCommande('mettre la clé rouillée sur la table', false);
    expect(cle.position.cibleId).toEqual(table.id);
  });

  it('[F062-T109] les actions que les prérequis refuseraient sont reléguées en fin de liste', () => {
    const ctx = commencerPartie();
    ctx.com.executerCommande('regarder', false);
    const table = ctx.jeu.objets.find(o => o.nom === 'table');
    const garde = ctx.jeu.objets.find(o => o.nom === 'garde');

    // parler avec le garde (une personne) : action pertinente, pas reléguée
    const suggestionsGarde = VerbesElementsUtils.listerVerbes(garde, ctx.jeu, ctx.eju);
    const parlerGarde = suggestionsGarde.find(s => s.infinitif === 'parler');
    expect(parlerGarde).toBeTruthy();
    expect(parlerGarde.probablementRefusee).toBeFalse();

    // parler avec la table : le prérequis « si ceci n’est ni une personne ni parlant, refuser »
    // serait vérifié → suggestion marquée et reléguée après les actions pertinentes
    const suggestionsTable = VerbesElementsUtils.listerVerbes(table, ctx.jeu, ctx.eju);
    const parlerTable = suggestionsTable.find(s => s.infinitif === 'parler');
    if (parlerTable) {
      expect(parlerTable.probablementRefusee).toBeTrue();
      const idxParler = suggestionsTable.indexOf(parlerTable);
      const idxExaminer = suggestionsTable.findIndex(s => s.infinitif === 'examiner');
      expect(idxExaminer).toBeGreaterThanOrEqual(0);
      expect(idxParler).toBeGreaterThan(idxExaminer);
    }
  });

  it('[F062-T106] la commande de déplacement générée pour une sortie est comprise', () => {
    const ctx = commencerPartie();
    // commande générée par le lecteur pour un lien de sortie « D-n »
    ctx.com.executerCommande('aller vers le nord', false);
    expect(ctx.eju.curLieu.nom).toEqual('cuisine');
  });

});
