import { ClasseUtils } from "donjon";

import { EClasseRacine } from "../models/commun/constantes";
import { TypeContexte, TypeInterruption } from "../models/jeu/interruption";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Abreviations } from "../utils/jeu/abreviations";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";

import { actions as scenarioActions } from "./scenario_actions";

// ---------------------------------------------------------------------------
// Miroir EXACT de ressources/scenarios/jeux/coince_v3.djn (les tests Karma ne
// peuvent pas lire le disque). Apostrophes désambiguïsées : U+0027 (') littéral,
// U+2019 (’) écrit ’. Fins de ligne d'origine (\r\n) conservées.
// Données de rejeu (intro + étapes) issues de coince_v3.rec — « la sortie
// attendue ». Les sorties contiennent l'espace fine insécable U+202F ( )
// inséré automatiquement par le moteur devant la ponctuation française.
// ---------------------------------------------------------------------------
const SCENARIO =
"PARTIE \"Informations sur le jeu\".\r\n" +
"  Le titre du jeu est \"Coincé\".\r\n" +
"  L’auteur du jeu est \"Jonathan Claes\".\r\n" +
"  La version du jeu est \"3.01\".\r\n" +
"  L’identifiant du jeu est \"d0f14d91-78ef-499d-890c-be88dd8f9a5d\".\r\n" +
"  Le titre de la licence est \"CC BY 4.0\".\r\n" +
"  Le lien de la licence est \"https://creativecommons.org/licenses/by/4.0/\".\r\n" +
"\r\n" +
"PARTIE \"Description du monde\".\r\n" +
"  CHAPITRE \"Le joueur\".\r\n" +
"    -- placement du joueur (par défaut il se trouve dans le premier lieu décrit)\r\n" +
"    Le joueur se trouve dans le salon.\r\n" +
"    -- on décrit le joueur car il peut se regarder avec la commande « me regarder ».\r\n" +
"    Sa description est \"Vos vêtements sont sales. Vous avez perdu des kilos. Il est temps de sortir d’ici !\".\r\n" +
"\r\n" +
"  CHAPITRE \"Objet initialement dans l’inventaire\".\r\n" +
"    -- le texte qui suit directement la définition d’un élément du jeu sera interprété comme sa description.\r\n" +
"    La pièce est un objet dans l’inventaire. \"Il s'agit d'une pièce en cuivre.\".\r\n" +
"\r\n" +
"  CHAPITRE \"Le salon\".\r\n" +
"    -- /////////////////////\r\n" +
"    --   LIEU 1 − LE SALON\r\n" +
"    -- /////////////////////\r\n" +
"    Le salon est un lieu.\r\n" +
"    Sa description est \"Vous êtes dans un petit salon dépouillé.\r\n" +
"        La lumière du jour provient d’une lucarne [@lucarne] placée à plusieurs mètres de hauteur.\".\r\n" +
"\r\n" +
"    SCÈNE \"les objets\".\r\n" +
"      -- ==========\r\n" +
"      --   OBJETS\r\n" +
"      -- ==========\r\n" +
"\r\n" +
"      -- lucarne\r\n" +
"      La lucarne est un objet inaccessible dans le salon.\r\n" +
"      Sa description est \"Impossible de l'atteindre : elle est bien trop haute.\".\r\n" +
"\r\n" +
"      interpréter la fenêtre comme la lucarne.\r\n" +
"\r\n" +
"      -- fauteuil --\r\n" +
"      Le fauteuil est un support dans le salon.\r\n" +
"      Sa description est \"C’est un vieux fauteuil en cuir brun bien patiné.\".\r\n" +
"      Son aperçu est \"Il y a un fauteuil de style anglais [initialement]au centre de la pièce[puis]que vous avez déplacé[fin].\".\r\n" +
"      Interpréter canapé et divan comme fauteuil.\r\n" +
"\r\n" +
"      -- bille --\r\n" +
"      La bille est dans le salon. \"C'est une bille en verre décorée de petits pois bleus.\".\r\n" +
"\r\n" +
"      -- papier --\r\n" +
"      Le bout de papier est un objet caché sur le fauteuil. \"Il y a quelque chose d'écrit dessus\".\r\n" +
"      Son aperçu est \"[initialement]Il y a un bout de papier froissé coincé entre le coussin et l'accoudoir.[puis]Il y a un bout de papier.[fin]\".\r\n" +
"      Son texte est \"Il est écrit << ne pas oublier: {+uaenna+} >>\".\r\n" +
"      Interpréter feuille comme le bout de papier.\r\n" +
"\r\n" +
"      -- coffre --\r\n" +
"      Le coffre est un contenant fixé dans le salon. \"Il s'agit d'un petit coffre surmonté d'un clavier.[si le coffre est verrouillé] Le clavier comporte les lettres de l'alphabet. (Probablement pour pouvoir {-taper-} un code.){U}[fin si]\".\r\n" +
"      Il est secret, fermé, ouvrable et verrouillé.\r\n" +
"      Interpréter le clavier comme le coffre.\r\n" +
"\r\n" +
"      -- anneau\r\n" +
"      L'anneau est un objet portable dans le coffre. \"C'est un anneau doré. Il est probablement magique.\".\r\n" +
"        \r\n" +
"      règle après mettre l’anneau:\r\n" +
"        si la règle se déclenche pour la première fois:\r\n" +
"          dire \"Vous sentez une force puissante vous envahir!\".\r\n" +
"        fin si\r\n" +
"        terminer l’action avant.\r\n" +
"      fin règle\r\n" +
"      \r\n" +
"      -- porte\r\n" +
"      La porte secrète est une porte secrète, fermée et verrouillée au nord du salon.\r\n" +
"\r\n" +
"      -- mur\r\n" +
"      Le mur est un support décoratif dans le salon. \"Les murs de la pièce sont peints en vert.\".\r\n" +
"\r\n" +
"      -- tableau\r\n" +
"      Le tableau est sur le mur. \"Il s'agit d'une peinture a l'huile. Elle représente un voilier en pleine mer.\".\r\n" +
"      Son aperçu est \"Il y a un tableau [si le tableau se trouve sur le mur]accroché à l’un des murs.[sinon]par terre.[fin si]\".\r\n" +
"      Interpréter peinture et cadre comme le tableau.\r\n" +
"\r\n" +
"      -- bouton --\r\n" +
"      Le bouton est un objet fixé et secret sur le mur. \"C’est un gros bouton rouge.{n}Juste au-dessus, il est écrit << NE PAS POUSSER SUR LE BOUTON S.V.P. >>\".\r\n" +
"      interpréter bouton rouge, gros bouton et bouton rond comme le bouton.\r\n" +
"\r\n" +
"    SCÈNE \"les actions\".\r\n" +
"      -- ===========\r\n" +
"      --   ACTIONS\r\n" +
"      -- ===========\r\n" +
"\r\n" +
"      -- > POUSSER/DÉPLACER FAUTEUIL\r\n" +
"      règle avant pousser le fauteuil ou déplacer le fauteuil:\r\n" +
"      -- modifier le déroulement normal des actions pousser et déplacer le fauteuil\r\n" +
"      -- [@coffre] permet de spécifier à Donjon que le coffre a été vu par le joueur, il n’est donc plus secret.\r\n" +
"        si le fauteuil n'est pas déplacé:\r\n" +
"          dire \"Vous poussez difficilement le fauteuil. Vous découvrez un coffre[@coffre] qui était dissimulé sous le fauteuil.\".\r\n" +
"          changer le fauteuil est déplacé.\r\n" +
"        sinon\r\n" +
"          dire \"Ce n'est plus nécessaire.\".\r\n" +
"        fin si\r\n" +
"        arrêter l'action.\r\n" +
"      fin règle.\r\n" +
"        \r\n" +
"      -- > SOULEVER ou PRENDRE ou JETER le FAUTEUIL\r\n" +
"      -- création de l’action soulever le fauteuil\r\n" +
"      action soulever ceci:\r\n" +
"        définitions:\r\n" +
"          Ceci est le fauteuil.\r\n" +
"        phase exécution:\r\n" +
"          dire \"Il est trop lourd. Par contre vous devriez pouvoir le pousser.\".\r\n" +
"      fin action\r\n" +
"    \r\n" +
"      -- empêcher le déroulement normal des actions prendre et jeter le fauteuil\r\n" +
"      règle avant prendre le fauteuil ou jeter le fauteuil:\r\n" +
"        dire \"Il est trop lourd. Par contre vous devriez pouvoir le pousser.\".\r\n" +
"        arrêter l’action.\r\n" +
"      fin règle\r\n" +
"      \r\n" +
"      règle avant examiner le fauteuil:\r\n" +
"        -- si le joueur essaie d’examiner sous le fauteuil\r\n" +
"        si la préposition de ceci est sous:\r\n" +
"          dire \"Il y a quelque chose d’étrange...\".\r\n" +
"          exécuter la commande \"pousser le fauteuil\".\r\n" +
"          arrêter l’action.\r\n" +
"        fin si\r\n" +
"      fin règle\r\n" +
"      \r\n" +
"      -- > JETER BILLE SUR LUCARNE\r\n" +
"      règle après jeter la bille vers la lucarne:\r\n" +
"        dire \"[au hasard]Vous atteignez la lucarne avec la bille, ça fait << poc >> puis la bille retombe.[ou]Raté.[ou]Bien essayé.[fin choix]\".\r\n" +
"      fin règle\r\n" +
"\r\n" +
"      -- > TAPER CODE\r\n" +
"      action taper ceci:\r\n" +
"      \r\n" +
"        définitions:\r\n" +
"          Ceci est un intitulé.\r\n" +
"\r\n" +
"        phase prérequis:\r\n" +
"          si le coffre n’est pas présent, refuser \"Il n'y a pas de clavier ici.\".\r\n" +
"          si le coffre n'est pas visible, refuser \"Je ne vois pas de clavier.\".\r\n" +
"          \r\n" +
"        phase exécution:\r\n" +
"          si ceci vaut \"anneau\":\r\n" +
"            dire \"Le coffre émet un déclic.\".\r\n" +
"            changer le coffre est déverrouillé.\r\n" +
"          sinon\r\n" +
"            dire \"Rien ne se passe. Ce n'est pas le bon code.\".\r\n" +
"          fin si\r\n" +
"\r\n" +
"      fin action\r\n" +
"      \r\n" +
"      -- ajout de la page d’aide pour l’action « taper »\r\n" +
"      L’aide pour l'action taper est \"{*taper*}\r\n" +
"        Cette commande permet de taper un mot de passe pour déverrouiller le coffre.\r\n" +
"        {+exemple :+}\r\n" +
"        > {-taper {/cerise/}-}\r\n" +
"      \".\r\n" +
"\r\n" +
"      -- > DÉCROCHER TABLEAU\r\n" +
"      action décrocher ceci:\r\n" +
"        définitions:\r\n" +
"          ceci est le tableau.\r\n" +
"        phase exécution:\r\n" +
"          exécuter la commande \"enlever le tableau\".\r\n" +
"          \r\n" +
"      fin action\r\n" +
"\r\n" +
"    scène \"les règles\".\r\n" +
"      -- ==========\r\n" +
"      --   RÈGLES\r\n" +
"      -- ==========\r\n" +
"\r\n" +
"      -- > AVANT − PRENDRE, ENLEVER ou JETER le TABLEAU\r\n" +
"      règle avant prendre le tableau, enlever le tableau, déplacer le tableau ou jeter le tableau:\r\n" +
"        si le tableau se trouve sur le mur:\r\n" +
"          déplacer le tableau vers le salon.\r\n" +
"          dire \"Vous décrochez le tableau et vous découvrez un gros bouton rouge.[@bouton]\".\r\n" +
"        sinon\r\n" +
"          dire \"Vous avez déjà décroché le tableau du mur.\".\r\n" +
"        fin si\r\n" +
"        arrêter l’action.\r\n" +
"      fin règle\r\n" +
"      \r\n" +
"      règle après pousser le bouton ou utiliser le bouton:\r\n" +
"        dire \"Vous entendez un déclic.\".\r\n" +
"        si la porte secrète est fermée:\r\n" +
"          dire \"Une porte[@porte secrète] s'ouvre dans le mur nord de la pièce.\".\r\n" +
"          changer la porte secrète est ouverte.\r\n" +
"        fin si\r\n" +
"      fin règle\r\n" +
"\r\n" +
"  CHAPITRE \"Le cabinet\".\r\n" +
"    -- ///////////////////////\r\n" +
"    --   LIEU 2 − LE CABINET\r\n" +
"    -- ///////////////////////\r\n" +
"\r\n" +
"    Le cabinet est un lieu au nord du salon.\r\n" +
"    -- si le joueur regarde alors qu’il est dans la pièce, il verra sa description\r\n" +
"    -- [@toiles d’araignées] : on spécifie à Donjon que les toiles d’araignées sont déjà décrites et vues lors de la description du lieu.\r\n" +
"    Sa description est \"Vous vous trouvez dans un petit cabinet rempli de toiles d'araignées[@toiles d’araignées].\".\r\n" +
"    -- si le joueur regarde vers le nord, alors qu’il est dans le salon, il verra l’aperçu du cabinet\r\n" +
"    Son aperçu est \"Une pièce sombre.\".\r\n" +
"\r\n" +
"    SCÈNE \"les décors\".\r\n" +
"      -- par défaut le joueur ne pourra pas déplacer un décor.\r\n" +
"      Les toiles d’araignées (f) sont des décors dans le cabinet. \"Brrr ce n'est pas très rassurant.\".\r\n" +
"      --interpréter araignées, araignée, toile et toiles comme les toiles d’araignées.\r\n" +
"\r\n" +
"    SCÈNE \"la magicienne\".\r\n" +
"      La magicienne est une femme dans le cabinet. \"La magicienne vous observe.\".\r\n" +
"\r\n" +
"      -- les conversations avec la magicienne\r\n" +
"      réactions de la magicienne:\r\n" +
"        basique:\r\n" +
"          dire \"<< Sans mon anneau, pas moyen de nous sortir d'ici. >>\".\r\n" +
"        concernant l’anneau:\r\n" +
"          dire \"<< [en boucle]Mon anneau magique m'a été dérobé.[puis]C’est un anneau en or il amplifie ma magie.[puis]Vous finirez bien par le retrouver.[fin choix] >>\".\r\n" +
"        concernant la sortie:\r\n" +
"          dire \"<< Grâce à mon anneau, je pourrai nous faire sortir d’ici.\".\r\n" +
"        concernant uaenna:\r\n" +
"          dire \"<< Oh ! Vous savez parler en verlan ! >>\".\r\n" +
"        concernant un sujet inconnu:\r\n" +
"          dire \"<< L’important c’est que vous retrouviez mon anneau afin que je puisse nous sortir d’ici. >>\".\r\n" +
"      fin réaction\r\n" +
"\r\n" +
"      -- les actions avec la magicienne\r\n" +
"      règle après donner pièce à la magicienne:\r\n" +
"        dire \"<< Elle ne semble pas magique malheureusement. >>\".\r\n" +
"      fin règle\r\n" +
"        \r\n" +
"      règle avant donner anneau à la magicienne ou montrer anneau à la magicienne:\r\n" +
"        dire \"<< Mon héro! >>\r\n" +
"              La magicienne tend la main et un éclair vous aveugle.\".\r\n" +
"        attendre touche.\r\n" +
"        dire \"Vous êtes de retour chez vous!\r\n" +
"              \r\n" +
"              {+Bravo! Vous avez gagné !+}\".\r\n" +
"        -- la partie est terminée car on a gagné\r\n" +
"        terminer le jeu.\r\n" +
"        arrêter l’action.\r\n" +
"      fin règle\r\n" +
"";

// Sortie de l'intro (« commencer le jeu » → « regarder ») — coince_v3.rec : sortieIntro.
const SORTIE_INTRO =
  "{_{*Le salon*}_}{n}Vous êtes dans un petit salon dépouillé.\n La lumière du jour provient d’une lucarne @@lien:26@@ placée à plusieurs mètres de hauteur.{N}{U}Il y a un fauteuil de style anglais {E}au centre de la pièce{E}.{U}Il y a un tableau {E}accroché à l’un des murs.{E}{N}{U}Vous apercevez une bille.{N}{P}Sorties : {n}{i}- nord : ? ({/obstrué/})";

interface EtapeRec { type: "g" | "c" | "r" | "d"; valeur: string; sortie?: string; }

// Étapes du magnétoscope coince_v3.rec (les `g` portent les graines ; les `c`
// sont les commandes du joueur, fautes de frappe comprises — elles ont été
// résolues par le correcteur du moteur et changer leur orthographe changerait
// la sortie).
const ETAPES: EtapeRec[] = [
  { type: "g", valeur: "0.0408105673930792" },
  { type: "g", valeur: "0.3017206846001985" },
  { type: "c", valeur: "x bille", sortie: "C'est une bille en verre décorée de petits pois bleus.{N}" },
  { type: "c", valeur: "x lucarne", sortie: "Impossible de l'atteindre : elle est bien trop haute.{N}Elle n’est pas accessible.{N}" },
  { type: "c", valeur: "jeter bille vers lucarne", sortie: "{E}Raté.{E}{N}" },
  { type: "c", valeur: "pousser le fauteil", sortie: "Vous poussez difficilement le fauteuil. Vous découvrez un coffre@@lien:30@@ qui était dissimulé sous le fauteuil.{N}" },
  { type: "c", valeur: "taper anneau", sortie: "Le coffre émet un déclic.{N}" },
  { type: "c", valeur: "ouvrir coffre", sortie: "Il est ouvert.{N} Dedans, il y a un anneau.{N}" },
  { type: "c", valeur: "pr anneau", sortie: "L’anneau a été ajouté à votre inventaire.{N}" },
  { type: "c", valeur: "x fauteil", sortie: "C’est un vieux fauteuil en cuir brun bien patiné.{N}{U}{E}Il y a un bout de papier froissé coincé entre le coussin et l'accoudoir.{E}{N}" },
  { type: "c", valeur: "lire papier", sortie: "Il est écrit « ne pas oublier: {+uaenna+} »" },
  { type: "c", valeur: "décrocher tableau", sortie: "Vous décrochez le tableau et vous découvrez un gros bouton rouge.@@lien:35@@{N}" },
  { type: "c", valeur: "enfoncer bouton", sortie: "Vous entendez un déclic.{N}Une porte@@lien:32@@ s'ouvre dans le mur nord de la pièce.{N}" },
  { type: "c", valeur: "re", sortie: "{_{*Le salon*}_}{n}Vous êtes dans un petit salon dépouillé.\n La lumière du jour provient d’une lucarne @@lien:26@@ placée à plusieurs mètres de hauteur.{N}{U}Il y a un fauteuil de style anglais {E}que vous avez déplacé{E}.{U}{E}Il y a un bout de papier.{E}{N}{U}Il y a un tableau {E}par terre.{E}{N}{U}Sur le mur il y a le bouton.{U}Vous apercevez la bille et le coffre.{U}La porte secrète est ouverte.{N}{P}Sorties : {n}{i}- nord : ?{N}" },
  { type: "c", valeur: "n", sortie: "{_{*Le cabinet*}_}{n}Vous vous trouvez dans un petit cabinet rempli de toiles d'araignées@@lien:36@@.{N}{U}Vous apercevez une magicienne.{N}{P}Sorties : {n}{i}- sud : {+Le salon+}" },
  { type: "c", valeur: "re magicienne", sortie: "La magicienne vous observe.{N}" },
  { type: "c", valeur: "parler à la magicienne", sortie: "« Sans mon anneau, pas moyen de nous sortir d'ici. »{N}" },
  { type: "c", valeur: "donner l'anneau à a magicienne", sortie: "« Mon héro! »\n La magicienne tend la main et un éclair vous aveugle.{N}Vous êtes de retour chez vous!\n \n {+Bravo! Vous avez gagné !+}{N}" },
];

/** Compile le scénario + les actions de base et génère le jeu (sans démarrer la partie). */
function genererJeuCoince() {
  const rc = CompilateurV8.analyserScenarioEtActions(SCENARIO, scenarioActions, false);
  expect(rc.erreurs?.length ?? 0)
    .withContext("erreurs de compilation : " + JSON.stringify(rc.erreurs))
    .toBe(0);
  const jeu = Generateur.genererJeu(rc);
  expect(jeu.tamponErreurs)
    .withContext("tamponErreurs : " + JSON.stringify(jeu.tamponErreurs))
    .toHaveSize(0);
  return jeu;
}

/** Retrouve un objet du jeu par son intitulé complet (nomEpithete). */
function objet(jeu: any, nomEpithete: string) {
  return jeu.objets.find((o: any) => o.intitule?.nomEpithete === nomEpithete);
}

/**
 * Exécute une commande comme le ferait le lecteur : les abréviations (x, pr, re,
 * n, …) sont d'abord développées via `Abreviations.obtenirCommandeComplete`
 * (le moteur seul ne les comprend pas), puis la commande complète est exécutée.
 */
function executer(ctx: ContextePartie, commande: string): string {
  const complete = Abreviations.obtenirCommandeComplete(
    commande, ctx.jeu.abreviations, ctx.jeu.lieux, ctx.jeu.objets,
  );
  let sortie = ctx.com.executerCommande(complete, false)?.sortie ?? "";
  // Résoudre les interruptions « attendre touche / attendre N secondes » comme
  // le ferait une pression de touche dans le lecteur : le moteur laisse le tour
  // en attente dans `tamponInterruptions`, on le poursuit et on concatène la
  // suite de la sortie (c'est ainsi que le .rec capture la sortie complète).
  let securite = 100;
  while (ctx.jeu.tamponInterruptions.length && securite-- > 0) {
    const it = ctx.jeu.tamponInterruptions[0];
    if (it.typeInterruption !== TypeInterruption.attendreTouche
      && it.typeInterruption !== TypeInterruption.attendreSecondes) {
      break;
    }
    ctx.jeu.tamponInterruptions.shift();
    if (it.typeContexte === TypeContexte.tour) {
      sortie += ctx.com.continuerLeTourInterrompu(it.tour!) ?? "";
    } else if (it.typeContexte === TypeContexte.routine) {
      sortie += ctx.com.continuerRoutineInterrompue(it.tour!) ?? "";
    }
  }
  return sortie;
}

// ===========================================================================
//   1) STRUCTURE DU JEU GÉNÉRÉ
// ===========================================================================
describe("Coincé — structure du jeu généré", () => {

  it("[F080-T001] compile sans erreur et génère le jeu", () => {
    const jeu = genererJeuCoince();
    expect(jeu).toBeDefined();
  });

  it("[F080-T002] cartouche : titre, auteur, version, identifiant, licence", () => {
    const jeu = genererJeuCoince();
    expect(jeu.titre).toEqual("Coincé");
    expect(jeu.auteur).toEqual("Jonathan Claes");
    expect(jeu.version).toEqual("3.01");
    expect(jeu.IFID).toEqual("d0f14d91-78ef-499d-890c-be88dd8f9a5d");
    expect(jeu.licenceTitre).toEqual("CC BY 4.0");
    expect(jeu.licenceLien).toEqual("https://creativecommons.org/licenses/by/4.0/");
  });

  it("[F080-T003] deux lieux (salon, cabinet) avec le cabinet au nord du salon", () => {
    const jeu = genererJeuCoince();
    expect(jeu.lieux).toHaveSize(2);
    const salon = jeu.lieux.find((l: any) => l.nom === "salon");
    const cabinet = jeu.lieux.find((l: any) => l.nom === "cabinet");
    expect(salon).toBeDefined();
    expect(cabinet).toBeDefined();
    // une sortie « nord » du salon mène au cabinet
    const versNord = salon.voisins.find((v: any) => v.id === cabinet.id);
    expect(versNord).withContext("le cabinet doit être un voisin du salon").toBeDefined();
  });

  it("[F080-T004] 13 objets déclarés (+ inventaire + joueur) avec les bons types", () => {
    const jeu = genererJeuCoince();
    // [0] inventaire, [1] joueur, puis 13 objets déclarés
    expect(jeu.objets).toHaveSize(2 + 13);

    expect(ClasseUtils.heriteDe(objet(jeu, "fauteuil").classe, EClasseRacine.support)).toBeTrue();
    expect(ClasseUtils.heriteDe(objet(jeu, "mur").classe, EClasseRacine.support)).toBeTrue();
    expect(ClasseUtils.heriteDe(objet(jeu, "coffre").classe, EClasseRacine.contenant)).toBeTrue();
    expect(ClasseUtils.heriteDe(objet(jeu, "porte secrète").classe, EClasseRacine.porte)).toBeTrue();
    expect(ClasseUtils.heriteDe(objet(jeu, "magicienne").classe, EClasseRacine.personne)).toBeTrue();
  });

  it("[F080-T005] états initiaux des objets clés", () => {
    const jeu = genererJeuCoince();
    const et = jeu.etats;

    // coffre : secret, fermé, ouvrable, verrouillé
    const coffre = objet(jeu, "coffre");
    expect(coffre.etats).toContain(et.secretID);
    expect(coffre.etats).toContain(et.fermeID);
    expect(coffre.etats).toContain(et.ouvrableID);
    expect(coffre.etats).toContain(et.verrouilleID);

    // porte secrète : secrète, fermée, verrouillée
    const porte = objet(jeu, "porte secrète");
    expect(porte.etats).toContain(et.secretID);
    expect(porte.etats).toContain(et.fermeID);
    expect(porte.etats).toContain(et.verrouilleID);

    // lucarne : inaccessible
    expect(objet(jeu, "lucarne").etats).toContain(et.inaccessibleID);

    // bouton : secret + fixé
    const bouton = objet(jeu, "bouton");
    expect(bouton.etats).toContain(et.secretID);
    expect(bouton.etats).toContain(et.fixeID);

    // fauteuil : pas encore déplacé
    expect(objet(jeu, "fauteuil").etats).not.toContain(et.deplaceID);

    // mur : décoratif
    expect(objet(jeu, "mur").etats).toContain(et.decoratifID);
  });

  it("[F080-T006] anneau initialement dans le coffre, bout de papier sur le fauteuil", () => {
    const jeu = genererJeuCoince();
    const coffre = objet(jeu, "coffre");
    const fauteuil = objet(jeu, "fauteuil");
    const anneau = objet(jeu, "anneau");
    const papier = objet(jeu, "bout de papier");
    expect(anneau.position?.cibleId).toEqual(coffre.id);
    expect(papier.position?.cibleId).toEqual(fauteuil.id);
  });

  it("[F080-T007] les 3 actions personnalisées sont générées", () => {
    const jeu = genererJeuCoince();
    const infinitifs = jeu.actions.map((a: any) => a.infinitif);
    expect(infinitifs).toContain("soulever");
    expect(infinitifs).toContain("taper");
    expect(infinitifs).toContain("décrocher");
  });

  it("[F080-T008] les règles (auditeurs) du scénario sont générées", () => {
    const jeu = genererJeuCoince();
    // 9 règles avant/après définies dans le scénario.
    const declarees = jeu.auditeurs.filter((a: any) => !a.estRegleActionQuelconque);
    expect(declarees.length).toBeGreaterThanOrEqual(9);
  });

});

// ===========================================================================
//   2) PARTIE REJOUÉE (coince_v3.rec)
// ===========================================================================
describe("Coincé — partie rejouée (.rec)", () => {

  /** Démarre la partie ; renvoie le contexte et la sortie de l'intro. */
  function demarrer(): { ctx: ContextePartie; sortieIntro: string } {
    const jeu = genererJeuCoince();
    const ctx = new ContextePartie(jeu);
    const intro = ctx.com.executerCommande("commencer le jeu", true);
    return { ctx, sortieIntro: intro?.sortie ?? "" };
  }

  it("[F080-T010] l'intro (commencer le jeu → regarder) correspond à sortieIntro", () => {
    const { sortieIntro } = demarrer();
    expect(sortieIntro).toEqual(SORTIE_INTRO);
  });

  it("[F080-T011] rejeu déterministe : chaque commande produit la sortie attendue", () => {
    const { ctx } = demarrer();

    // Rejeu des graines comme le ferait le magnéto : on ignore la première
    // (graine initiale déjà posée) et on applique les suivantes.
    let premiereGraine = true;
    for (const etape of ETAPES) {
      if (etape.type === "g") {
        if (premiereGraine) { premiereGraine = false; continue; }
        ctx.nouvelleGraineAleatoire(etape.valeur);
      } else if (etape.type === "c") {
        const sortie = executer(ctx, etape.valeur);
        expect(sortie)
          .withContext("commande : " + etape.valeur)
          .toEqual(etape.sortie!);
      }
    }

    expect(ctx.jeu.tamponErreurs)
      .withContext("aucune erreur ne doit survenir pendant la partie")
      .toHaveSize(0);
  });

  it("[F080-T012] état final du monde après la partie gagnée", () => {
    const { ctx } = demarrer();
    ctx.nouvelleGraineAleatoire("0.3017206846001985");
    for (const etape of ETAPES) {
      if (etape.type === "c") {
        executer(ctx, etape.valeur);
      }
    }

    const jeu = ctx.jeu;
    const et = jeu.etats;

    // le jeu est terminé (« terminer le jeu » dans la règle de victoire)
    expect(jeu.termine).withContext("le jeu doit être terminé après la victoire").toBeTrue();

    // le joueur a rejoint le cabinet
    expect(ctx.eju.curLieu.nom).toEqual("cabinet");

    // fauteuil déplacé (a révélé le coffre)
    expect(objet(jeu, "fauteuil").etats).toContain(et.deplaceID);

    // coffre : déverrouillé (code « anneau ») + ouvert + plus secret (vu via [@coffre])
    const coffre = objet(jeu, "coffre");
    expect(coffre.etats).not.toContain(et.verrouilleID);
    expect(coffre.etats).toContain(et.ouvertID);
    expect(coffre.etats).not.toContain(et.secretID);

    // porte secrète : ouverte (bouton poussé) + plus secrète
    const porte = objet(jeu, "porte secrète");
    expect(porte.etats).toContain(et.ouvertID);
    expect(porte.etats).not.toContain(et.fermeID);
    expect(porte.etats).not.toContain(et.secretID);

    // bouton révélé (décroché le tableau)
    expect(objet(jeu, "bouton").etats).not.toContain(et.secretID);

    // tableau décroché : ne se trouve plus sur le mur, mais dans le salon
    const tableau = objet(jeu, "tableau");
    const salon = jeu.lieux.find((l: any) => l.nom === "salon");
    expect(tableau.position?.cibleId).toEqual(salon.id);
  });

  it("[F080-T013] le synonyme « fenêtre » désigne bien la lucarne", () => {
    const { ctx } = demarrer();
    const sortie = executer(ctx, "examiner fenêtre");
    expect(sortie)
      .toEqual("Impossible de l'atteindre : elle est bien trop haute.{N}Elle n’est pas accessible.{N}");
  });

});

// ===========================================================================
//   3) PRÉSENCE, VISIBILITÉ, DÉPLACEMENTS, DIALOGUE, ANNULER
// ===========================================================================
describe("Coincé — présence, visibilité, déplacements et dialogue", () => {

  function demarrer(): ContextePartie {
    const jeu = genererJeuCoince();
    const ctx = new ContextePartie(jeu);
    ctx.com.executerCommande("commencer le jeu", true);
    return ctx;
  }

  /** Rejoue (graine fixe) les commandes du .rec jusqu'à `derniereCommande` incluse. */
  function rejouerJusqua(ctx: ContextePartie, derniereCommande: string): void {
    ctx.nouvelleGraineAleatoire("0.3017206846001985");
    for (const etape of ETAPES) {
      if (etape.type !== "c") { continue; }
      executer(ctx, etape.valeur);
      if (etape.valeur === derniereCommande) { break; }
    }
  }

  it("[F080-T020] présence initiale : objets du salon présents, magicienne absente", () => {
    const ctx = demarrer();
    const et = ctx.jeu.etats;
    // le joueur démarre dans le salon
    expect(ctx.eju.curLieu.nom).toEqual("salon");
    // objets du salon présents
    expect(objet(ctx.jeu, "fauteuil").etats).toContain(et.presentID);
    expect(objet(ctx.jeu, "bille").etats).toContain(et.presentID);
    expect(objet(ctx.jeu, "tableau").etats).toContain(et.presentID);
    // la magicienne est dans le cabinet → pas présente dans le salon
    expect(objet(ctx.jeu, "magicienne").etats).not.toContain(et.presentID);
  });

  it("[F080-T021] la magicienne devient présente une fois dans le cabinet", () => {
    const ctx = demarrer();
    rejouerJusqua(ctx, "n");
    expect(ctx.eju.curLieu.nom).toEqual("cabinet");
    expect(objet(ctx.jeu, "magicienne").etats).toContain(ctx.jeu.etats.presentID);
  });

  it("[F080-T022] visibilité : le coffre (secret) devient vu après avoir poussé le fauteuil", () => {
    const ctx = demarrer();
    const et = ctx.jeu.etats;
    const coffre = objet(ctx.jeu, "coffre");
    // avant : secret, pas vu
    expect(coffre.etats).toContain(et.secretID);
    expect(coffre.etats).not.toContain(et.vuID);
    // pousser le fauteuil révèle le coffre ([@coffre])
    executer(ctx, "pousser le fauteuil");
    expect(coffre.etats).not.toContain(et.secretID);
    expect(coffre.etats).toContain(et.vuID);
  });

  it("[F080-T023] visibilité : le bouton (secret) devient vu après avoir décroché le tableau", () => {
    const ctx = demarrer();
    const et = ctx.jeu.etats;
    const bouton = objet(ctx.jeu, "bouton");
    expect(bouton.etats).toContain(et.secretID);
    expect(bouton.etats).not.toContain(et.vuID);
    executer(ctx, "décrocher le tableau");
    expect(bouton.etats).not.toContain(et.secretID);
    expect(bouton.etats).toContain(et.vuID);
  });

  it("[F080-T024] déplacement : l'anneau passe du coffre à l'inventaire quand on le prend", () => {
    const ctx = demarrer();
    const coffre = objet(ctx.jeu, "coffre");
    const anneau = objet(ctx.jeu, "anneau");
    expect(anneau.position?.cibleId).toEqual(coffre.id);
    // révéler le coffre, le déverrouiller, l'ouvrir et prendre l'anneau
    executer(ctx, "pousser le fauteuil");
    executer(ctx, "taper anneau");
    executer(ctx, "ouvrir le coffre");
    executer(ctx, "prendre l'anneau");
    // un objet « dans l'inventaire » est positionné sur le joueur
    expect(anneau.position?.cibleId).toEqual(ctx.jeu.joueur.id);
  });

  it("[F080-T025] dialogue : réaction « basique » de la magicienne", () => {
    const ctx = demarrer();
    rejouerJusqua(ctx, "n");
    const sortie = executer(ctx, "parler à la magicienne");
    // réplique attendue reprise telle quelle du .rec (espaces fines insécables U+202F comprises)
    const attendu = ETAPES.find((e) => e.valeur === "parler à la magicienne")!.sortie!;
    expect(sortie).toEqual(attendu);
  });

  it("[F080-T026] dialogue : réactions par sujet (anneau, sortie, uaenna, sujet inconnu)", () => {
    const ctx = demarrer();
    rejouerJusqua(ctx, "n");

    // concernant l'anneau (1er passage de la boucle)
    expect(executer(ctx, "parler de l'anneau à la magicienne"))
      .withContext("sujet : anneau").toContain("Mon anneau magique");

    // concernant la sortie
    expect(executer(ctx, "parler de la sortie à la magicienne"))
      .withContext("sujet : sortie").toContain("je pourrai nous faire sortir");

    // concernant uaenna (le mot de passe en verlan)
    expect(executer(ctx, "parler de uaenna à la magicienne"))
      .withContext("sujet : uaenna").toContain("verlan");

    // sujet sans réaction dédiée → réaction « sujet inconnu »
    expect(executer(ctx, "interroger la magicienne sur le coffre"))
      .withContext("sujet inconnu").toContain("retrouviez mon anneau");
  });

});
