import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { TypeRegle } from "../models/compilateur/type-regle";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { Generateur } from "../utils/compilation/generateur";

const scenario = `        
La salon est un lieu.

La bibliothèque est un contenant ici.
  Sa description est "Une bibliothèque. Un livre de cuisine [@livre de cuisine]dépasse".
  Le livre de cuisine est un objet discret dedans.

Le bureau est un support ici.
  La lettre est un objet dessus.
    Sa description est "En examinant la lettre vous remarquez une pièce cachée dessous.[&pièce]".
    Son texte est "La saviez-vous ? Sous le bureau il y a un parchemin[#parchemin]".
  La pièce est un objet caché sur le bureau.
  Le parchemin est un objet secret en dessous du bureau.
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
--   REGARDER
-- ============
-- a) regarder
action regarder:
  phase exécution:
    dire "{_{*[titre ici]*}_}".
    si l'infinitif de l'action est examiner:
      dire "{n}[description ici][décrire objets ici]".
    sinon
      dire "{n}[description ici][décrire objets ici sauf cachés]".
    fin si.
  phase épilogue:
    dire "{P}[sorties ici]".
fin action
    
-- b) regarder ceci
action regarder ceci:
  définitions:
    ceci est un intitulé.
  phase prérequis:
    si ceci n’est ni un élément ni une direction, refuser "Je ne comprends pas ce que vous voulez regarder.".
    si ceci n’est ni visible ni l’inventaire ni adjacent ni une direction, refuser "Je ne [le ceci] vois pas actuellement.".
  phase exécution:
    si ceci est une personne:
      dire "[description ceci]".
    sinon
      exécuter la commande "examiner [préposition ceci] [intitulé ceci]".
    fin si.
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

-- ===========
--    LIRE
-- ===========
action lire ceci:
  définitions:
    ceci est un objet visible prioritairement lisible.
  phase prérequis:
    si ceci est le joueur, refuser "Vous lisez en vous. Hein ?".
    si aucun texte pour ceci, refuser "Je ne vois rien à lire.".
  phase exécution:
    changer ceci est lu.  
  phase épilogue:
    dire "[texte ceci]".
fin action

`;

describe('Test du jeu avec secret, caché et discret', () => {
  it('Nombre de phrases', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
    expect(phrases).toHaveSize(10); // nombre de phrases
  });

  it('Regarder', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 6); // (joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 6); // (inventaire, joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    ctxCommande = ctxPartie.com.executerCommande("regarder");
    expect(ctxCommande.sortie).toEqual("{_{*La salon*}_}{n}Vous êtes dans la salon.{N}{U}Vous apercevez une bibliothèque et un bureau.{U}Sur le bureau il y a une lettre.{N}{P}Il n’y a pas de sortie.{N}");
  });

  it('examiner bibliothèque et livre', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 6); // (joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 6); // (inventaire, joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let livreCuisine = ctxPartie.jeu.objets[3];
    expect(livreCuisine.nom).toEqual("livre de cuisine");

    // discret
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    // TODO: faut-il empêcher d’examiner un objet pas encore mentionné/vu/connu ?
    // ctxCommande = ctxPartie.com.executerCommande("examiner livre");
    // expect(ctxCommande.sortie).toEqual("Je ne comprends pas ce que vous voulez examiner.{N}");

    ctxCommande = ctxPartie.com.executerCommande("examiner bibliothèque");
    expect(ctxCommande.sortie).toEqual("Une bibliothèque. Un livre de cuisine dépasse Dedans, il y a un livre de cuisine.{N}");
    // => vu
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    ctxCommande = ctxPartie.com.executerCommande("examiner livre");
    expect(ctxCommande.sortie).toEqual("C’est un livre de cuisine.{N}");

    // => connu
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.connuID);
  });

  it('examiner parchemin', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 6); // (joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 6); // (inventaire, joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let bureau = ctxPartie.jeu.objets[4];
    expect(bureau.nom).toEqual("bureau");

    let lettre = ctxPartie.jeu.objets[5];
    expect(lettre.nom).toEqual("lettre");

    let piece = ctxPartie.jeu.objets[6];
    expect(piece.nom).toEqual("piece");

    let parchemin = ctxPartie.jeu.objets[7];
    expect(parchemin.nom).toEqual("parchemin");

    // secret
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    ctxCommande = ctxPartie.com.executerCommande("examiner parchemin");
    expect(ctxCommande.sortie).toEqual("Je ne comprends pas ce que vous voulez examiner.{N}");

    ctxCommande = ctxPartie.com.executerCommande("lire lettre");
    expect(ctxCommande.sortie).toEqual("La saviez-vous ? Sous le bureau il y a un parchemin");
    // => mentionné
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    ctxCommande = ctxPartie.com.executerCommande("examiner sous bureau");
    // => vu
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    ctxCommande = ctxPartie.com.executerCommande("examiner parchemin");
    expect(ctxCommande.sortie).toEqual("C’est un parchemin.{N}");
    // => connu
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.connuID);

  });

  it('examiner pièce', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 6); // (joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 6); // (inventaire, joueur,) bibliothèque, livre de cuisine, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let bureau = ctxPartie.jeu.objets[4];
    expect(bureau.nom).toEqual("bureau");

    let lettre = ctxPartie.jeu.objets[5];
    expect(lettre.nom).toEqual("lettre");

    let piece = ctxPartie.jeu.objets[6];
    expect(piece.nom).toEqual("piece");

    // cachée
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.connuID);

    // // TODO: empêcher d’examiner un objet qui n’est pas encore mentionné/vu/connu ?
    // ctxCommande = ctxPartie.com.executerCommande("examiner pièce");
    // expect(ctxCommande.sortie).toEqual("Je ne comprends pas ce que vous voulez examiner.{N}");

    ctxCommande = ctxPartie.com.executerCommande("examiner lettre");
    expect(ctxCommande.sortie).toEqual("En examinant la lettre vous remarquez une pièce cachée dessous.{N}");

    // mention connu
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.connuID);

    ctxCommande = ctxPartie.com.executerCommande("examiner pièce");
    expect(ctxCommande.sortie).toEqual("C’est une pièce.{N}");

  });
});