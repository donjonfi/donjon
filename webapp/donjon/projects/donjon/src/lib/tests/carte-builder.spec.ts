import { CarteBuilder } from "../utils/jeu/carte-builder";
import { EClasseRacine } from "../models/commun/constantes";
import { ELocalisation } from "../models/jeu/localisation";
import { TestUtils } from "../utils/test-utils";

describe('CarteBuilder', () => {

  it('[F060-T001] place les lieux selon les directions cardinales', () => {
    const scenario = `
Le carrefour est un lieu.
La clairière est un lieu au nord du carrefour.
Le village est un lieu au sud du carrefour.
La grotte est un lieu à l'est du carrefour.
La ferme est un lieu à l'ouest du carrefour.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    expect(carte.noeuds.length).toBe(5);

    const noeud = (nom: string) => carte.noeuds.find(n => n.lieu.nom === nom);
    const carrefour = noeud('carrefour')!;
    const clairiere = noeud('clairiere')!;
    const village = noeud('village')!;
    const grotte = noeud('grotte')!;
    const ferme = noeud('ferme')!;

    // le lieu de départ (carrefour) est à l'origine
    expect(carrefour.x).toBe(0);
    expect(carrefour.y).toBe(0);
    // nord = y-1, sud = y+1, est = x+1, ouest = x-1
    expect(clairiere.x).toBe(0); expect(clairiere.y).toBe(-1);
    expect(village.x).toBe(0); expect(village.y).toBe(1);
    expect(grotte.x).toBe(1); expect(grotte.y).toBe(0);
    expect(ferme.x).toBe(-1); expect(ferme.y).toBe(0);
  });

  it('[F060-T002] collecte les objets et PNJ par lieu et exclut les barrières', () => {
    const scenario = `
Le carrefour est un lieu.
La clairière est un lieu au nord du carrefour.

La pomme est un objet dans le carrefour.
Le marchand est une personne dans le carrefour.

Le grand rocher est un obstacle au nord du carrefour.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const carrefour = carte.noeuds.find(n => n.lieu.nom === 'carrefour')!;
    expect(carrefour.objets.map(o => o.nom)).toEqual(['pomme']);
    expect(carrefour.personnes.map(o => o.nom)).toEqual(['marchand']);
    // l'obstacle n'apparaît pas comme objet du lieu
    expect(carrefour.objets.find(o => o.nom === 'grand rocher' || o.nom === 'grandrocher')).toBeUndefined();
  });

  it('[F060-T003] annote les arêtes traversant une porte ou un obstacle', () => {
    const scenario = `
Le carrefour est un lieu.
La clairière est un lieu au nord du carrefour.
La grotte est un lieu à l'est du carrefour.

Le grand rocher est un obstacle au nord du carrefour.
La porte rouge est une porte fermée à l'est du carrefour.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const findArete = (loc: ELocalisation) =>
      carte.aretes.find(a => a.sourceId === jeu.lieux.find(l => l.nom === 'carrefour')!.id
        && a.localisation === loc);

    const areteNord = findArete(ELocalisation.nord);
    const areteEst = findArete(ELocalisation.est);

    expect(areteNord?.via?.type).toBe('obstacle');
    expect(areteEst?.via?.type).toBe('porte');
  });

  it('[F060-T004] vue d\'ensemble cardinale : les sorties haut/bas vers d\'autres lieux restent orphelines', () => {
    const scenario = `
La cave est un lieu.
Le jardin est un lieu au nord de la cave.
Le rez est un lieu en haut de la cave.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    // cave a au moins une voisine cardinale (jardin) → mode vue d'ensemble auto
    expect(carte.noeuds.length).toBe(2);
    const cave = carte.noeuds.find(n => n.lieu.nom === 'cave')!;
    expect(cave.sortiesSpeciales.length).toBe(1);
    expect(cave.sortiesSpeciales[0].localisation).toBe(ELocalisation.haut);
    expect(cave.sortiesSpeciales[0].cibleType).toBe('lieu');

    // le rez reste orphelin (uniquement accessible via sortie spéciale)
    const rez = jeu.lieux.find(l => l.nom === 'rez')!;
    expect(carte.lieuxOrphelinsIds.has(rez.id)).toBe(true);
    expect(carte.detailsParLieu.has(rez.id)).toBe(true);
  });

  it('[F060-T005] ne dédoublonne pas les arêtes (aller/retour comptent pour une seule)', () => {
    const scenario = `
Le carrefour est un lieu.
La clairière est un lieu au nord du carrefour.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    // L'analyseur ajoute automatiquement la sortie inverse (sud) du voisin.
    // On vérifie qu'une seule arête est conservée pour la paire.
    expect(carte.aretes.length).toBe(1);
  });

  it('[F060-T006] marque joueurPresent sur le lieu du joueur', () => {
    const scenario = `
Le hall est un lieu.
Le salon est un lieu à l'est du hall.

Le joueur est dans le salon.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const hall = carte.noeuds.find(n => n.lieu.nom === 'hall')!;
    const salon = carte.noeuds.find(n => n.lieu.nom === 'salon')!;
    expect(hall.joueurPresent).toBe(false);
    expect(salon.joueurPresent).toBe(true);
  });

  it('[F060-T008] zoom : construire avec racineId place le lieu cible à l\'origine', () => {
    const scenario = `
La maison est un lieu.
Le grenier est un lieu en haut de la maison.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const grenier = jeu.lieux.find(l => l.nom === 'grenier')!;
    const carte = CarteBuilder.construire(jeu, grenier.id);

    // le grenier est désormais racine de la sous-carte → placé à (0,0)
    const grenierNoeud = carte.noeuds.find(n => n.lieu.nom === 'grenier');
    expect(grenierNoeud).toBeDefined();
    expect(grenierNoeud!.x).toBe(0);
    expect(grenierNoeud!.y).toBe(0);
  });

  it('[F060-T010] zoom : un voisin cardinal n\'expose PAS ses intérieurs (isolation latérale)', () => {
    // Le user clique sur le bois ; le BFS atteint la place (cardinal sud-ouest),
    // puis l'auberge (cardinal nord de la place). L'auberge a un intérieur (salle)
    // mais comme elle a été atteinte via cardinal, on ne le déplie pas.
    const scenario = `
La place est un lieu.
L'auberge est un lieu au nord de la place.
La salle est un lieu à l'intérieur de l'auberge.
Le bois est un lieu au nord-est de la place.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const bois = jeu.lieux.find(l => l.nom === 'bois')!;
    const salle = jeu.lieux.find(l => l.nom === 'salle')!;
    expect(salle).toBeDefined();
    const carte = CarteBuilder.construire(jeu, bois.id);

    const noms = carte.noeuds.map(n => n.lieu.nom);
    expect(noms).toContain('bois');
    expect(noms).toContain('place');
    expect(noms).toContain('auberge');
    // la salle NE doit PAS apparaître (intérieur d'un voisin cardinal de la racine)
    expect(noms).not.toContain('salle');
    expect(carte.lieuxOrphelinsIds.has(salle.id)).toBe(true);
  });

  it('[F060-T009] mode auto : lieu de départ sans voisin cardinal → BFS étendu sur haut/bas/intérieur/extérieur', () => {
    // Bâtiment vertical pur : aucune sortie cardinale. Centre sur le rez (lieu du joueur).
    const scenario = `
La cave est un lieu.
Le rez est un lieu en haut de la cave.
Le grenier est un lieu en haut du rez.

Le joueur est dans le rez.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    // mode zoom auto activé : tous les étages placés et reliés verticalement
    expect(carte.noeuds.length).toBe(3);
    expect(carte.lieuxOrphelinsIds.size).toBe(0);
    const rezNoeud = carte.noeuds.find(n => n.lieu.nom === 'rez')!;
    const grenierNoeud = carte.noeuds.find(n => n.lieu.nom === 'grenier')!;
    const caveNoeud = carte.noeuds.find(n => n.lieu.nom === 'cave')!;
    expect(rezNoeud.y).toBe(0);
    expect(grenierNoeud.y).toBe(-1); // haut
    expect(caveNoeud.y).toBe(1);     // bas
    expect(carte.aretes.length).toBe(2);
  });

  it('[F060-T011] zoom sur la forge : son intérieur (arrière-boutique) est déplié', () => {
    // Reproduction d'un bug rapporté : depuis la vue d'ensemble (joueur sur la place),
    // cliquer sur la forge doit zoomer dessus ET afficher l'arrière-boutique (intérieur).
    const scenario = `
La place du village est un lieu.
L'auberge est un lieu au nord de la place du village.
La forge est un lieu à l'est de la place du village.
L'arriere boutique est un lieu à l'intérieur de la forge.

Le joueur est sur la place du village.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const forge = jeu.lieux.find(l => l.nom === 'forge')!;
    const arriere = jeu.lieux.find(l => l.nom === 'arriereboutique' || l.nom === 'arriere boutique')!;
    expect(forge).toBeDefined();
    expect(arriere).toBeDefined();

    const carte = CarteBuilder.construire(jeu, forge.id);

    const noms = carte.noeuds.map(n => n.lieu.nom);
    expect(noms).toContain('forge');
    expect(noms).toContain('place du village');
    // l'arrière-boutique DOIT apparaître sur la sous-carte
    expect(noms).toContain(arriere.nom);
    expect(carte.lieuxOrphelinsIds.has(arriere.id)).toBe(false);
  });

  it('[F060-T015] DIAGNOSTIC : avec genererEtCommencerLeJeu (initialisations live), clic forge déplie arrière-boutique', () => {
    const scenario = `
La place du village est un lieu.
La forge est un lieu à l'est de la place du village.
L'arrière-boutique de la forge est un lieu à l'intérieur de la forge.

Le marteau est un objet dans la forge.
L'épée longue (f) est un objet dans l'arrière-boutique de la forge.

Le joueur est sur la place du village.
`;
    const ctx = TestUtils.genererEtCommencerLeJeu(scenario);
    const jeu = ctx.jeu;
    const forge = jeu.lieux.find(l => l.nom === 'forge')!;
    const carte = CarteBuilder.construire(jeu, forge.id);
    const noms = carte.noeuds.map(n => n.lieu.nom);
    const dump = forge.voisins.map(v => `${v.localisation}:${v.type}#${v.id}`).join(', ');
    expect(noms).withContext('forge voisins=[' + dump + '] noeuds=[' + noms.join(', ') + ']').toContain('arriere-boutique de la forge');
  });

  it('[F060-T016] HYPOTHÈSE : si le joueur est dans la forge, vue d\'ensemble centre sur forge — clic sur forge ne déclenche PAS de zoom (déjà racine)', () => {
    // Reproduction d'un cas live : le user a joué, le joueur est dans la forge,
    // il revient sur la carte → vue d'ensemble centrée sur forge. La forge a un voisin
    // cardinal (ouest=place), donc modeZoom=false → arrière-boutique reste dans la boîte forge.
    // Clic sur forge depuis cette vue : id === lieuJoueurId → pile reste vide → rien ne change.
    const scenario = `
La place du village est un lieu.
La forge est un lieu à l'est de la place du village.
L'arriere boutique est un lieu à l'intérieur de la forge.

Le joueur est dans la forge.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const forge = jeu.lieux.find(l => l.nom === 'forge')!;

    // Vue d'ensemble (sans racineId) : joueur est dans forge, forge a un cardinal → modeZoom=false
    const carteEnsemble = CarteBuilder.construire(jeu);
    const nomsE = carteEnsemble.noeuds.map(n => n.lieu.nom);
    expect(nomsE).toContain('forge');
    expect(nomsE).toContain('place du village');
    // arrière-boutique NON placée → ce qui explique pourquoi le user voit la sortie dans la boîte forge
    expect(nomsE).not.toContain('arriere boutique');

    // Si maintenant on force le zoom sur forge → arrière-boutique apparaît
    const carteZoom = CarteBuilder.construire(jeu, forge.id);
    const nomsZ = carteZoom.noeuds.map(n => n.lieu.nom);
    expect(nomsZ).toContain('arriere boutique');
  });

  it('[F060-T014] DIAGNOSTIC : scénario 05-village-complet exact — clic forge déplie arrière-boutique', () => {
    // Reproduction littérale du scénario livré dans ressources/scenarios/tests/map/05-village-complet.djn
    const scenario = `-- Scénario de test pour la carte du scénario.
Le titre du jeu est "Carte — village complet".
La version du jeu est "1.0".

La place du village est un lieu.
Sa description est "Une place pavée avec une fontaine au centre.".

La fontaine est un décor fixé sur la place du village.
Sa description est "Une fontaine de pierre, l'eau y coule clair.".

L'auberge est un lieu au nord de la place du village.
Sa description est "L'auberge du Cheval Boiteux, l'enseigne grince au vent.".

La forge est un lieu à l'est de la place du village.
Sa description est "La forge du village, on entend le marteau frapper.".

La chapelle est un lieu au sud de la place du village.

La place du marché est un lieu à l'ouest de la place du village.

Le moulin est un lieu à l'ouest de la place du marché.

Le verger est un lieu à l'ouest du moulin.

Le bois sombre est un lieu au nord-est de la place du village.

La crypte est un lieu en bas de la chapelle.

La salle commune est un lieu à l'intérieur de l'auberge.

L'arrière-boutique de la forge est un lieu à l'intérieur de la forge.

La grosse pierre est un obstacle au nord-est de la place du village.

La porte de la chapelle est une porte fermée au sud de la place du village.
Elle est verrouillée et ouvrable.

La porte de la crypte est une porte fermée en bas de la chapelle.
Elle est verrouillée et ouvrable.

L'aubergiste (m) est une personne dans la salle commune.

Le forgeron est une personne dans la forge.

Le prêtre est une personne dans la chapelle.

La marchande est une personne sur la place du marché.

Le meunier est une personne dans le moulin.

Le chien (m) est un animal sur la place du village.

Le chat noir est un animal dans la salle commune.

Le hibou est un animal dans le bois sombre.

La chope (f) est un objet dans la salle commune.

Le tabouret est un support dans la salle commune.

L'épée longue (f) est un objet dans l'arrière-boutique de la forge.

Le marteau est un objet dans la forge.

Le calice (m) est un objet dans la chapelle.

L'amulette (f) est un bijou portable dans la crypte.

Les pommes (f) sont des objets dans le verger.

Le sac de farine est un contenant dans le moulin.
Il est fermé.

Le joueur est sur la place du village.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const forge = jeu.lieux.find(l => l.nom === 'forge');
    expect(forge).withContext('forge présente').toBeDefined();

    // Inspecter tous les voisins de la forge (sortie attendue : ouest=place, intérieur=arrière-boutique)
    const dump = (forge!.voisins ?? []).map(v => `${v.localisation}:${v.type}#${v.id}`).join(', ');
    const forgInt = forge!.voisins.find(v => v.localisation === ELocalisation.interieur && v.type === EClasseRacine.lieu);
    expect(forgInt).withContext('forge voisins = [' + dump + ']').toBeDefined();

    // Cibler le lieu derrière l'intérieur : doit exister (l'arrière-boutique)
    const arriereBoutique = forgInt ? jeu.lieux.find(l => l.id === forgInt.id) : undefined;
    expect(arriereBoutique).withContext('lieu arrière-boutique existe').toBeDefined();

    // Zoom sur la forge -> arrière-boutique placée comme nœud (pas seulement listée dans la boîte forge)
    const carte = CarteBuilder.construire(jeu, forge!.id);
    const nomsCarte = carte.noeuds.map(n => n.lieu.nom);
    expect(nomsCarte).withContext('zoom forge — noms placés : [' + nomsCarte.join(', ') + ']').toContain(arriereBoutique!.nom);
  });

  it('[F060-T013] DIAGNOSTIC : voisins de la forge dans le scénario complet (clic forge live)', () => {
    // Scénario quasi identique à 05-village-complet.djn pour traquer la divergence avec la prod.
    const scenario = `
La place du village est un lieu.
L'auberge est un lieu au nord de la place du village.
La forge est un lieu à l'est de la place du village.

La salle commune est un lieu à l'intérieur de l'auberge.
L'arrière-boutique de la forge est un lieu à l'intérieur de la forge.

Le forgeron est une personne dans la forge.
Le marteau est un objet dans la forge.

Le joueur est sur la place du village.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const forge = jeu.lieux.find(l => l.nom === 'forge');
    const auberge = jeu.lieux.find(l => l.nom === 'auberge');
    expect(forge).toBeDefined();
    expect(auberge).toBeDefined();

    // sanity : noms des lieux compilés
    const noms = jeu.lieux.map(l => l.nom);
    // (utilisé pour diagnostic en cas d'échec)
    expect(noms.length).toBeGreaterThan(0);

    // l'auberge a bien un voisin intérieur (référence)
    const auberInt = auberge!.voisins.find(v => v.localisation === ELocalisation.interieur && v.type === EClasseRacine.lieu);
    expect(auberInt).withContext('auberge → voisin intérieur lieu').toBeDefined();

    // la forge a-t-elle un voisin intérieur de type lieu pointant sur arrière-boutique ?
    const forgInt = forge!.voisins.find(v => v.localisation === ELocalisation.interieur && v.type === EClasseRacine.lieu);
    expect(forgInt).withContext('forge → voisin intérieur lieu (devrait pointer sur arrière-boutique)').toBeDefined();

    // zoom sur la forge : l'arrière-boutique doit devenir un nœud placé
    const carte = CarteBuilder.construire(jeu, forge!.id);
    const nomsCarte = carte.noeuds.map(n => n.lieu.nom);
    expect(nomsCarte).withContext('forge zoom : noms placés').toContain('forge');
    expect(nomsCarte).withContext('forge zoom : arrière-boutique doit être placée').toContain(forgInt?.id != null ? jeu.lieux.find(l => l.id === forgInt!.id)!.nom : '?');
  });

  it('[F060-T012] nom composé avec tiret et complément (« arrière-boutique de la forge ») reste un voisin intérieur', () => {
    // Le scénario 05-village-complet utilise ce nom littéral. Si l'analyseur le coupe ailleurs
    // ou ne lie pas la sortie « intérieur » correctement, le zoom sur la forge n'affichera pas
    // l'arrière-boutique. Ce test garde la garantie.
    const scenario = `
La place du village est un lieu.
La forge est un lieu à l'est de la place du village.
L'arrière-boutique de la forge est un lieu à l'intérieur de la forge.

Le joueur est sur la place du village.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const forge = jeu.lieux.find(l => l.nom === 'forge')!;
    expect(forge).toBeDefined();
    // l'analyseur doit avoir créé un voisin de la forge en sortie « intérieur »
    const voisinInterieur = forge.voisins.find(v => v.localisation === ELocalisation.interieur);
    expect(voisinInterieur).toBeDefined();

    const carte = CarteBuilder.construire(jeu, forge.id);
    const ids = carte.noeuds.map(n => n.lieu.id);
    expect(ids).toContain(voisinInterieur!.id);
  });

  it('[F060-T017] hiérarchie : objets sur un support et dans un contenant sont rattachés au parent (pas au lieu)', () => {
    const scenario = `
La salle est un lieu.
Le tabouret est un support dans la salle.
La chope (f) est un objet sur le tabouret.
Le sac est un contenant dans la salle.
Il est ouvert.
La farine (f) est un objet dans le sac.

Le joueur est dans la salle.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const salle = carte.noeuds.find(n => n.lieu.nom === 'salle')!;
    // tabouret et sac sont directement dans le lieu
    const nomsObjetsLieu = salle.objets.map(o => o.nom).sort();
    expect(nomsObjetsLieu).toContain('tabouret');
    expect(nomsObjetsLieu).toContain('sac');
    // chope et farine ne sont PAS au niveau du lieu
    expect(nomsObjetsLieu).not.toContain('chope');
    expect(nomsObjetsLieu).not.toContain('farine');

    // chope rattachée au tabouret
    const tabouret = jeu.objets.find(o => o.nom === 'tabouret')!;
    const enfTab = carte.enfantsParObjet.get(tabouret.id);
    expect(enfTab?.map(e => e.objet.nom)).toEqual(['chope']);

    // farine rattachée au sac
    const sac = jeu.objets.find(o => o.nom === 'sac')!;
    const enfSac = carte.enfantsParObjet.get(sac.id);
    expect(enfSac?.map(e => e.objet.nom)).toEqual(['farine']);
  });

  it('[F060-T018] inventaire : objets « possédé » sans position explicite sont placés dans le joueur', () => {
    // Le générateur fixe automatiquement la position des objets `possédé` à « dans le joueur »
    // (cf. generateur.ts). Le builder les voit alors comme enfants du joueur.
    const scenario = `
La salle est un lieu.
La bourse (f) est un contenant possédé.
La carte du village est un objet possédé.

Le joueur est dans la salle.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const enfJoueur = carte.enfantsParObjet.get(jeu.joueur.id);
    expect(enfJoueur).withContext('joueur a des enfants').toBeDefined();
    const nomsInv = enfJoueur!.map(e => e.objet.nom).sort();
    expect(nomsInv).toContain('bourse');
    expect(nomsInv).toContain('carte du village');

    // l'inventaire n'est pas listé comme objet du lieu
    const salle = carte.noeuds.find(n => n.lieu.nom === 'salle')!;
    expect(salle.objets.map(o => o.nom)).not.toContain('bourse');
  });

  it('[F060-T007] expose sortiesCardinales par lieu pour le panneau de détail', () => {
    const scenario = `
Le carrefour est un lieu.
La clairière est un lieu au nord du carrefour.
La grotte est un lieu à l'est du carrefour.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const carte = CarteBuilder.construire(jeu);

    const carrefourId = jeu.lieux.find(l => l.nom === 'carrefour')!.id;
    const detail = carte.detailsParLieu.get(carrefourId)!;
    const dirs = detail.sortiesCardinales.map(s => s.localisation).sort();
    expect(dirs).toContain(ELocalisation.nord);
    expect(dirs).toContain(ELocalisation.est);
  });
});
