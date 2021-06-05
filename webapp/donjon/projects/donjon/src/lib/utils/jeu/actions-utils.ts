import { Action, CandidatActionCeciCela } from "../../models/compilateur/action";

import { CibleAction } from "../../models/compilateur/cible-action";
import { ClasseUtils } from "../commun/classe-utils";
import { Correspondance } from "./correspondance";
import { EClasseRacine } from "../../models/commun/constantes";
import { ElementJeu } from "../../models/jeu/element-jeu";
import { ElementsJeuUtils } from "../commun/elements-jeu-utils";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Intitule } from "../../models/jeu/intitule";
import { Jeu } from "../../models/jeu/jeu";
import { ResultatChercherCandidats } from "../../models/jeu/resultat-chercher-candidats";
import { ResultatVerifierCandidat } from "../../models/jeu/resultat-verifier-candidat";

export class ActionsUtils {

    constructor(
        private jeu: Jeu,
        private verbeux: boolean,
    ) {
        this.eju = new ElementsJeuUtils(this.jeu, this.verbeux);
    }

    private eju: ElementsJeuUtils;

    public obtenirRaisonRefuCommande(commande: ElementsPhrase, ceciCommande: Correspondance, celaCommande: Correspondance) {

        let raisonRefu: string = "Inconnu.";

        // 1. trouver l’infinitif
        let resCherCand = this.chercherCandidatsCommandeSansControle(commande);

        // verbe inconnu
        if (!resCherCand.verbeConnu) {
            raisonRefu = "Je ne connais pas le verbe « " + commande.infinitif + " »";
            // verbe connu 
        } else {
            // I) aucun candidat en lice
            if (resCherCand.candidatsEnLice.length == 0) {
                //     I.A) 1 seul candidat refusé
                if (resCherCand.candidatsRefuses.length == 1) {
                    const candUnique = resCherCand.candidatsRefuses[0];
                    //     I.A.a) la seule action possible n’a pas d’argument
                    if (!candUnique.ceci) {
                        raisonRefu = "Je peux simplement « " + candUnique.infinitif + " » (sans complément).";
                        // I.A.b) la seule action possible fait 1 seul argument (ceci)
                    } else if (!candUnique.cela) {
                        // I.A.b.1) l’utilisateur n’a pas spécifié l’argument
                        if (!commande.sujet) {
                            raisonRefu = "Je peux « " + candUnique.infinitif + " » " + (candUnique.prepositionCeci ? (candUnique.prepositionCeci + " ") : "") + candUnique.cibleCeci + ". Il manque le complément.";
                        // I.A.b.2) l’utilisateur a spécifié un complément de trop
                        } else {
                            raisonRefu = "Je peux « " + candUnique.infinitif + " » " + (candUnique.prepositionCeci ? (candUnique.prepositionCeci + " ") : "") + candUnique.cibleCeci + ". Il y a un complément de trop.";
                        }
                        // I.A.c) la seule action possible fait 2 arguments (ceci et cela)
                    } else {

                    }

                    // I.B) plusieurs candidats refusés
                } else {

                }
                // II) candidats en lice
            } else {

            }


        }

        return raisonRefu;

    }

    private chercherCandidatsCommandeSansControle(commande: ElementsPhrase): ResultatChercherCandidats {

        let candidatsEnLice: Action[] = [];
        let candidatsRefuses: Action[] = [];
        let verbeConnu: boolean = false;

        // trouver les commande qui corresponde (sans vérifier le sujet (+complément) exacte)
        this.jeu.actions.forEach(action => {
            // vérifier infinitif
            let infinitifOk = (commande.infinitif === action.infinitif);
            // vérifier également les synonymes
            if (!infinitifOk && action.synonymes) {
                action.synonymes.forEach(synonyme => {
                    if (!infinitifOk && commande.infinitif === synonyme) {
                        infinitifOk = true;
                    }
                });
            }

            if (infinitifOk) {
                verbeConnu = true;
                let candidatValide = false;
                // vérifier sujet
                if ((commande.sujet && action.ceci) || (!commande.sujet && !action.ceci)) {
                    // vérifier complément
                    if ((commande.sujetComplement1 && action.cela) || (!commande.sujetComplement1 && !action.cela)) {
                        candidatValide = true;
                    }
                }
                if (candidatValide) {
                    candidatsEnLice.push(action);
                } else {
                    candidatsRefuses.push(action);
                }
            }

        });

        if (this.verbeux) {
            console.warn("testerCommandePersonnalisee :", candidatsEnLice.length, "candidat(s) p1 :", candidatsEnLice);
        }

        return new ResultatChercherCandidats(verbeConnu, candidatsEnLice, candidatsRefuses);

    }

    /** Trouver l’action personnalisée correspondant le mieux la la commande de l’utilisateur */
    public trouverActionPersonnalisee(commande: ElementsPhrase, ceciCommande: Correspondance, celaCommande: Correspondance): CandidatActionCeciCela[] {

        // console.log("trouverActionPersonnalisee els=", els, "ceci=", ceci, "cela=", cela);

        let matchCeci: ResultatVerifierCandidat = null;
        let matchCela: ResultatVerifierCandidat = null;
        let resultat: CandidatActionCeciCela[] = null;

        let resCherCand = this.chercherCandidatsCommandeSansControle(commande);

        if (resCherCand.verbeConnu) {
            resultat = []; // verbe connu

            // infinitif + sujet (+complément), vérifier que celui de la commande correspond
            if (commande.sujet) {

                let meilleurScore = 0;

                resCherCand.candidatsEnLice.forEach(candidatAction => {
                    let candidatCorrespond = false;
                    matchCeci = null;
                    matchCela = null;

                    // 1) vérifier sujet (CECI)
                    if (candidatAction.cibleCeci) {
                        matchCeci = this.verifierCandidatCeciCela(ceciCommande, candidatAction.cibleCeci);
                        // A. aucun candidat valide trouvé
                        if (matchCeci.elementsTrouves.length === 0) {
                            // console.log(">>> Pas de candidat valide trouvé pour ceci avec le candidat:", candidat, "ceci:", ceci);
                            // B. au moins un candidat se démarque
                        } else {
                            // 2) vérifier complément (CELA)
                            if (commande.complement1) {
                                if (candidatAction.cibleCela) {
                                    matchCela = this.verifierCandidatCeciCela(celaCommande, candidatAction.cibleCela);
                                    // A. aucun candidat valide trouvé
                                    if (matchCela.elementsTrouves.length === 0) {
                                        // console.log(">>> Pas de candidat valide trouvé pour cela avec le candidat:", candidat, "cela:", cela);
                                        // B. au moins un candidat se démarque
                                    } else {
                                        candidatCorrespond = true;
                                    }
                                }
                                // pas de cela
                            } else {
                                candidatCorrespond = true;
                            }
                        }
                    }

                    /*
          
                           // B. plusieurs candidats se démarquent
                      } else if (matchCeci.elementsTrouves.length !== 1) {
                        console.warn(">>> Plusieurs candidats se démarquent pour ceci avec le candidat:", candidat, "ceci:", ceci);
          
          
                           // B. plusieurs candidats se démarquent
                            } else if (matchCela.elementsTrouves.length !== 1) {
                              console.warn(">>> Plusieurs candidats se démarquent pour cela avec le candidat:", candidat, "cela:", cela);
          
                    */

                    if (candidatCorrespond) {

                        const score = matchCeci.meilleurScore + (matchCela?.meilleurScore ?? 0);

                        // meilleur score jusqu’à présent => remplace le précédent résultat
                        if (score > meilleurScore) {
                            meilleurScore = score;
                            resultat = [new CandidatActionCeciCela(candidatAction, matchCeci?.elementsTrouves, matchCela?.elementsTrouves)];
                            // plusieurs scores équivalents => on ajoute au résultat existant
                        } else if (score === meilleurScore) {
                            resultat.push(new CandidatActionCeciCela(candidatAction, matchCeci?.elementsTrouves, matchCela?.elementsTrouves));
                        }
                    }
                });

                // infinitif simple
            } else {
                // à priori on ne devrait avoir qu’un seul résultat vu que verbe simple…
                resCherCand.candidatsEnLice.forEach(candidatAction => {
                    resultat.push(new CandidatActionCeciCela(candidatAction, null, null));
                });
            }
        }
        return resultat;
    }

    /**
     * Vérifier si on trouve l’élément rechercher parmis les correspondances.
     * @param ceciCelaCommande  correspondances
     * @param candidatCeciCelaAction  élément recherché
     * @returns élément éventuellement trouvé ou -1 si plusieurs éléments possibles.
     */
    private verifierCandidatCeciCela(ceciCelaCommande: Correspondance, candidatCeciCelaAction: CibleAction): ResultatVerifierCandidat {
        let retVal: Array<ElementJeu | Intitule> = [];

        // on donne un score aux correspondances : cela permet de départager plusieurs corresspondances.
        let meilleurScore = 0;

        // il s’agit d’un sujet précis
        if (candidatCeciCelaAction.determinant.match(/^(du|((de )?(le|la|l’|l'|les)))?( )?$/)) {

            // Vérifier s’il s’agit du sujet précis
            // PRIORITÉ 1 >> élément (objet ou lieu)
            if (ceciCelaCommande.elements.length) {
                // console.log("verifierCandidatCeciCela > sujet précis > élements (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
                // vérifier s’il s’agit du sujet précis
                ceciCelaCommande.elements.forEach(ele => {
                    // console.log("check for ele=", ele, "candidatCeciCela=", candidatCeciCela);
                    // console.log("check for ele.intitule.nom=", ele.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
                    // console.log("check for ele.intitule.epithete=", ele.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);
                    if (ele.intitule.nom === candidatCeciCelaAction.nom && ele.intitule.epithete === candidatCeciCelaAction.epithete) {
                        let curScore = 1000;
                        // si priorité respectée, score augmente
                        if (candidatCeciCelaAction.priorite) {
                            if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.priorite, this.eju)) {
                                curScore += 500; // prioritaire
                            }
                        }
                        // meilleur score jusqu’à présent => remplace le précédent résultat
                        if (curScore > meilleurScore) {
                            meilleurScore = curScore;
                            retVal = [ele];
                            // 2 scores équivalents => on ajoute au résultat existant
                        } else if (curScore === meilleurScore) {
                            retVal.push(ele);
                        }
                    }
                });
                // PRIORITÉ 2 >> compteur
            } else if (ceciCelaCommande.compteurs.length) {
                // console.log("verifierCandidatCeciCela > sujet précis > compteurs (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");
                // vérifier s’il s’agit du sujet précis
                ceciCelaCommande.compteurs.forEach(cpt => {
                    // console.log("check for cpt=", cpt, "candidatCeciCela=", candidatCeciCela);
                    // console.log("check for cpt.intitule.nom=", cpt.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
                    // console.log("check for cpt.intitule.epithete=", cpt.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

                    if (cpt.intitule.nom === candidatCeciCelaAction.nom && cpt.intitule.epithete === candidatCeciCelaAction.epithete) {
                        let curScore = 500;
                        if (curScore > meilleurScore) {
                            meilleurScore = curScore;
                            retVal = [cpt];
                        } else {
                            // déjà un match, on en a plusieurs
                            // (ici ils ont toujours la même valeur)
                            retVal.push(cpt);
                        }
                    }
                });
                // PRIORITÉ 3 >> intitulé
            } else if (ceciCelaCommande.intitule) {
                // console.log("verifierCandidatCeciCela > sujet précis > intitulé (" + candidatCeciCela.nom + (candidatCeciCela.epithete ?? '') + ")");

                const intitule = ceciCelaCommande.intitule;

                // vérifier s’il s’agit du sujet précis
                // console.log("check for intitule=", intitule, "candidatCeciCela=", candidatCeciCela);
                // console.log("check for intitule.intitule.nom=", intitule.intitule.nom, "candidatCeciCela.nom=", candidatCeciCela.nom);
                // console.log("check for intitule.intitule.epithete=", intitule.intitule.epithete, "candidatCeciCela.epithete=", candidatCeciCela.epithete);

                if (intitule.intitule.nom === candidatCeciCelaAction.nom && intitule.intitule.epithete === candidatCeciCelaAction.epithete) {
                    let curScore = 250;
                    if (curScore > meilleurScore) {
                        meilleurScore = curScore;
                        retVal = [intitule];
                    } else {
                        // déjà un match, on en a plusieurs
                        // (ici ils ont toujours la même valeur)
                        retVal.push(intitule);
                    }
                }
            }

            // todo: vérifier début de nom si aucune correspondance exacte

            // il s’agit d’un type
        } else if (candidatCeciCelaAction.determinant.match(/^(un|une|des|deux)( )?$/)) {
            ceciCelaCommande.elements.forEach(ele => {
                // vérifier si l’ojet est du bon type
                if (ClasseUtils.heriteDe(ele.classe, ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom))) {

                    // s’il n’y a pas d’état requis ou si l’état est respecté
                    if (!candidatCeciCelaAction.epithete || this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.epithete, this.eju)) {
                        let curScore = 125;
                        // si priorité respectée, score augmente
                        if (candidatCeciCelaAction.priorite) {
                            if (this.jeu.etats.possedeEtatElement(ele, candidatCeciCelaAction.priorite, this.eju)) {
                                curScore += 75; // prioritaire
                            }
                        }
                        // meilleur score jusqu’à présent => remplace le précédent résultat
                        if (curScore > meilleurScore) {
                            meilleurScore = curScore;
                            retVal = [ele];
                            // plusieurs scores équivalents => on ajoute au résultat existant
                        } else if (curScore === meilleurScore) {
                            retVal.push(ele);
                        }
                    }
                }
            });

            // si ce n'est pas un élément du jeu,
            //  - vérifier direction
            if (meilleurScore === 0 && ceciCelaCommande.localisation && (ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.direction || ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.intitule)) {
                meilleurScore = 75;
                retVal = [ceciCelaCommande.localisation];
            }
            //  - vérifier intitué
            if (meilleurScore === 0 && ClasseUtils.getIntituleNormalise(candidatCeciCelaAction.nom) === EClasseRacine.intitule) {
                meilleurScore = 50;
                retVal = [ceciCelaCommande.intitule];
            }

        }
        if (this.verbeux) {
            console.log("VerifierCandidat >>> \nbestScore=", meilleurScore, "\ncandidatCeciCela=", candidatCeciCelaAction, "\nceciCela=", ceciCelaCommande);
        }
        return new ResultatVerifierCandidat(retVal, meilleurScore);
    }



}