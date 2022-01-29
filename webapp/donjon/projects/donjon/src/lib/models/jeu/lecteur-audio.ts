import { ElementListeLecture } from "./element-liste-lecture";
import { Jeu } from "./jeu";
import { Resultat } from "../jouer/resultat";

export class LecteurAudio {
  private audio: HTMLAudioElement;
  private listeLecture: ElementListeLecture[];
  private lectureEnCours: boolean;
  private repetitionsRestantes: number;

  /** 
   * Le lecteur joue-t-il actuellement un son ?
   */
  public joue: boolean;

  constructor(
    private jeu: Jeu,
  ) {
    this.audio = new Audio();
    // son joué
    this.audio.onended = () => this.onTermine();
    // erreur au chargement du son
    this.audio.onerror = (ev: Event) => this.onAudioErreur(ev);
    // this.audio.oncanplay = (ev: Event) => this.onPeutEtreJoue(ev);
    // this.audio.onplaying = (ev: Event) => this.onPeutEtreJoue(ev);
    this.reinitialiser();
  }

  private reinitialiser() {
    this.audio.volume = 1;
    this.lectureEnCours = false;
    this.repetitionsRestantes = 0;
    this.listeLecture = [];
  }

  private onTermine() {
    if (this.repetitionsRestantes > 0) {
      this.repetitionsRestantes -= 1;
      this.audio.play();
      this.lectureEnCours = true;
    } else if (this.listeLecture.length > 0) {
      const suivant = this.listeLecture.shift();
      this.jouer(suivant.fichier, suivant.enBoucle, suivant.repetitions);
    } else {
      this.lectureEnCours = false;
    }
  }

  /** Le fichier n’a pas pu être lu (404, format incompatible, …) */
  private onAudioErreur(ev: Event) {
    this.jeu.tamponErreurs.push("Le fichier audio n’a pas pu être lu : " + this.audio.src);
    // on a terminé ce son, il y en a peut-être encore 1 qui suit…
    this.onTermine();
  }

  // private onEstJoue(ev: Event) {
  //   console.log("Le fichier audio est joué", ev);
  // }

  /**
   * Charger un fichier audio et le jouer.
   * @argument urlFichierSecurisee Attention: l’url du fichier doit avoir été vérifiée avant !
   * @returns true s’il n’y a pas eu d’erreur.
   */
  public jouer(urlFichierSecurisee: string, enBoucle: boolean = false, repetitions: number = 0): Resultat {
    if (this.jeu.parametres.activerAudio) {
      //console.log("jouer:", urlFichierSecurisee, "boucle:", enBoucle, "repet:", repetitions);
      this.lectureEnCours = true;
      this.audio.pause();
      this.audio.volume = 1;
      this.repetitionsRestantes = repetitions;
      this.audio.src = urlFichierSecurisee;
      // ne pas lire en boucle s’il ne s’agit pas du dernier élément de la liste de lecture
      this.audio.loop = (enBoucle && this.listeLecture.length == 0);
      this.audio.play();

      return new Resultat(true, '', 1);
    } else {
      return new Resultat(false, '{/L’audio est désactivé (jouer «' + urlFichierSecurisee + '»)/}{N}', 1);
    }
  }

  /**
   * Charger un fichier audio quand le précédent est terminé
   * @argument urlFichierSecurisee Attention: l’url du fichier doit avoir été vérifiée avant !
   * @returns true s’il n’y a pas eu d’erreur.
   */
  public jouerALaSuite(urlFichierSecurisee: string, enBoucle: boolean = false, repetitions: number = 0): Resultat {
    if (this.lectureEnCours) {
      this.listeLecture.push(new ElementListeLecture(urlFichierSecurisee, enBoucle, repetitions));
      // ne pas lire en boucle s’il ne s’agit pas du dernier élément de la liste de lecture
      this.audio.loop = false;
      return new Resultat(true, '', 1);
    } else {
      return this.jouer(urlFichierSecurisee, enBoucle, repetitions);
    }

  }

  /**
   * Arrêter l’audio actuellement joué.
   * @param progressivement Arrêter l’audio actuellement joué en diminuant progressivement le volume
   * @returns true
   */
  public arreter(progressivement: boolean): Resultat {
    if (this.jeu.parametres.activerAudio) {
      if (progressivement) {
        this.arreterProgressivement();
      } else {
        this.audio.pause();
      }
      return new Resultat(true, '', 1);
    } else {
      this.audio.pause(); // s’assurer qu’il n’y avait plus une boucle à volume 0
      return new Resultat(false, '{/L’audio est désactivé (arrêter)/}{N}', 1);
    }
  }

  /**
   * Arrêter l’audio actuellement joué en diminuant progressivement le volume
   */
  private arreterProgressivement(): void {
    setTimeout(() => {
      if (this.audio.volume > 0.1) {
        this.audio.volume -= 0.1
        this.arreterProgressivement();
      } else {
        this.audio.pause();
        this.audio.volume = 1;
      }
    }, 100);
  }

  public onChangementAudioActif(): void {
    // ré-activer le son
    if (this.jeu.parametres.activerAudio) {
      this.audio.volume = 1;
    // désactiver le son
    } else {
      this.audio.volume = 0;
    }
  }

}
