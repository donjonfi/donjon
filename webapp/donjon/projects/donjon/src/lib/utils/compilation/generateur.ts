import { EClasseRacine, EEtatsBase } from '../../models/commun/constantes';
import { ElementsJeuUtils, TypeSujet } from '../commun/elements-jeu-utils';
import { PositionObjet, PrepositionSpatiale } from '../../models/jeu/position-objet';
import { PositionSujetString } from '../../models/compilateur/position-sujet';
import { PresenceFond } from '../../models/compilateur/presence-fond';

import { Action } from '../../models/compilateur/action';
import { Auditeur } from '../../models/jouer/auditeur';
import { Classe } from '../../models/commun/classe';
import { ClasseUtils } from '../commun/classe-utils';
import { ClassesRacines } from '../../models/commun/classes-racines';
import { Compteur } from '../../models/compilateur/compteur';
import { CompteursUtils } from '../jeu/compteurs-utils';
import { ContexteGeneration } from '../../models/compilateur/contexte-generation';
import { DeclarationEtat, TypeDeclarationEtat } from '../../models/compilateur/declaration-etat';
import { ELocalisation } from '../../models/jeu/localisation';
import { ElementGenerique } from '../../models/compilateur/element-generique';
import { ElementJeu } from '../../models/jeu/element-jeu';
import { ExprReg } from './expr-reg';
import { Genre } from '../../models/commun/genre.enum';
import { GroupeNominal } from '../../models/commun/groupe-nominal';
import { RessourceAffichee } from '../../models/jeu/ressource-affichee';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Liste } from '../../models/jeu/liste';
import { ListeEtats } from '../jeu/liste-etats';
import { MotUtils } from '../commun/mot-utils';
import { Nombre } from '../../models/commun/nombre.enum';
import { Objet } from '../../models/jeu/objet';
import { PhraseUtils } from '../commun/phrase-utils';
import { ProprieteConcept } from '../../models/commun/propriete-element';
import { RechercheUtils } from '../commun/recherche-utils';
import { Regle } from '../../interfaces/compilateur/regle';
import { ResultatCompilation } from '../../models/compilateur/resultat-compilation';
import { StringUtils } from '../commun/string.utils';
import { TypeRegle } from '../../models/compilateur/type-regle';
import { Voisin } from '../../models/jeu/voisin';
import { Commandeur, TypeEvenement } from 'donjon';
import { Concept } from '../../models/compilateur/concept';

export class Generateur {

  public static genererJeu(rc: ResultatCompilation): Jeu {

    let jeu = new Jeu();

    let ctx = new ContexteGeneration(false);

    // APPLIQUER LES DÉCLARATIONS D'ÉTATS PERSONNALISÉS
    // *************************************************
    // Propager le paramètre de création automatique des états (actif par défaut) sur la liste
    // des états AVANT d’appliquer les déclarations et de traiter les éléments.
    jeu.etats.creationAutomatiqueEtats = rc.parametres?.activerCreationAutomatiqueEtats ?? true;
    // Doit être fait AVANT le traitement des éléments (qui s’appuient sur la liste des états).
    Generateur.appliquerDeclarationsEtats(rc.declarationsEtats, jeu.etats, ctx);

    // assigner les statistiques du scénario
    jeu.statistiques = rc.statistiques;

    // DÉFINIR LES CLASSES
    // *******************
    jeu.classes = [];
    rc.monde.classes.forEach(classe => {
      classe.id = jeu.nextID++;
      // RESSOURCE : id dédié par TYPE de ressource (classe par-nom héritant de « ressource »,
      //  hors classe racine). Sert d'idOriginal commun à toutes les piles de cette ressource.
      if (classe.nom !== EClasseRacine.ressource && ClasseUtils.heriteDe(classe, EClasseRacine.ressource)) {
        classe.ressourceId = jeu.nextID++;
      }
      jeu.classes.push(classe);
    });

    // DÉFINIR LES FICHES D'AIDE
    // *************************
    jeu.aides = rc.aides;

    // DÉFINIR LES PARAMÈTRES
    // *************************
    jeu.parametres = rc.parametres;

    // DÉFINIR LES ABRÉVIATIONS
    // *************************
    jeu.abreviations = rc.abreviations;

    // // ÉCRAN
    // // ****************
    // let ecran = new Objet(jeu.nextID++, "écran", new GroupeNominal("l’", "écran"), ClassesRacines.Objet, 1, Genre.m, Nombre.s);
    // ecran.intituleS = ecran.intitule;
    // jeu.etats.ajouterEtatElement(ecran, EEtatsBase.invisible);
    // jeu.objets.push(ecran);

    // INFOS SUR LE JEU
    // ****************
    const jeuDansMonde = rc.monde.speciaux.find(x => x.nom === 'jeu');
    if (jeuDansMonde) {
      jeu.IFID = jeuDansMonde.proprietes.find(x => x.nom.toLowerCase() === 'ifid' || x.nom.toLowerCase() == 'identifiant')?.valeur;
      jeu.titre = jeuDansMonde.proprietes.find(x => x.nom === 'titre')?.valeur;
      jeu.auteur = jeuDansMonde.proprietes.find(x => x.nom === 'auteur')?.valeur;
      jeu.auteurs = jeuDansMonde.proprietes.find(x => x.nom === 'auteurs')?.valeur;
      jeu.participants = jeuDansMonde.proprietes.find(x => x.nom === 'participants')?.valeur;
      jeu.remerciements = jeuDansMonde.proprietes.find(x => x.nom === 'remerciements')?.valeur;
      jeu.version = jeuDansMonde.proprietes.find(x => x.nom === 'version')?.valeur;
    }

    // dossier qui contient les ressources du jeu (./assets/dossier_ressources)
    jeu.sousDossierRessources = undefined;
    const ressourcesDuJeuDansMonde = rc.monde.speciaux.find(x => x.nom === 'ressources du jeu');
    if (ressourcesDuJeuDansMonde?.positionString[0]?.complement) {
      const nomDossierNonSecurise = ressourcesDuJeuDansMonde.positionString[0].complement;
      const nomDossierSecurise = StringUtils.nomDeDossierSecurise(nomDossierNonSecurise);
      if (nomDossierSecurise.length && nomDossierSecurise == nomDossierNonSecurise) {
        jeu.sousDossierRessources = nomDossierSecurise;
      }
    }

    const siteWebDansMonde = rc.monde.speciaux.find(x => x.nom === 'site' && x.epithete === 'web');
    if (siteWebDansMonde) {
      jeu.siteWebTitre = siteWebDansMonde.proprietes.find(x => x.nom === 'titre')?.valeur;
      jeu.siteWebLien = siteWebDansMonde.proprietes.find(x => x.nom === 'lien')?.valeur;
    }

    const licenceDansMonde = rc.monde.speciaux.find(x => x.nom === 'licence');
    if (licenceDansMonde) {
      jeu.licenceTitre = licenceDansMonde.proprietes.find(x => x.nom === "titre")?.valeur;
      jeu.licenceLien = licenceDansMonde.proprietes.find(x => x.nom === "lien")?.valeur;
    }

    // INVENTAIRE
    // **********
    // (on l’ajoute pour pouvoir interagir avec)
    let inventaire = new Objet(jeu.nextID++, "inventaire", new GroupeNominal("l’", "inventaire", null), ClassesRacines.Special, 1, Genre.m, Nombre.s);
    inventaire.intituleS = inventaire.intitule;
    jeu.etats.ajouterEtatElement(inventaire, EEtatsBase.inaccessible, ctx);
    jeu.etats.ajouterEtatElement(inventaire, EEtatsBase.permeable, ctx);
    jeu.objets.push(inventaire);

    // AJOUTER LES CONCEPTS
    // ********************
    rc.monde.concepts.forEach(curEle => {
      // TODO: générer concepts
      let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
      let nouvConcept = new Concept(jeu.nextID++, intitule.nomEpithete, intitule);
      nouvConcept.genre = curEle.genre;
      nouvConcept.nombre = curEle.nombre;

      // ajouter les états par défaut de la classe du lieu
      //  (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
      Generateur.attribuerEtatsParDefaut(nouvConcept.classe, nouvConcept, jeu.etats, ctx);
      // ajouter les états du lieu définis explicitement (avec gestion de « non X »)
      Generateur.appliquerAttributsAvecNegation(nouvConcept, curEle.attributs, jeu, ctx);

      // parcourir les propriétés du lieu
      let nouvellesProp: ProprieteConcept[] = []
      curEle.proprietes.forEach(pro => {
        // spécial: intitulé
        if (pro.nom == 'intitulé') {
          // TODO: gérer groupe nominal ?
          const groupeNominal = PhraseUtils.getGroupeNominalDefini(pro.valeur, false);
          nouvConcept.intitule = groupeNominal ? groupeNominal : new GroupeNominal(null, pro.valeur);

          switch (nouvConcept.nombre) {
            case Nombre.tp:
            case Nombre.p:
              nouvConcept.intituleP = nouvConcept.intitule;
              break;
            case Nombre.s:
            case Nombre.i:
              nouvConcept.intituleS = nouvConcept.intitule;
              break;
          }
          // autres propriétés
        } else {
          // fix ç de aperçu
          if (pro.nom == 'apercu') {
            pro.nom = 'aperçu';
          }
          // ajouter ou mettre à jour
          const proExistantDeja = nouvConcept.proprietes.find(x => x.nom == pro.nom);
          if (proExistantDeja) {
            proExistantDeja.valeur = pro.valeur;
          } else {
            pro.parent = nouvConcept;
            nouvellesProp.push(pro);
          }
        }
      });
      nouvConcept.proprietes.push(...nouvellesProp);

      // synonymes définis par l’auteur
      if (curEle.synonymes?.length) {
        nouvConcept.addSynonymes(curEle.synonymes)
      }
      // synonymes générés automatiquement
      if (jeu.parametres.activerSynonymesAuto) {
        Generateur.genererSynonymesAuto(nouvConcept);
      }


      jeu.concepts.push(nouvConcept);
    });

    // AJOUTER LES LIEUX
    // ******************
    let premierIndexLieu = (jeu.nextID);
    rc.monde.lieux.forEach(curEle => {

      // let titre = (curEle.determinant ? (" " + curEle.determinant) : "") + curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "");
      let titreSansAutoMaj = (curEle.determinant ? curEle.determinant : "") + curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "");
      // mettre majuscule en début d’intitulé (début de Phrase)
      let titre = titreSansAutoMaj[0].toUpperCase() + titreSansAutoMaj.slice(1);
      let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
      let nouvLieu = new Lieu(jeu.nextID++, intitule.nomEpithete, intitule, titre);
      nouvLieu.genre = curEle.genre;
      nouvLieu.nombre = curEle.nombre;

      // ajouter description éventuelle du lieu
      if (curEle.description) {
        nouvLieu.description = curEle.description;
      }
      // ajouter les états par défaut de la classe du lieu
      //  (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
      Generateur.attribuerEtatsParDefaut(nouvLieu.classe, nouvLieu, jeu.etats, ctx);
      // ajouter les états du lieu définis explicitement (avec gestion de « non X »)
      Generateur.appliquerAttributsAvecNegation(nouvLieu, curEle.attributs, jeu, ctx);

      // parcourir les propriétés du lieu
      let nouvellesProp: ProprieteConcept[] = []
      curEle.proprietes.forEach(pro => {
        // spécial: intitulé
        if (pro.nom == 'intitulé') {
          // TODO: gérer groupe nominal ?
          const groupeNominal = PhraseUtils.getGroupeNominalDefini(pro.valeur, false);
          nouvLieu.intitule = groupeNominal ? groupeNominal : new GroupeNominal(null, pro.valeur);
          if (nouvLieu.nombre == Nombre.p || nouvLieu.nombre == Nombre.tp) {
            nouvLieu.intituleP = nouvLieu.intitule;
          } else {
            nouvLieu.intituleS = nouvLieu.intitule;
          }
          // autres propriétés
        } else {
          // fix ç de aperçu
          if (pro.nom == 'apercu') {
            pro.nom = 'aperçu';
          }
          // ajouter ou mettre à jour
          const proExistantDeja = nouvLieu.proprietes.find(x => x.nom == pro.nom);
          if (proExistantDeja) {
            proExistantDeja.valeur = pro.valeur;
          } else {
            pro.parent = nouvLieu;
            nouvellesProp.push(pro);
          }
        }
      });
      nouvLieu.proprietes.push(...nouvellesProp);

      // synonymes définis par l’auteur
      if (curEle.synonymes?.length) {
        nouvLieu.addSynonymes(curEle.synonymes)
      }
      // synonymes générés automatiquement
      if (jeu.parametres.activerSynonymesAuto) {
        Generateur.genererSynonymesAuto(nouvLieu);
      }

      // description par défaut du lieu (description automatique)
      if (nouvLieu.description === null) {
        nouvLieu.description = "Vous êtes dans " + nouvLieu.intitule + ".";
      }

      jeu.lieux.push(nouvLieu);
    });

    // DÉFINIR LES VOISINS (LIEUX)
    // ****************************
    for (let index = 0; index < rc.monde.lieux.length; index++) {
      const curEle = rc.monde.lieux[index];
      Generateur.ajouterVoisin(jeu.lieux, curEle, (premierIndexLieu + index), ctx);
    }

    // PLACER LE JOUEUR
    // ****************
    let joueur = new Objet(jeu.nextID++, "joueur", new GroupeNominal("le ", "joueur"), ClassesRacines.Vivant, 1, Genre.m, Nombre.s);
    jeu.joueur = joueur;
    joueur.intituleS = joueur.intitule;
    joueur.addSynonymes([new GroupeNominal("", "moi", null)]);
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.vu, ctx);
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.familier, ctx);
    jeu.etats.ajouterEtatElement(joueur, EEtatsBase.intact, ctx);
    // ajouter le joueur aux objets du jeu
    jeu.objets.push(joueur);
    // regarder si on a positionné le joueur dans le monde
    const joueurDansMonde = rc.monde.speciaux.find(x => x.nom === 'joueur');
    if (joueurDansMonde) {
      if (joueurDansMonde.positionString.length) {
        const ps = PositionObjet.getPrepositionSpatiale(joueurDansMonde.positionString[0].position);
        const lieuID = Generateur.getLieuID(jeu.lieux, joueurDansMonde.positionString[0].complement, true);
        if (lieuID !== -1) {
          joueur.position = new PositionObjet(ps, EClasseRacine.lieu, lieuID);
        }
      }

      // parcourir les propriétés du joueur
      let nouvellesProp: ProprieteConcept[] = []
      joueurDansMonde.proprietes.forEach(pro => {
        // spécial: intitulé
        if (pro.nom == 'intitulé') {
          // TODO: gérer groupe nominal ?
          joueur.intitule = new GroupeNominal(null, pro.valeur);
          if (joueur.nombre == Nombre.p || joueur.nombre == Nombre.tp) {
            joueur.intituleP = joueur.intitule;
          } else {
            joueur.intituleS = joueur.intitule;
          }
          // autres propriétés
        } else {
          // fix ç de aperçu
          if (pro.nom == 'apercu') {
            pro.nom = 'aperçu';
          }
          // ajouter ou mettre à jour
          const proExistantDeja = joueur.proprietes.find(x => x.nom == pro.nom);
          if (proExistantDeja) {
            proExistantDeja.valeur = pro.valeur;
          } else {
            pro.parent = joueur;
            nouvellesProp.push(pro);
          }
        }
      });
      joueur.proprietes.push(...nouvellesProp);

      // description du joueur par défaut
      if (joueur.description === null) {
        joueur.description = "(C’est vous)";
      }

      // ajouter attributs du joueur (avec gestion de « non X »)
      Generateur.appliquerAttributsAvecNegation(joueur, joueurDansMonde.attributs, jeu, ctx);
    }


    // PLACER LES ÉLÉMENTS DU JEU DANS LES LIEUX (ET DANS LA LISTE COMMUNE)
    // *********************************************************************
    // FONDS « propre à chaque lieu » : matérialiser une instance par lieu du domaine AVANT la
    //  boucle (les clones sont alors générés normalement). Les clones sont ajoutés EN FIN de liste
    //  → les ids des objets existants ne sont pas décalés (rejeu .sol/.rec déterministe). Les états
    //  de lieu sont déjà appliqués à ce stade (les lieux sont générés avant les objets).
    rc.monde.objets = Generateur.expanserFondsPropreParLieu(rc.monde.objets, jeu);

    // Placements à différer en 2ᵉ passe : objet posé sur un contenant/support déclaré APRÈS lui
    //  (la cible n'existe pas encore dans jeu.objets au moment de la résolution inline).
    const placementsADifferer: Array<{ newObjet: Objet, curEle: any, curPositionString: any }> = [];
    rc.monde.objets.forEach(curEle => {
      // ignorer le joueur (on l'a déjà ajouté)
      if (curEle.nom.toLowerCase() != 'joueur') {
        let intitule = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        let newObjet = new Objet(jeu.nextID++, intitule.nomEpithete, intitule, curEle.classe, curEle.quantite, curEle.genre, curEle.nombre);

        // reporter l’unité de comptage (ressources) : singulier + pluriel
        if (curEle.unite) {
          newObjet.unite = curEle.unite;
        }
        if (curEle.unites) {
          newObjet.unites = curEle.unites;
        }
        // genre grammatical de l’unité (pour les accords des messages)
        if (curEle.uniteGenre) {
          newObjet.uniteGenre = curEle.uniteGenre;
        }

        // Ressource déclarée mais jamais placée ni créée → quantité 0 (type/gabarit seulement,
        //  pas de pile illimitée fantôme). Une ressource placée a reçu une position via la fusion ;
        //  sa quantité (issue du placement) est alors conservée.
        if (ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.ressource) && (curEle.positionString?.length ?? 0) === 0) {
          newObjet.quantite = 0;
        }

        // RESSOURCE affichée dans le cartouche : config figée à la compilation (ancrée sur la
        //  définition) ; la quantité est sommée en direct à l'exécution selon le périmètre (scope).
        //  Dédup par nom : seul le 1er exemplaire (la définition) porte positionAffichage.
        if (curEle.positionAffichage
          && ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.ressource)
          && !jeu.ressourcesAffichees.some(r => r.nom === newObjet.nom)) {
          const proprieteTitre = curEle.proprietes?.find(p => p.nom?.toLowerCase() === 'titre');
          jeu.ressourcesAffichees.push(new RessourceAffichee(
            newObjet.nom,
            curEle.positionAffichage,
            intitule.nom,
            curEle.scopeAffichage ?? 'possede',
            newObjet.unite ?? null,
            newObjet.unites ?? null,
            proprieteTitre?.valeur ?? null,
            !!curEle.sansIntitule,
            !!curEle.sansUnite,
          ));
        }

        // RESSOURCE : toutes les piles d'une même ressource partagent le ressourceId dédié comme
        //  idOriginal (identité stable) → elles se regroupent une fois rassemblées dans un contenant.
        if (ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.ressource) && newObjet.classe.ressourceId != null) {
          newObjet.idOriginal = newObjet.classe.ressourceId;
          // s'il s'agit d'un objet multiple, lui donner l'id de sa classe comme id initial
        } else if (curEle.determinant?.match(/^(un |une |des |\d+ )$/i)) {
          newObjet.idOriginal = newObjet.classe.id;
        }
        newObjet.capacites = curEle.capacites;
        newObjet.reactions = curEle.reactions;

        // FOND « commun » (partagé) : porter la spec de présence sur l'objet runtime (présence
        //  résolue dynamiquement par prédicat dans majPresenceObjet). Les instances « propre »
        //  ont presenceFond = null (clones localisés par leur position).
        newObjet.presenceFond = curEle.presenceFond;

        // ajouter les états par défaut de la classe de l’objet
        //  (on commence par le parent le plus éloigné et on revient jusqu’à la classe le plus précise)
        Generateur.attribuerEtatsParDefaut(newObjet.classe, newObjet, jeu.etats, ctx);
        // ajouter les états de l'objet définis explicitement (avec gestion de « non X »)
        Generateur.appliquerAttributsAvecNegation(newObjet, curEle.attributs, jeu, ctx);

        // si indénombrable singulier, le nombre est indéfini.
        Generateur.corrigerNombreSiIndenombrable(newObjet, jeu);

        // ajouter description éventuelle de l’objet
        if (curEle.description) {
          newObjet.description = curEle.description;
        }

        // attributs liés à la quantité d’objets
        if (newObjet.quantite == 1) {
          jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.unique, ctx);
        } else {
          // plusieurs exemplaires
          jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.multiple, ctx);
          // quantité illimitée
          if (newObjet.quantite == -1) {
            jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.illimite, ctx);
          }
        }

        // Déterminer le SINGULIER à partir du pluriel.
        if (curEle.nombre === Nombre.p) {
          // on a déjà le pluriel (nomP si fourni — utile quand le nom a été normalisé sur la forme
          //  singulière canonique d'une ressource ; sinon le nom lui-même).
          newObjet.intituleP = new GroupeNominal(curEle.determinant, curEle.nomP ?? curEle.nom, curEle.epithete);
          // le singulier est fourni
          if (curEle.nomS) {
            newObjet.intituleS = new GroupeNominal(null, curEle.nomS, curEle.epitheteS);
            // le singulier est calculé (tête : « pommes de terre » → « pomme de terre »)
          } else {
            newObjet.intituleS = new GroupeNominal(null, MotUtils.getSingulierTete(curEle.nom), MotUtils.getSingulier(curEle.epithete));
          }
          // Déterminer PLURIEL à partir du singulier.
        } else if (curEle.nombre == Nombre.s) {
          // on a déjà le singulier
          newObjet.intituleS = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
          // le pluriel est fourni
          if (curEle.nomP) {
            newObjet.intituleP = new GroupeNominal(null, curEle.nomP, curEle.epitheteP);
            // le pluriel est calculé (tête : « point de vie » → « points de vie »)
          } else {
            newObjet.intituleP = new GroupeNominal(null, MotUtils.getPlurielTete(curEle.nom), MotUtils.getPluriel(curEle.epithete));
          }
        } else if (curEle.nombre == Nombre.tp) {
          // on a déjà le pluriel
          newObjet.intituleP = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
          // le singulier n’existe pas
          newObjet.intituleS = new GroupeNominal(curEle.determinant, curEle.nom, curEle.epithete);
        }

        // parcourir les propriétés de l’objet
        let nouvellesProp: ProprieteConcept[] = []
        curEle.proprietes.forEach(pro => {
          // spécial: intitulé
          if (pro.nom == 'intitulé') {
            // gérer groupe nominal
            const intituleDecompose = PhraseUtils.getGroupeNominalDefiniOuIndefini(pro.valeur, false);
            if (intituleDecompose) {
              newObjet.intitule = intituleDecompose;
              if (newObjet.nombre == Nombre.p || newObjet.nombre == Nombre.tp) {
                newObjet.intituleP = newObjet.intitule;
              } else {
                newObjet.intituleS = newObjet.intitule;
              }
            } else {
              ctx.ajouterErreur("L’intitulé « " + pro.valeur + " » n’est pas supporté (" + pro.nom + " => " + newObjet.nom + ")");
            }
            // autres propriétés
          } else {
            // fix ç de aperçu
            if (pro.nom == 'apercu') {
              pro.nom = 'aperçu';
            }
            // ajouter ou mettre à jour
            const proExistantDeja = newObjet.proprietes.find(x => x.nom == pro.nom);
            if (proExistantDeja) {
              proExistantDeja.valeur = pro.valeur;
            } else {
              pro.parent = newObjet;
              nouvellesProp.push(pro);
            }
          }
        });
        newObjet.proprietes.push(...nouvellesProp);

        // synonymes définis par l’auteur
        if (curEle.synonymes?.length) {
          newObjet.addSynonymes(curEle.synonymes)
        }
        // synonymes générés automatiquement
        if (jeu.parametres.activerSynonymesAuto) {
          Generateur.genererSynonymesAuto(newObjet);
        }

        // RESSOURCE : on peut la désigner par son unité, seule (« les pièces ») ou suivie de la
        //  ressource (« les pièces d’argent »). On enregistre les deux formes comme synonymes.
        if (newObjet.unite && ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.ressource)) {
          const unites = (newObjet.unites && newObjet.unites !== newObjet.unite) ? newObjet.unites : null;
          newObjet.synonymes.push(PhraseUtils.getGroupeNominalDefini(newObjet.unite, true));
          newObjet.synonymes.push(PhraseUtils.getGroupeNominalDefini(newObjet.unite + ' de ' + newObjet.nom, true));
          if (unites) {
            newObjet.synonymes.push(PhraseUtils.getGroupeNominalDefini(unites, true));
            newObjet.synonymes.push(PhraseUtils.getGroupeNominalDefini(unites + ' de ' + newObjet.nom, true));
          }
          // Le NOM seul (« or ») doit aussi être désignable avec une quantité (« prendre 10 or »).
          //  Sans ça, une quantité plurielle cherche l'intitulé pluriel (« ors ») qui ne matche pas
          //  le nom massif. On enregistre le nom comme synonyme (matché quelle que soit la quantité).
          newObjet.synonymes.push(PhraseUtils.getGroupeNominalDefini(newObjet.nom, true));
        }

        // description par défaut : phrase DYNAMIQUE résolue à l'affichage.
        //  « [Cest ceci] » → « C'est »/« Ce sont » accordé ; « [ceci] » → intitulé selon l'état
        //  réel (« une pomme » → « la pomme »), et toujours le nombre pour les ressources
        //  (« 1 pièce d'or », « 4 fruits »). L'auteur peut toujours définir sa propre description.
        if (newObjet.description === null) {
          newObjet.description = "[Cest ceci] [ceci].";
        }

        // POSITION de l’élément
        // --   A. OBSTACLE (PORTE ou autre)
        if (ClasseUtils.heriteDe(newObjet.classe, EClasseRacine.obstacle)) {
          Generateur.ajouterVoisin(jeu.lieux, curEle, newObjet.id, ctx);
        } else {
          // -- B. AUTRE TYPE D'OBJET
          if (curEle.positionString.length != 0) {
            const curPositionString = curEle.positionString[0];

            //console.error("@@ curPositionString=", curPositionString);

            // const localisation = Generateur.getLocalisation(curPositionString.position);
            const lieuID = Generateur.getLieuID(jeu.lieux, curPositionString.complement, false);

            // A) lieu trouvé
            if (lieuID !== -1) {
              newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curPositionString.position), EClasseRacine.lieu, lieuID);

              // vu que l’objet est dans un lieu, il ni porté ni occupé donc il est disponible
              jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.disponible, ctx, true);

              // B) pas de lieu trouvé
            } else {

              // chercher un contenant ou un support
              const contenantSupport = Generateur.getContenantSupportOuCouvrant(jeu.objets, curPositionString.complement);
              // >> trouvé contenant
              // Cible introuvable inline : support/contenant déclaré APRÈS l'objet (typiquement la
              //  1re pile d'une ressource, fusionnée sur sa définition placée tôt). On diffère : une
              //  2e passe (cf. après la boucle) réessaie une fois TOUS les objets créés ; le « else »
              //  d'erreur plus bas devient alors mort (cible toujours truthy ici) — l'erreur réelle
              //  est émise par la 2e passe si la cible reste introuvable.
              if (!contenantSupport) {
                placementsADifferer.push({ newObjet, curEle, curPositionString });
              } else if (contenantSupport) {

                // si le contenant est vivant, l’objet est « occupé »
                if (ClasseUtils.heriteDe(contenantSupport.classe, EClasseRacine.vivant)) {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.occupe, ctx, true);
                  // sinon l’objet est disponible
                } else {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.disponible, ctx, true);
                }

                // si le contenant est le joueur, l’objet est possédé (et vu)
                if (contenantSupport === jeu.joueur) {
                  jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.possede, ctx, true);
                  // à moins que l’objet soit « caché » dans l’inventaire, celui-ci est forcément « vu » par le joueur.
                  if (!jeu.etats.possedeEtatIdElement(newObjet, jeu.etats.cacheID, null)) {
                    jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.vu, ctx, true);
                  }
                }

                newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curPositionString.position), EClasseRacine.objet, contenantSupport.id);
                // >> pas trouvé de contenant
              } else {
                //console.warn("position élément jeu pas trouvé:", (curEle.nom + (curEle.epithete ? (" " + curEle.epithete) : "")), curPositionString);
                ctx.ajouterErreur('Élément « ' + curEle.elIntitule + ' » : position pas trouvée : ' + curPositionString.positionToString());
              }
            }

            if (curEle.positionString.length > 1) {
              ctx.ajouterErreur('L’élément « ' + curEle.elIntitule + ' » : a été positionné à plusieurs endroits. Seuls les lieux et les obstacles peuvent avoir plusieurs positions (relatives).');
            }

          };

          // si aucune position explicite mais l’objet est marqué « possédé »,
          // sa position est « dans le joueur » (inventaire initial).
          if (!newObjet.position && jeu.etats.possedeEtatIdElement(newObjet, jeu.etats.possedeID, null)) {
            newObjet.position = new PositionObjet(PrepositionSpatiale.dans, EClasseRacine.objet, jeu.joueur.id);
          }

        }
        jeu.objets.push(newObjet);
      }
    });

    // 2e PASSE — placements différés : objet posé sur un contenant/support déclaré APRÈS lui.
    // *********************************************************************************
    //  Tous les objets existent désormais dans jeu.objets : on réessaie la résolution (position +
    //  états induits). L'erreur « position pas trouvée » n'est émise QUE si la cible reste
    //  introuvable (vraie faute d'auteur : nom inexistant / faute de frappe).
    placementsADifferer.forEach(({ newObjet, curEle, curPositionString }) => {
      if (!Generateur.resoudrePositionSurContenant(jeu, ctx, newObjet, curPositionString)) {
        ctx.ajouterErreur('Élément « ' + curEle.elIntitule + ' » : position pas trouvée : ' + curPositionString.positionToString());
      }
    });

    // PLACEMENT DU JOUEUR
    // *******************
    // si pas de position définie, on commence dans le premier lieu
    if (!jeu.joueur.position) {
      if (jeu.lieux.length > 0) {
        jeu.joueur.position = new PositionObjet(PrepositionSpatiale.dans, EClasseRacine.lieu, jeu.lieux[0].id);
      }
    }

    // GÉNÉRER LES ACTIONS
    // *******************
    // Helper : deux actions ont la même signature si infinitif + (préposition + présence + cible) ceci/cela coïncident.
    const memeSignature = (a: Action, b: Action) =>
      a.infinitifSansAccent === b.infinitifSansAccent
      && a.ceci === b.ceci && a.cela === b.cela
      && (a.prepositionCeci ?? '') === (b.prepositionCeci ?? '')
      && (a.prepositionCela ?? '') === (b.prepositionCela ?? '')
      && (a.cibleCeci?.nom ?? null) === (b.cibleCeci?.nom ?? null)
      && (a.cibleCela?.nom ?? null) === (b.cibleCela?.nom ?? null);

    const signatureLisible = (action: Action) => action.infinitif
      + (action.ceci ? (action.prepositionCeci ? ' ' + action.prepositionCeci : '') + ' ceci' : '')
      + (action.cela ? (action.prepositionCela ? ' ' + action.prepositionCela : '') + ' cela' : '');
    const detailCibleLisible = (action: Action) =>
      (action.cibleCeci?.nom || action.cibleCela?.nom)
        ? ` (ceci=${action.cibleCeci?.nom ?? '∅'}, cela=${action.cibleCela?.nom ?? '∅'})`
        : '';

    // Passe 1 : actions « normales » (non-remplaçantes).
    // Détection de doublons : deux blocs `action X:` avec la même signature → erreur, l’auteur doit
    // utiliser `règle remplacer X` s’il voulait remplacer le comportement par défaut.
    rc.actions.forEach(action => {
      if (action.remplace) return;
      const doublon = jeu.actions.find(a => memeSignature(a, action));
      if (doublon) {
        ctx.ajouterErreur(`L’action « ${signatureLisible(action)} »${detailCibleLisible(action)} est définie plusieurs fois. Pour modifier le comportement d’une action existante, utilisez « règle remplacer ${signatureLisible(action)} ».`);
        return;
      }
      jeu.actions.push(action);
    });

    // Passe 2 : règles remplacer (action.remplace === true).
    // Plusieurs actions peuvent partager le même infinitif+ceci+cela (ex: 4 « action examiner ceci »
    // distinguées par cibleCeci.nom : direction, lieu, objet, spécial). Le remplacement doit donc
    // aussi désambiguïser sur cibleCeci.nom / cibleCela.nom — sinon on écraserait la mauvaise.
    rc.actions.forEach(action => {
      if (!action.remplace) return;
      const indexMatches: number[] = [];
      jeu.actions.forEach((a, i) => { if (memeSignature(a, action)) indexMatches.push(i); });
      if (indexMatches.length === 0) {
        // Pas de cible : on crée l’action quand même, mais on prévient l’auteur (visible dans donjon-creer).
        jeu.tamponConseils.push(`« règle remplacer ${signatureLisible(action)} »${detailCibleLisible(action)} ne correspond à aucune action existante — une nouvelle action est créée.`);
        jeu.actions.push(action);
      } else if (indexMatches.length > 1) {
        ctx.ajouterErreur(`« règle remplacer ${signatureLisible(action)} »${detailCibleLisible(action)} correspond à ${indexMatches.length} actions existantes — précisez davantage le bloc « définitions: » pour lever l’ambiguïté.`);
      } else {
        // Vérifier qu’aucune autre « règle remplacer » n’a déjà ciblé cette action.
        const dejaRemplacee = jeu.actions[indexMatches[0]].remplace;
        if (dejaRemplacee) {
          ctx.ajouterErreur(`Deux « règle remplacer ${signatureLisible(action)} »${detailCibleLisible(action)} pour la même action : une seule règle de remplacement est autorisée par action.`);
        } else {
          // garder une référence vers l’action originale écrasée pour traçabilité dans l’aperçu.
          action.actionRemplacee = jeu.actions[indexMatches[0]];
          jeu.actions.splice(indexMatches[0], 1, action);
        }
      }
    });

    // Passe 3 : conseil si une « règle remplacer » d’un verbe laisse d’autres formes de ce verbe
    // non remplacées (la phase « définitions: » fait partie de la signature). L’action de base
    // reste alors active pour ces formes — parfois voulu, donc conseil (visible dans
    // donjon-creer), pas erreur.
    const infinitifsRemplaces = new Set(rc.actions.filter(a => a.remplace).map(a => a.infinitifSansAccent));
    infinitifsRemplaces.forEach(infinitifSansAccent => {
      jeu.actions
        .filter(a => a.infinitifSansAccent === infinitifSansAccent && !a.remplace)
        .forEach(reste => {
          jeu.tamponConseils.push(`« règle remplacer ${reste.infinitif} » : la forme « ${signatureLisible(reste)} »${detailCibleLisible(reste)} n’est pas remplacée et reste active. Si ce n’est pas voulu, vérifiez la phase « définitions: » de votre règle : elle fait partie de la signature de l’action.`);
        });
    });

    // GÉNÉRER LES ROUTINES
    // ********************
    rc.routinesSimples.forEach(routineSimple => {
      jeu.routines.push(routineSimple);
    });

    // GÉNÉRER LES COMPTEURS
    // *********************
    rc.compteurs.forEach(cpt => {
      const intitule = new GroupeNominal(cpt.determinant, cpt.nom, cpt.epithete);
      const curCompteur = new Compteur(intitule.nomEpithete, 0, intitule, ClassesRacines.Compteur);
      // vérifier les attributs du compteur
      cpt.attributs.forEach(curAttribut => {
        // valeur initialisation
        const initialisation = ExprReg.xInitialiseA.exec(curAttribut)
        if (initialisation) {
          // vérifier s’il s’agit d’un nombre
          curCompteur.valeur = CompteursUtils.intituleNombreVersNombre(initialisation[1]);
        }
      });

      if (cpt.positionAffichage) {
        curCompteur.positionAffichage = cpt.positionAffichage;
      }
      if (cpt.unite) {
        curCompteur.unite = cpt.unite;
      }
      if (cpt.sansIntitule) {
        curCompteur.sansIntitule = true;
      }
      if (cpt.sansUnite) {
        curCompteur.sansUnite = true;
      }
      // Titre libre : défini via la propriété "titre" (regex xProprieteReaction).
      // Ex: « Le titre du score est "Score final". »
      const proprieteTitre = cpt.proprietes.find(p => p.nom?.toLowerCase() === 'titre');
      if (proprieteTitre?.valeur) {
        curCompteur.titre = proprieteTitre.valeur;
      }
      jeu.compteurs.push(curCompteur);
    });


    // GÉNÉRER LES LISTES
    // *********************
    rc.listes.forEach(lst => {
      const intitule = new GroupeNominal(lst.determinant, lst.nom, lst.epithete);
      const curListe = new Liste(intitule.nomEpithete, intitule, ClassesRacines.ListeVide);

      if (lst.valeursNombre.length) {
        curListe.ajouterNombres(lst.valeursNombre);
      }
      if (lst.valeursTexte.length) {
        curListe.ajouterTextes(lst.valeursTexte);
      }
      if (lst.valeursIntitule.length) {
        const eju = new ElementsJeuUtils(jeu, false);
        lst.valeursIntitule.forEach(valeurIntitule => {
          const cor = eju.trouverCorrespondance(valeurIntitule, TypeSujet.SujetEstNom, false, false);
          if (cor.nbCor == 1) {
            curListe.ajouterIntitule(cor.unique);
          } else {
            curListe.ajouterIntitule(cor.intitule);
          }
        });
      }

      jeu.listes.push(curListe);
    });

    // GÉNÉRER LES AUDITEURS
    // *********************

    let com = new Commandeur(jeu, null, null, true);

    // ajouter les règles
    rc.regles.forEach(regle => {
      switch (regle.typeRegle) {
        case TypeRegle.apres:
        case TypeRegle.avant:
        case TypeRegle.remplacer:

          // découper les commandes qui déclenchent les règles
          // à présent que l’on dispose des objets
          regle.evenements.forEach(ev => {

            if (ev.type == TypeEvenement.action) {
              if (ev.commandeComprise) {
                let ctxCom = com.decomposerCommande(ev.commandeComprise);
                // aucune commande trouvée
                if (ctxCom.candidats.length == 0) {
                  ctx.ajouterErreur(`❌ Pas trouvé de commande pour la règle ${regle.typeRegle} ${regle.evenements[0].commandeComprise}`)
                  // une commande se démarque
                } else if ((ctxCom.candidats.length == 1) || (ctxCom.candidats[0].score > ctxCom.candidats[1].score)) {
                  const cmd = ctxCom.candidats[0];
                  ev.commandeComprise = undefined;

                  const ceci = cmd.els.sujet;
                  ev.isCeci = ceci ? true : false;
                  ev.ceci = (ev.isCeci ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((ceci.determinant?.match(/un(e)? /) ? ceci.determinant : '') + ceci.nom + (ceci.epithete ? (" " + ceci.epithete) : "")).trim() : null);
                  ev.classeCeci = (ceci?.determinant?.match(/un(e)? /) ? ClasseUtils.trouverClasse(jeu.classes, ceci.nom) : null);
                  ev.quantiteCeci = 0;
                  ev.prepositionCeci = cmd.els.preposition0;

                  const cela = cmd.els.sujetComplement1;
                  ev.isCela = cela ? true : false;
                  ev.cela = (ev.isCela ? RechercheUtils.transformerCaracteresSpeciauxEtMajuscules((cela.determinant?.match(/un(e)? /) ? cela.determinant : '') + cela.nom + (cela.epithete ? (" " + cela.epithete) : "")).trim() : null);
                  ev.classeCela = (cela?.determinant?.match(/un(e)? /) ? ClasseUtils.trouverClasse(jeu.classes, cela.nom) : null);
                  ev.quantiteCela = 0;
                  ev.prepositionCela = cmd.els.preposition1;

                  if (ctx.verbeux) {
                    console.warn(`🟢 Commande trouvée pour la règle ${regle.intitule}`);
                  }

                  // aucune commande ne se démarque
                } else {
                  ctx.ajouterErreur(`❌ Plusieurs commandes trouvées pour la règle ${regle.typeRegle} ${regle.evenements[0].commandeComprise}`)
                }
              } else {
                //TODO: check si on peut complètement supprimer l'erreur ou si elle est pertinante dans certains cas
                //ctx.ajouterErreur(`❌ ev.commandeComprise n’est pas défini pour la règle: ${regle.intitule}`)
              }
            }
          });

          // ajouter la règle
          jeu.auditeurs.push(Generateur.getAuditeur(regle));
          break;

        default:
          break;
      }
    });


    // ajouter les erreurs
    if (ctx.erreurs.length) {
      jeu.tamponErreurs.push(...ctx.erreurs);
    }

    return jeu;
  }

  /**
   * Ajout d'un voisin (lieu ou porte) à un lieu 
   * @argument lieux liste des lieux
   * @argument voisin à ajouter
   * @argument identifiant du voisin à ajouter
   * @argument ctx contexte génération (pour pouvoir ajouter des erreurs)
   */
  static ajouterVoisin(lieux: Lieu[], elVoisin: ElementGenerique, idElVoisin: number, ctx: ContexteGeneration) {

    // Parcourir les positions relatives du nouveau voisin
    elVoisin.positionString.forEach(curPositionString => {

      // retrouver la localisation (nord, nord-est, …)
      const localisation = Generateur.getLocalisation(curPositionString.position);
      // lieu auquel il faut ajouter le voisin
      const lieuTrouveID = Generateur.getLieuID(lieux, curPositionString.complement, true);

      if (localisation === ELocalisation.inconnu) {
        ctx.ajouterErreur(`positionnement lieu « ${elVoisin.elIntitule} » : position relative pas trouvée : « ${curPositionString.position} »`, elVoisin.numeroLigne);
      } else if (lieuTrouveID === -1) {
        ctx.ajouterErreur(`positionnement lieu « ${elVoisin.elIntitule} » : lieu lié pas trouvé : « ${curPositionString.complement} »`, elVoisin.numeroLigne);
      } else {
        // on met la classe racine lieu, porte ou obstacle:
        let classeRacine: string;
        // lieu
        if (ClasseUtils.heriteDe(elVoisin.classe, EClasseRacine.lieu)) {
          classeRacine = EClasseRacine.lieu;
          // porte
        } else if (ClasseUtils.heriteDe(elVoisin.classe, EClasseRacine.porte)) {
          classeRacine = EClasseRacine.porte;
          // autre type d’obstacle
        } else {
          classeRacine = EClasseRacine.obstacle;
        }

        // ajouter au lieu trouvé, le voisin elVoisin
        const opposeVoisin = new Voisin(idElVoisin, classeRacine, localisation);
        const lieu = lieux.find(x => x.id == lieuTrouveID);
        lieu.ajouterVoisin(opposeVoisin);

        // le lieu trouvé, est le voisin du lieu elVoisin.
        if (classeRacine == EClasseRacine.lieu) {
          // ajouter le lieu trouvé aux voisins de elVoisin
          const newVoisin = new Voisin(lieuTrouveID, classeRacine, this.getOpposePosition(localisation));
          const lieuTrouve = lieux.find(x => x.id === idElVoisin);
          lieuTrouve.ajouterVoisin(newVoisin);
          // la porte trouvée, est également visible depuis le lieu voisin à priori…
        } else if (classeRacine == EClasseRacine.porte) {
          // todo: rendre la porte visible chez le voisin également
        }
      }
    });
  }

  static getAuditeur(regle: Regle) {
    let auditeur = new Auditeur();
    auditeur.type = regle.typeRegle;
    auditeur.evenements = regle.evenements;
    auditeur.instructions = regle.instructions;
    return auditeur;
  }
  /**
   * Retrouver un lieu sur base de son intitulé.
   * @param lieux 
   * @param nomLieu
   * @returns ID du lieu ou -1 si pas trouvée.
   */
  /**
   * FONDS — résoudre le domaine de lieux d'un fond (tous, ou ceux possédant l'état du domaine).
   */
  private static resoudreDomaineFond(presence: PresenceFond, jeu: Jeu): Lieu[] {
    if (presence.tousLesLieux) {
      return jeu.lieux.slice();
    }
    if (!presence.etatDomaine) {
      return [];
    }
    return jeu.lieux.filter(lieu => jeu.etats.possedeEtatElement(lieu, presence.etatDomaine, null));
  }

  /**
   * FONDS — cloner un élément générique « propre à chaque lieu » pour un lieu donné.
   * Le clone reçoit une position « dans <lieu> » (résolue par la boucle via getLieuID) et son
   * propre jeu de propriétés (pour ne pas partager les pointeurs `parent` entre instances).
   */
  private static clonerElementGeneriquePourLieu(source: ElementGenerique, lieu: Lieu): ElementGenerique {
    const clone = new ElementGenerique(
      source.determinant,
      source.nom,
      source.epithete,
      source.classeIntitule,
      source.classe,
      [new PositionSujetString(source.nom, lieu.nom, 'dans')],
      source.genre,
      source.nombre,
      source.quantite,
      source.attributs ? source.attributs.slice() : [],
    );
    clone.numeroLigne = source.numeroLigne;
    clone.description = source.description;
    clone.nomS = source.nomS;
    clone.nomP = source.nomP;
    clone.epitheteS = source.epitheteS;
    clone.epitheteP = source.epitheteP;
    clone.synonymes = source.synonymes ? source.synonymes.slice() : [];
    clone.capacites = source.capacites ? source.capacites.slice() : [];
    clone.reactions = source.reactions ? source.reactions.slice() : [];
    clone.proprietes = (source.proprietes ?? []).map(p => new ProprieteConcept(null, p.nom, p.type, p.valeur, 0));
    // instance localisée par sa position → pas de présence par prédicat
    clone.presenceFond = null;

    // SURCHARGES PAR LIEU : écraser/ajouter les propriétés (et attributs) propres à ce lieu
    //  (« La description du sol situé dans la cuisine est "…" »). Clé = nom de lieu nettoyé.
    if (source.surchargesParLieu) {
      const key = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(lieu.nom);
      const surcharge = source.surchargesParLieu.get(key);
      if (surcharge) {
        surcharge.proprietes.forEach(sp => {
          const copie = new ProprieteConcept(null, sp.nom, sp.type, sp.valeur, 0);
          const idx = clone.proprietes.findIndex(p => p.nom === sp.nom);
          if (idx >= 0) { clone.proprietes[idx] = copie; } else { clone.proprietes.push(copie); }
        });
        if (surcharge.attributs?.length) {
          clone.attributs = clone.attributs.concat(surcharge.attributs);
        }
      }
    }
    return clone;
  }

  /**
   * FONDS — remplacer chaque fond « propre à chaque lieu » par une instance par lieu du domaine.
   * Les instances (clones) sont ajoutées EN FIN de liste pour ne pas décaler les ids des autres
   * objets (rejeu .sol/.rec déterministe). Les fonds « commun » (partagés) sont laissés tels quels.
   */
  private static expanserFondsPropreParLieu(elements: ElementGenerique[], jeu: Jeu): ElementGenerique[] {
    const base: ElementGenerique[] = [];
    const clones: ElementGenerique[] = [];
    elements.forEach(el => {
      const estFond = el.classe ? ClasseUtils.heriteDe(el.classe, EClasseRacine.fond) : (el.classeIntitule === EClasseRacine.fond);
      if (el.presenceFond && estFond && el.presenceFond.portee === 'parLieu') {
        const lieuxDomaine = Generateur.resoudreDomaineFond(el.presenceFond, jeu);
        lieuxDomaine.forEach(lieu => clones.push(Generateur.clonerElementGeneriquePourLieu(el, lieu)));
        // le template n'est pas généré (remplacé par ses instances par lieu)
      } else {
        base.push(el);
      }
    });
    return base.concat(clones);
  }

  static getLieuID(lieux: Lieu[], nomLieu: string, erreurSiPasTrouve: boolean) {

    let candidats: Lieu[] = [];
    let retVal = -1;
    // trouver le sujet complet
    const nomLieuNettoye = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(nomLieu.trim());
    lieux.forEach(lieu => {
      // rem: le nom d’un lieu est toujours un minuscule, pas besoin de forcer ici
      if (lieu.nom == nomLieuNettoye) {
        candidats.push(lieu);
      }
    });
    // sujet trouvé
    if (candidats.length === 1) {
      retVal = candidats[0].id;
      // pas trouvé => on va chercher le début d'un sujet
    } else if (candidats.length === 0) {
      let nbFound = 0;
      // trouver un début de sujet
      lieux.forEach(lieu => {
        if (lieu.nom.startsWith(nomLieuNettoye)) {
          candidats.push(lieu);
          nbFound += 1;
        }
      });
      if (nbFound === 1) {
        retVal = candidats[0].id;
      } else if (erreurSiPasTrouve) {
        console.log("complément position pas trouvé : intituleLieu=", nomLieu, "lieux=", lieux);
      }
    } else if (erreurSiPasTrouve) {
      console.log("complément position pas trouvé (plusieurs candidats) :", nomLieu);
    }

    return retVal;
  }

  /**
   * Résoudre la position d’un objet posé SUR/DANS/SOUS un contenant ou support : applique la
   * position ET les états induits (disponible/occupé, et possédé+vu si la cible est le joueur).
   * Appelé en résolution inline (1re passe) ET pour les placements différés (2e passe).
   * @returns true si la cible a été trouvée et la position appliquée ; false sinon (cible absente
   *          de jeu.objets — au caller de différer (1re passe) ou d’émettre l’erreur (2e passe)).
   */
  static resoudrePositionSurContenant(jeu: Jeu, ctx: ContexteGeneration, newObjet: Objet, curPositionString: any): boolean {
    const contenantSupport = Generateur.getContenantSupportOuCouvrant(jeu.objets, curPositionString.complement);
    if (!contenantSupport) { return false; }

    // si le contenant est vivant, l’objet est « occupé » ; sinon il est « disponible »
    if (ClasseUtils.heriteDe(contenantSupport.classe, EClasseRacine.vivant)) {
      jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.occupe, ctx, true);
    } else {
      jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.disponible, ctx, true);
    }

    // si le contenant est le joueur, l’objet est possédé (et vu, sauf s’il est caché)
    if (contenantSupport === jeu.joueur) {
      jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.possede, ctx, true);
      if (!jeu.etats.possedeEtatIdElement(newObjet, jeu.etats.cacheID, null)) {
        jeu.etats.ajouterEtatElement(newObjet, EEtatsBase.vu, ctx, true);
      }
    }

    newObjet.position = new PositionObjet(PositionObjet.getPrepositionSpatiale(curPositionString.position), EClasseRacine.objet, contenantSupport.id);
    return true;
  }

  /** Trouver l’objet qui fait office de contenant (dans), support (sur) ou couvrant (sous) */
  static getContenantSupportOuCouvrant(objets: Objet[], nomObjet: string) {

    // patch pour l’inventaire qui est en réalité le joueur:
    if (nomObjet === 'inventaire') {
      nomObjet = 'joueur';
    }

    // TODO: check si contenant ou support ?
    // mais quid pour « sous » ?

    let trouve: Objet = null;

    const nomObjetNettoye = RechercheUtils.transformerCaracteresSpeciauxEtMajuscules(nomObjet.trim());

    objets.forEach(el => {
      // rem: le nom d’un Objet est toujours en lower case c’est pourquoi on ne le force pas ici.
      if (el.nom === nomObjetNettoye) {
        trouve = el;
      }
    });

    return trouve;
  }

  /**
   * Appliquer une liste d’attributs explicites sur un élément, en gérant la négation.
   *
   * - Attribut « non X » → retire l’état X de l’élément. Si X appartient à une bascule, pousse aussi un
   *   conseil dans `jeu.tamponConseils` invitant à utiliser la forme positive de l’opposé.
   * - Attribut « X » → ajoute l’état X comme d’habitude (via `ajouterEtatElement`).
   *
   * À appeler APRÈS `attribuerEtatsParDefaut(...)` pour que la négation puisse retirer un défaut de classe.
   */
  static appliquerAttributsAvecNegation(cibleEle: Concept, attributs: string[], jeu: Jeu, ctx: ContexteGeneration) {
    if (!attributs || attributs.length === 0) return;
    for (const attribut of attributs) {
      // Accepter `non X` (espace) ou `non_X` (underscore, produit par preTraiterNegation).
      const m = /^non[\s_]+(.+)$/i.exec(attribut.trim());
      if (m) {
        const nomEtatNie = m[1].trim();
        const etatNie = jeu.etats.trouverEtatSilencieux(nomEtatNie);
        if (etatNie) {
          jeu.etats.retirerEtatElement(cibleEle, nomEtatNie, ctx);
          if (etatNie.bascule !== null) {
            const oppose = jeu.etats.obtenirEtat(etatNie.bascule);
            const oppNom = oppose ? oppose.nom : "<opposé>";
            jeu.tamponConseils.push(
              `Plutôt qu’écrire « non ${etatNie.nom} », préférer « ${oppNom} » : ${etatNie.nom}/${oppNom} forment une bascule, la forme positive de l’opposé est plus claire.`
            );
          }
        } else {
          ctx.ajouterErreur(`Négation « ${attribut} » : l’état « ${nomEtatNie} » n’existe pas.`);
        }
      } else {
        jeu.etats.ajouterEtatElement(cibleEle, attribut, ctx);
      }
    }
  }

  /**
   * Appliquer les déclarations d’états personnalisés (issues de la DSL) sur la liste des états du jeu.
   * Doit être appelé avant tout traitement d’élément.
   * L’ordre est : simple → bascule → groupe → implication → exclusion, afin que les implications
   * et exclusions puissent référencer des états créés juste avant.
   */
  static appliquerDeclarationsEtats(declarations: DeclarationEtat[], etats: ListeEtats, ctx: ContexteGeneration) {
    if (!declarations || declarations.length === 0) {
      return;
    }
    const ordrePhases: TypeDeclarationEtat[] = [
      TypeDeclarationEtat.simple,
      TypeDeclarationEtat.bascule,
      TypeDeclarationEtat.groupe,
      TypeDeclarationEtat.implication,
      TypeDeclarationEtat.exclusion,
    ];

    for (const phase of ordrePhases) {
      for (const decl of declarations) {
        if (decl.type !== phase) continue;
        switch (decl.type) {
          case TypeDeclarationEtat.simple: {
            const nom = decl.etats[0];
            if (etats.trouverEtatSilencieux(nom)) {
              ctx.ajouterErreur(`L’état « ${nom} » est déjà déclaré (état moteur ou déclaration précédente).`, decl.ligne);
            } else {
              etats.creerEtat(nom);
            }
            break;
          }
          case TypeDeclarationEtat.bascule: {
            const [a, b] = decl.etats;
            const conflit = [a, b].find(n => etats.trouverEtatSilencieux(n));
            if (conflit) {
              ctx.ajouterErreur(`L’état « ${conflit} » est déjà déclaré, impossible de créer la bascule « ${a} et ${b} forment une bascule ».`, decl.ligne);
            } else {
              etats.creerBasculeEtats(a, b);
            }
            break;
          }
          case TypeDeclarationEtat.groupe: {
            const conflit = decl.etats.find(n => etats.trouverEtatSilencieux(n));
            if (conflit) {
              ctx.ajouterErreur(`L’état « ${conflit} » est déjà déclaré, impossible de créer le groupe « ${decl.etats.join(", ")} se contredisent ».`, decl.ligne);
            } else {
              etats.creerGroupeEtats(decl.etats);
            }
            break;
          }
          case TypeDeclarationEtat.implication: {
            if (!Generateur.assurerEtatPourRelation(etats, decl.sujet, ctx, decl)) break;
            for (const cible of decl.cibles) {
              if (!Generateur.assurerEtatPourRelation(etats, cible, ctx, decl)) continue;
              etats.ajouterImplication(decl.sujet, cible);
            }
            break;
          }
          case TypeDeclarationEtat.exclusion: {
            if (!Generateur.assurerEtatPourRelation(etats, decl.sujet, ctx, decl)) break;
            for (const cible of decl.cibles) {
              if (!Generateur.assurerEtatPourRelation(etats, cible, ctx, decl)) continue;
              etats.ajouterContradiction(decl.sujet, cible);
            }
            break;
          }
        }
      }
    }
  }

  /**
   * S’assurer qu’un état utilisé dans une relation (implication / exclusion) existe.
   * Si la création automatique des états est active, le crée à la volée ; sinon signale une erreur.
   * @returns true si l’état existe (ou vient d’être créé), false sinon.
   */
  private static assurerEtatPourRelation(etats: ListeEtats, nom: string, ctx: ContexteGeneration, decl: DeclarationEtat): boolean {
    if (etats.trouverEtatSilencieux(nom)) {
      return true;
    }
    if (etats.creationAutomatiqueEtats) {
      etats.creerEtat(nom);
      return true;
    }
    ctx.ajouterErreur(`L’état « ${nom} » utilisé dans une relation entre états n’existe pas et la création automatique des états est désactivée. Déclarez-le (« ${nom} est un état. ») avant la relation.`, decl.ligne);
    return false;
  }

  /**
   * Attribuer les états par défaut de l’objet sur base de la classe spécifiée.
   * Si la classe à un parent, on commence par attribuer les états par défaut du parent.
   */
  static attribuerEtatsParDefaut(classe: Classe, ele: Concept, etats: ListeEtats, ctx: ContexteGeneration) {
    // commencer par la classe parent (s’il y en a)
    if (classe.parent) {
      Generateur.attribuerEtatsParDefaut(classe.parent, ele, etats, ctx);
    }
    // attribuer les états par défaut de la classe
    classe.etats.forEach(nomEtat => {
      etats.ajouterEtatElement(ele, nomEtat, ctx);
    });
  }

  /**
   * Obtenir la localisation correspondante.
   */
  static getLocalisation(strPosition: string): ELocalisation {

    strPosition = strPosition
      .trim()
      .toLocaleLowerCase()
      .replace(/^((à (l'|l\u2019)|en |au( |\-)))/, "")
      .replace(/(du|de( la| l'| l\u2019)?|des|le|la|les|l'|l\u2019)$/, "")
      .trim();

    let retVal = ELocalisation.inconnu;
    switch (strPosition) {
      case "bas":
      case "dessous":
        retVal = ELocalisation.bas;
        break;
      case "haut":
      case "dessus":
        retVal = ELocalisation.haut;
        break;
      case "extérieur":
      case "exterieur":
      case "hors":
        retVal = ELocalisation.exterieur;
        break;
      case "intérieur":
      case "interieur":
      case "dans":
        retVal = ELocalisation.interieur;
        break;
      case "est":
        retVal = ELocalisation.est;
        break;
      case "ouest":
        retVal = ELocalisation.ouest;
        break;
      case "nord":
        retVal = ELocalisation.nord;
        break;
      case "nord-est":
        retVal = ELocalisation.nord_est;
        break;
      case "nord-ouest":
        retVal = ELocalisation.nord_ouest;
        break;
      case "sud":
        retVal = ELocalisation.sud;
        break;
      case "sud-est":
        retVal = ELocalisation.sud_est;
        break;
      case "sud-ouest":
        retVal = ELocalisation.sud_ouest;
        break;
      default:
        console.log("Localisation pas connue: ", strPosition);
        break;
    }

    return retVal;
  }

  static getOpposePosition(localisation: ELocalisation) {
    switch (localisation) {
      // est
      case ELocalisation.est:
        return ELocalisation.ouest;
      // ouest
      case ELocalisation.ouest:
        return ELocalisation.est;
      // nord
      case ELocalisation.nord:
        return ELocalisation.sud;
      // nord-est
      case ELocalisation.nord_est:
        return ELocalisation.sud_ouest;
      // nord-ouest
      case ELocalisation.nord_ouest:
        return ELocalisation.sud_est;
      // sud
      case ELocalisation.sud:
        return ELocalisation.nord;
      // sud-est
      case ELocalisation.sud_est:
        return ELocalisation.nord_ouest;
      // sud-ouest
      case ELocalisation.sud_ouest:
        return ELocalisation.nord_est;
      // bas
      case ELocalisation.bas:
        return ELocalisation.haut;
      // haut
      case ELocalisation.haut:
        return ELocalisation.bas;
      // intérieur
      case ELocalisation.interieur:
        return ELocalisation.exterieur;
      // extérieur
      case ELocalisation.exterieur:
        return ELocalisation.interieur;

      default:
        return ELocalisation.inconnu;
    }
  }

  /**
   * Un élément qui est singulier et indénombrable possède en fait le nombre indéfini.
   */
  private static corrigerNombreSiIndenombrable(el: ElementJeu, jeu: Jeu) {
    if (el.nombre == Nombre.s && jeu.etats.possedeEtatIdElement(el, jeu.etats.indenombrableID, undefined)) {
      el.nombre = Nombre.i;
    }
  }

  public static genererSynonymesAuto(concept: Concept) {
    // composé de au moins 2 mots
    if (concept.intitule.motsCles.length > 1) {
      for (let indexMotA = 0; indexMotA < concept.intitule.motsCles.length; indexMotA++) {
        // chaque mot séparé est un synonyme — dans ses DEUX formes (singulier ET pluriel), car les
        //  commandes ne normalisent pas le nombre (on matche les formes stockées). Ainsi « vies »
        //  comme « vie » désignent « points de vie » (cf. nomS/nomP du nom principal).
        const motCleA = concept.intitule.motsCles[indexMotA];
        const formes = [motCleA];
        // ajouter la forme singulier seulement si le mot n’est PAS invariable au pluriel
        //  (évite de mutiler « bois » → « boi », « dubois » → « duboi »).
        if (MotUtils.getPluriel(motCleA) !== motCleA) {
          formes.push(MotUtils.getSingulier(motCleA));
        }
        formes.push(MotUtils.getPluriel(motCleA));
        formes.forEach(forme => {
          const syn = PhraseUtils.getGroupeNominalDefini(forme, true);
          if (!concept.synonymes.some(x => x.toString() == syn.toString())) {
            concept.synonymes.push(syn);
          }
        });
        // composé de au moins 3 mots
        if (concept.intitule.motsCles.length > 2) {
          for (let indexMotB = indexMotA + 1; indexMotB < concept.intitule.motsCles.length; indexMotB++) {
            const motCleB = concept.intitule.motsCles[indexMotB];
            const curSynonymeDouble = PhraseUtils.getGroupeNominalDefini(`${motCleA} ${motCleB}`, true);
            if (!concept.synonymes.some(x => x.toString() == curSynonymeDouble.toString())) {
              concept.synonymes.push(curSynonymeDouble);
            }
          }
        }
      }
    }

  }

}
