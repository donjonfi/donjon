// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F152] INTERFACE TACTILE : ATTENTE (TOUCHE, SUITE DU TEXTE, SECONDES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Pendant une attente, le joueur ne peut que continuer : la barre Actions/Regarder
// laisse place à un bouton « Suite » (ou « Patientez… » grisé pour attendre N secondes)
// et les éléments du jeu ne sont plus soulignés (liens tactiles inactifs).
//
// Tests sur l’interface réelle : le lecteur est monté avec son template (TestBed)
// et les vérifications portent sur le DOM rendu.

import { ChangeDetectorRef } from "@angular/core";
import { ComponentFixture,TestBed, fakeAsync, flush, tick } from "@angular/core/testing";

import { DonjonModule } from "../donjon.module";
import { LecteurComponent } from "../lecteur/lecteur.component";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

describe('[F152] Interface tactile : attente (touche, suite du texte, secondes)', () => {

  let fixture: ComponentFixture<LecteurComponent>;
  let lecteur: LecteurComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DonjonModule] }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  /** Monter le lecteur (mode tactile forcé) sur un scénario. */
  function monter(scenario: string, interfaceTactile: 'active' | 'desactive' = 'active'): void {
    fixture = TestBed.createComponent(LecteurComponent);
    lecteur = fixture.componentInstance;
    lecteur.jeu = TestUtils["genererLeJeu"](`La salle est un lieu.
La balle est un objet dans la salle.
${scenario}
` + actions, false);
    lecteur.interfaceTactile = interfaceTactile;
    spyOn(lecteur as any, "definirIFID");
    spyOn(lecteur as any, "verifierChrono");
    spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques");
    spyOn(lecteur as any, "verifierTamponErreurs"); // se relance toutes les secondes
    lecteur.ngOnChanges({});
    // comme dans l’application : la zone re-rend la vue après chaque événement
    fixture.autoDetectChanges(true);
    attendre();
  }

  /**
   * Laisser passer les timers du lecteur (défilement, fin de commande) puis re-rendre.
   * Le rendu passe par le ChangeDetectorRef du lecteur : un appel direct
   * (validationCommande) ne marque pas sa vue, que fixture.detectChanges() ne re-rend alors pas.
   */
  function attendre(ms = 1000): void {
    tick(ms);
    fixture.componentRef.injector.get(ChangeDetectorRef).detectChanges();
  }

  /** Exécuter une commande comme le joueur. */
  function executer(commande: string): void {
    lecteur.commande = commande;
    (lecteur as any).validationCommande();
    attendre();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  /** Libellés des boutons de la barre tactile. */
  function boutonsBarre(): HTMLButtonElement[] {
    return Array.from(el().querySelectorAll<HTMLButtonElement>('.djn-barre-tactile button'));
  }

  function libellesBarre(): string[] {
    return boutonsBarre().map(b => b.textContent!.trim());
  }

  function sortie(): HTMLElement {
    return el().querySelector<HTMLElement>('#taResultat')!;
  }

  function cliquer(element: HTMLElement): void {
    element.click();
    attendre();
  }

  it('[F152-T001] hors attente : barre Actions/Regarder et objets soulignés', fakeAsync(() => {
    monter('');
    expect(libellesBarre()[0]).toBe('⚡ Actions');
    expect(sortie().classList).toContain('tactile-actif');
    flush();
  }));

  it('[F152-T002] attendre touche : bouton « Suite » seul, objets non soulignés, puis retour à la normale', fakeAsync(() => {
    monter(`
action tester:
  dire "Avant.".
  attendre touche.
  dire "Après.".
fin action
`);
    executer('tester');
    expect(libellesBarre()).toEqual(['Suite']);
    expect(sortie().classList).not.toContain('tactile-actif');
    expect(sortie().textContent).not.toContain('Après.');

    cliquer(boutonsBarre()[0]);
    expect(sortie().textContent).toContain('Après.');
    expect(libellesBarre()[0]).toBe('⚡ Actions');
    expect(sortie().classList).toContain('tactile-actif');
    flush();
  }));

  it('[F152-T003] attendre touche : un tap sur un objet du texte continue (n’ouvre pas le menu)', fakeAsync(() => {
    monter(`
action tester:
  dire "Avant.".
  attendre touche.
  dire "Après.".
fin action
`);
    executer('tester');
    const lienBalle = sortie().querySelector<HTMLElement>('.djn-lien-tactile')!;
    expect(lienBalle).withContext('lien tactile « balle » présent dans la sortie').not.toBeNull();

    cliquer(lienBalle);
    expect(lecteur.menuTactileOuvert).toBeFalse();
    expect(sortie().textContent).toContain('Après.');
    flush();
  }));

  it('[F152-T004] suite du texte (pause dans un dire) : « Suite », puis la suite s’affiche', fakeAsync(() => {
    monter(`
action tester:
  dire "Question ?@@attendre touche@@Réponse !".
fin action
`);
    executer('tester');
    expect(libellesBarre()).toEqual(['Suite']);
    expect(sortie().classList).not.toContain('tactile-actif');
    expect(sortie().textContent).not.toContain('Réponse');

    cliquer(boutonsBarre()[0]);
    expect(sortie().textContent).toContain('Réponse');
    expect(libellesBarre()[0]).toBe('⚡ Actions');
    flush();
  }));

  it('[F152-T005] suite du texte : un tap sur le texte affiche la suite', fakeAsync(() => {
    monter(`
action tester:
  dire "Question ?@@attendre touche@@Réponse !".
fin action
`);
    executer('tester');
    cliquer(sortie());
    expect(sortie().textContent).toContain('Réponse');
    flush();
  }));

  it('[F152-T006] attendre N secondes : « Patientez… » grisé, puis retour à la normale', fakeAsync(() => {
    monter(`
action tester:
  dire "Avant.".
  attendre 5 secondes.
  dire "Après.".
fin action
`);
    executer('tester');
    expect(libellesBarre()).toEqual(['Patientez…']);
    expect(boutonsBarre()[0].disabled).toBeTrue();
    expect(sortie().classList).not.toContain('tactile-actif');

    // un tap sur le texte ne raccourcit pas l’attente
    cliquer(sortie());
    expect(sortie().textContent).not.toContain('Après.');

    attendre(5000);
    expect(sortie().textContent).toContain('Après.');
    expect(libellesBarre()[0]).toBe('⚡ Actions');
    flush();
  }));

  it('[F152-T007] mode clavier : ni barre tactile ni bouton « Suite »', fakeAsync(() => {
    monter(`
action tester:
  attendre touche.
fin action
`, 'desactive');
    executer('tester');
    expect(boutonsBarre()).toEqual([]);
    expect(sortie().classList).not.toContain('tactile-actif');
    flush();
  }));

});
