import { Classe } from "../../models/commun/classe";
import { ClasseUtils } from "../commun/classe-utils";
import { ClassesRacines } from "../../models/commun/classes-racines";
import { ContexteAnalyse } from "../../models/compilateur/contexte-analyse";
import { ContexteCompilation } from "../../models/compilateur/contexte-compilation";
import { ContexteCompilationV8 } from "../../models/compilateur/contexte-compilation-v8";
import { Definition } from "../../models/compilateur/definition";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementGenerique } from "../../models/compilateur/element-generique";
import { Genre } from "../../models/commun/genre.enum";
import { Monde } from "../../models/compilateur/monde";
import { Nombre } from "../../models/commun/nombre.enum";
import { ResultatCompilation } from "../../models/compilateur/resultat-compilation";
import { StringUtils } from "../commun/string.utils";

export class CompilateurCommunUtils {

  public static readonly infoCopyright = "Jeu créé avec Donjon FI ©2018-2025 Jonathan Claes − https://donjon.fi";
  // rem: l’espace+point termine la dernière commande écrite par le joueur (au cas-où il l’aurait oublié).
  public static readonly regleInfoDonjonBeta = " .\naprès afficher aide: dire \"{n}{n}{+{/" + CompilateurCommunUtils.infoCopyright + "/}+}\"; terminer l’action avant.";

  public static readonly regleInfoDonjonV8 = "règle après afficher aide: dire \"{n}{n}{+{/" + CompilateurCommunUtils.infoCopyright + "/}+}\". Terminer l’action avant. fin règle";

  /** Ajouter les éléments spéciaux au scénario (joueur, inventaire, jeu, ressources, …) */
  public static ajouterElementsSpeciaux(ctxAnalyse: ContexteAnalyse) {
    // ajouter le joueur et l’inventaire au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "joueur", null, EClasseRacine.joueur, ClassesRacines.Vivant, [], Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("l’", "inventaire", null, EClasseRacine.special, null, [], Genre.m, Nombre.s, 1, null));
    // ajouter le jeu, les ressources, la licence et le site web au monde
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "jeu", null, EClasseRacine.special, null, [], Genre.m, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("les ", "ressources du jeu", null, EClasseRacine.special, null, [], Genre.f, Nombre.p, -1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("la ", "licence", null, EClasseRacine.special, null, [], Genre.f, Nombre.s, 1, null));
    ctxAnalyse.elementsGeneriques.push(new ElementGenerique("le ", "site", "web", EClasseRacine.special, null, [], Genre.m, Nombre.s, 1, null));
  }

  public static peuplerLeMonde(ctx: ContexteCompilation) {
    // ********************************************
    // PEUPLER LE MONDE À PARTIR DE L’ANALYSE
    // ********************************************
    // le monde qui est décrit
    ctx.monde = new Monde();

    // CLASSES
    // retrouver les types utilisateurs (classes)
    ctx.analyse.typesUtilisateur.forEach(def => {
      CompilateurCommunUtils.ajouterClasseDuTypeUtilisateur(def.intitule, ctx.analyse, ctx.monde);
    });

    // CLASSE ÉVÈNEMENTS DES RÈGLES
    // parcour des règles
    ctx.analyse.regles.forEach(regle => {
      // parcour des évènements de la règle
      regle.evenements.forEach(evenement => {
        // retrouver classe de ceci
        if (evenement.isCeci) {
          const ceciEstClasse = (evenement.ceci.match(/^un(e)? /i));
          if (ceciEstClasse) {
            evenement.classeCeci = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, evenement.ceci);
          }
        }
        // retrouver classe de cela
        if (evenement.isCela) {
          const celaEstClasse = (evenement.cela.match(/^un(e)? /i));
          if (celaEstClasse) {
            evenement.classeCela = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, evenement.cela);
          }
        }
      });
    });

    // ÉLÉMENTS
    ctx.compteurs = [];
    ctx.listes = [];
    // définir la classe des éléments génériques et les trier.
    ctx.analyse.elementsGeneriques.forEach(el => {
      el.classe = ClasseUtils.trouverOuCreerClasse(ctx.monde.classes, el.classeIntitule);
      // objets
      if (ClasseUtils.heriteDe(el.classe, EClasseRacine.objet)) {
        ctx.monde.objets.push(el);
        // listes d’objets filtrés
        if (ClasseUtils.heriteDe(el.classe, EClasseRacine.obstacle)) {
          ctx.monde.portesEtObstacles.push(el);
        } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.joueur)) {
          ctx.monde.speciaux.push(el);
        } else {
          ctx.monde.classiques.push(el);
        }
        // lieux
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.lieu)) {
        if(ctx.monde.lieux.find(x => x.nom == el.nom)) {
          ctx.analyse.ajouterErreur(el.numeroLigne, `Plusieurs lieux portent ce nom : « ${el.nom} ».`);
        }else{
          ctx.monde.lieux.push(el);
        }
        // spécial
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.special)) {
        // spécial: sous-dossier pour les ressources du jeu
        if (el.nom.toLowerCase() == 'ressources du jeu' && el.positionString?.length == 1) {
          if (el.positionString[0].complement.toLowerCase().startsWith('dossier ') && el.positionString[0].position.toLowerCase().startsWith("dans")) {
            el.positionString[0].position = 'dans le dossier';
            el.positionString[0].complement = el.positionString[0].complement.slice('dossier '.length);

            const nomDossierNonSecurise = el.positionString[0].complement;
            const nomDossierSecurise = StringUtils.nomDeDossierSecurise(nomDossierNonSecurise);
            if (nomDossierSecurise.length && nomDossierSecurise == nomDossierNonSecurise) {
              ctx.monde.speciaux.push(el);
            } else {
              ctx.analyse.ajouterErreur(undefined, 'Ressources du jeu: le nom du dossier ne peut contenir que lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Exemple: « mon_dossier ».');
            }
          } else {
            ctx.analyse.ajouterErreur(undefined, 'Ressources du jeu: utiliser la formulation « Les ressources du jeu se trouvent dans le dossier abc_def. »');
          }
          // autres éléments spéciaux
        } else {
          ctx.monde.speciaux.push(el);
        }
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.compteur)) {
        ctx.compteurs.push(el);
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.liste)) {
        ctx.listes.push(el);
      } else if (ClasseUtils.heriteDe(el.classe, EClasseRacine.concept)) {
        ctx.monde.concepts.push(el);
      } else {
        console.error("ParseCode >>> classe racine pas prise en charge:", el.classe, el);
      }
    });

    // **********************************
    // AFFICHER RÉSULTAT DANS LA CONSOLE
    // **********************************

    if (ctx.verbeux) {
      console.log("==================\n");
      console.log("ctx.monde:", ctx.monde);
      console.log("règles:", ctx.analyse.regles);
      console.log("actions:", ctx.analyse.actions);
      if (ctx instanceof ContexteCompilationV8) {
        console.log("routines simples:", ctx.analyse.routinesSimples);
      }
      console.log("abréviations:", ctx.analyse.abreviations);
      console.log("compteurs:", ctx.compteurs);
      console.log("listes:", ctx.listes);
      console.log("aides:", ctx.analyse.aides);
      console.log("typesUtilisateur:", ctx.analyse.typesUtilisateur);
      console.log("==================\n");
    }

    ctx.resultat = new ResultatCompilation();
    ctx.resultat.monde = ctx.monde;
    if (ctx instanceof ContexteCompilationV8) {
      ctx.resultat.routinesSimples = ctx.analyse.routinesSimples;
    }
    ctx.resultat.regles = ctx.analyse.regles;
    ctx.resultat.actions = ctx.analyse.actions;
    ctx.resultat.abreviations = ctx.analyse.abreviations;
    ctx.resultat.compteurs = ctx.compteurs;
    ctx.resultat.listes = ctx.listes;
    ctx.resultat.erreurs = ctx.analyse.erreurs;
    if (ctx instanceof ContexteCompilationV8) {
      ctx.resultat.messages = ctx.analyse.messages;
    }
    ctx.resultat.aides = ctx.analyse.aides;
    ctx.resultat.parametres = ctx.analyse.parametres;

  }

  /**
    * Retourne 'true' si le dernier crochet rencontré est un crochet ouvert.
    */
  public static dernierCrochetEstOuvert(texte: string): boolean {
    let dernierEstOuvert = false;
    if (texte) {
      for (let index = 0; index < texte.length; index++) {
        const char = texte[index];
        if (char == '[') {
          dernierEstOuvert = true;
        } else if (char == ']') {
          dernierEstOuvert = false;
        }
      }
    }
    return (dernierEstOuvert);
  }

  public static ajouterClasseDuTypeUtilisateur(nomTypeUtilisateur, ctxAnalyse: ContexteAnalyse, monde: Monde): Classe {

    // > NOM
    const nom = StringUtils.normaliserMot(nomTypeUtilisateur);

    // > DEFINITION
    let def: Definition = null;
    // retrouver la définition du type
    if (ctxAnalyse.typesUtilisateur.has(nom)) {
      def = ctxAnalyse.typesUtilisateur.get(nom);
      // définition pas trouvé => hériter de objet par défaut
    } else {
      def = new Definition(nomTypeUtilisateur, EClasseRacine.objet, Nombre.s, []);
    }

    // > INTITULÉ
    const intitule = def.intitule;

    // > PARENT
    let parent = monde.classes.find(x => x.nom === StringUtils.normaliserMot(def.typeParent));
    // si parent pas encore présent, le définir
    if (!parent) {
      parent = CompilateurCommunUtils.ajouterClasseDuTypeUtilisateur(def.typeParent, ctxAnalyse, monde);
    }

    // > NIVEAU
    const niveau = parent.niveau + 1;

    // > CRÉATION
    // vérifier si existe déjà
    let retVal = monde.classes.find(x => x.nom == nom);
    // existe déjà
    if (retVal) {
      // ctxAnalyse.ajouterErreur(0, ("Type défini plusieurs fois : " + retVal.intitule));
      // n’existe pas encore
    } else {
      retVal = new Classe(nom, intitule, parent, niveau, def.etats);
      // ajouter une nouvelle classe pour ce type utilisateur
      monde.classes.push(retVal);
    }

    return retVal;
  }

}