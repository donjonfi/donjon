import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { TypeRegle } from "../models/compilateur/type-regle";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { Generateur } from "../utils/compilation/generateur";

const scenario = `        
-- "Informations sur le jeu".
Le titre du jeu est "Nouveau jeu".
L’auteur du jeu est "Anonyme".
L’identifiant du jeu est "d0f1c14b-9386-4ac4-b14e-5b0d322b11e4".

-- positionner le joueur dans le jeu
Le joueur se trouve dans le salon.

-- LE SALON
Le salon est un lieu.
Sa description est "Vous êtes dans un salon.".

La table basse est un support dans le salon.
Sa description est "Il s'agit d'une table basse en bois clair.".
interpréter la table comme la table basse.

La pomme est un objet mangeable sur la table basse.
Sa description est "Vous avez envie de croquer dedans.".
action croquer la pomme:
  effacer la pomme.
  dire "Vous n’en avez fait qu’une bouchée !".
fin action

Le magazine de récup est un objet dans le salon.
Son aperçu est "[initialement]Un magazine traîne sur le sol.[fin choix]".
Sa description est "Il s'agit des programmes TV de la semaine dernière.".
Le texte du magazine de récup est "Ils repassent un film de Noël ce soir.".

-- règle: sortie spécifique la 1ère et 2e fois que le joueur prend la pomme.
règle après prendre la pomme:
  si la règle se déclenche pour la première fois:
    dire "D’un geste royal, vous prenez la pomme !".
  sinonsi la règle se déclenche pour la deuxième fois:
    dire "Avec toujours autant de manières, vous prenez la pomme.".
  sinon
    continuer l’action.
  fin si
fin règle
`

const actions = `

-- ======================
--   COMMENCER (jeu, nouvelle partie)
-- ======================
action commencer ceci:

  définitions:
    ceci est un intitulé.
    
  phase prérequis:
    si ceci n’est ni le jeu ni la nouvelle partie, refuser "Je peux seulement commencer le jeu.".
    si ceci est le jeu et si le jeu est commencé, refuser "Le jeu a déjà commencé.".
    
  phase exécution:
    -- début du jeu
    si ceci vaut le jeu:
      -- déplacer le joueur pour provoquer la mise à jour de 
      -- la présence des objets et de l’adjacence des lieux
      changer le joueur se trouve dans ici.
      -- afficher ce que voit le joueur.
      exécuter la commande "regarder".
    -- commencer une nouvelle partie (après la fin du jeu par exemple)
    sinonsi ceci vaut une nouvelle partie:
      exécuter la commande "recommencer".
    fin si
    
fin action


-- ============
--   EXAMINER
-- ============

action examiner ceci:

  définitions:
    Ceci est un intitulé.

  phase prérequis:
    si ceci n’est ni un élément ni une direction, refuser "Je ne comprends pas ce que vous voulez examiner.".
    si ceci n’est ni visible ni l’inventaire ni adjacent ni une direction, refuser "Je ne [le ceci] vois pas actuellement.".
    si ceci est une personne, refuser "Pas sûr qu'[pronom ceci] [v avoir spr ceci] envie de jouer au docteur.".

  phase exécution:
    -- objet
    si ceci est un objet:
      -- > description de l’objet
      dire "[description ceci]".
      -- > statut de l’objet
      si ceci est une porte ou un contenant,
        dire "[statut ceci]".
      -- > contenu de l’objet
      -- >> contenant ouvert
      si ceci est un contenant et ouvert :
        dire "[décrire objets dans ceci]".
      -- >> contenant fermé mais transparent
      sinonsi ceci est un contenant et fermé et transparent :
        dire "[décrire objets dans ceci]".
      -- >> support
      sinonsi ceci est un support :
        si la préposition de ceci est sous:
          dire "[décrire objets sous ceci]".
        sinon
          dire "[décrire objets sur ceci]".
        fin si
      fin si
      -- >> objet pas accessible
      si ceci n'est ni accessible ni l’inventaire, 
        dire " [Pronom ceci] [v être ipr pas ceci] accessible[s ceci].".
      -- >> inventaire
      si ceci est l’inventaire,
        dire "Votre inventaire [si l’inventaire contient un objet]contient : [lister objets inventaire][sinon]est vide.[fin si]".
    -- lieu
    sinonsi ceci est un lieu :
      -- > lieu actuel
      si le joueur se trouve dans ceci:
        exécuter l’action regarder.
      -- > lieu adjacent
      sinon
        -- >> avec aperçu
        si un aperçu existe pour ceci:
          dire "[aperçu ceci]".
        -- >> sans aperçu, déjà visité
        sinonsi ceci est visité:
          dire "Il faudrait y retourner.".
        -- >> sans aperçu, pas encore visité
        sinon
          dire "Pour en savoir plus, il faut s’y rendre.".
        fin si
      fin si
    -- direction
    sinonsi ceci est une direction:
      -- s’il n’y a rien dans cette direction
      si aucune sortie n’existe vers ceci:
        dire "Il n’y a rien dans cette direction.".
      -- s’il y a un lieu avec un aperçu dans cette direction
      sinonsi un aperçu existe pour ceci:
        dire "[aperçu ceci]".
      -- s’il y a un lieu sans aperçu dans cette direction
      sinon
        dire "Le mieux est de se rendre vers [intitulé ceci].".
      fin si
    -- inventaire
    sinonsi ceci est l’inventaire:
      dire "Votre inventaire [si l’inventaire contient un objet]contient : [lister objets inventaire][sinon]est vide.[fin si]".
    -- inconnu
    sinon
      dire "Hum ceci [intitulé ceci] n’est ni un objet ni un lieu. Je ne connais pas.".
    fin si    
fin action

L'aide pour l'action examiner est "{*Examiner*}
  Permet d'examiner un élément du jeu pour avoir des détails ou trouver un objet.
  {+exemples+} :
  > {-examiner {/l'arbre/}-}
  > {-examiner {/l'épée/}}
  {+raccourci+} : {-x-}, {-ex-}".

`;

describe('Test du jeu de base', () => {
    it('Nombre de phrases', () => {

        let ctxAnalyse = new ContexteAnalyseV8();
        let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
        expect(phrases).toHaveSize(28); // nombre de phrases
        expect(phrases[0].morceaux).toHaveSize(2); // Le titre du jeu est "Nouveau jeu".
        expect(phrases[4].morceaux).toHaveSize(1); // Le salon est un lieu.
        expect(phrases[16].morceaux).toHaveSize(2); //Son aperçu est "[initialement]Un magazine traîne sur le sol.[fin choix]".
    });

    it('Action croquer la pomme', () => {
        const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
        expect(rc.actions).toHaveSize(1); // action croquer la pomme
        expect(rc.actions[0].infinitif).toEqual("croquer");
        expect(rc.actions[0].cibleCeci.nom).toEqual("pomme");
        expect(rc.actions[0].phasePrerequis).toHaveSize(0);
        expect(rc.actions[0].phaseExecution).toHaveSize(2);
        expect(rc.actions[0].phaseEpilogue).toHaveSize(0);

        const jeu = Generateur.genererJeu(rc);

        expect(jeu.actions).toHaveSize(1);
        expect(jeu.actions[0].infinitif).toEqual("croquer");
        expect(jeu.actions[0].cibleCeci.nom).toEqual("pomme");
        expect(jeu.actions[0].phasePrerequis).toHaveSize(0);
        expect(jeu.actions[0].phaseExecution).toHaveSize(2);
        expect(jeu.actions[0].phaseEpilogue).toHaveSize(0);
    });

    it('Règle après prendre la pomme', () => {
        const rc = CompilateurV8.analyserScenarioSeul(scenario, false);
        expect(rc.regles).toHaveSize(1); // règle après prendre la pomme
        expect(rc.regles[0].evenements).toHaveSize(1); // prendre la pomme
        expect(rc.regles[0].evenements[0].infinitif).toEqual("prendre");
        expect(rc.regles[0].evenements[0].commandeComprise).toEqual("prendre la pomme");
        expect(rc.regles[0].typeRegle).toEqual(TypeRegle.apres);
        expect(rc.regles[0].instructions).toHaveSize(1); // si la règle se déclenche…

        const jeu = Generateur.genererJeu(rc);

        expect(jeu.auditeurs).toHaveSize(1); // règle après prendre la pomme
        expect(jeu.auditeurs[0].evenements).toHaveSize(1); // prendre la pomme
        expect(jeu.auditeurs[0].evenements[0].infinitif).toEqual("prendre");
        expect(jeu.auditeurs[0].evenements[0].ceci).toEqual("pomme");
        expect(jeu.auditeurs[0].type).toEqual(TypeRegle.apres);
        expect(jeu.auditeurs[0].estRegleActionQuelconque).toBeFalse();
        expect(jeu.auditeurs[0].declenchements).toEqual(0);
        expect(jeu.auditeurs[0].instructions).toHaveSize(1); // si la règle se déclenche…

    });

    it('Objets: pomme', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        console.log("rc.monde.objets=", rc.monde.objets);
        expect(rc.monde.objets).toHaveSize(1+3); // (joueur,) table basse, pomme, magazine
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2+3); // (l’inventaire, le joueur,) table basse, pomme, magazine
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

        // pomme
        const pomme = jeu.objets[3];
        expect(pomme.intitule.nomEpithete).toEqual("pomme");
        expect(pomme.description).toEqual("Vous avez envie de croquer dedans.");
        ctxCommande = ctxPartie.com.executerCommande("examiner pomme");
        expect(ctxCommande.sortie).toEqual("Vous avez envie de croquer dedans.{N}");
    });
    
    it('Objets: magazine', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        console.log("rc.monde.objets=", rc.monde.objets);
        expect(rc.monde.objets).toHaveSize(1+3); // (joueur,) table basse, pomme, magazine
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2+3); // (l’inventaire, le joueur,) table basse, pomme, magazine
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

        // magazine
        const magazine = jeu.objets[4];
        expect(magazine.intitule.nomEpithete).toEqual("magazine de récup");
        expect(magazine.description).toEqual("Il s'agit des programmes TV de la semaine dernière.");
        expect(magazine.apercu).toEqual("[initialement]Un magazine traîne sur le sol.[fin choix]");
        expect(magazine.texte).toEqual("Ils repassent un film de Noël ce soir.");
        ctxCommande = ctxPartie.com.executerCommande("examiner magazine de récup");
        expect(ctxCommande.sortie).toEqual("Il s'agit des programmes TV de la semaine dernière.{N}");
        ctxCommande = ctxPartie.com.executerCommande("examiner magazine");
        expect(ctxCommande.sortie).toEqual("Il s'agit des programmes TV de la semaine dernière.{N}");
    });

    it('Objets: table basse', () => {
        const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
        console.log("rc.monde.objets=", rc.monde.objets);
        expect(rc.monde.objets).toHaveSize(1+3); // (joueur,) table basse, pomme, magazine
        const jeu = Generateur.genererJeu(rc);
        expect(jeu.objets).toHaveSize(2+3); // (l’inventaire, le joueur,) table basse, pomme, magazine
        const ctxPartie = new ContextePartie(jeu);
        let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

        // table basse
        const tableBasse = jeu.objets[2];
        expect(tableBasse.intitule.nomEpithete).toEqual("table basse");
        expect(tableBasse.description).toEqual("Il s'agit d'une table basse en bois clair.");
        ctxCommande = ctxPartie.com.executerCommande("examiner table basse");
        expect(ctxCommande.sortie).toEqual("Il s'agit d'une table basse en bois clair.{N} Dessus, il y a une pomme.{N}");
        ctxCommande = ctxPartie.com.executerCommande("examiner table");
        expect(ctxCommande.sortie).toEqual("Il s'agit d'une table basse en bois clair.{N} Dessus, il y a une pomme.{N}");
    });

});