import { CompilateurV8, EEtatsBase } from "../../public-api";

import { ActionsTactilesUtils } from "../utils/jeu/tactile/actions-tactiles-utils";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { LecteurComponent } from "../lecteur/lecteur.component";
import { LiensElementsUtils } from "../utils/jeu/tactile/liens-elements-utils";
import { ELocalisation, Localisation } from "../models/jeu/localisation";
import { MenuTactileComponent } from "../lecteur/tactile/menu-tactile.component";
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
    // écho de commande (<span class="t-commande">) : pas de lien dans une commande tapée
    resultat = LiensElementsUtils.enrichirLiens('<p><span class="t-commande"> &gt; prendre la clé</span></p>', cibles);
    expect(resultat).toEqual('<p><span class="t-commande"> &gt; prendre la clé</span></p>');
    // le texte hors écho reste enrichi
    resultat = LiensElementsUtils.enrichirLiens('<p><span class="t-commande"> &gt; prendre la clé</span> Une clé brille.</p>', cibles);
    expect(resultat).toEqual('<p><span class="t-commande"> &gt; prendre la clé</span> Une <a class="djn-lien-tactile" href="#E1" role="button">clé</a> brille.</p>');
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

  it('[F062-T007] le mot « inventaire » devient un lien de commande (#CMD-inventaire)', () => {
    const cibles = [
      { ref: 'CMD-inventaire', libelles: ['inventaire'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>Consultez votre inventaire.</p>', cibles);
    expect(resultat).toEqual('<p>Consultez votre <a class="djn-lien-tactile" href="#CMD-inventaire" role="button">inventaire</a>.</p>');
  });

  it('[F062-T008] « est » : lien comme direction (l’est / liste des sorties), pas comme verbe « être »', () => {
    const cibles = [
      { ref: 'D-est', libelles: ['est'] },
    ];
    // verbe conjugué « est » : pas de lien
    expect(LiensElementsUtils.enrichirLiens('<p>La porte est ouverte.</p>', cibles))
      .toEqual('<p>La porte est ouverte.</p>');
    // direction précédée du déterminant « l’ » : lien
    expect(LiensElementsUtils.enrichirLiens('<p>Allez vers l’est.</p>', cibles))
      .toEqual('<p>Allez vers l’<a class="djn-lien-tactile" href="#D-est" role="button">est</a>.</p>');
    // direction dans la liste des sorties (« - est ») : lien
    expect(LiensElementsUtils.enrichirLiens('<p>- est : Cuisine</p>', cibles))
      .toEqual('<p>- <a class="djn-lien-tactile" href="#D-est" role="button">est</a> : Cuisine</p>');
  });

  it('[F062-T009] libellé ambigu : choix entre les objets (#AMBIG) plutôt qu’un lien deviné', () => {
    const cibles = [
      { ref: 'E5', libelles: ['porte vitrée', 'porte'] },
      { ref: 'E8', libelles: ['porte du bureau', 'porte'] },
    ];
    const resultat = LiensElementsUtils.enrichirLiens('<p>une porte vitrée et une porte en chêne.</p>', cibles);
    // « porte vitrée » : non ambigu → lien direct ; « porte » seul → désambiguïsation des deux objets
    expect(resultat).toEqual('<p>une <a class="djn-lien-tactile" href="#E5" role="button">porte vitrée</a>'
      + ' et une <a class="djn-lien-tactile" href="#AMBIG-5-8" role="button">porte</a> en chêne.</p>');
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

    // le mot « inventaire » est toujours une cible de commande
    expect(cibles.some(c => c.ref === 'CMD-inventaire')).toBeTrue();
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

  it('[F062-T107] nom composé (« porte du bureau ») : le nom de tête « porte » reste ambigu', () => {
    const scenario = `
      Le hall est un lieu.
      La porte vitrée est une porte ouverte à l’est du hall.
      La porte du bureau est une porte fermée au sud du hall.
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    expect(rc.erreurs.length).toEqual(0);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);

    const porteVitree = jeu.objets.find(o => o.intitule.nom === 'porte');
    const porteBureau = jeu.objets.find(o => o.intitule.nom === 'porte du bureau');
    expect(porteVitree).toBeTruthy();
    expect(porteBureau).toBeTruthy();

    // le moteur désambiguïse « porte » entre les deux portes : le lien tactile doit le refléter
    const cibles = LiensElementsUtils.construireCibles(jeu, ctx.eju);
    const cibleBureau = cibles.find(c => c.ref === 'E' + porteBureau.id);
    // le nom de tête « porte » est exposé même si le nom complet est composé
    expect(cibleBureau.libelles).toContain('porte');

    // « porte » seul → lien de désambiguïsation vers les deux portes ; le nom complet reste direct
    const html = LiensElementsUtils.enrichirLiens('<p>une porte en chêne près de la porte du bureau.</p>', cibles);
    expect(html).toContain('href="#AMBIG-' + porteVitree.id + '-' + porteBureau.id + '" role="button">porte</a>');
    expect(html).toContain('href="#E' + porteBureau.id + '" role="button">porte du bureau</a>');
  });

});

describe('Interface tactile — actions principales et secondaires', () => {

  function commencerPartie(scenarioSupplementaire: string = ''): ContextePartie {
    const scenario = `
      Le salon est un lieu. "Vous êtes dans le salon."
      La clé rouillée est un objet dans le salon.
      Le coffre est un contenant fixé, ouvrable et fermé dans le salon.
      Le garde est une personne dans le salon.
      ${scenarioSupplementaire}
    `;
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, false);
    expect(rc.erreurs.length).toEqual(0);
    const jeu = Generateur.genererJeu(rc);
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande('commencer le jeu', false);
    return ctx;
  }

  it('[F062-T201] défauts du moteur (actions.djn) : objets et personnes', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const garde = ctx.jeu.objets.find(o => o.intitule.nom === 'garde');

    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre']);
    expect(ActionsTactilesUtils.resoudre(cle, 'secondaires', ctx.jeu, ctx.eju)).toEqual(['pousser', 'tirer', 'toucher', 'secouer', 'utiliser']);
    expect(ActionsTactilesUtils.resoudre(garde, 'principales', ctx.jeu, ctx.eju)).toEqual(['regarder', 'parler']);
    expect(ActionsTactilesUtils.resoudre(garde, 'secondaires', ctx.jeu, ctx.eju)).toEqual(['montrer', 'donner', 'interroger']);
  });

  it('[F062-T202] une déclaration sur la classe remplace les défauts du moteur', () => {
    const ctx = commencerPartie(`Les actions principales pour les objets sont examiner et sentir.`);
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    // la classe remplace la base (examiner, sentir) ; « prendre » revient via la règle
    // supplémentaire plus précise « un objet transportable est prendre »
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'sentir', 'prendre']);
  });

  it('[F062-T203] une déclaration sur un élément précis prime sur celle de sa classe', () => {
    const ctx = commencerPartie(`
      Les actions principales pour les personnes sont examiner.
      Les actions principales du garde sont parler et donner.
    `);
    const garde = ctx.jeu.objets.find(o => o.intitule.nom === 'garde');
    expect(ActionsTactilesUtils.resoudre(garde, 'principales', ctx.jeu)).toEqual(['parler', 'donner']);
  });

  it('[F062-T204] « Ajouter … aux actions principales de … » complète la liste héritée (définition)', () => {
    const ctx = commencerPartie(`Ajouter pousser et sentir aux actions principales du garde.`);
    const garde = ctx.jeu.objets.find(o => o.intitule.nom === 'garde');
    // défauts de la classe personne + ajouts de l'élément
    expect(ActionsTactilesUtils.resoudre(garde, 'principales', ctx.jeu, ctx.eju)).toEqual(['regarder', 'parler', 'pousser', 'sentir']);
  });

  it('[F062-T205] « ajouter … aux actions … » en cours de partie (élément et classe)', () => {
    const ctx = commencerPartie(`
      action pratiquer:
        phase exécution:
          ajouter pousser aux actions principales du garde.
          ajouter chanter aux actions principales des personnes.
      fin action
    `);
    const garde = ctx.jeu.objets.find(o => o.intitule.nom === 'garde');
    expect(ActionsTactilesUtils.resoudre(garde, 'principales', ctx.jeu, ctx.eju)).toEqual(['regarder', 'parler']);

    ctx.com.executerCommande('pratiquer', false);
    // ajout sur l'élément + ajout sur la classe, tous deux reflétés sur l'élément
    expect(ActionsTactilesUtils.resoudre(garde, 'principales', ctx.jeu, ctx.eju)).toEqual(['regarder', 'parler', 'chanter', 'pousser']);
  });

  it('[F062-T206] « changer les actions principales de … sont … » remplace la liste en cours de partie', () => {
    const ctx = commencerPartie(`
      action modifier:
        phase exécution:
          changer les actions principales de la clé rouillée sont examiner et pousser.
      fin action
    `);
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre']);

    ctx.com.executerCommande('modifier', false);
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'pousser']);
  });

  it('[F062-T207] infinitif invalide → problème ; infinitif sans action correspondante → conseil', () => {
    // « chapeau » : pas un infinitif → problème à l'analyse
    let rc = CompilateurV8.analyserScenarioEtActions(`
      Le salon est un lieu.
      Les actions principales pour les objets sont examiner et chapeau.
    `, actions, false);
    expect(rc.messages.some(m => m.titre === 'Infinitif attendu')).toBeTrue();

    // « valser » : infinitif valide mais aucune action → simple conseil à la génération
    rc = CompilateurV8.analyserScenarioEtActions(`
      Le salon est un lieu.
      Les actions principales pour les objets sont examiner et valser.
    `, actions, false);
    expect(rc.messages.some(m => m.titre === 'Infinitif attendu')).toBeFalse();
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.tamponConseils.some(c => c.includes('valser'))).toBeTrue();
  });

  it('[F062-T208] « Désactiver le mode mobile. » désactive le paramètre du jeu', () => {
    const ctx = commencerPartie(`Désactiver le mode mobile.`);
    expect(ctx.jeu.parametres.activerInterfaceTactile).toBeFalse();

    // actif par défaut
    const ctxDefaut = commencerPartie();
    expect(ctxDefaut.jeu.parametres.activerInterfaceTactile).toBeTrue();
  });

  it('[F062-T209] listerGroupesVerbes : un groupe par infinitif, niveaux et variantes', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const groupes = VerbesElementsUtils.listerGroupesVerbes(cle, ctx.jeu, ctx.eju);

    // un seul groupe par infinitif
    const infinitifs = groupes.map(g => g.infinitif);
    expect(new Set(infinitifs).size).toEqual(infinitifs.length);

    // principales en tête, dans l'ordre déclaré
    const principales = groupes.filter(g => g.niveau === 'principale').map(g => g.infinitif);
    expect(principales).toEqual(['examiner', 'prendre']);
    expect(groupes.slice(0, principales.length).every(g => g.niveau === 'principale')).toBeTrue();

    // « utiliser » a une variante avec second complément (« utiliser ceci sur cela »)
    const utiliser = groupes.find(g => g.infinitif === 'utiliser');
    expect(utiliser.simple.attendCela).toBeFalse();
    expect(utiliser.variantes.length).toBeGreaterThanOrEqual(1);
    expect(utiliser.variantes.some(v => v.attendCela)).toBeTrue();
  });

  it('[F062-T210] une action définie pour un élément précis est proposée d’office en secondaire', () => {
    const ctx = commencerPartie(`
      action soulever ceci:
        définitions:
          ceci est le coffre.
        phase exécution:
          dire "Il est trop lourd.".
      fin action
    `);
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const groupes = VerbesElementsUtils.listerGroupesVerbes(coffre, ctx.jeu, ctx.eju);

    const soulever = groupes.find(g => g.infinitif === 'soulever');
    expect(soulever).toBeDefined();
    expect(soulever.niveau).toEqual('secondaire');
    // les secondaires promues automatiquement arrivent après les secondaires déclarées
    const idxSoulever = groupes.indexOf(soulever);
    const dernierDeclare = Math.max(...groupes
      .filter(g => g.niveau === 'secondaire' && g !== soulever && !g.simple.probablementRefusee)
      .map(g => groupes.indexOf(g)));
    expect(idxSoulever).toBeGreaterThan(dernierDeclare);

    // mais une déclaration de l'auteur reste prioritaire (principale)
    const ctx2 = commencerPartie(`
      action soulever ceci:
        définitions:
          ceci est le coffre.
        phase exécution:
          dire "Il est trop lourd.".
      fin action
      Les actions principales du coffre sont soulever et examiner.
    `);
    const coffre2 = ctx2.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const groupes2 = VerbesElementsUtils.listerGroupesVerbes(coffre2, ctx2.jeu, ctx2.eju);
    expect(groupes2.find(g => g.infinitif === 'soulever').niveau).toEqual('principale');
  });

  it('[F062-T211] une action sur un intitulé (texte libre) est proposée dans le constructeur global', () => {
    const ctx = commencerPartie(`
      action taper ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Rien ne se passe.".
      fin action
    `);
    const suggestions = VerbesElementsUtils.listerVerbesGlobaux(ctx.jeu, ctx.eju);

    const taper = suggestions.find(s => s.infinitif === 'taper');
    expect(taper).toBeDefined();
    expect(taper.attendCeci).toBeTrue();
    expect(taper.ceciLibre).toBeTrue();

    // une action ciblant un élément n'est pas en texte libre
    const prendre = suggestions.find(s => s.infinitif === 'prendre');
    expect(prendre).toBeDefined();
    expect(prendre.ceciLibre).toBeFalsy();

    // la commande construite (infinitif + texte saisi) est comprise par le moteur
    const sortie = ctx.com.executerCommande('taper anneau', false).sortie;
    expect(sortie).toContain('Rien ne se passe.');
  });

  it('[F062-T212] listerGroupesVerbesGlobaux : un groupe par infinitif, forme simple en premier', () => {
    const ctx = commencerPartie(`
      action taper ceci:
        définitions:
          ceci est un intitulé.
        phase exécution:
          dire "Rien ne se passe.".
      fin action
    `);
    const groupes = VerbesElementsUtils.listerGroupesVerbesGlobaux(ctx.jeu, ctx.eju);

    // un seul groupe par infinitif (le menu n'affiche que les infinitifs)
    const infinitifs = groupes.map(g => g.infinitif);
    expect(new Set(infinitifs).size).toEqual(infinitifs.length);

    // liste triée par ordre alphabétique
    const tries = [...infinitifs].sort((a, b) => a.localeCompare(b, 'fr'));
    expect(infinitifs).toEqual(tries);

    // la forme simple est celle avec le moins de compléments : si elle attend
    // un complément, c'est qu'aucune variante sans complément n'existe
    groupes.forEach(g => {
      if (g.simple.attendCeci) {
        expect(g.variantes.every(v => v.attendCeci)).toBeTrue();
      }
    });

    // « taper » (texte libre) est proposé dans le constructeur global
    const taper = groupes.find(g => g.infinitif === 'taper');
    expect(taper).toBeDefined();
    expect(taper.simple.ceciLibre).toBeTrue();
  });

  it('[F062-T213] construireCibles : les sorties non cardinales sont reconnues par leur verbe (monter, …)', () => {
    const ctx = commencerPartie(`Le grenier est un lieu en haut du salon.`);
    const cibles = LiensElementsUtils.construireCibles(ctx.jeu, ctx.eju);

    const cibleHaut = cibles.find(c => c.ref === 'D-h');
    expect(cibleHaut).toBeTruthy();
    // le texte des sorties affiche « monter : Grenier » → les deux libellés sont cliquables
    expect(cibleHaut.libelles).toEqual(['haut', 'monter']);

    const html = LiensElementsUtils.enrichirLiens('<p>Vous pouvez monter.</p>', cibles);
    expect(html).toContain('href="#D-h"');
  });

  it('[F062-T214] listerGroupesVerbesDirection : aller et regarder principales (défauts actions.djn)', () => {
    const ctx = commencerPartie(`La cave est un lieu au nord du salon.`);
    const groupes = VerbesElementsUtils.listerGroupesVerbesDirection(Localisation.Nord, ctx.jeu, ctx.eju);

    const principales = groupes.filter(g => g.niveau === 'principale').map(g => g.infinitif);
    expect(principales).toEqual(['aller', 'regarder']);

    const aller = groupes.find(g => g.infinitif === 'aller');
    expect(aller.simple.commande).toEqual('aller vers le nord');
    const regarder = groupes.find(g => g.infinitif === 'regarder');
    expect(regarder.simple.commande).toEqual('regarder le nord');

    // les commandes construites sont comprises par le moteur
    const sortieRegarder = ctx.com.executerCommande('regarder le nord', false).sortie;
    expect(sortieRegarder.length).toBeGreaterThan(0);
    ctx.com.executerCommande('aller vers le nord', false);
    expect(ctx.eju.curLieu.nom).toEqual('cave');
  });

  it('[F062-T215] listerVerbesGlobaux : « aller » proposé avec choix de direction quand une sortie existe', () => {
    const ctx = commencerPartie(`La cave est un lieu au nord du salon.`);
    const suggestions = VerbesElementsUtils.listerVerbesGlobaux(ctx.jeu, ctx.eju);

    const aller = suggestions.find(s => s.infinitif === 'aller');
    expect(aller).toBeDefined();
    expect(aller.attendCeci).toBeTrue();
    expect(aller.ceciDirection).toBeTrue();

    const sorties = VerbesElementsUtils.listerSortiesVisibles(ctx.jeu, ctx.eju);
    expect(sorties.map(s => s.id)).toContain(Localisation.Nord.id);
  });

  it('[F062-T216] « Les actions principales supplémentaires pour … sont … » complète la liste héritée', () => {
    const ctx = commencerPartie(`Les actions principales supplémentaires pour les objets sont sentir et pousser.`);
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre', 'sentir', 'pousser']);
  });

  it('[F062-T217] cible classe + état (« les objets ouvrables ») : seuls les éléments dans cet état sont concernés', () => {
    // défauts actions.djn : « Les actions principales supplémentaires pour les objets ouvrables sont ouvrir et fermer. »
    const ctx = commencerPartie();
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');

    // le coffre est ouvrable : il reçoit ouvrir et fermer en plus
    expect(ActionsTactilesUtils.resoudre(coffre, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre', 'ouvrir', 'fermer']);
    // la clé ne l'est pas : liste de la classe seule
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre']);

    // une déclaration classe + état du scénario est plus précise que la classe seule
    const ctx2 = commencerPartie(`Les actions principales pour les objets ouvrables sont ouvrir.`);
    const coffre2 = ctx2.jeu.objets.find(o => o.intitule.nom === 'coffre');
    expect(ActionsTactilesUtils.resoudre(coffre2, 'principales', ctx2.jeu, ctx2.eju)).toEqual(['ouvrir']);
  });

  it('[F062-T219] candidats d’un complément : derniers mentionnés/manipulés d’abord', () => {
    const ctx = commencerPartie(`
      action peser ceci:
        définitions:
          ceci est un objet.
        phase exécution:
          dire "Pesé.".
      fin action
    `);
    const peser = ctx.jeu.actions.find(a => a.infinitif === 'peser');
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');

    // après avoir examiné le coffre, il est proposé en premier
    ctx.com.executerCommande('examiner le coffre', false);
    let candidats = VerbesElementsUtils.listerCandidatsCible(peser.cibleCeci, ctx.jeu, ctx.eju);
    expect(candidats.length).toBeGreaterThanOrEqual(3);
    expect(candidats[0]).toBe(coffre);

    // après avoir pris la clé (manipulée + possédée), c'est elle qui passe en tête
    ctx.com.executerCommande('prendre la clé', false);
    candidats = VerbesElementsUtils.listerCandidatsCible(peser.cibleCeci, ctx.jeu, ctx.eju);
    expect(candidats[0]).toBe(cle);
  });

  it('[F062-T218] défauts des portes : examiner, ouvrir, fermer (pas prendre)', () => {
    const ctx = commencerPartie(`
      La cuisine est un lieu au nord du salon.
      La porte verte est une porte au nord du salon.
    `);
    const porte = ctx.jeu.objets.find(o => o.intitule.nom === 'porte');
    expect(porte).toBeTruthy();
    // défaut actions.djn : « Les actions principales pour les portes sont examiner, ouvrir et fermer. »
    // (remplace la liste héritée des objets : une porte ne se « prend » pas)
    // une porte est déverrouillée par défaut → « verrouiller » s’ajoute (règle « porte déverrouillée »)
    expect(ActionsTactilesUtils.resoudre(porte, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'ouvrir', 'fermer', 'verrouiller']);
  });

  it('[F062-T220] historiqueElementIds : accumulation des objets manipulés (plus récent d’abord, dédoublonné)', () => {
    const ctx = commencerPartie();
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');

    expect(ctx.jeu.historiqueElementIds).toEqual([]);

    // une première manipulation : le coffre en tête
    ctx.com.executerCommande('examiner le coffre', false);
    expect(ctx.jeu.historiqueElementIds).toEqual([coffre.id]);

    // une seconde : la clé devient l'objet le plus récent, le coffre l'avant-dernier
    ctx.com.executerCommande('prendre la clé', false);
    expect(ctx.jeu.historiqueElementIds).toEqual([cle.id, coffre.id]);

    // re-manipuler le coffre : il repasse en tête sans doublon
    ctx.com.executerCommande('examiner le coffre', false);
    expect(ctx.jeu.historiqueElementIds).toEqual([coffre.id, cle.id]);
  });

  it('[F062-T221] avantDernierObjetInteragi : 2e objet distinct le plus récent', () => {
    const ctx = commencerPartie();
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');

    const lecteur = new LecteurComponent(document, { nativeElement: document.createElement('div') } as any);
    (lecteur as any).partie = ctx;

    // aucun objet encore manipulé par une commande : pas d’avant-dernier
    // (le « dernier » peut être l’objet mentionné en dernier dans la description)
    expect(lecteur.avantDernierObjetInteragi).toBeUndefined();

    // un seul objet manipulé : dernier = coffre, pas encore d’avant-dernier
    ctx.com.executerCommande('examiner le coffre', false);
    expect(lecteur.dernierObjetInteragi).toBe(coffre);
    expect(lecteur.avantDernierObjetInteragi).toBeUndefined();

    // deux objets distincts : dernier = clé, avant-dernier = coffre
    ctx.com.executerCommande('prendre la clé', false);
    expect(lecteur.dernierObjetInteragi).toBe(cle);
    expect(lecteur.avantDernierObjetInteragi).toBe(coffre);

    // re-manipuler le coffre : dernier = coffre, avant-dernier = clé (pas de doublon)
    ctx.com.executerCommande('examiner le coffre', false);
    expect(lecteur.dernierObjetInteragi).toBe(coffre);
    expect(lecteur.avantDernierObjetInteragi).toBe(cle);
  });

  it('[F062-T222] aller : proposer le lieu de destination connu plutôt que la direction', () => {
    const ctx = commencerPartie(`
      La cuisine est un lieu au nord du salon.
      Le jardin est un lieu au sud du salon.
    `);

    // visiter la cuisine puis revenir : la cuisine devient connue, pas le jardin
    ctx.com.executerCommande('aller au nord', false);
    ctx.com.executerCommande('aller au sud', false);
    expect(ctx.eju.curLieu.nom).toEqual('salon');

    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.verbeChoisi = { infinitif: 'aller' } as any;

    const nord = Localisation.getLocalisation(ELocalisation.nord);
    const sud = Localisation.getLocalisation(ELocalisation.sud);

    // destination connue (visitée) → on affiche le lieu
    expect(comp.libelleCandidatDirection(nord)).toContain('cuisine');
    // destination inconnue → on garde la direction
    expect(comp.libelleCandidatDirection(sud)).toEqual('le sud');

    // pour un autre verbe que « aller », on garde toujours la direction
    comp.verbeChoisi = { infinitif: 'regarder' } as any;
    expect(comp.libelleCandidatDirection(nord)).toEqual('le nord');
  });

  it('[F062-T223] « Les actions principales sont … » (défaut actions.djn) : règle globale sans cible', () => {
    const ctx = commencerPartie();
    // défaut actions.djn : « Les actions principales sont regarder, inventaire et aller. »
    expect(ActionsTactilesUtils.resoudreGlobales('principales', ctx.jeu)).toEqual(['regarder', 'inventaire', 'aller']);
    // une règle globale ne pollue pas la résolution par élément
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre']);
    // « inventaire » (pseudo-infinitif → « afficher inventaire ») ne déclenche pas de conseil
    expect(ctx.jeu.tamponConseils.some(c => c.includes('inventaire'))).toBeFalse();
  });

  it('[F062-T224] menu global : inventaire/aller/regarder toujours proposés après les dernières commandes', () => {
    const ctx = commencerPartie(`La cuisine est un lieu au nord du salon.`);

    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.cible = null;
    comp.cibleDirection = null;
    comp.dernieresCommandes = ['regarder'];
    comp.ngOnChanges();

    const infinitifs = comp.groupesRecents.map(g => g.infinitif);
    expect(infinitifs).toContain('inventaire');
    expect(infinitifs).toContain('aller');
    expect(infinitifs).toContain('regarder');
    // « regarder » déjà présent via les dernières commandes : pas de doublon
    expect(infinitifs.filter(i => i === 'regarder').length).toBe(1);

    // « inventaire » est un raccourci vers « afficher inventaire », exécutable directement
    const inventaire = comp.groupesRecents.find(g => g.infinitif === 'inventaire');
    expect(inventaire.simple.commande).toEqual('afficher inventaire');
    expect(inventaire.simple.attendCeci).toBeFalse();
    expect(inventaire.simple.attendCela).toBeFalse();
  });

  it('[F062-T225] menu global : un verbe épinglé indisponible n’est pas proposé (« aller » sans sortie)', () => {
    const ctx = commencerPartie(); // salon sans sortie visible
    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.ngOnChanges();

    const infinitifs = comp.groupesRecents.map(g => g.infinitif);
    expect(infinitifs).toContain('inventaire');
    expect(infinitifs).toContain('regarder');
    expect(infinitifs).not.toContain('aller');
  });

  it('[F062-T226] libellé court d’un bouton objet : pronom COD + infinitif (« l’examiner »)', () => {
    const ctx = commencerPartie();
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');       // féminin singulier
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre'); // masculin singulier

    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.libelleObjetCourt = true;

    comp.cible = coffre;
    // élision devant voyelle, quel que soit le genre
    expect(comp.libelleVerbeParties({ infinitif: 'examiner' } as any)).toEqual({ avant: 'l’', infinitif: 'examiner', apres: '' });
    // consonne + masculin → « le »
    expect(comp.libelleVerbeParties({ infinitif: 'prendre' } as any)).toEqual({ avant: 'le ', infinitif: 'prendre', apres: '' });

    // consonne + féminin → « la »
    comp.cible = cle;
    expect(comp.libelleVerbeParties({ infinitif: 'prendre' } as any)).toEqual({ avant: 'la ', infinitif: 'prendre', apres: '' });

    // pluriel → « les » (cible synthétique : seuls genre/nombre comptent)
    comp.cible = { genre: 'm', nombre: 'p' } as any;
    expect(comp.libelleVerbeParties({ infinitif: 'prendre' } as any)).toEqual({ avant: 'les ', infinitif: 'prendre', apres: '' });

    // ancienne version conservée : commande complète, infinitif (premier mot) en gras
    comp.libelleObjetCourt = false;
    comp.cible = coffre;
    expect(comp.libelleVerbeParties({ infinitif: 'examiner', simple: { commande: 'examiner le coffre' } } as any))
      .toEqual({ avant: '', infinitif: 'examiner', apres: ' le coffre' });
  });

  it('[F062-T231] libellé court : préposition spatiale de ceci → adverbe (« monter dessus »), pas pronom COD', () => {
    const ctx = commencerPartie();
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');

    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.libelleObjetCourt = true;
    comp.cible = coffre;

    // « infinitif sur/sous/dans ceci » : adverbe dessus/dessous/dedans (ceci n’est pas un complément direct)
    expect(comp.libelleVerbeParties({ infinitif: 'monter', simple: { action: { prepositionCeci: 'sur' } } } as any))
      .toEqual({ avant: '', infinitif: 'monter', apres: ' dessus' });
    expect(comp.libelleVerbeParties({ infinitif: 'regarder', simple: { action: { prepositionCeci: 'sous' } } } as any))
      .toEqual({ avant: '', infinitif: 'regarder', apres: ' dessous' });
    expect(comp.libelleVerbeParties({ infinitif: 'fouiller', simple: { action: { prepositionCeci: 'dans' } } } as any))
      .toEqual({ avant: '', infinitif: 'fouiller', apres: ' dedans' });

    // sans préposition (complément direct) : le pronom COD est conservé
    expect(comp.libelleVerbeParties({ infinitif: 'pousser', simple: { action: { prepositionCeci: undefined } } } as any))
      .toEqual({ avant: 'le ', infinitif: 'pousser', apres: '' });
    // préposition non spatiale (« parler à ceci ») : pronom COD conservé (pas d’adverbe)
    expect(comp.libelleVerbeParties({ infinitif: 'parler', simple: { action: { prepositionCeci: 'à' } } } as any))
      .toEqual({ avant: 'le ', infinitif: 'parler', apres: '' });
  });

  it('[F062-T227] une règle avant/après ciblant un élément précis propulse le verbe en secondaire', () => {
    // contrôle : « casser » (action par défaut, cible générique, hors listes) est en « autre » sans règle
    const ctxSans = commencerPartie();
    const coffreSans = ctxSans.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const sans = VerbesElementsUtils.listerGroupesVerbes(coffreSans, ctxSans.jeu, ctxSans.eju)
      .find(g => g.infinitif === 'casser');
    expect(sans).toBeDefined();
    expect(sans.niveau).toEqual('autre');

    // une règle avant ciblant le coffre précis → le verbe passe en secondaire
    const ctxAvant = commencerPartie(`
      règle avant casser le coffre:
        dire "Il ne se casse pas.".
      fin règle
    `);
    const coffreAvant = ctxAvant.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const avant = VerbesElementsUtils.listerGroupesVerbes(coffreAvant, ctxAvant.jeu, ctxAvant.eju)
      .find(g => g.infinitif === 'casser');
    expect(avant.niveau).toEqual('secondaire');

    // la règle ne promeut pas le verbe pour un autre objet (la clé reste en « autre »)
    const cle = ctxAvant.jeu.objets.find(o => o.intitule.nom === 'clé');
    const casserCle = VerbesElementsUtils.listerGroupesVerbes(cle, ctxAvant.jeu, ctxAvant.eju)
      .find(g => g.infinitif === 'casser');
    expect(casserCle.niveau).toEqual('autre');
  });

  it('[F062-T228] menu objet : principales + secondaires sur le 1er écran (principales d’abord), autres au 2e', () => {
    // « soulever » défini pour le coffre précis → secondaire ; « casser » reste « autre »
    const ctx = commencerPartie(`
      action soulever ceci:
        définitions:
          ceci est le coffre.
        phase exécution:
          dire "Trop lourd.".
      fin action
    `);
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const comp = new MenuTactileComponent();
    comp.jeu = ctx.jeu;
    comp.eju = ctx.eju;
    comp.cible = coffre;
    comp.ngOnChanges();

    // 1er écran : principales ET secondaires ensemble
    expect(comp.niveauAffiche).toEqual(2);
    const niveaux = comp.groupesAffiches.map(g => g.niveau);
    expect(niveaux).toContain('principale');
    expect(niveaux).toContain('secondaire');
    expect(niveaux).not.toContain('autre');
    // principales avant secondaires dans la liste
    expect(niveaux.lastIndexOf('principale')).toBeLessThan(niveaux.indexOf('secondaire'));
    // « casser » (autre) pas encore affiché
    expect(comp.groupesAffiches.some(g => g.infinitif === 'casser')).toBeFalse();

    // 2e écran : toutes les actions
    expect(comp.plusDeCommandesDisponible).toBeTrue();
    comp.afficherPlusDeCommandes();
    expect(comp.niveauAffiche).toEqual(3);
    expect(comp.groupesAffiches.some(g => g.infinitif === 'casser')).toBeTrue();
    expect(comp.plusDeCommandesDisponible).toBeFalse();
  });

  it('[F062-T229] switch de position du panneau : en haut par défaut, bascule persistée', () => {
    localStorage.removeItem('djn-menu-tactile-position');
    const comp = new MenuTactileComponent();
    // en haut par défaut
    expect(comp.positionHaut).toBeTrue();

    // bascule en bas (préférence écrite)
    comp.basculerPosition();
    expect(comp.positionHaut).toBeFalse();
    expect(localStorage.getItem('djn-menu-tactile-position')).toEqual('bas');

    // une nouvelle ouverture du menu conserve la préférence
    expect(new MenuTactileComponent().positionHaut).toBeFalse();

    // rebascule en haut
    comp.basculerPosition();
    expect(comp.positionHaut).toBeTrue();
    expect(localStorage.getItem('djn-menu-tactile-position')).toEqual('haut');

    localStorage.removeItem('djn-menu-tactile-position');
  });

  it('[F062-T230] anti-spoiler : une action à sujet précis propose toute la classe, pas le seul objet', () => {
    const ctx = commencerPartie(`
      La bille est un objet dans le salon.
      action coincer ceci:
        définitions:
          ceci est la bille.
        phase exécution:
          dire "Coincé.".
      fin action
    `);
    const coincer = VerbesElementsUtils.listerVerbesGlobaux(ctx.jeu, ctx.eju).find(s => s.infinitif === 'coincer');
    expect(coincer).toBeDefined();

    const noms = VerbesElementsUtils.listerCandidatsCible(coincer.action.cibleCeci, ctx.jeu, ctx.eju)
      .map(c => c.intitule.nom);
    // la bille (le vrai sujet) est proposée…
    expect(noms).toContain('bille');
    // …mais aussi d’autres objets de la classe (le coffre), donc pas de spoiler
    expect(noms).toContain('coffre');
    expect(noms.length).toBeGreaterThan(1);
  });

  it('[F062-T231b] cible au singulier (« un objet », « un objet ouvrable », « un lieu ») : équivalente au pluriel', () => {
    const ctx = commencerPartie(`
      Les actions principales supplémentaires pour un objet sont sentir.
      Les actions principales supplémentaires pour un objet ouvrable sont peser.
      Les actions secondaires supplémentaires pour un lieu sont penser et se souvenir.
    `);
    const cle = ctx.jeu.objets.find(o => o.intitule.nom === 'clé');
    const coffre = ctx.jeu.objets.find(o => o.intitule.nom === 'coffre');
    const salon = ctx.jeu.lieux.find(l => l.intitule.nom === 'salon');

    // « un objet » = la classe objet (singulier strictement équivalent au pluriel « les objets »)
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).toEqual(['examiner', 'prendre', 'sentir']);
    // « un objet ouvrable » = classe + état : seul le coffre (ouvrable) reçoit « peser », pas la clé
    expect(ActionsTactilesUtils.resoudre(coffre, 'principales', ctx.jeu, ctx.eju)).toContain('peser');
    expect(ActionsTactilesUtils.resoudre(cle, 'principales', ctx.jeu, ctx.eju)).not.toContain('peser');
    // « un lieu » en secondaire (verbe pronominal « se souvenir » accepté)
    expect(ActionsTactilesUtils.resoudre(salon, 'secondaires', ctx.jeu, ctx.eju)).toEqual(['penser', 'se souvenir']);
  });

});
