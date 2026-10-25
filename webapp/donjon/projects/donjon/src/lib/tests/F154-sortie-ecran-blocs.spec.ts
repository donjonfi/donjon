// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F154] SORTIE ÉCRAN : UN BLOC PAR TOUR (PERFORMANCES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// La sortie n’est plus une seule chaîne re-rendue en entier à chaque tour : chaque tour
// est un bloc, seul le dernier est re-rendu. Seuls les derniers tours (une « page ») sont
// dans le DOM ; les plus anciens restent en mémoire et sont rechargés quand le joueur remonte.
//
// Les tests « Lecteur » montent le vrai composant (TestBed) et vérifient le DOM rendu,
// notamment qu’il est équivalent à l’ancien rendu (toute la chaîne dans un seul innerHTML).

import { ChangeDetectorRef, SecurityContext } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";

import { ChoixEcran, ContexteEcran, TOURS_PAR_PAGE_PAR_DEFAUT } from "../models/jouer/contexte-ecran";
import { DonjonModule } from "../donjon.module";
import { FichierEnregistrement } from "../models/jouer/fichier-enregistrement";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { LecteurComponent } from "../lecteur/lecteur.component";
import { Sauvegarde } from "../models/jouer/sauvegarde";
import { TestUtils } from "../utils/test-utils";
import { actions } from "./scenario_actions";

describe('[F154] Sortie écran : un bloc par tour', () => {

    describe('ContexteEcran', () => {

        it('[F154-T001] les blocs se concatènent dans le contenu de l’écran', () => {
            const ecran = new ContexteEcran('');
            ecran.ajouterContenuHtml('<p>a</p>');
            ecran.nouveauBloc();
            ecran.ajouterContenuHtml('<p>b</p>');
            ecran.ajouterContenuHtml('<p>c</p>');
            expect(ecran.blocsPrincipal.map(x => x.html)).toEqual(['<p>a</p>', '<p>b</p><p>c</p>']);
            expect(ecran.ecran).toBe('<p>a</p><p>b</p><p>c</p>');
        });

        it('[F154-T002] pas de bloc vide, effacer l’écran ne laisse qu’un bloc', () => {
            const ecran = new ContexteEcran('');
            ecran.nouveauBloc();
            ecran.nouveauBloc();
            expect(ecran.blocsPrincipal.length).toBe(1);
            ecran.ajouterContenuHtml('a');
            ecran.nouveauBloc();
            ecran.ajouterContenuHtml('b');
            ecran.effacerEcran();
            expect(ecran.blocsPrincipal.length).toBe(1);
            expect(ecran.ecran).toBe('');
        });

        it('[F154-T003] écrans secondaire et temporaire séparés du principal', () => {
            const ecran = new ContexteEcran('');
            ecran.ajouterContenuHtml('principal');
            ecran.afficherEcran(ChoixEcran.secondaire);
            expect(ecran.ecranAffiche).toBe(ChoixEcran.secondaire);
            ecran.ajouterContenuHtml('secondaire');
            ecran.afficherEcran(ChoixEcran.temporaire);
            ecran.ajouterContenuHtml('temporaire');
            expect(ecran.ecran).toBe('temporaire');
            ecran.afficherEcran(ChoixEcran.precedent);
            expect(ecran.ecran).toBe('secondaire');
            ecran.afficherEcran(ChoixEcran.principal);
            expect(ecran.ecran).toBe('principal');
            expect(ecran.ecranSecondaire).toBe('secondaire');
        });

        it('[F154-T004] restauration : le texte des écrans secondaire et temporaire est recopié sur le principal', () => {
            const ecran = new ContexteEcran('');
            ecran.recopierAutresEcrans = true;
            ecran.ajouterContenuHtml('<p>avant</p>');
            ecran.afficherEcran(ChoixEcran.secondaire);
            ecran.ajouterContenuHtml('<p>souvenir 1</p>');
            ecran.ajouterContenuHtml('<p>souvenir 2</p>');
            ecran.afficherEcran(ChoixEcran.temporaire);
            ecran.ajouterContenuHtml('<p>note</p>');
            ecran.afficherEcran(ChoixEcran.precedent);
            ecran.afficherEcran(ChoixEcran.principal);
            ecran.ajouterContenuHtml('<p>après</p>');
            expect(ecran.ecranPrincipal).toBe('<p>avant</p>'
                + '<div class="djn-rejeu-ecran djn-rejeu-secondaire"><div class="djn-rejeu-etiquette">écran secondaire</div><p>souvenir 1</p><p>souvenir 2</p></div>'
                + '<div class="djn-rejeu-ecran djn-rejeu-temporaire"><div class="djn-rejeu-etiquette">écran temporaire</div><p>note</p></div>'
                + '<p>après</p>');
            // l’écran secondaire garde son propre contenu
            expect(ecran.ecranSecondaire).toBe('<p>souvenir 1</p><p>souvenir 2</p>');
        });

        it('[F154-T005] fin de la restauration : le passage en cours est fermé, plus de recopie ensuite', () => {
            const ecran = new ContexteEcran('');
            ecran.recopierAutresEcrans = true;
            ecran.afficherEcran(ChoixEcran.secondaire);
            ecran.ajouterContenuHtml('<p>rejoué</p>');
            ecran.recopierAutresEcrans = false;
            ecran.ajouterContenuHtml('<p>joué</p>');
            expect(ecran.ecranPrincipal).toBe('<div class="djn-rejeu-ecran djn-rejeu-secondaire"><div class="djn-rejeu-etiquette">écran secondaire</div><p>rejoué</p></div>');
            expect(ecran.ecranSecondaire).toBe('<p>rejoué</p><p>joué</p>');
        });

        it('[F154-T006] hors restauration : rien n’est recopié', () => {
            const ecran = new ContexteEcran('');
            ecran.afficherEcran(ChoixEcran.secondaire);
            ecran.ajouterContenuHtml('<p>secondaire</p>');
            ecran.afficherEcran(ChoixEcran.principal);
            expect(ecran.ecranPrincipal).toBe('');
        });
    });

    describe('Lecteur', () => {

        /** Scénario avec les trois écrans (temporaire + attente, secondaire, retour au principal). */
        const SCENARIO = `La salle est un lieu.
La balle est un objet dans la salle.
Le journal est un objet dans la salle.
Le carnet est un objet dans la salle.

action consulter le journal:
  afficher l'écran temporaire.
  dire "Journal de bord : rien à signaler.".
  attendre une touche.
  afficher l'écran précédent.
  dire "Vous refermez le journal.".
fin action

action feuilleter le carnet:
  afficher l'écran secondaire.
  dire "Carnet : une page griffonnée.".
fin action

action refermer le carnet:
  afficher l'écran principal.
  dire "Vous rangez le carnet.".
fin action
`;

        interface OptionsMontage {
            toursParPage?: number;
            tactile?: 'active' | 'desactive';
            sauvegarde?: Sauvegarde;
            /** Rejouer la sauvegarde en « triche auto » plutôt que la reprendre. */
            tricheAuto?: boolean;
            enregistrement?: FichierEnregistrement;
        }

        let fixture: ComponentFixture<LecteurComponent>;
        let lecteur: LecteurComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({ imports: [DonjonModule] }).compileComponents();
            vi.useFakeTimers();
        });

        afterEach(() => {
            if (lecteur) {
                (lecteur as any).enregistrementActif = false;
                (lecteur as any).enregistrementEnCours = null;
            }
            fixture?.destroy();
            vi.clearAllTimers();
            vi.useRealTimers();
            HorlogeUtils.terminerRejeu();
            HorlogeUtils.reinitialiser();
        });

        function monter(scenario: string, options: OptionsMontage = {}): void {
            fixture?.destroy();
            fixture = TestBed.createComponent(LecteurComponent);
            lecteur = fixture.componentInstance;
            const jeu = TestUtils["genererLeJeu"](scenario + actions, false);
            lecteur.jeu = jeu;
            lecteur.interfaceTactile = options.tactile ?? 'desactive';
            if (options.toursParPage) {
                lecteur.toursParPage = options.toursParPage;
            }
            vi.spyOn(lecteur as any, "definirIFID").mockImplementation(() => undefined);
            vi.spyOn(lecteur as any, "verifierChrono").mockImplementation(() => undefined);
            vi.spyOn(lecteur as any, "ajouterTexteAIgnorerAuxStatistiques").mockImplementation(() => undefined);
            vi.spyOn(lecteur as any, "verifierTamponErreurs").mockImplementation(() => undefined);
            if (options.sauvegarde) {
                jeu.sauvegarde = options.sauvegarde;
                if (options.tricheAuto) {
                    (lecteur as any).autoTricheEnAttente = true;
                } else {
                    lecteur.restaurerProchainJeu();
                }
            }
            if (options.enregistrement) {
                (lecteur as any).enregistrementEnCours = options.enregistrement;
                (lecteur as any).enregistrementEnAttente = true;
            }
            lecteur.ngOnChanges({});
            fixture.autoDetectChanges(true);
            attendre();
        }

        function attendre(ms = 1000): void {
            vi.advanceTimersByTime(ms);
            fixture.componentRef.injector.get(ChangeDetectorRef).detectChanges();
        }

        /** Exécuter une commande comme le joueur. */
        function executer(commande: string): void {
            lecteur.commande = commande;
            (lecteur as any).validationCommande();
            attendre();
        }

        /** Appuyer sur une touche (attendre une touche). */
        function toucher(): void {
            lecteur.onKeyDown({ key: ' ', preventDefault: () => undefined } as KeyboardEvent);
            attendre();
        }

        function racine(): HTMLElement {
            return fixture.nativeElement as HTMLElement;
        }

        /** Conteneur de l’écran affiché (les autres sont masqués ou absents). */
        function ecranVisible(): HTMLElement {
            const ecrans = Array.from(racine().querySelectorAll<HTMLElement>('#taResultat > .djn-ecran')).filter(x => !x.hidden);
            expect(ecrans.length, 'un seul écran visible').toBe(1);
            return ecrans[0];
        }

        /** Tours de l’écran principal présents dans le DOM. */
        function toursPrincipal(): HTMLElement[] {
            return Array.from(racine().querySelectorAll<HTMLElement>('#taResultat > .djn-ecran:first-child > .djn-tour'));
        }

        /** Remonter jusqu’au début : recharger toutes les pages de tours précédentes. */
        function chargerTout(): void {
            let garde = 1000;
            while (lecteur.nbBlocsMasques > 0 && garde--) {
                (lecteur as any).chargerToursPrecedents();
                attendre(50);
            }
            expect(lecteur.nbBlocsMasques).toBe(0);
        }

        /**
         * Le rendu par blocs doit être équivalent à l’ancien rendu (toute la sortie de l’écran
         * dans un seul innerHTML) : même texte et mêmes éléments, rien d’ajouté par le découpage
         * (ex. un `</p>` orphelin en début de bloc créerait un paragraphe vide).
         */
        function verifierRenduEquivalent(): void {
            chargerTout();
            const reference = document.createElement('div');
            reference.innerHTML = TestBed.inject(DomSanitizer).sanitize(SecurityContext.HTML, (lecteur as any).partie.ecran.ecran) ?? '';
            const visible = ecranVisible();
            const texte = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();
            expect(texte(visible)).toBe(texte(reference));
            for (const balise of ['p', 'br', 'span', 'a', 'i', 'b', 'img']) {
                expect(visible.querySelectorAll(balise).length, `nombre de <${balise}>`).toBe(reference.querySelectorAll(balise).length);
            }
            const paragraphesVides = (el: HTMLElement) => Array.from(el.querySelectorAll('p')).filter(p => !p.childNodes.length).length;
            expect(paragraphesVides(visible), 'paragraphes vides').toBe(paragraphesVides(reference));
        }

        /** Une partie variée : objets, trois écrans, attente d’une touche (se termine sur l’écran principal). */
        function jouerPartieVariee(nbTours: number): void {
            const cycle = ['regarder', 'prendre la balle', 'inventaire', 'poser la balle', 'examiner le journal',
                'feuilleter le carnet', 'regarder', 'refermer le carnet', 'consulter le journal'];
            for (let i = 0; i < nbTours; i++) {
                const commande = cycle[i % cycle.length];
                executer(commande);
                if (commande === 'consulter le journal') {
                    expect(lecteur.ecranAffiche, 'journal sur l’écran temporaire').toBe(ChoixEcran.temporaire);
                    toucher();
                    expect(lecteur.ecranAffiche, 'retour à l’écran précédent').toBe(ChoixEcran.principal);
                }
            }
            if (lecteur.ecranAffiche === ChoixEcran.secondaire) {
                executer('refermer le carnet');
            }
        }

        it('[F154-T010] un bloc par commande, les tours précédents ne sont pas re-rendus', () => {
            monter(SCENARIO);
            const nbAvant = toursPrincipal().length;
            executer('regarder');
            const premierTour = toursPrincipal()[toursPrincipal().length - 1];
            expect(premierTour.textContent).toContain('> regarder');
            executer('inventaire');
            expect(toursPrincipal().length).toBe(nbAvant + 2);
            // même nœud DOM : le tour précédent n’a pas été reconstruit
            expect(toursPrincipal()[toursPrincipal().length - 2]).toBe(premierTour);
            expect(toursPrincipal()[toursPrincipal().length - 1].textContent).toContain('> inventaire');
        });

        it('[F154-T011] seuls les derniers tours sont dans le DOM, les anciens se rechargent en remontant', () => {
            monter(SCENARIO, { toursParPage: 3 });
            for (let i = 0; i < 5; i++) {
                executer('regarder');
            }
            expect(toursPrincipal().length).toBe(3);
            const masques = lecteur.nbBlocsMasques;
            expect(masques).toBeGreaterThan(0);

            // le joueur remonte en haut de la sortie : une page de plus
            (lecteur as any).chargerToursPrecedents();
            attendre(50);
            expect(toursPrincipal().length).toBe(3 + Math.min(3, masques));
            expect(lecteur.nbBlocsMasques).toBe(Math.max(0, masques - 3));

            // une nouvelle commande ramène en bas : de nouveau une seule page dans le DOM
            executer('inventaire');
            expect(toursPrincipal().length).toBe(3);
            expect(toursPrincipal()[2].textContent).toContain('> inventaire');
        });

        it('[F154-T012] liens tactiles : cibles recalculées après la commande', () => {
            monter(`La salle est un lieu.
Le couloir est un lieu au nord de la salle.
La lampe est un objet dans le couloir.
`, { tactile: 'active' });
            executer('nord');
            const dernier = toursPrincipal()[toursPrincipal().length - 1];
            const lien = Array.from(dernier.querySelectorAll('a.djn-lien-tactile')).find(a => a.textContent === 'lampe');
            expect(lien, 'la lampe du nouveau lieu doit être cliquable').toBeTruthy();
        });

        it('[F154-T014] défilement : re-défiler en bas quand une image du dernier tour est chargée', () => {
            monter(`La salle est un lieu.
action contempler le tableau:
  afficher image tableau.png.
fin action
`);
            const sortie = racine().querySelector<HTMLElement>('#taResultat')!;
            let hauteur = 1000;
            Object.defineProperty(sortie, 'scrollHeight', { get: () => hauteur });

            const commander = () => {
                lecteur.commande = 'contempler le tableau';
                (lecteur as any).validationCommande();
                fixture.componentRef.injector.get(ChangeDetectorRef).detectChanges();
            };

            // 1er défilement, l’image n’a pas encore sa hauteur
            commander();
            const image = toursPrincipal()[toursPrincipal().length - 1].querySelector('img')!;
            expect(image, 'image dans le dernier tour').toBeTruthy();
            vi.advanceTimersByTime(100);
            expect(sortie.scrollTop).toBe(1000);
            // plus de second défilement à délai fixe
            hauteur = 1400;
            vi.advanceTimersByTime(1000);
            expect(sortie.scrollTop).toBe(1000);
            // l’image est chargée : on re-défile en bas
            image.dispatchEvent(new Event('load'));
            expect(sortie.scrollTop).toBe(1400);

            // le joueur a remonté pendant le chargement : on ne le ramène pas en bas
            hauteur = 2000;
            commander();
            const image2 = toursPrincipal()[toursPrincipal().length - 1].querySelector('img')!;
            vi.advanceTimersByTime(100);
            expect(sortie.scrollTop).toBe(2000);
            sortie.scrollTop = 500;
            hauteur = 2400;
            image2.dispatchEvent(new Event('load'));
            expect(sortie.scrollTop).toBe(500);
        });

        it('[F154-T013] taille de page par défaut', () => {
            monter(SCENARIO);
            expect(lecteur.toursParPage).toBe(TOURS_PAR_PAGE_PAR_DEFAUT);
        });

        it('[F154-T020] plusieurs écrans : le principal est conservé tel quel pendant les autres écrans', () => {
            monter(SCENARIO);
            executer('regarder');
            const tourAvant = toursPrincipal()[toursPrincipal().length - 1];

            // écran temporaire + attendre une touche
            executer('consulter le journal');
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.temporaire);
            expect(ecranVisible().textContent).toContain('rien à signaler');
            expect(ecranVisible().textContent).not.toContain('> regarder');
            expect(tourAvant.isConnected, 'écran principal gardé dans le DOM (masqué)').toBe(true);
            toucher();
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            expect(ecranVisible().textContent).toContain('Vous refermez le journal.');
            expect(ecranVisible().textContent).not.toContain('rien à signaler');
            expect(toursPrincipal()).toContain(tourAvant);

            // écran secondaire : les commandes s’y affichent tant qu’il est affiché
            executer('feuilleter le carnet');
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.secondaire);
            expect(ecranVisible().textContent).toContain('une page griffonnée.');
            executer('inventaire');
            expect(ecranVisible().textContent).toContain('> inventaire');
            verifierRenduEquivalent();
            executer('refermer le carnet');
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            expect(ecranVisible().textContent).toContain('Vous rangez le carnet.');
            expect(ecranVisible().textContent).not.toContain('> inventaire');
            expect(toursPrincipal()).toContain(tourAvant);
            verifierRenduEquivalent();

            // le contenu de l’écran secondaire est conservé
            executer('feuilleter le carnet');
            expect(ecranVisible().textContent).toContain('> inventaire');
        });

        it('[F154-T021] longue partie : DOM borné, tout l’historique rechargeable, rendu équivalent', () => {
            monter(SCENARIO, { toursParPage: 20 });
            jouerPartieVariee(250);
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            expect(toursPrincipal().length, 'une seule page dans le DOM').toBe(20);
            const ecran = (lecteur as any).partie.ecran;
            // (les commandes tapées pendant que le carnet est ouvert vont sur l’écran secondaire)
            expect(ecran.blocsPrincipal.length, 'tout l’historique en mémoire').toBeGreaterThan(180);
            expect(ecran.blocsSecondaire.length).toBeGreaterThan(40);

            // remonter jusqu’au début : l’intro et la première commande sont de retour, dans l’ordre
            verifierRenduEquivalent();
            const tours = toursPrincipal();
            expect(tours.length).toBe(ecran.blocsPrincipal.length);
            expect(tours[0].textContent).toContain('salle');
            expect(tours[1].textContent).toContain('> regarder');
            expect(tours[2].textContent).toContain('> prendre la balle');

            // nouvelle commande : retour à une seule page
            executer('regarder');
            expect(toursPrincipal().length).toBe(20);

            // effacer l’écran au milieu d’une longue partie
            executer('effacer l’écran');
            expect(ecran.blocsPrincipal.length).toBeLessThanOrEqual(2);
            expect(lecteur.nbBlocsMasques).toBe(0);
            executer('inventaire');
            expect(ecranVisible().textContent).toContain('> inventaire');
            verifierRenduEquivalent();
        }, 30_000);

        it('[F154-T022] sauvegarde puis reprise de la partie : historique et état restaurés', () => {
            monter(SCENARIO);
            jouerPartieVariee(60);
            executer('prendre la balle');
            const sauvegarde = JSON.parse(JSON.stringify((lecteur as any).partie.creerSauvegardePourFichier())) as Sauvegarde;

            monter(SCENARIO, { sauvegarde, toursParPage: 10 });
            expect(lecteur.interruptionEnCours, 'aucune attente pendante après la reprise').toBeFalsy();
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            expect(toursPrincipal().length, 'une seule page dans le DOM').toBe(10);
            expect(lecteur.nbBlocsMasques).toBeGreaterThan(0);

            executer('inventaire');
            expect(toursPrincipal()[toursPrincipal().length - 1].textContent, 'état restauré').toContain('balle');
            verifierRenduEquivalent();
        }, 30_000);

        it('[F154-T023] enregistrement (.rec) d’une partie avec écrans, rejoué au magnéto sans divergence', () => {
            monter(SCENARIO);
            jouerPartieVariee(40);
            const fichier = JSON.parse(JSON.stringify((lecteur as any).partie.creerFichierEnregistrement())) as FichierEnregistrement;
            expect(fichier.etapes.filter(e => e.type === 'c').length).toBe(40);

            monter(SCENARIO, { enregistrement: fichier, toursParPage: 5 });
            expect(lecteur.magnetoDivergenceIntro, 'intro identique').toBeFalsy();
            let garde = 500;
            while (lecteur.magnetoIdx < fichier.etapes.length && garde--) {
                lecteur.magnetoPasSuivant();
                attendre(50);
                expect(lecteur.magnetoDivergence, `aucune divergence (étape ${lecteur.magnetoIdx})`).toBeNull();
            }
            expect(lecteur.magnetoIdx).toBe(fichier.etapes.length);
            expect(toursPrincipal().length, 'une seule page dans le DOM').toBeLessThanOrEqual(5);
            verifierRenduEquivalent();
            // le magnéto n’est pas une restauration : pas de passages recopiés
            expect(racine().querySelector('.djn-rejeu-ecran')).toBeNull();
        }, 30_000);

        /** Partie avec les écrans secondaire et temporaire, terminée sur l’écran principal. */
        function sauvegardeAvecEcrans(): Sauvegarde {
            monter(SCENARIO);
            executer('regarder');
            executer('feuilleter le carnet');
            executer('refermer le carnet');
            executer('consulter le journal');
            toucher();
            return JSON.parse(JSON.stringify((lecteur as any).partie.creerSauvegardePourFichier())) as Sauvegarde;
        }

        it('[F154-T024] triche auto : les écrans secondaire et temporaire apparaissent sur le principal', () => {
            const sauvegarde = sauvegardeAvecEcrans();

            monter(SCENARIO, { sauvegarde, tricheAuto: true });
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            const secondaire = racine().querySelector('#taResultat > .djn-ecran:first-child .djn-rejeu-secondaire');
            expect(secondaire?.textContent, 'carnet recopié').toContain('une page griffonnée.');
            expect(secondaire?.querySelector('.djn-rejeu-etiquette')?.textContent).toBe('écran secondaire');
            const temporaire = racine().querySelector('#taResultat > .djn-ecran:first-child .djn-rejeu-temporaire');
            expect(temporaire?.textContent, 'journal recopié').toContain('rien à signaler.');
            // ordre chronologique : le carnet avant le journal, puis la suite du principal
            const texte = ecranVisible().textContent ?? '';
            expect(texte.indexOf('griffonnée')).toBeLessThan(texte.indexOf('rangez le carnet'));
            expect(texte.indexOf('rangez le carnet')).toBeLessThan(texte.indexOf('Journal de bord'));
            expect(texte.indexOf('Journal de bord')).toBeLessThan(texte.indexOf('refermez le journal'));

            // la partie reprise : plus de recopie
            const nbPassages = racine().querySelectorAll('.djn-rejeu-ecran').length;
            executer('feuilleter le carnet');
            executer('refermer le carnet');
            expect(racine().querySelectorAll('.djn-rejeu-ecran').length).toBe(nbPassages);
        });

        it('[F154-T026] « annuler » (rejeu de la partie) : pas de passages recopiés', () => {
            monter(SCENARIO);
            // comme le composant parent : recharger le jeu avec la sauvegarde émise
            lecteur.nouvellePartieOuAnnulerTour.subscribe((sauvegarde: Sauvegarde) => {
                const jeu = TestUtils["genererLeJeu"](SCENARIO + actions, false);
                jeu.sauvegarde = sauvegarde;
                lecteur.jeu = jeu;
                lecteur.ngOnChanges({});
            });
            executer('feuilleter le carnet');
            executer('refermer le carnet');
            executer('regarder');
            executer('annuler');
            expect(ecranVisible().textContent, 'partie rejouée').toContain('rangez le carnet');
            expect(racine().querySelector('.djn-rejeu-ecran')).toBeNull();
        });

        it('[F154-T025] triche auto qui se termine sur l’écran secondaire : écran secondaire affiché avec son contenu', () => {
            monter(SCENARIO);
            executer('feuilleter le carnet');
            const sauvegarde = JSON.parse(JSON.stringify((lecteur as any).partie.creerSauvegardePourFichier())) as Sauvegarde;

            monter(SCENARIO, { sauvegarde, tricheAuto: true });
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.secondaire);
            expect(ecranVisible().textContent).toContain('une page griffonnée.');
            executer('regarder');
            expect(ecranVisible().textContent, 'la suite reste sur l’écran secondaire').toContain('> regarder');
            executer('refermer le carnet');
            const passage = racine().querySelector('#taResultat > .djn-ecran:first-child .djn-rejeu-secondaire');
            expect(passage?.textContent).toContain('une page griffonnée.');
            expect(passage?.textContent, 'seule la partie rejouée est recopiée').not.toContain('> regarder');
        });

        it('[F154-T027] reprise d’une partie sauvegardée : pas de passages recopiés, seul l’écran actif est affiché', () => {
            const sauvegarde = sauvegardeAvecEcrans();

            monter(SCENARIO, { sauvegarde });
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.principal);
            expect(racine().querySelector('.djn-rejeu-ecran')).toBeNull();
            const texte = ecranVisible().textContent ?? '';
            expect(texte).toContain('rangez le carnet');
            expect(texte, 'écran secondaire non visible').not.toContain('griffonnée');
            expect(texte, 'écran temporaire non visible').not.toContain('rien à signaler');
        });

        it('[F154-T028] reprise d’une partie sauvegardée sur l’écran secondaire : seul l’écran secondaire est affiché', () => {
            monter(SCENARIO);
            executer('regarder');
            executer('feuilleter le carnet');
            const sauvegarde = JSON.parse(JSON.stringify((lecteur as any).partie.creerSauvegardePourFichier())) as Sauvegarde;

            monter(SCENARIO, { sauvegarde });
            expect(lecteur.ecranAffiche).toBe(ChoixEcran.secondaire);
            expect(ecranVisible().textContent).toContain('une page griffonnée.');
            expect(racine().querySelector('.djn-rejeu-ecran')).toBeNull();
            executer('refermer le carnet');
            expect(ecranVisible().textContent, 'retour au principal sans passage recopié').not.toContain('griffonnée');
        });
    });

});
