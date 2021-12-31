import { Classe } from "../commun/classe";
import { ClassesRacines } from "../commun/classes-racines";
import { GroupeNominal } from "../commun/groupe-nominal";
import { Intitule } from "./intitule";
import { THIS_EXPR } from "@angular/compiler/src/output/output_ast";

export class Liste extends Intitule {

  private _valeursTexte: string[] | undefined = undefined;
  private _valeursNombre: number[] | undefined = undefined;
  private _valeursIntitule: Intitule[] | undefined = undefined;
  private _valeursMixtes: (string | number | Intitule)[] | undefined = undefined;

  public constructor(
    /** Nom du compteur */
    nom: string,
    /** Valeur du compteur */
    public valeur: number = 0,
    /** Intitulé du compteur */
    intitule: GroupeNominal | undefined = undefined,
    /** Classe : liste */
    classe: Classe = ClassesRacines.Liste,
  ) {
    super(nom, (intitule ? intitule : (new GroupeNominal(null, nom, null))), classe);
  }

  /** La liste est-elle vide ? */
  public get vide(): boolean {
    return this.classe == ClassesRacines.ListeVide;
  }

  /** Vider la liste */
  public vider(): void {
    switch (this.classe) {
      // Vide
      case ClassesRacines.ListeVide:
        break;

      // Mixte
      case ClassesRacines.ListeMixte:
        this._valeursMixtes = undefined;
        break;

      // Nombre
      case ClassesRacines.ListeNombre:
        this._valeursNombre = undefined;
        break;

      // Texte
      case ClassesRacines.ListeTexte:
        this._valeursTexte = undefined;
        break;

      // Intitulé
      case ClassesRacines.ListeIntitule:
        this._valeursIntitule = undefined;
        break;

      default:
        throw new Error("Not implemented");
    }
  }



  /** Ajouter un élément de type « texte » à la liste. */
  public ajouterTexte(valeur: string) {
    this.ajouterTextes([valeur]);
  }

  /** Ajouter des éléments de type « texte » à la liste. */
  public ajouterTextes(valeurs: string[]) {
    switch (this.classe) {
      // Vide => texte
      case ClassesRacines.ListeVide:
        this._valeursTexte = [...valeurs];
        this.classe = ClassesRacines.ListeTexte;
        break;

      // Texte
      case ClassesRacines.ListeTexte:
        this._valeursTexte.push(...valeurs);
        break;

      // Mixte
      case ClassesRacines.ListeMixte:
        this._valeursMixtes.push(...valeurs);
        break;

      // Intitulé => Mixte
      case ClassesRacines.ListeIntitule:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursIntitule);
        this._valeursIntitule = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Nombre => Mixte
      case ClassesRacines.ListeNombre:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursNombre);
        this._valeursNombre = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      default:
        throw new Error("Not implemented");
    }
  }

  /** Ajouter un élément de type « nombre » à la liste. */
  public ajouterNombre(valeur: number) {
    this.ajouterNombres([valeur]);
  }

  /** Ajouter des éléments de type « nombre » à la liste. */
  public ajouterNombres(valeurs: number[]) {
    switch (this.classe) {
      // Vide => nombre
      case ClassesRacines.ListeVide:
        this._valeursNombre = [...valeurs];
        this.classe = ClassesRacines.ListeNombre;
        break;

      // Nombre
      case ClassesRacines.ListeNombre:
        this._valeursNombre.push(...valeurs);
        break;

      // Mixte
      case ClassesRacines.ListeMixte:
        this._valeursMixtes.push(...valeurs);
        break;

      // Intitulé => Mixte
      case ClassesRacines.ListeIntitule:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursIntitule);
        this._valeursIntitule = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Texte => Mixte
      case ClassesRacines.ListeTexte:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursTexte);
        this._valeursTexte = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      default:
        throw new Error("Not implemented");
    }
  }

  /** Ajouter un élément de type « intitulé » à la liste. */
  public ajouterIntitule(valeur: Intitule) {
    this.ajouterIntitules([valeur]);
  }

  /** Ajouter des éléments de type « intitulé » à la liste. */
  public ajouterIntitules(valeurs: Intitule[]) {
    switch (this.classe) {
      // Vide => Intitulé
      case ClassesRacines.ListeVide:
        this._valeursIntitule = [...valeurs];
        this.classe = ClassesRacines.ListeIntitule;
        break;

      // Intitulé
      case ClassesRacines.ListeIntitule:
        this._valeursIntitule.push(...valeurs);
        break;

      // Mixte
      case ClassesRacines.ListeMixte:
        this._valeursMixtes.push(...valeurs);
        break;

      // Nombre => Mixte
      case ClassesRacines.ListeNombre:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursNombre);
        this._valeursNombre = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Texte => Mixte
      case ClassesRacines.ListeTexte:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursTexte);
        this._valeursTexte = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      default:
        throw new Error("Not implemented");
    }
  }

  /** Ajouter des éléments de différents types à la liste. */
  public ajouterMixtes(valeurs: (string | number | Intitule)[]) {

    switch (this.classe) {
      // Vide => Mixte
      case ClassesRacines.ListeVide:
        this._valeursMixtes = [...valeurs];
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Mixte
      case ClassesRacines.ListeMixte:
        this._valeursMixtes.push(...valeurs);
        break;

      // Nombre => Mixte
      case ClassesRacines.ListeNombre:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursNombre);
        this._valeursNombre = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Texte => Mixte
      case ClassesRacines.ListeTexte:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursTexte);
        this._valeursTexte = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      // Intitulé => Mixte
      case ClassesRacines.ListeIntitule:
        this._valeursMixtes = [];
        this._valeursMixtes.push(...this._valeursIntitule);
        this._valeursIntitule = undefined;
        this._valeursMixtes.push(...valeurs);
        this.classe = ClassesRacines.ListeMixte;
        break;

      default:
        throw new Error("Not implemented");
    }

  }

  /** Récupérer les valeurs de la liste (texte) */
  public get valeursTexte(): string[] {
    if (this.classe == ClassesRacines.ListeTexte) {
      return this._valeursTexte;
    } else {
      console.error("Liste > GetValeursTexte : il ne s’agit pas d’une liste texte.");
      return [];
    }
  }

  /** Récupérer les valeurs de la liste (nombre) */
  public get valeursNombre(): number[] {
    if (this.classe == ClassesRacines.ListeNombre) {
      return this.valeursNombre;
    } else {
      console.error("Liste > GetValeursNombre : il ne s’agit pas d’une liste nombre.");
      return [];
    }
  }

  /** Récupérer les valeurs de la liste (intitulé) */
  public get valeursIntitule(): Intitule[] {
    if (this.classe == ClassesRacines.ListeIntitule) {
      return this.valeursIntitule;
    } else {
      console.error("Liste > GetValeursIntitule : il ne s’agit pas d’une liste intitulé.");
      return [];
    }
  }

  /** Récupérer les valeurs de la liste (mixte) */
  public get valeurs(): (string | number | Intitule)[] {
    switch (this.classe) {
      // Vide
      case ClassesRacines.ListeVide:
        return [];

      // Mixte
      case ClassesRacines.ListeMixte:
        return this._valeursMixtes;

      // Nombre
      case ClassesRacines.ListeNombre:
        return this._valeursNombre;

      // Texte
      case ClassesRacines.ListeTexte:
        return this._valeursTexte;

      // Intitulé
      case ClassesRacines.ListeIntitule:
        return this._valeursIntitule;

      default:
        throw new Error("Not implemented");
    }
  }

}
