import { ClassesRacines, EClasseRacine, ELocalisation, ElementsJeuUtils, Genre, Jeu, Lieu, Nombre, Objet, PhraseUtils, PositionObjet, PrepositionSpatiale, Voisin } from "../../public-api";

import { InstructionDeplacerCopier } from "../utils/jeu/instruction-deplacer-copier";

describe('Instructions − Lieux', () => {

  interface ThisContext {
    jeu: Jeu;
    eju: ElementsJeuUtils;
    insDeplacerCopier: InstructionDeplacerCopier;
    joueur: Objet;
    cuisine: Lieu;
    sdb: Lieu;
    chambre: Lieu;
  }

  beforeEach(function (this: ThisContext) {

    this.jeu = new Jeu();
    this.eju = new ElementsJeuUtils(this.jeu, false);
    this.insDeplacerCopier = new InstructionDeplacerCopier(this.jeu, this.eju, false);

    // définir le joueur
    this.joueur = new Objet(
      1,
      "joueur",
      PhraseUtils.getGroupeNominalDefini("Le joueur", false),
      ClassesRacines.Special,
      1,
      Genre.m,
      Nombre.s
    );
    this.jeu.joueur = this.joueur;

    // définition des lieux
    this.cuisine = new Lieu(
      2, // id
      'cuisine', // nom
      PhraseUtils.getGroupeNominalDefini("La cuisine", false), // intitule
      "Cuisine", // titre
      ClassesRacines.Lieu
    );
    this.sdb = new Lieu(
      3, // id
      'salle de bain', // nom
      PhraseUtils.getGroupeNominalDefini("La salle de bain", false), // intitule
      "Salle de bain", // titre
      ClassesRacines.Lieu
    );
    this.chambre = new Lieu(
      4, // id
      'chambre', // nom
      PhraseUtils.getGroupeNominalDefini("La chambre à coucher", false), // intitule
      "Chambre", // titre
      ClassesRacines.Lieu
    );
    // ajouter les lieux au jeu
    this.jeu.lieux.push(this.cuisine);
    this.jeu.lieux.push(this.sdb);
    this.jeu.lieux.push(this.chambre);
    // La salle de bain est au nord de la cuisine
    this.cuisine.voisins.push(new Voisin(
      this.sdb.id, this.sdb.classe.nom, ELocalisation.nord
    ));
    // La cuisine est au sud de la salle de bain.
    this.sdb.voisins.push(new Voisin(
      this.cuisine.id, this.cuisine.classe.nom, ELocalisation.sud
    ));
    // La chambre est au sud de la salle de bain
    this.sdb.voisins.push(new Voisin(
      this.chambre.id, this.chambre.classe.nom, ELocalisation.sud
    ));
    // La salle de bain est au nord de la chambre
    this.chambre.voisins.push(new Voisin(
      this.sdb.id, this.sdb.classe.nom, ELocalisation.nord
    ));
    // positionner le joueur dans la cuisine
    this.jeu.joueur.position = new PositionObjet(
      PrepositionSpatiale.dans,
      EClasseRacine.lieu,
      this.cuisine.id
    );
    this.eju.majPresenceDesObjets();
    this.eju.majAdjacenceLieux();
  });



  it('vérifier accessibilité lieux', function (this: ThisContext) {

    // vérifier que les lieux sont accessibles
    // cuisine est accessible (le joueur est dedans)
    expect(this.eju.estLieuAccessible(this.cuisine)).toBeTrue();
    // sdb est accessible (à coté de la cuisine)
    expect(this.eju.estLieuAccessible(this.sdb)).toBeTrue();
    // chambre n'est pas accessible (trop loin de la cuisine)
    expect(this.eju.estLieuAccessible(this.chambre)).toBeFalse();
  });

  it('vérifier getLieuxVoisinsVisibles()', function (this: ThisContext) {

    // cuisine à coté de sdb
    let resultats = this.eju.getLieuxVoisinsVisibles(this.cuisine);
    expect(resultats.length).toBe(1);
    expect(resultats[0].id).toBe(this.sdb.id);

    // sdb à coté de cuisine et chambre
    resultats = this.eju.getLieuxVoisinsVisibles(this.sdb);
    expect(resultats.length).toBe(2);
    expect(resultats.some(x => x.id == this.cuisine.id)).toBeTrue();
    expect(resultats.some(x => x.id == this.chambre.id)).toBeTrue();
    expect(resultats.some(x => x.id == this.sdb.id)).toBeFalse();
  });

  it('vérifier trouverLieu', function (this: ThisContext) {
    // trouver la cuisine
    let resultats = this.eju.trouverLieuSurIntituleAvecScore(this.cuisine.intitule, false);
    expect(resultats[1].length).toBe(1);
    expect(resultats[1][0]).toBe(this.cuisine);
    // trouver la salle de bain
    resultats = this.eju.trouverLieuSurIntituleAvecScore(this.sdb.intitule, false);
    expect(resultats[1].length).toBe(1);
    expect(resultats[1][0]).toBe(this.sdb);
    // trouver la chambre à coucher
    resultats = this.eju.trouverLieuSurIntituleAvecScore(this.chambre.intitule, false);
    expect(resultats[1].length).toBe(1);
    expect(resultats[1][0]).toBe(this.chambre);
  });

  it('vérifier getLieuObjet(joueur)', function (this: ThisContext) {
    let lieuId = this.eju.getLieuObjet(this.joueur);
    expect(lieuId).toEqual(this.cuisine.id);
  });

  it('vérifier exectuterDeplacerObjetVersDestination(joueur)', function (this: ThisContext) {

    // le joueur est dans la cuisine
    let lieuId = this.eju.getLieuObjet(this.joueur);
    expect(lieuId).toEqual(this.cuisine.id);

    let resultat = this.insDeplacerCopier.executerDeplacerObjetVersDestination(this.joueur, "dans", this.chambre, 1);
    expect(resultat.succes).toEqual(true);

    // le joueur est à présent dans la chambre
    lieuId = this.eju.getLieuObjet(this.joueur);
    expect(lieuId).toEqual(this.chambre.id);
  });

});