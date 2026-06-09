import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { ElementJeu } from '../../models/jeu/element-jeu';
import { ElementsJeuUtils } from '../../utils/commun/elements-jeu-utils';
import { Jeu } from '../../models/jeu/jeu';
import { SuggestionVerbe, VerbesElementsUtils } from '../../utils/jeu/tactile/verbes-elements-utils';

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
  @Input() jeu: Jeu;
  @Input() eju: ElementsJeuUtils;

  /** Commande choisie par le joueur, à exécuter. */
  @Output() commandeChoisie = new EventEmitter<string>();
  /** Fermeture du menu sans commande. */
  @Output() fermer = new EventEmitter<void>();

  /** Étape du constructeur de phrase. */
  etape: 'verbes' | 'ceci' | 'cela' | 'apercu' = 'verbes';
  /** Verbes proposés. */
  suggestions: SuggestionVerbe[] = [];
  /** Verbe choisi (étapes ceci/cela/aperçu). */
  verbeChoisi: SuggestionVerbe | null = null;
  /** Candidats pour le premier complément (constructeur global). */
  candidatsCeci: ElementJeu[] = [];
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
    this.ceciChoisi = null;
    this.candidatsCela = [];
    this.celaChoisi = null;
    this.commandePartielle = '';
    this.apercu = '';
    this.prepositionApercu = undefined;
    if (this.jeu && this.eju) {
      this.suggestions = this.cible
        ? VerbesElementsUtils.listerVerbes(this.cible, this.jeu, this.eju)
        : VerbesElementsUtils.listerVerbesGlobaux(this.jeu, this.eju);
    } else {
      this.suggestions = [];
    }
  }

  /** Intitulé affiché dans l’entête du menu (étape verbes). */
  get titreCible(): string {
    return this.cible ? VerbesElementsUtils.intituleCommande(this.cible) : 'Actions';
  }

  choisirVerbe(suggestion: SuggestionVerbe): void {
    this.verbeChoisi = suggestion;
    // constructeur global : choisir d’abord le premier complément
    if (suggestion.attendCeci) {
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
        this.etape = this.verbeChoisi?.attendCela ? 'cela' : (this.verbeChoisi?.attendCeci ? 'ceci' : 'verbes');
        break;
      case 'cela':
        this.candidatsCela = [];
        this.celaChoisi = null;
        this.etape = this.verbeChoisi?.attendCeci ? 'ceci' : 'verbes';
        if (this.etape === 'verbes') {
          this.verbeChoisi = null;
        }
        break;
      case 'ceci':
        this.candidatsCeci = [];
        this.ceciChoisi = null;
        this.verbeChoisi = null;
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

  intituleElement(element: ElementJeu): string {
    return VerbesElementsUtils.intituleCommande(element);
  }

}
