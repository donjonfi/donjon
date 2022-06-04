import * as FileSaver from 'file-saver';

import { Compilateur, Generateur, Jeu, LecteurComponent, Sauvegarde, StringUtils, version, versionNum } from '@donjon/core';
import { Component, OnInit, ViewChild } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-jouer',
  templateUrl: './jouer.component.html',
  styleUrls: ['./jouer.component.scss']
})
export class JouerComponent implements OnInit {

  chargement = false;
  compilation = false;
  scenario: string | undefined;
  erreurs: string[] | undefined;
  jeu: Jeu | undefined;

  private lecteurRef: LecteurComponent;
  @ViewChild('lecteur', { static: false }) set content(content: LecteurComponent) {
    if (content) { // initially setter gets called with undefined
      this.lecteurRef = content;
    }
  }

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {

    if (environment.chargementAutoJeu) {
      //essayer de charcher jeu.djn
      this.onChargerFichierSiteWeb("jeu");
    } else {
      const sub = this.route.params.subscribe(params => {
        const fichier = params['fichier'];
        if (fichier) {
          this.onChargerFichierSiteWeb(fichier);
        } else {
          // aucun jeu pré-chargé
        }
      });
    }
  }

  get afficherBanniere(): boolean {
    return environment.banniere;
  }

  /** Charger un fichier depuis le site */
  onChargerFichierSiteWeb(nomJeu: string) {
    this.chargement = true;
    const nomFichierJeu = StringUtils.nomDeFichierSecuriseExtensionForcee(nomJeu, "djn");
    if (nomFichierJeu) {
      this.http.get('assets/jeux/' + nomFichierJeu, { responseType: 'text' })
        .subscribe({
          next: scenario => {
            this.chargement = false;
            // this.scenario = scenario;
            // // enlever les commentaires afin de réduire un peu la taille du fichier
            // this.scenario = Compilateur.nettoyerCodeSource(this.scenario);
            this.analyserContenuFichierJeu(scenario);
          },
          error: erreur => {
            this.chargement = false;
            this.erreurs = ["Le fichier du jeu n’a pas pu être téléchargé."];
          }
        });
    } else {
      this.erreurs = ["Pas de nom de fichier à charger."];
    }
  }

  /** Charger un fichier depuis l'ordinateur de l'utilisateur. */
  onChargerFichierLocal(et: EventTarget | null) {

    const hie = et as HTMLInputElement;

    if (hie?.files?.length) {

      // fichier choisi par l’utilisateur
      const file = hie.files[0];
      this.erreurs = [];
      if (file) {
        this.chargement = true;
        let fileReader = new FileReader();
        // quand lu, l’attribuer au code source
        fileReader.onloadend = (progressEvent) => {
          this.chargement = false;
          this.analyserContenuFichierJeu(fileReader.result as string);
        };
        // lire le fichier
        fileReader.readAsText(file);
      }
    }
  }


  private analyserContenuFichierJeu(contenuFichier: string) {

    this.compilation = true;
    this.erreurs = [];
    if (contenuFichier.trim() !== '') {

      // sauvegarde => scénario + commandes + graine
      if (contenuFichier.startsWith('{"type":"sauvegarde"')) {
        var sauvegarde = JSON.parse(contenuFichier) as Sauvegarde;

        // enlever les commentaires afin de réduire un peu la taille du fichier
        this.scenario = Compilateur.nettoyerCodeSource(sauvegarde.scenario);

        // Analyser le scénario et générer le jeu
        Compilateur.analyserScenario(this.scenario, false, this.http).then(
          resultatCompilation => {
            // générer le jeu
            let jeu = Generateur.genererJeu(resultatCompilation);
            // informer si sauvegarde faite avec version plus récente de Donjon FI.
            if (sauvegarde.version > versionNum) {
              jeu.tamponErreurs.push("Cette sauvegarde a été effectuée avec une version plus récente de Donjon FI.");
            }
            // rétablir la graine pour le générateur aléatoire
            jeu.graine = sauvegarde.graine;
            // exécuter les commandes de la sauvegarde
            jeu.sauvegarde = sauvegarde.commandes;
            // lancer le jeu
            this.jeu = jeu;
          }
        );

        // scénario seul
      } else {

        // enlever les commentaires afin de réduire un peu la taille du fichier
        this.scenario = Compilateur.nettoyerCodeSource(contenuFichier);

        // Analyser le scénario et générer le jeu
        Compilateur.analyserScenario(this.scenario, false, this.http).then(
          resComp => {
            // générer le jeu
            this.jeu = Generateur.genererJeu(resComp);
          }
        );
      }
    } else {
      this.erreurs = ["Pas de code source dans le fichier."];
    }
    this.compilation = false;
  }

  onSauvegarderJeu(): void {

    let sauvegarde = new Sauvegarde();
    // version
    sauvegarde.version = versionNum;
    // graine pour le générateur de nombres aléatoires
    sauvegarde.graine = this.jeu.graine;
    // commandes du joueur
    sauvegarde.commandes = this.lecteurRef.getHistoriqueCommandesPartie();
    // scénario
    sauvegarde.scenario = this.scenario;

    const contenuJson = JSON.stringify(sauvegarde);

    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([contenuJson], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : "partie") + ".sav"), { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  /**
   * Générer une nouvelle partie à partir du même scénario que précédemment.
   */
  onNouvellePartie() {
    // Analyser le scénario et générer le jeu
    Compilateur.analyserScenario(this.scenario, false, this.http).then(
      resComp => {
        // générer le jeu
        this.jeu = Generateur.genererJeu(resComp);
      }
    );
  }

  get version() {
    return version;
  }


}
