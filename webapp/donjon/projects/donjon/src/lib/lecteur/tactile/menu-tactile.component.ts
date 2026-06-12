import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../../utils/commun/elements-jeu-utils';
import { Jeu } from '../../models/jeu/jeu';
import { Localisation } from '../../models/jeu/localisation';
import { GroupeVerbe, SuggestionVerbe, VerbesElementsUtils } from '../../utils/jeu/tactile/verbes-elements-utils';

/**
 * Proposition affichée après le choix d’un verbe : une commande prête à être
 * exécutée, ou une variante dont il reste un complément à choisir (« … »).
 */
interface PropositionVariante {
  /** Texte du bouton. */
  libelle: string;
  /** Commande complète à exécuter (sinon la variante doit encore être complétée). */
  commande: string | null;
  /** Variante à compléter (choix du complément). */
  variante: SuggestionVerbe | null;
  /** L’action serait probablement refusée par ses prérequis. */
  douteuse: boolean;
}

/**
 * Menu tactile (bottom-sheet) : liste les verbes applicables à un élément du
 * jeu (mode élément), ou toutes les actions lançables (mode constructeur
 * global, quand `cible` est null), avec constructeur de phrase pour les
 * compléments (« donner la clé au garde »).
 */
@Component({
  selector: 'djn-menu-tactile',
  templateUrl: './menu-tactile.component.html',
  styleUrls: ['./menu-tactile.component.scss'],
  standalone: false
})
export class MenuTactileComponent implements OnChanges {

  /** Élément du jeu sur lequel le menu est ouvert (null : constructeur global). */
  @Input() cible: ElementJeu | null = null;
  /** Sortie (direction) sur laquelle le menu est ouvert (prioritaire sur le mode global). */
  @Input() cibleDirection: Localisation | null = null;
  /** Dernières commandes exécutées par le joueur (la plus récente en dernier). */
  @Input() dernieresCommandes: string[] = [];
  @Input() jeu: Jeu;
  @Input() eju: ElementsJeuUtils;

  /** Commande choisie par le joueur, à exécuter. */
  @Output() commandeChoisie = new EventEmitter<string>();
  /** Fermeture du menu sans commande. */
  @Output() fermer = new EventEmitter<void>();
  /** Le joueur veut taper une commande complète au clavier. */
  @Output() saisieManuelle = new EventEmitter<void>();

  /** Étape du constructeur de phrase. */
  etape: 'verbes' | 'variantes' | 'ceci' | 'ceciLibre' | 'cela' | 'apercu' = 'verbes';
  /** Verbes proposés, regroupés par infinitif (et par niveau en mode élément). */
  groupes: GroupeVerbe[] = [];
  /** Niveau d’affichage : 1 principales, 2 + secondaires, 3 toutes les actions. */
  niveauAffiche: 1 | 2 | 3 = 1;
  /** Les derniers verbes utilisés par le joueur (constructeur global, plus récent d’abord). */
  groupesRecents: GroupeVerbe[] = [];
  /** Groupe de verbes choisi (étape variantes). */
  groupeChoisi: GroupeVerbe | null = null;
  /** Propositions de commandes pour le verbe choisi (étape variantes). */
  propositions: PropositionVariante[] = [];
  /** Texte saisi pour un premier complément libre (cible « un intitulé »). */
  texteLibre = '';
  /** Verbe choisi (étapes ceci/cela/aperçu). */
  verbeChoisi: SuggestionVerbe | null = null;
  /** Candidats pour le premier complément (constructeur global). */
  candidatsCeci: ElementJeu[] = [];
  /** Candidats direction pour le premier complément (« aller vers … »). */
  candidatsCeciDirections: Localisation[] = [];
  /** Premier complément choisi (= cible en mode élément). */
  ceciChoisi: ElementJeu | null = null;
  /** Candidats pour le second complément. */
  candidatsCela: ElementJeu[] = [];
  /** Second complément choisi. */
  celaChoisi: ElementJeu | null = null;
  /** Début de commande affiché dans l’entête (étape cela). */
  commandePartielle = '';
  /** Aperçu de la commande complète. */
  apercu = '';
  /** Préposition de cela utilisée dans l’aperçu (ajustable si spatiale). */
  prepositionApercu: string | undefined;

  ngOnChanges(): void {
    this.etape = 'verbes';
    this.verbeChoisi = null;
    this.candidatsCeci = [];
    this.candidatsCeciDirections = [];
    this.ceciChoisi = null;
    this.candidatsCela = [];
    this.celaChoisi = null;
    this.commandePartielle = '';
    this.apercu = '';
    this.prepositionApercu = undefined;
    this.niveauAffiche = 1;
    this.groupeChoisi = null;
    this.propositions = [];
    this.groupesRecents = [];
    this.texteLibre = '';
    this.groupes = [];
    if (this.jeu && this.eju) {
      if (this.cible) {
        this.groupes = VerbesElementsUtils.listerGroupesVerbes(this.cible, this.jeu, this.eju);
        // pas de principale pour cet élément : montrer directement tous les niveaux
        if (!this.groupes.some(g => g.niveau === 'principale')) {
          this.niveauAffiche = 3;
        }
      } else if (this.cibleDirection) {
        // sortie : actions ciblant une direction (aller, regarder, …)
        this.groupes = VerbesElementsUtils.listerGroupesVerbesDirection(this.cibleDirection, this.jeu, this.eju);
        if (!this.groupes.some(g => g.niveau === 'principale')) {
          this.niveauAffiche = 3;
        }
      } else {
        // constructeur global : les derniers verbes utilisés, puis tout par ordre alphabétique
        this.groupes = VerbesElementsUtils.listerGroupesVerbesGlobaux(this.jeu, this.eju);
        this.niveauAffiche = 3;
        this.groupesRecents = this.calculerGroupesRecents();
      }
    }
  }

  /** Nombre de derniers verbes utilisés proposés en tête du constructeur global. */
  private static readonly NB_RECENTS = 5;

  /** Les derniers verbes utilisés par le joueur, du plus récent au plus ancien. */
  private calculerGroupesRecents(): GroupeVerbe[] {
    const recents: GroupeVerbe[] = [];
    // la plus récente en dernier dans l’historique → parcourir à rebours
    for (let i = (this.dernieresCommandes?.length ?? 0) - 1; i >= 0 && recents.length < MenuTactileComponent.NB_RECENTS; i--) {
      const premierMot = this.dernieresCommandes[i]?.trim().toLowerCase().split(' ')[0];
      if (!premierMot) {
        continue;
      }
      const groupe = this.groupes.find(g => g.infinitif === premierMot
        || [g.simple, ...g.variantes].some(v => v.action.synonymes?.includes(premierMot)));
      if (groupe && !recents.includes(groupe)) {
        recents.push(groupe);
      }
    }
    return recents;
  }

  /** Groupes de verbes affichés au niveau courant (mode élément). */
  get groupesAffiches(): GroupeVerbe[] {
    return this.groupes.filter(g =>
      g.niveau === 'principale'
      || (this.niveauAffiche >= 2 && g.niveau === 'secondaire')
      || (this.niveauAffiche >= 3));
  }

  /** Reste-t-il des niveaux à déplier ? */
  get plusDeCommandesDisponible(): boolean {
    if (this.niveauAffiche >= 3) {
      return false;
    }
    return this.groupes.some(g =>
      (this.niveauAffiche < 2 && g.niveau === 'secondaire')
      || g.niveau === 'autre');
  }

  /** Libellé du bouton qui déplie le niveau suivant. */
  get libellePlusDeCommandes(): string {
    return (this.niveauAffiche === 1 && this.groupes.some(g => g.niveau === 'secondaire'))
      ? 'Plus d\u2019actions…'
      : 'Toutes les actions';
  }

  /** Déplier le niveau suivant (secondaires, puis toutes les actions). */
  afficherPlusDeCommandes(): void {
    this.niveauAffiche = (this.niveauAffiche === 1 && this.groupes.some(g => g.niveau === 'secondaire')) ? 2 : 3;
  }

  /**
   * Choix d’un verbe : exécution directe s’il n’y a qu’une forme complète,
   * sinon le contenu du menu est remplacé par les variantes de ce qu’on peut
   * faire avec cette action — commandes concrètes incluant l’élément cliqué
   * et le dernier élément mentionné dans la partie.
   */
  clicVerbe(groupe: GroupeVerbe): void {
    const variantes = [groupe.simple, ...groupe.variantes];

    // mode élément : construire des commandes concrètes
    if (this.cible) {
      if (variantes.length === 1 && !groupe.simple.attendCela) {
        this.choisirVerbe(groupe.simple);
        return;
      }
      this.propositions = [];
      variantes.forEach(v => {
        if (!v.attendCela) {
          this.propositions.push({ libelle: v.commande, commande: v.commande, variante: null, douteuse: v.probablementRefusee });
        } else {
          // commande pré-remplie avec le dernier élément mentionné (s’il convient)
          const candidats = VerbesElementsUtils.listerCandidatsCela(v.action, this.cible, this.jeu, this.eju);
          const dernier = this.dernierMentionneParmi(candidats);
          if (dernier) {
            const commande = VerbesElementsUtils.construireCommande(v.action, this.cible, dernier);
            this.propositions.push({ libelle: commande, commande, variante: null, douteuse: v.probablementRefusee });
          }
          // choisir soi-même le second complément
          const preposition = VerbesElementsUtils.affichagePrepositionCela(v);
          this.propositions.push({
            libelle: v.commande + (preposition ? (' ' + preposition) : '') + ' …',
            commande: null, variante: v, douteuse: v.probablementRefusee,
          });
        }
      });
      this.groupeChoisi = groupe;
      this.etape = 'variantes';

      // mode direction : la commande est complète
    } else if (this.cibleDirection) {
      this.choisirVerbe(groupe.simple);

      // constructeur global : squelettes des variantes
    } else {
      if (variantes.length === 1) {
        this.choisirVerbe(groupe.simple);
        return;
      }
      this.propositions = variantes.map(v => ({
        libelle: this.libelleSquelette(v), commande: null, variante: v, douteuse: v.probablementRefusee,
      }));
      this.groupeChoisi = groupe;
      this.etape = 'variantes';
    }
  }

  /** Choix d’une proposition : exécution directe, ou choix du complément restant. */
  choisirProposition(proposition: PropositionVariante): void {
    if (proposition.commande) {
      this.commandeChoisie.emit(proposition.commande);
    } else if (proposition.variante) {
      if (this.cible) {
        // mode élément : il reste le second complément à choisir
        this.verbeChoisi = proposition.variante;
        this.ceciChoisi = this.cible;
        this.commandePartielle = proposition.variante.commande;
        this.candidatsCela = VerbesElementsUtils.listerCandidatsCela(proposition.variante.action, this.cible, this.jeu, this.eju);
        this.etape = 'cela';
      } else {
        // constructeur global : choisir le premier complément
        this.choisirVerbe(proposition.variante);
      }
    }
  }

  /** Libellé d’une variante du constructeur global (« jeter … vers … »). */
  private libelleSquelette(variante: SuggestionVerbe): string {
    let libelle = variante.infinitif;
    if (variante.attendCeci) {
      libelle += (variante.prepositionCeci ? (' ' + variante.prepositionCeci) : '') + ' …';
    }
    if (variante.attendCela) {
      const preposition = VerbesElementsUtils.affichagePrepositionCela(variante);
      libelle += (preposition ? (' ' + preposition) : '') + ' …';
    }
    return libelle;
  }

  /** Le dernier élément mentionné dans la partie qui figure parmi les candidats. */
  private dernierMentionneParmi(candidats: ElementJeu[]): ElementJeu | null {
    for (const id of (this.jeu.derniersElementIds ?? [])) {
      const candidat = candidats.find(c => c.id === id);
      if (candidat) {
        return candidat;
      }
    }
    return null;
  }

  /** Intitulé affiché dans l’entête du menu (étape verbes). */
  get titreCible(): string {
    if (this.cible) {
      return VerbesElementsUtils.intituleCommande(this.cible);
    }
    if (this.cibleDirection) {
      return this.cibleDirection.intitule.determinant + this.cibleDirection.intitule.nom;
    }
    return 'Actions';
  }

  choisirVerbe(suggestion: SuggestionVerbe): void {
    this.verbeChoisi = suggestion;
    // constructeur global : premier complément en texte libre (cible « un intitulé »)
    if (suggestion.attendCeci && suggestion.ceciLibre) {
      this.texteLibre = '';
      this.etape = 'ceciLibre';
      // constructeur global : premier complément direction (« aller vers … »)
    } else if (suggestion.attendCeci && suggestion.ceciDirection) {
      this.candidatsCeciDirections = VerbesElementsUtils.listerSortiesVisibles(this.jeu, this.eju);
      this.etape = 'ceci';
      // constructeur global : choisir d’abord le premier complément
    } else if (suggestion.attendCeci) {
      this.candidatsCeci = VerbesElementsUtils.listerCandidatsCible(suggestion.action.cibleCeci, this.jeu, this.eju);
      this.etape = 'ceci';
      // mode élément : ceci est la cible du menu
    } else if (suggestion.attendCela) {
      this.ceciChoisi = this.cible;
      this.commandePartielle = suggestion.commande;
      this.candidatsCela = VerbesElementsUtils.listerCandidatsCela(suggestion.action, this.cible, this.jeu, this.eju);
      this.etape = 'cela';
      // commande complète : exécution immédiate
    } else {
      this.commandeChoisie.emit(suggestion.commande);
    }
  }

  /** Valider le premier complément saisi en texte libre → aperçu de la commande. */
  validerTexteLibre(): void {
    const texte = this.texteLibre.trim();
    if (!this.verbeChoisi || !texte) {
      return;
    }
    const preposition = this.verbeChoisi.prepositionCeci ? (this.verbeChoisi.prepositionCeci + ' ') : '';
    this.apercu = this.verbeChoisi.infinitif + ' ' + preposition + texte;
    this.etape = 'apercu';
  }

  /** Choisir une direction comme premier complément (« aller vers … ») → aperçu. */
  choisirCeciDirection(direction: Localisation): void {
    if (!this.verbeChoisi) {
      return;
    }
    this.apercu = VerbesElementsUtils.construireCommandeDirection(this.verbeChoisi.action, direction);
    this.etape = 'apercu';
  }

  choisirCeci(ceci: ElementJeu): void {
    if (!this.verbeChoisi) {
      return;
    }
    this.ceciChoisi = ceci;
    this.commandePartielle = VerbesElementsUtils.construireCommande(this.verbeChoisi.action, ceci);
    if (this.verbeChoisi.attendCela) {
      this.candidatsCela = VerbesElementsUtils.listerCandidatsCela(this.verbeChoisi.action, ceci, this.jeu, this.eju);
      this.etape = 'cela';
    } else {
      this.apercu = this.commandePartielle;
      this.etape = 'apercu';
    }
  }

  choisirCela(cela: ElementJeu): void {
    if (this.verbeChoisi && this.ceciChoisi) {
      this.celaChoisi = cela;
      this.prepositionApercu = VerbesElementsUtils.prepositionCelaParDefaut(this.verbeChoisi.action, cela);
      this.apercu = VerbesElementsUtils.construireCommande(this.verbeChoisi.action, this.ceciChoisi, cela, this.prepositionApercu);
      this.etape = 'apercu';
    }
  }

  /** Prépositions de cela proposées dans l’aperçu (« mettre ceci sur/dans/sous cela »). */
  get prepositionsPossibles(): string[] {
    return (this.verbeChoisi && this.celaChoisi) ? VerbesElementsUtils.prepositionsCelaPossibles(this.verbeChoisi.action) : [];
  }

  /** Ajuster la préposition de cela dans l’aperçu. */
  changerPreposition(preposition: string): void {
    if (this.verbeChoisi && this.ceciChoisi && this.celaChoisi) {
      this.prepositionApercu = preposition;
      this.apercu = VerbesElementsUtils.construireCommande(this.verbeChoisi.action, this.ceciChoisi, this.celaChoisi, preposition);
    }
  }

  /** Préposition de cela affichée sur le bouton d’un verbe (« sur/dans/sous » si spatiale). */
  affichagePrepositionCela(suggestion: SuggestionVerbe | null): string | undefined {
    return suggestion ? VerbesElementsUtils.affichagePrepositionCela(suggestion) : undefined;
  }

  envoyerApercu(): void {
    if (this.apercu) {
      this.commandeChoisie.emit(this.apercu);
    }
  }

  retour(): void {
    switch (this.etape) {
      case 'apercu':
        this.apercu = '';
        this.prepositionApercu = undefined;
        this.celaChoisi = null;
        this.etape = this.verbeChoisi?.attendCela ? 'cela'
          : (this.verbeChoisi?.attendCeci ? (this.verbeChoisi.ceciLibre ? 'ceciLibre' : 'ceci') : 'verbes');
        break;
      case 'cela':
        this.candidatsCela = [];
        this.celaChoisi = null;
        if (this.groupeChoisi && this.cible) {
          // on venait des propositions de variantes
          this.verbeChoisi = null;
          this.etape = 'variantes';
        } else {
          this.etape = this.verbeChoisi?.attendCeci ? 'ceci' : 'verbes';
          if (this.etape === 'verbes') {
            this.verbeChoisi = null;
          }
        }
        break;
      case 'ceci':
      case 'ceciLibre':
        this.candidatsCeci = [];
        this.candidatsCeciDirections = [];
        this.ceciChoisi = null;
        this.texteLibre = '';
        this.verbeChoisi = null;
        this.etape = this.groupeChoisi ? 'variantes' : 'verbes';
        break;
      case 'variantes':
        this.propositions = [];
        this.groupeChoisi = null;
        this.etape = 'verbes';
        break;
      default:
        this.fermer.emit();
        break;
    }
  }

  onFermer(): void {
    this.fermer.emit();
  }

  /** Le joueur préfère taper sa commande au clavier (« au cas où »). */
  demanderSaisieManuelle(): void {
    this.saisieManuelle.emit();
  }

  intituleElement(element: ElementJeu): string {
    return VerbesElementsUtils.intituleCommande(element);
  }

  intituleDirection(direction: Localisation): string {
    return direction.intitule.determinant + direction.intitule.nom;
  }

}
