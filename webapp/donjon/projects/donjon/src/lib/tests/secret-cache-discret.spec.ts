import { ContexteAnalyseV8 } from "../models/compilateur/contexte-analyse-v8";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { ClasseUtils } from "../utils/commun/classe-utils";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { CompilateurV8Utils } from "../utils/compilation/compilateur-v8-utils";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenario = `        
Le salon est un lieu.

La bibliothèque est un contenant ici.
  Sa description est "Une bibliothèque. Un livre de cuisine [@livre de cuisine]dépasse.".
  Le livre de cuisine est un objet dedans.
  Le livre de sciences est un objet discret dedans.

La balle est un objet discret dans le salon.

Le bureau est un support ici.
  La lettre est un objet dessus.
    Sa description est "En examinant la lettre vous remarquez une pièce cachée dessous.[@pièce][&pièce]".
    Son texte est "La saviez-vous ? Sous le bureau il y a un parchemin[#parchemin]".
  La pièce est un objet caché sur le bureau.
  Le parchemin est un objet secret en dessous du bureau.
`

// états
// mentionneID: 3, vuID: 4, 
// familierID: 5, 
// discretID: 11,  cacheID: 12, secret: 13,
// accessibleID: 18, adjacentID: 58


describe('Test du jeu avec secret, caché et discret', () => {
  it('Nombre de phrases', () => {
    let ctxAnalyse = new ContexteAnalyseV8();
    let phrases = CompilateurV8Utils.convertirCodeSourceEnPhrases(scenario);
    expect(phrases).toHaveSize(12); // nombre de phrases
  });

  it('Regarder', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 8); // (joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 8); // (inventaire, joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    ctxCommande = ctxPartie.com.executerCommande("regarder");
    expect(ctxCommande.sortie).toEqual("{_{*Le salon*}_}{n}Vous êtes dans le salon.{N}{U}Vous apercevez une bibliothèque et un bureau.{U}Sur le bureau il y a une lettre.{N}{P}Il n’y a pas de sortie.{N}");
  });

  it('examiner bibliothèque et livre', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 8); // (joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 8); // (inventaire, joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin

    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let bibliotheque = ctxPartie.jeu.objets[2];
    expect(bibliotheque.nom).toEqual("bibliotheque");

    let livreCuisine = ctxPartie.jeu.objets[3];
    expect(livreCuisine.nom).toEqual("livre de cuisine");

    let livreSciences = ctxPartie.jeu.objets[4];
    expect(livreSciences.nom).toEqual("livre de sciences");

    // classique
    expect(ClasseUtils.getHierarchieClasse(bibliotheque.classe)).toEqual("contenant → objet → élément → concept → intitulé");
    expect(bibliotheque.etats).toContain(ctxPartie.jeu.etats.presentID);
    expect(bibliotheque.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(bibliotheque.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(bibliotheque.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(bibliotheque.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(bibliotheque.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(bibliotheque.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // classique
    expect(ClasseUtils.getHierarchieClasse(livreCuisine.classe)).toEqual("objet → élément → concept → intitulé");
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.presentID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // discret
    expect(ClasseUtils.getHierarchieClasse(livreSciences.classe)).toEqual("objet → élément → concept → intitulé");
    expect(livreSciences.etats).toContain(ctxPartie.jeu.etats.presentID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreSciences.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner livre de cuisine");
    expect(ctxCommande.sortie)
      .withContext("Le livre ne doit pas pouvoir être examiné car il n’a pas encore été vu")
      .toEqual("Je ne l’ai pas encore vu.{N}");

    ctxCommande = ctxPartie.com.executerCommande("examiner la bibliothèque");
    expect(ctxCommande.sortie)
      .withContext("Le livre, déjà mentionné dans bibliothèque, ne doit pas être décrit une seconde fois.")
      .toEqual("Une bibliothèque. Un livre de cuisine dépasse.{N}");

    // => vu
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // discret
    expect(ClasseUtils.getHierarchieClasse(livreSciences.classe)).toEqual("objet → élément → concept → intitulé");
    expect(livreSciences.etats).toContain(ctxPartie.jeu.etats.presentID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreSciences.etats).toContain(ctxPartie.jeu.etats.discretID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(livreSciences.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner livre de cuisine");
    expect(ctxCommande.sortie).toEqual("C’est un livre de cuisine.{N}");

    // => familier
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(livreCuisine.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(livreCuisine.etats).toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner livre de sciences");
    expect(ctxCommande.sortie).toEqual("Je ne l’ai pas encore vu.{N}");

  });

  it('examiner parchemin', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 8); // (joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 8); // (inventaire, joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let bureau = ctxPartie.jeu.objets[6];
    expect(bureau.nom).toEqual("bureau");

    let lettre = ctxPartie.jeu.objets[7];
    expect(lettre.nom).toEqual("lettre");

    let piece = ctxPartie.jeu.objets[8];
    expect(piece.nom).toEqual("piece");

    let parchemin = ctxPartie.jeu.objets[9];
    expect(parchemin.nom).toEqual("parchemin");

    // classique
    expect(bureau.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(bureau.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(bureau.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(bureau.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(bureau.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(bureau.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // secret
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner parchemin");
    expect(ctxCommande.sortie)
      .withContext("Le parchemin secret ne doit pas pouvoir être examiné")
      .toEqual("Je n’ai pas trouvé {/parchemin/}.{N}{u}{/Entrez « {-aide examiner-} » pour afficher l’aide de cette action./}");

    ctxCommande = ctxPartie.com.executerCommande("lire lettre");
    expect(ctxCommande.sortie).toEqual("La saviez-vous ? Sous le bureau il y a un parchemin");
    // => mentionné mais toujours caché
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("prendre parchemin");
    expect(ctxCommande.sortie).toEqual("Je ne l’ai pas encore vu.{N}{u}{/Entrez « {-aide prendre-} » pour afficher l’aide de cette action./}");

    ctxCommande = ctxPartie.com.executerCommande("examiner sous bureau");
    expect(ctxCommande.sortie).toEqual(" Dessous, il y a un parchemin.{N}");

    // => vu
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner parchemin");
    expect(ctxCommande.sortie).toEqual("C’est un parchemin.{N}");
    // => familier
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(parchemin.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(parchemin.etats).toContain(ctxPartie.jeu.etats.familierID);

  });

  it('examiner pièce', () => {
    const rc = CompilateurV8.analyserScenarioEtActions(scenario, actions, true);
    expect(rc.monde.objets).toHaveSize(1 + 8); // (joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const jeu = Generateur.genererJeu(rc);
    expect(jeu.objets).toHaveSize(2 + 8); // (inventaire, joueur,) bibliothèque, livre de cuisine, livre de sciences, balle, bureau, lettre, pièce et parchemin
    const ctxPartie = new ContextePartie(jeu);
    let ctxCommande = ctxPartie.com.executerCommande("commencer le jeu");

    let bureau = ctxPartie.jeu.objets[6];
    expect(bureau.nom).toEqual("bureau");

    let lettre = ctxPartie.jeu.objets[7];
    expect(lettre.nom).toEqual("lettre");

    let piece = ctxPartie.jeu.objets[8];
    expect(piece.nom).toEqual("piece");

    // classique
    expect(lettre.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(lettre.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(lettre.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(lettre.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(lettre.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(lettre.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // cachée
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.cacheID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.mentionneID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.vuID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.familierID);

    // on ne doit pas pouvoir examiner directement un objet caché
    ctxCommande = ctxPartie.com.executerCommande("examiner pièce");
    expect(ctxCommande.sortie)
      .withContext("La pièce cachée ne doit pas pouvoir être examinée")
      .toEqual("Je ne l’ai pas encore vue.{N}");

    ctxCommande = ctxPartie.com.executerCommande("examiner lettre");
    expect(ctxCommande.sortie).toEqual("En examinant la lettre vous remarquez une pièce cachée dessous.{N}"); // [@pièce][&pièce]

    // mention « vue » et « familière » sur la pièce quand on lit la lettre
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.secretID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.cacheID);
    expect(piece.etats).not.toContain(ctxPartie.jeu.etats.discretID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.mentionneID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.vuID);
    expect(piece.etats).toContain(ctxPartie.jeu.etats.familierID);

    ctxCommande = ctxPartie.com.executerCommande("examiner pièce");
    expect(ctxCommande.sortie).toEqual("C’est une pièce.{N}");

  });
});