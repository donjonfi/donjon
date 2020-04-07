import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Compilateur } from '../utils/compilateur';
import { Generateur } from '../utils/generateur';
import { HttpClient } from '@angular/common/http';
import { Jeu } from '../models/jeu/jeu';
import { StringUtils } from '../utils/string.utils';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-jouer',
  templateUrl: './jouer.component.html',
  styleUrls: ['./jouer.component.scss']
})
export class JouerComponent implements OnInit {

  chargement = false;
  compilation = false;
  codeSource: string;
  erreurs: string[] = null;
  jeu: Jeu = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,

  ) { }

  ngOnInit(): void {
    const sub = this.route.params.subscribe(params => {
      const fichier = params['fichier'];
      if (fichier) {
        this.onChargerExemple(fichier);
      }
    });
  }

  onChargerExemple(nomExemple: string) {
    this.chargement = true;
    const nomFichierExemple = StringUtils.nameToSafeFileName(nomExemple, ".djn");
    if (nomFichierExemple) {
      this.http.get('assets/exemples/' + nomFichierExemple, { responseType: 'text' })
        .subscribe(
          codeSource => {
            this.chargement = false;
            this.compilation = true;
            this.codeSource = codeSource;
            if (this.codeSource.trim() != '') {
              // interpréter le code
              const resultat = Compilateur.parseCode(this.codeSource);
              // générer le jeu
              this.jeu = Generateur.genererJeu(resultat.monde, resultat.regles);
            } else {
              this.erreurs = ["Pas de code source dans le fichier."];
            }
            this.compilation = false;
          }, erreur => {
            this.chargement = false;
            this.erreurs = ["Le code source n’a pas pu être téléchargé."];
          });
    } else {
      this.erreurs = ["Pas de nom de fichier à charger."];
    }
  }

}
