import { Action } from '../../../models/compilateur/action';
import { Classe } from '../../../models/commun/classe';
import { ElementGenerique } from '../../../models/compilateur/element-generique';
import { Monde } from '../../../models/compilateur/monde';
import { Regle } from '../../../interfaces/compilateur/regle';
import { TypeRegle } from '../../../models/compilateur/type-regle';
import { Component, Input, OnChanges } from '@angular/core';

@Component({
    selector: 'app-apercu-monde',
    templateUrl: './apercu-monde.component.html',
    styleUrls: ['./apercu-monde.component.scss'],
    standalone: false
})
export class ApercuMondeComponent implements OnChanges {

  TypeRegle = TypeRegle;

  @Input() monde: Monde;
  @Input() regles: Regle[];
  @Input() compteurs: ElementGenerique[];
  @Input() listes: ElementGenerique[];
  @Input() actions: Action[];

  /** Racines de l’arbre des classes (classes sans parent connu dans le monde). */
  racinesClasses: Classe[] = [];
  /** Enfants directs de chaque classe (clé = classe parente). */
  private enfantsParClasse = new Map<Classe, Classe[]>();

  constructor() { }

  ngOnChanges(): void {
    this.construireArbreClasses();
  }

  /** Construit l’arbre des classes à partir de monde.classes (références `parent`). */
  private construireArbreClasses(): void {
    this.racinesClasses = [];
    this.enfantsParClasse = new Map<Classe, Classe[]>();
    const classes = this.monde?.classes ?? [];
    const triParNom = (a: Classe, b: Classe) => a.nom.localeCompare(b.nom);
    classes.forEach(classe => {
      // racine : pas de parent, ou parent absent du monde (sécurité)
      if (!classe.parent || !classes.includes(classe.parent)) {
        this.racinesClasses.push(classe);
      } else {
        const fratrie = this.enfantsParClasse.get(classe.parent) ?? [];
        fratrie.push(classe);
        this.enfantsParClasse.set(classe.parent, fratrie);
      }
    });
    this.racinesClasses.sort(triParNom);
    this.enfantsParClasse.forEach(fratrie => fratrie.sort(triParNom));
  }

  /** Enfants directs d’une classe (pour le rendu récursif de l’arbre). */
  enfants(classe: Classe): Classe[] {
    return this.enfantsParClasse.get(classe) ?? [];
  }

}
