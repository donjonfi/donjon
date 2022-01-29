import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Jeu } from "../../models/jeu/jeu";
import { LecteurAudio } from "../../models/jeu/lecteur-audio";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";

export class InstructionJouerArreter {

  private testerAudio: LecteurAudio | undefined;
  private son: LecteurAudio;
  private musique: LecteurAudio;

  constructor(
    private jeu: Jeu,
  ) {
    this.son = new LecteurAudio(this.jeu);
    this.musique = new LecteurAudio(this.jeu);
  }

  /** émettre un son pour que le joueur puisse vérifier ses baffles. */
  public testSon(): Resultat {
    // initialiser le lecteur la première fois
    if (!this.testerAudio) {
      this.testerAudio = new LecteurAudio(this.jeu);
    }
    // jouer  le son de test
    const resultat = this.testerAudio.jouer(Jeu.dossierRessources + "/sons/son_utilise_par_commande_tester_audio.mp3", false, 0);
    if (resultat.succes) {
      resultat.sortie = "Test audio exécuté.";
    } else {
      resultat.sortie = "Le test audio a échoué.";
      if (!this.jeu.parametres.activerAudio) {
        resultat.sortie += " En effet, l’audio est désactivé.";
      }
    }
    return resultat;
  }

  public onChangementAudioActif() {
    this.son.onChangementAudioActif();
    this.musique.onChangementAudioActif();
    this.testerAudio?.onChangementAudioActif();
  }

  /** Jouer un son ou une musique */
  public executerJouer(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(false, '', 1);

    // vérifier si le nom du fichier est sécurisé
    const nomFichierNonSecurise = instruction.complement1;
    const nomFichierSecurise = StringUtils.nomDeFichierSecurise(nomFichierNonSecurise);
    if (nomFichierSecurise && nomFichierSecurise == nomFichierNonSecurise) {

      // vérifier s’il faut jouer en boucle
      let enBoucle = (instruction.complement2 == 'en boucle');
      // vérifier s’il faut jouer plusieurs fois
      let repetitions = 0;
      if (!enBoucle && instruction.sujetComplement2 && instruction.sujetComplement2.nom == 'fois' && instruction.sujetComplement2.determinant) {
        repetitions = Number.parseInt(instruction.sujetComplement2.determinant.trim()) - 1;
      }

      switch (instruction.sujet.nom) {
        // jouer le son
        case 'son':
          const urlSon = Jeu.dossierRessources + (this.jeu.sousDossierRessources ? ("/" + this.jeu.sousDossierRessources) : "") + "/sons/" + nomFichierNonSecurise;
          resultat = this.son.jouerALaSuite(urlSon, enBoucle, repetitions);
          break;
        // jouer la musique
        case 'musique':
          const urlMusique = Jeu.dossierRessources + (this.jeu.sousDossierRessources ? ("/" + this.jeu.sousDossierRessources) : "") + "/musiques/" + nomFichierNonSecurise;
          resultat = this.musique.jouer(urlMusique, enBoucle, repetitions);
          break;

        default:
          contexteTour.ajouterErreurInstruction(instruction, "Jouer : seul un son ou une musique peuvent être joués.");
          break;
      }
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Jouer : le nom du fichier à jouer ne peut contenir que des lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Ex: ma_musique.mp3");
    }

    return resultat;
  }

  /** 
   * Arrêter de jouer un son, une musique ou une action
   * */
  public executerArreter(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(false, '', 1);

    switch (instruction.sujet.nom?.toLocaleLowerCase()) {

      // arrêter le son qui est joué actuellement
      case 'son':
        const arretSonProgressif = (instruction.sujet.epithete == 'progressivement');
        resultat = this.son.arreter(arretSonProgressif);
        break;

      // arrêter la musique qui est jouée actuellement
      case 'musique':
        const arretMusiqueProgressif = (instruction.sujet.epithete == 'progressivement');
        resultat = this.musique.arreter(arretMusiqueProgressif);
        break;

      // arrêter l’action qui va être exécutée (évènement AVANT spécial)
      case 'action':
        resultat.stopperApresRegle = true;
        resultat.succes = true;
        break;

      default:
        contexteTour.ajouterErreurInstruction(instruction, "Arrêter: seul un son, une musique ou une action peuvent être arrêtés.");
        break;
    }/*  */

    return resultat;
  }

  public unload() {
    this.musique.arreter(false);
    this.son.arreter(false);
    this.testerAudio?.arreter(false);
  }

}