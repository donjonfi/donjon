import { ContexteTour } from "../../models/jouer/contexte-tour";
import { ElementsPhrase } from "../../models/commun/elements-phrase";
import { Jeu } from "../../models/jeu/jeu";
import { Resultat } from "../../models/jouer/resultat";
import { StringUtils } from "../commun/string.utils";

export class InstructionCharger {

  constructor(
    private jeu: Jeu,
    private document: Document | undefined,
  ) { }

  /** Jouer un son ou une musique */
  public executerCharger(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {

    let resultat = new Resultat(false, '', 1);

    // vérifier si le nom du fichier est sécurisé
    const nomFichierNonSecurise = instruction.complement1;
    const nomFichierSecurise = StringUtils.nomDeFichierSecurise(nomFichierNonSecurise);
    if (nomFichierSecurise && nomFichierSecurise == nomFichierNonSecurise) {
      switch (instruction.sujet.nom) {
        // charger le thème
        case 'theme':
        case 'thème':
          const urlTheme = Jeu.dossierRessources + (this.jeu.sousDossierRessources ? ("/" + this.jeu.sousDossierRessources) : "") + "/themes/" + nomFichierNonSecurise;

          // charger le thème dynamiquement
          this.chargerTheme(urlTheme);

          resultat.succes = true;
          break;

        default:
          contexteTour.ajouterErreurInstruction(instruction, "Charger : seul un thème peut être chargé.");
          break;
      }
    } else {
      contexteTour.ajouterErreurInstruction(instruction, "Charger : le nom du fichier à charger ne peut contenir que des lettres, chiffres et tirets (pas de caractère spécial ou lettre accentuée). Ex: mon_theme.css");
    }

    return resultat;
  }

  public executerDecharger(instruction: ElementsPhrase, contexteTour: ContexteTour): Resultat {
    let resultat = new Resultat(true, '', 1);
    
    switch (instruction.sujet.nom) {
      // charger le thème
      case 'theme':
      case 'thème':
        // décharger le thème
        this.unload();
        resultat.succes = true;
        break;

      default:
        contexteTour.ajouterErreurInstruction(instruction, "Décharger : seul un thème peut être déchargé.");
        break;
    }

    return resultat;
  }


  /**
   * Charger le thème CSS
   * @param urlThemeSecurisee l’url doit déjà avoir été vérifiée avant d’appeler cette méthode ! 
   */
  private chargerTheme(urlThemeSecurisee: string) {
    if (this.document) {
      const head = this.document.getElementsByTagName('head')[0];

      let themeLink = this.document.getElementById(
        'client-theme'
      ) as HTMLLinkElement;
      if (themeLink) {
        themeLink.href = urlThemeSecurisee;
      } else {
        const style = this.document.createElement('link');
        style.id = 'client-theme';
        style.rel = 'stylesheet';
        style.href = `${urlThemeSecurisee}`;
        head.appendChild(style);
      }
    }
  }


  public unload() {
    let themeLink = this.document.getElementById('client-theme');
    if (themeLink) {
      themeLink.remove();
    }
  }
}
