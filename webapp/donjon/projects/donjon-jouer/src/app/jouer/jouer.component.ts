import * as FileSaver from 'file-saver';

import { Compilateur, Generateur, Jeu, ListeEtats, StringUtils, version } from '@donjon/core';
import { Component, OnInit } from '@angular/core';

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
  codeSource: string | undefined;
  erreurs: string[] | undefined;
  jeu: Jeu | undefined;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {

    if (environment.chargementAutoJeu) {
      //essayer de charcher jeu.djn
      this.onChargerExemple("jeu");
    } else {
      const sub = this.route.params.subscribe(params => {
        const fichier = params['fichier'];
        if (fichier) {
          this.onChargerExemple(fichier);
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
  onChargerExemple(nomExemple: string) {
    this.chargement = true;
    const nomFichierExemple = StringUtils.nomDeFichierSecuriseExtensionForcee(nomExemple, "djn");
    if (nomFichierExemple) {
      this.http.get('assets/jeux/' + nomFichierExemple, { responseType: 'text' })
        .subscribe({
          next: scenario => {
            this.chargement = false;
            this.chargerJeu(scenario);
          },
          error: erreur => {
            this.chargement = false;
            this.erreurs = ["Le code source n’a pas pu être téléchargé."];
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
          this.chargerJeu(fileReader.result as string);
        };
        // lire le fichier
        fileReader.readAsText(file);
      }
    }
  }


  private chargerJeu(scenario: string) {

    this.compilation = true;
    this.erreurs = [];
    if (scenario.trim() !== '') {

      if (scenario.startsWith('{"sauvegarde":{')) {

        let jeuCharge: Jeu = Object.assign((new Jeu()), JSON.parse(scenario).sauvegarde);

        jeuCharge.etats = Object.assign((new ListeEtats()), jeuCharge.etats);

        this.jeu = jeuCharge;


      } else {
        // Analyser le scénario et générer le jeu
        Compilateur.analyserScenario(scenario, false, this.http).then(
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
    // sauver le code dans un fichier de l'utilisateur

    const sauvegarde = JSON.stringify({ sauvegarde: this.jeu });

    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([sauvegarde], (StringUtils.normaliserMot(this.jeu.titre ? this.jeu.titre : "partie") + ".sav"), { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  get version(){
    return version;
  }


}
