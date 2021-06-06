import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';

import { Abreviations } from '../utils/jeu/abreviations';
import { ActionCeciCela } from '../models/compilateur/action';
import { ActionsUtils } from '../utils/jeu/actions-utils';
import { BalisesHtml } from '../utils/jeu/balises-html';
import { ClasseUtils } from '../utils/commun/classe-utils';
import { ClassesRacines } from '../models/commun/classes-racines';
import { Commandes } from '../utils/jeu/commandes';
import { ConditionsUtils } from '../utils/jeu/conditions-utils';
import { Declencheur } from '../utils/jeu/declencheur';
import { EClasseRacine } from '../models/commun/constantes';
import { ElementsJeuUtils } from '../utils/commun/elements-jeu-utils';
import { Evenement } from '../models/jouer/evenement';
import { Instructions } from '../utils/jeu/instructions';
import { Jeu } from '../models/jeu/jeu';
import { MotUtils } from '../utils/commun/mot-utils';
import { Objet } from '../models/jeu/objet';
import { PhraseUtils } from '../utils/commun/phrase-utils';
import { Resultat } from '../models/jouer/resultat';

@Component({
  selector: 'djn-lecteur',
  templateUrl: './lecteur.component.html',
  styleUrls: ['./lecteur.component.scss']
})
export class LecteurComponent implements OnInit, OnChanges {

  static verbeux = true;

  @Input() jeu: Jeu;
  @Input() verbeux = false;
  @Input() debogueur = false;

  readonly TAILLE_DERNIERES_COMMANDES: number = 10;

  sortieJoueur: string = null;
  commande = "";
  historiqueCommandes = new Array<string>();
  curseurHistorique = -1;

  private com: Commandes;
  private ins: Instructions;
  private eju: ElementsJeuUtils;
  private cond: ConditionsUtils;
  private act: ActionsUtils;

  private dec: Declencheur;

  @ViewChild('txCommande') commandeInputRef: ElementRef;
  @ViewChild('taResultat') resultatInputRef: ElementRef;

  resteDeLaSortie: string[] = [];
  commandeEnCours: boolean = false;

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.jeu) {
      console.warn("jeu: ", this.jeu);
      this.sortieJoueur = "";
      this.resteDeLaSortie = [];
      this.commandeEnCours = false;
      this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
      this.dec = new Declencheur(this.jeu.auditeurs, this.verbeux);
      this.ins = new Instructions(this.jeu, this.eju, this.verbeux);
      this.com = new Commandes(this.jeu, this.ins, this.verbeux);
      this.cond = new ConditionsUtils(this.jeu, this.verbeux);
      this.act = new ActionsUtils(this.jeu, this.verbeux);
      // afficher le titre et la version du jeu
      this.sortieJoueur += ("<h5>" + (this.jeu.titre ? BalisesHtml.retirerBalisesHtml(this.jeu.titre) : "(jeu sans titre)"));
      // afficher la version du jeu
      if (this.jeu.version) {
        this.sortieJoueur += ("<small> " + BalisesHtml.retirerBalisesHtml(this.jeu.version) + "</small>");
      }
      this.sortieJoueur += "</h5><p>Un jeu de ";

      // afficher l’auteur du jeu
      if (this.jeu.auteur) {
        this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteur));
      } else if (this.jeu.auteurs) {
        this.sortieJoueur += (BalisesHtml.retirerBalisesHtml(this.jeu.auteurs));
      } else {
        this.sortieJoueur += ("(anonyme)");
      }

      // afficher la licence du jeu
      if (this.jeu.licenceTitre) {
        if (this.jeu.licenceLien) {
          this.sortieJoueur += ('<br>Licence : <a href="' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceLien) + '" target="_blank">' + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre) + "</a>");
        } else {
          this.sortieJoueur += ("<br>Licence : " + BalisesHtml.retirerBalisesHtml(this.jeu.licenceTitre));
        }
      }
      this.sortieJoueur += "</p>";

      // nouvelle partie
      if (!this.jeu.commence) {

        this.sortieJoueur += "<p>";

        // évènement COMMENCER JEU
        let evCommencerJeu = new Evenement('commencer', true, null, 0, 'jeu', ClassesRacines.Special);

        // éxécuter les instructions AVANT le jeu commence
        let resultatAvant = new Resultat(true, "", 0);
        // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
        const declenchementsAvant = this.dec.avant(evCommencerJeu);
        // éxécuter les règles déclenchées
        declenchementsAvant.forEach(declenchement => {
          const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions);
          resultatAvant.sortie += sousResultatAvant.sortie;
          resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
          resultatAvant.nombre += sousResultatAvant.nombre;
          resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
        });
        // ajouter la sortie
        if (resultatAvant.sortie) {
          this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatAvant.sortie));
        }

        // définir visibilité des objets initiale
        this.eju.majPresenceDesObjets();

        // définir adjacence des lieux initiale
        this.eju.majAdjacenceLieux();

        // continuer l’exécution de l’action si elle n’a pas été arrêtée
        if (!resultatAvant.stopperApresRegle) {
          // // // exécuter les instruction REMPLACER s’il y a lieu, sinon suivre le cours normal
          // // let resultatRemplacer = this.ins.executerInstructions(this.dec.remplacer(evCommencerJeu));
          // // if (resultatRemplacer.nombre === 0) {

          // afficher où on est.
          this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(this.com.ouSuisJe()) + "</p>");
          this.jeu.commence = true;

          // // }

          // éxécuter les instructions APRÈS le jeu commence
          let resultatApres = new Resultat(true, "", 0);
          // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
          const declenchementsApres = this.dec.apres(evCommencerJeu);
          // éxécuter les règles déclenchées
          declenchementsApres.forEach(declenchement => {
            const sousResultatApres = this.ins.executerInstructions(declenchement.instructions);
            resultatApres.sortie += sousResultatApres.sortie;
            resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
            resultatApres.nombre += sousResultatApres.nombre;
            resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || sousResultatApres.terminerAvantRegle;
            resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || sousResultatApres.terminerApresRegle;
          });

          if (resultatApres.sortie) {
            this.ajouterSortieJoueur(BalisesHtml.doHtml(resultatApres.sortie));
          }


        }
        //terminer le paragraphe sauf si on attends une touche pour continuer
        if (!this.resteDeLaSortie?.length && !this.sortieJoueur.endsWith("</p>")) {
          this.sortieJoueur += "</p>";
        }
        // REPRISE D’UNE PARTIE
      } else {
        this.sortieJoueur += ("<p>" + BalisesHtml.doHtml("{/{+(reprise de la partie)+}/}") + "</p>");
        // afficher où on est.
        this.ajouterSortieJoueur("<p>" + BalisesHtml.doHtml(this.com.ouSuisJe()) + "</p>");
      }

      this.focusCommande();

    } else {
      console.log("Lecteur: Pas de jeu chargé.");
    }
  }

  /**
   * Ajouter du contenu à la sortie pour le joueur.
   * Cette méthode tient compte des pauses (attendre touche).
   */
  private ajouterSortieJoueur(contenu: string) {
    if (contenu) {
      // découper en fonction des pauses
      const sectionsContenu = contenu.split("@@attendre touche@@");
      // s'il y a du texte en attente, ajouter au texte en attente
      if (this.resteDeLaSortie?.length) {
        this.resteDeLaSortie[this.resteDeLaSortie.length - 1] += ("</p><p>" + sectionsContenu[0]);
        this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        // s'il n'y a pas de texte en attente, afficher la première partie
      } else {
        // retrouver le dernier effacement d’écran éventuel
        const texteSection = sectionsContenu[0];
        const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
        // s’il ne faut pas effacer l’écran
        if (indexDernierEffacement == -1) {
          // ajouter à la suite
          this.sortieJoueur += texteSection;
          // sinon
        } else {
          // remplacer la sortie du joueur
          this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length);
        }
        // attendre pour afficher la suite éventuelle
        if (sectionsContenu.length > 1) {
          this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…'
          this.resteDeLaSortie = this.resteDeLaSortie.concat(sectionsContenu.slice(1));
        }
      }
    }
  }

  private afficherSuiteSortie() {
    // prochaine section à afficher
    let texteSection = this.resteDeLaSortie.shift();
    // retrouver le dernier effacement d’écran éventuel
    const indexDernierEffacement = texteSection.lastIndexOf("@@effacer écran@@");
    // s’il ne faut pas effacer l’écran
    if (indexDernierEffacement == -1) {
      // enlever premier retour à la ligne
      if (texteSection.startsWith("<br>")) {
        texteSection = texteSection.slice("<br>".length);
      }
      // ajouter à la suite
      this.sortieJoueur += ("<p>" + texteSection + "</p>");
      // sinon
    } else {
      // remplacer la sortie du joueur
      this.sortieJoueur = "<p>" + texteSection.slice(indexDernierEffacement + "@@effacer écran@@".length) + "</p>";
    }

    // s’il reste d’autres sections, attendre
    if (this.resteDeLaSortie.length) {
      this.sortieJoueur += '<p class="text-primary font-italic">Appuyez sur une touche…'
    }
    // scroll
    setTimeout(() => {
      this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
      this.commandeInputRef.nativeElement.focus();
    }, 100);
  }

  /**
   * Appuis sur une touche par le joueur.
   */
  onKeyDown(event: Event) {
    // éviter de déclencher appuis touche avant la fin de la commande en cours
    if (!this.commandeEnCours) {
      // regarder s’il reste du texte à afficher
      if (this.resteDeLaSortie?.length) {
        this.afficherSuiteSortie();
        this.commande = "";
        event.preventDefault();
      }
    }
  }

  /**
   * Historique: aller en arrière (flèche haut)
   * @param event
   */
  onKeyDownArrowUp(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique < (this.historiqueCommandes.length - 1)) {
        this.curseurHistorique += 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      }
    }
  }

  /**
   * Historique: revenir en avant (Flèche bas)
   */
  onKeyDownArrowDown(event) {
    if (!this.resteDeLaSortie?.length) {
      if (this.curseurHistorique >= 0) {
        this.curseurHistorique -= 1;
        const index = (this.historiqueCommandes.length - this.curseurHistorique - 1);
        this.commande = this.historiqueCommandes[index];
        this.focusCommande();
      } else {
        this.commande = "";
      }
    }
  }

  public focusCommande() {
    setTimeout(() => {
      this.commandeInputRef.nativeElement.focus();
      this.commandeInputRef.nativeElement.selectionStart = this.commandeInputRef.nativeElement.selectionEnd = this.commande?.length ?? 0;
    }, 100);
  }

  /** Tabulation: continuer le mot */
  onKeyDownTab(event) {
    if (!this.resteDeLaSortie?.length) {
      const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
      if (commandeComplete !== this.commande) {
        this.commande = commandeComplete;
        this.focusCommande();
      }
    }
  }

  onClickValidate(event: Event) {
    if (this.resteDeLaSortie?.length) {
      event.preventDefault(); // éviter que l’évènement soit encore émis ailleurs
      this.afficherSuiteSortie();
    } else {
      this.onKeyDownEnter(event);
    }
  }

  /**
   * Enter: Valider une commande.
   * @param event 
   */
  onKeyDownEnter(event: Event) {
    if (!this.resteDeLaSortie?.length) {
      this.curseurHistorique = -1;
      if (this.commande && this.commande.trim() !== "") {
        event.stopPropagation; // éviter que l’évènement soit encore émis ailleurs
        this.commandeEnCours = true; // éviter qu’il déclenche attendre touche trop tôt et continue le texte qui va être ajouté ci dessous durant cet appuis-ci
        // compléter la commande
        const commandeComplete = Abreviations.obtenirCommandeComplete(this.commande);
        this.sortieJoueur += '<p><span class="text-primary">' + BalisesHtml.doHtml(' > ' + this.commande + (this.commande !== commandeComplete ? (' (' + commandeComplete + ')') : '')) + '</span><br>';
        const result = this.doCommande(commandeComplete.trim());
        if (result) {
          // console.log("resultat commande:", result);
          this.ajouterSortieJoueur(BalisesHtml.doHtml(result));
        }
        this.sortieJoueur += "</p>";
        this.commande = "";
        setTimeout(() => {
          this.resultatInputRef.nativeElement.scrollTop = this.resultatInputRef.nativeElement.scrollHeight;
          this.commandeInputRef.nativeElement.focus();
          this.commandeEnCours = false;
        }, 100);
      }
    }
  }

  doCommande(commande: string): string {

    if (this.jeu.termine) {
      return "Le jeu est terminé.{n}Pour débuter une nouvelle partie veuillez actualiser la page web.";
    }

    // nettoyage commmande pour ne pas afficher une erreur en cas de faute de frappe…


    const commandeNettoyee = commande
      // 1) remplacer espaces insécables par espace simple.
      ?.replace(/ /g, ' ')
      // 2) effacer les espaces multiples
      .replace(/\s\s+/g, ' ')
      // 3) enlever espaces avant et après la commande
      .trim();

    // GESTION HISTORIQUE
    // ajouter à l’historique (à condition que différent du précédent)
    if (this.historiqueCommandes.length === 0 || (this.historiqueCommandes[this.historiqueCommandes.length - 1] !== commandeNettoyee)) {
      this.historiqueCommandes.push(commandeNettoyee);
      if (this.historiqueCommandes.length > this.TAILLE_DERNIERES_COMMANDES) {
        this.historiqueCommandes.shift();
      }
    }

    // COMPRENDRE LA COMMANDE
    const els = PhraseUtils.decomposerCommande(commandeNettoyee);

    let retVal = "";

    if (els) {

      const isCeciV1 = els.sujet ? true : false;
      const ceciIntituleV1 = els.sujet;

      const ceciQuantiteV1 = isCeciV1 ? (MotUtils.getQuantite(els.sujet.determinant, (MotUtils.estFormePlurielle(els.sujet.nom) ? -1 : 1))) : 0;
      // const ceciNomV1 = isCeciV1 ? (ceciIntituleV1.nom + (ceciIntituleV1.epithete ? (" " + ceciIntituleV1.epithete) : "")) : null;
      // const ceciClasseV1 = null;
      const resultatCeci = isCeciV1 ? this.eju.trouverCorrespondance(ceciIntituleV1, true, true) : null;

      const isCelaV1 = els.sujetComplement1 ? true : false;
      const celaIntituleV1 = els.sujetComplement1;
      const celaQuantiteV1 = isCelaV1 ? (MotUtils.getQuantite(els.sujetComplement1.determinant, (MotUtils.estFormePlurielle(els.sujetComplement1.nom) ? -1 : 1))) : 0;
      // const celaNomV1 = isCelaV1 ? (celaIntituleV1.nom + (celaIntituleV1.epithete ? (" " + celaIntituleV1.epithete) : "")) : null;
      // const celaClasseV1 = null;
      const resultatCela = isCelaV1 ? this.eju.trouverCorrespondance(celaIntituleV1, true, true) : null;

      // let evenementV1 = new Evenement(
      //   // verbe
      //   els.infinitif,
      //   // ceci
      //   isCeciV1, els.preposition0, ceciQuantiteV1, ceciNomV1, ceciClasseV1,
      //   // cela
      //   isCelaV1, els.preposition1, celaQuantiteV1, celaNomV1, celaClasseV1
      // );

      // si on a déjà une erreur, ne pas continuer.
      if (retVal.length > 0) {
        return retVal;
      }

      switch (els.infinitif) {

        // commande « en dur »
        case "déboguer":
          retVal = this.com.deboguer(els);
          break;

        // autres commandes
        default:
          const actionsCeciCela = this.act.trouverActionPersonnalisee(els, resultatCeci, resultatCela);
          // =====================================================
          //  A. VERBE PAS CONNU
          // =====================================================
          if (actionsCeciCela === null) {

            retVal = "Désolé, je n’ai pas compris le verbe « " + els.infinitif + " ».";

            // =====================================================
            // B. VERBE CONNU MAIS CECI/CELA NE CORRESPONDENT PAS
            // =====================================================
          } else if (actionsCeciCela.length === 0) {

            const explicationRefu = this.act.obtenirRaisonRefuCommande(els, resultatCeci, resultatCela);

            // correspondance CECI
            let tempCeci = null;
            if (resultatCeci) {
              if (resultatCeci.nbCor) {
                // élément
                if (resultatCeci.elements.length) {
                  tempCeci = resultatCeci.elements[0];
                  // compteur
                } else if (resultatCeci.compteurs.length) {
                  tempCeci = resultatCeci.compteurs[0];
                  // autre (direction)
                } else {
                  tempCeci = resultatCeci.localisation;
                }
                // non trouvé => intitulé
              } else {
                tempCeci = resultatCeci?.intitule ?? null;
              }
            }

            // correspondance CELA
            let tempCela = null;
            if (resultatCela) {
              if (resultatCela.nbCor) {
                // élément
                if (resultatCela.elements.length) {
                  tempCela = resultatCela.elements[0];
                  // compteur
                } else if (resultatCela.compteurs.length) {
                  tempCela = resultatCela.compteurs[0];
                  // autre (direction)
                } else {
                  tempCela = resultatCela.localisation;
                }
                // non trouvé => intitulé
              } else {
                tempCela = resultatCela.intitule;
              }
            }

            retVal = this.ins.dire.interpreterContenuDire(explicationRefu, 0, tempCeci, tempCela, null, null);

            // retVal = "Je comprends « " + els.infinitif + " » mais il y a un souci avec les arguments ou la formulation de la commande.";
            // // vérifier si on a trouvé les éléments de la commande.
            // if (ceciIntituleV1) {
            //   // ON N'A PAS TROUVÉ L'OBJET
            //   if (resultatCeci.nbCor === 0) {
            //     retVal += "\n{+(Je ne trouve pas ceci : « " + this.com.outils.afficherIntitule(ceciIntituleV1) + " ».)+}";
            //   } else {
            //     // ON NE VOIT PAS L'OBJET
            //     // vérifier si les objets de la commande sont visibles
            //     if (resultatCeci && resultatCeci.nbCor === 1 && resultatCeci.objets.length === 1) {
            //       if (!this.jeu.etats.estVisible(resultatCeci.objets[0], this.eju)) {
            //         retVal += "\n{+(Actuellement, je ne vois pas ceci : « " + this.com.outils.afficherIntitule(resultatCeci.objets[0].intitule) + " ».)+}";
            //       }
            //     }
            //   }
            // }
            // if (celaIntituleV1) {
            //   // ON N'A PAS TROUVÉ L'OBJET
            //   if (resultatCela.nbCor === 0) {
            //     retVal += "\n{+(Je ne trouve pas cela : « " + this.com.outils.afficherIntitule(celaIntituleV1) + " ».)+}";
            //   } else {
            //     // ON NE VOIT PAS L'OBJET
            //     if (resultatCela && resultatCela.nbCor === 1 && resultatCela.objets.length === 1) {
            //       if (!this.jeu.etats.estVisible(resultatCela.objets[0], this.eju)) {
            //         retVal += "\n{+(Actuellement, je ne vois pas cela : « " + this.com.outils.afficherIntitule(resultatCela.objets[0].intitule) + " ».)+}";
            //       }
            //     }
            //   }
            // }

            // regarder si de l’aide existe pour cet infinitif
            const aide = this.jeu.aides.find(x => x.infinitif === els.infinitif);
            if (aide) {
              retVal += "{u}{/Vous pouvez entrer « {-aide " + els.infinitif + "-} » pour afficher l’aide de la commande./}";
            }
            //  else {
            //   retVal += "\n{/(Il n’y a pas de page d’aide concernant cette commande.)/}";
            // }

            // =============================================================================
            // C. PLUSIEURS ACTIONS SE DÉMARQUENT (on ne sait pas les départager)
            // =============================================================================
          } else if (actionsCeciCela.length > 1) {

            retVal = "{+Erreur: plusieurs actions avec la même priorité trouvées (" + els.infinitif + ").+}";

            // =============================================================================
            // D. UNE ACTION SE DÉMARQUE (ont a trouvé l’action)
            // =============================================================================
          } else {

            // console.log("Une action se démarque !");

            const candidatVainqueur = actionsCeciCela[0];

            // il peut y avoir plusieurs correspondances avec le même score pour un objet.
            // Ex: il y a une pomme par terre et des pommes sur le pommier on on fait « prendre pomme ».
            // => Dans ce cas, on prend un élément au hasard pour que le jeu ne soit pas bloqué.
            let indexCeci = 0;
            let indexCela = 0;

            if (candidatVainqueur.ceci?.length > 1) {
              retVal += "{+{/Il y a plusieurs résultats équivalents pour « " + ceciIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
              indexCeci = Math.floor(Math.random() * candidatVainqueur.ceci.length);
              console.log("indexCeci=", indexCeci);
            }
            if (candidatVainqueur.cela?.length > 1) {
              retVal += "{+{/Il y a plusieurs résultats équivalents pour « " + celaIntituleV1.toString() + " ». Je choisis au hasard./}+}{n}";
              indexCela = Math.floor(Math.random() * candidatVainqueur.cela.length);
              console.log("indexCela=", indexCela);
            }

            const actionCeciCela = new ActionCeciCela(candidatVainqueur.action, (candidatVainqueur.ceci ? candidatVainqueur.ceci[indexCeci] : null), (candidatVainqueur.cela ? candidatVainqueur.cela[indexCela] : null));

            const isCeciV2 = actionCeciCela.ceci ? true : false;
            let ceciQuantiteV2 = ceciQuantiteV1;
            // transformer « -1 » en la quantité de l’objet
            if (ceciQuantiteV2 === -1 && actionCeciCela.ceci && ClasseUtils.heriteDe(actionCeciCela.ceci.classe, EClasseRacine.objet)) {
              ceciQuantiteV2 = (actionCeciCela.ceci as Objet).quantite;
            }

            const ceciNomV2 = isCeciV2 ? actionCeciCela.ceci.nom : null;
            const ceciClasseV2 = (isCeciV2 ? actionCeciCela.ceci.classe : null)

            const isCelaV2 = actionCeciCela.cela ? true : false;
            let celaQuantiteV2 = celaQuantiteV1;
            // transformer « -1 » en la quantité de l’objet
            if (celaQuantiteV2 === -1 && actionCeciCela.cela && ClasseUtils.heriteDe(actionCeciCela.cela.classe, EClasseRacine.objet)) {
              celaQuantiteV2 = (actionCeciCela.cela as Objet).quantite;
            }
            const celaNomV2 = isCelaV2 ? actionCeciCela.cela.nom : null;
            const celaClasseV2 = (isCelaV2 ? actionCeciCela.cela.classe : null)

            // mettre à jour l'évènement avec les éléments trouvés
            const evenementV2 = new Evenement(
              // verbe
              actionCeciCela.action.infinitif,
              // ceci
              isCeciV2, els.preposition0, ceciQuantiteV2, ceciNomV2, ceciClasseV2,
              // cela
              isCelaV2, els.preposition1, celaQuantiteV2, celaNomV2, celaClasseV2
            );

            // console.error(">>>>>> evenement = ", evenement);F


            // ÉVÈNEMENT AVANT la commande (qu'elle soit refusée ou non)
            let resultatAvant = new Resultat(true, "", 0);
            // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
            const declenchementsAvant = this.dec.avant(evenementV2);
            // éxécuter les règles déclenchées
            declenchementsAvant.forEach(declenchement => {
              const sousResultatAvant = this.ins.executerInstructions(declenchement.instructions, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, declenchement.declenchements);
              retVal += sousResultatAvant.sortie;
              resultatAvant.succes = resultatAvant.succes && sousResultatAvant.succes;
              resultatAvant.nombre += sousResultatAvant.nombre;
              resultatAvant.stopperApresRegle = resultatAvant.stopperApresRegle || sousResultatAvant.stopperApresRegle;
            });

            // Continuer l’action (sauf si on a fait appel à l’instruction « STOPPER L’ACTION ».)
            if (resultatAvant.stopperApresRegle !== true) {
              // PHASE REFUSER (vérifier l'action)
              let refus = false;
              if (actionCeciCela.action.verifications) {
                // console.log("vérifications en cours pour la commande…");
                // parcourir les vérifications
                actionCeciCela.action.verifications.forEach(verif => {
                  if (verif.conditions.length == 1) {
                    if (!refus && this.cond.siEstVraiAvecLiens(null, verif.conditions[0], actionCeciCela.ceci, actionCeciCela.cela, evenementV2, null)) {
                      // console.warn("> commande vérifie cela:", verif);
                      const resultatRefuser = this.ins.executerInstructions(verif.resultats, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, null);
                      retVal += resultatRefuser.sortie;
                      refus = true;
                    }
                  } else {
                    console.error("action.verification: 1 et 1 seule condition possible par vérification. Mais plusieurs vérifications possibles par action.");
                  }
                });
              }

              // exécuter l’action si pas refusée
              if (!refus) {
                // PHASE EXÉCUTER l’action
                const resultatExecuter = this.executerAction(actionCeciCela, evenementV2);
                retVal += resultatExecuter.sortie;
                // ÉVÈNEMENT APRÈS la commande
                let resultatApres = new Resultat(true, "", 0);
                // à priori 1 déclenchement mais il pourrait y en avoir plusieurs si même score
                const declenchementsApres = this.dec.apres(evenementV2);

                if (declenchementsApres.length) {
                  // éxécuter les règles déclenchées
                  declenchementsApres.forEach(declenchement => {
                    const sousResultatApres = this.ins.executerInstructions(declenchement.instructions, actionCeciCela.ceci, actionCeciCela.cela, evenementV2, declenchement.declenchements);
                    resultatApres.sortie += sousResultatApres.sortie;
                    resultatApres.succes = resultatApres.succes && sousResultatApres.succes;
                    resultatApres.nombre += sousResultatApres.nombre;
                    resultatApres.terminerAvantRegle = resultatApres.terminerAvantRegle || sousResultatApres.terminerAvantRegle;
                    resultatApres.terminerApresRegle = resultatApres.terminerApresRegle || sousResultatApres.terminerApresRegle;
                  });

                  // terminer avant sortie règle « après » ?
                  if (resultatApres.terminerAvantRegle) {
                    // PHASE TERMINER l'action (avant sortie règle « après ») => « terminer l’action avant »
                    const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                    retVal += resultatFinaliser.sortie;
                    // éviter de terminer 2x l’action (en cas d’erreur de l’utilisateur)
                    if (resultatApres.terminerApresRegle) {
                      resultatApres.terminerApresRegle = false;
                    }
                  }

                  // sortie règle après
                  retVal += resultatApres.sortie;

                  // terminer après sortie règle « après » ?
                  if (resultatApres.terminerApresRegle) {
                    // PHASE TERMINER l'action (après sortie règle « après ») => « terminer l’action après » (ou « continuer l’action »)
                    const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                    retVal += resultatFinaliser.sortie;
                  }

                } else {
                  // PHASE TERMINER l'action (sans règle « après »)
                  const resultatFinaliser = this.finaliserAction(actionCeciCela, evenementV2);
                  retVal += resultatFinaliser.sortie;
                }

              }
            }

          }

          break;
      }
    } else {
      retVal = "Désolé, je n'ai pas compris la commande « " + commandeNettoyee + " ».";
    }
    return retVal;
  }

  private executerAction(action: ActionCeciCela, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructions, action.ceci, action.cela, evenement, null);
    return resultat;
  }

  private finaliserAction(action: ActionCeciCela, evenement: Evenement) {
    const resultat = this.ins.executerInstructions(action.action.instructionsFinales, action.ceci, action.cela, evenement, null);
    return resultat;
  }



}
