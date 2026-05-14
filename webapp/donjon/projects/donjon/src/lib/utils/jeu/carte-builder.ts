import { ClasseUtils } from '../commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ELocalisation } from '../../models/jeu/localisation';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';
import { Voisin } from '../../models/jeu/voisin';

/** Objet barrière (porte ou obstacle) sur une sortie. */
export interface CarteBarriere {
  type: 'porte' | 'obstacle';
  id: number;
  nom: string;
}

/** Sortie « spéciale » (haut, bas, intérieur, extérieur) qui ne se rend pas en 2D. */
export interface CarteSortieSpeciale {
  localisation: ELocalisation;
  cibleType: 'lieu' | 'porte' | 'obstacle';
  cibleId: number;
  cibleNom: string;
  via?: CarteBarriere;
}

/** Sortie cardinale (nord/sud/est/ouest + diagonales). */
export interface CarteSortieCardinale {
  localisation: ELocalisation;
  cibleId: number;
  cibleNom: string;
  via?: CarteBarriere;
}

/** Un enfant d'un objet (objet posé sur/dans/sous un autre objet, ou item d'inventaire). */
export interface CarteObjetEnfant {
  objet: Objet;
  prep: PrepositionSpatiale;
}

/** Informations affichables pour un lieu (placé ou non sur la grille). */
export interface CarteLieuInfo {
  lieu: Lieu;
  joueurPresent: boolean;
  objets: Objet[];
  personnes: Objet[];
  sortiesCardinales: CarteSortieCardinale[];
  sortiesSpeciales: CarteSortieSpeciale[];
}

/** Un lieu placé sur la grille avec ses occupants. */
export interface CarteNoeud extends CarteLieuInfo {
  x: number;
  y: number;
}

/** Une connexion cardinale entre deux lieux placés. */
export interface CarteArete {
  sourceId: number;
  cibleId: number;
  localisation: ELocalisation;
  via?: CarteBarriere;
}

export interface CarteScenario {
  /** Lieux placés sur la grille principale. */
  noeuds: CarteNoeud[];
  /** Arêtes cardinales entre lieux placés. */
  aretes: CarteArete[];
  /** Détails consultables pour TOUS les lieux du jeu (placés ou non). */
  detailsParLieu: Map<number, CarteLieuInfo>;
  /** IDs des lieux non placés sur la grille (atteignables uniquement par sortie spéciale). */
  lieuxOrphelinsIds: Set<number>;
  /** Objets enfants d'un objet parent (support, contenant, joueur=inventaire). Clé = id du parent. */
  enfantsParObjet: Map<number, CarteObjetEnfant[]>;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface DeplacementCardinal { dx: number; dy: number; }

/** Décalage (dx, dy) sur la grille selon la direction cardinale ou diagonale. */
function deplacementCardinal(loc: ELocalisation): DeplacementCardinal | null {
  switch (loc) {
    case ELocalisation.nord: return { dx: 0, dy: -1 };
    case ELocalisation.sud: return { dx: 0, dy: 1 };
    case ELocalisation.est: return { dx: 1, dy: 0 };
    case ELocalisation.ouest: return { dx: -1, dy: 0 };
    case ELocalisation.nord_est: return { dx: 1, dy: -1 };
    case ELocalisation.nord_ouest: return { dx: -1, dy: -1 };
    case ELocalisation.sud_est: return { dx: 1, dy: 1 };
    case ELocalisation.sud_ouest: return { dx: -1, dy: 1 };
    default: return null;
  }
}

/** Décalage (dx, dy) pour une sortie spéciale (haut/bas/intérieur/extérieur). */
function deplacementSpecial(loc: ELocalisation): DeplacementCardinal | null {
  switch (loc) {
    case ELocalisation.haut: return { dx: 0, dy: -1 };
    case ELocalisation.bas: return { dx: 0, dy: 1 };
    case ELocalisation.exterieur: return { dx: -1, dy: 0 };
    case ELocalisation.interieur: return { dx: 1, dy: 0 };
    default: return null;
  }
}

/**
 * Choisit le déplacement à appliquer selon la direction du voisin.
 * En mode zoom (sous-carte focalisée sur un lieu), on suit aussi les sorties spéciales
 * afin de représenter les étages / intérieurs reliés entre eux.
 */
function deplacement(loc: ELocalisation, modeZoom: boolean): DeplacementCardinal | null {
  const c = deplacementCardinal(loc);
  if (c) { return c; }
  if (modeZoom) { return deplacementSpecial(loc); }
  return null;
}

/** PNJ = vivant (personne ou animal). Pas un simple objet ni un contenant. */
function estPersonne(objet: Objet): boolean {
  return ClasseUtils.heriteDe(objet.classe, EClasseRacine.vivant);
}

/** Construire une carte (lieux placés en 2D + arêtes + objets/PNJ) à partir d'un Jeu compilé. */
export class CarteBuilder {

  /**
   * Construire la carte.
   * @param racineId si fourni, force le BFS à démarrer depuis ce lieu (mode zoom).
   *                 Sinon, le lieu de départ est choisi automatiquement (joueur ou premier).
   */
  public static construire(jeu: Jeu, racineId?: number): CarteScenario {
    const carte: CarteScenario = {
      noeuds: [],
      aretes: [],
      detailsParLieu: new Map<number, CarteLieuInfo>(),
      lieuxOrphelinsIds: new Set<number>(),
      enfantsParObjet: new Map<number, CarteObjetEnfant[]>(),
      minX: 0, maxX: 0, minY: 0, maxY: 0,
    };

    if (!jeu || !jeu.lieux || jeu.lieux.length === 0) {
      return carte;
    }

    const lieuParId = new Map<number, Lieu>();
    jeu.lieux.forEach(l => lieuParId.set(l.id, l));

    const objetParId = new Map<number, Objet>();
    jeu.objets?.forEach(o => objetParId.set(o.id, o));

    const idLieuJoueur = jeu.joueur?.position?.cibleId ?? null;

    // 1) répartir objets et PNJ par lieu (en excluant joueur, portes et obstacles).
    //    Les objets dont la cible est UN AUTRE OBJET (sur un support, dans un contenant, ou
    //    dans l'inventaire du joueur) vont dans `enfantsParObjet` au lieu d'être rattachés au lieu.
    const objetsParLieu = new Map<number, Objet[]>();
    const personnesParLieu = new Map<number, Objet[]>();
    jeu.objets?.forEach(objet => {
      const pos = objet.position;
      if (!pos) { return; }
      if (jeu.joueur && objet.id === jeu.joueur.id) { return; }
      if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.porte)
        || ClasseUtils.heriteDe(objet.classe, EClasseRacine.obstacle)) { return; }

      if (pos.cibleType === EClasseRacine.objet) {
        // objet enfant d'un autre objet (support/contenant/joueur)
        const liste = carte.enfantsParObjet.get(pos.cibleId) ?? [];
        liste.push({ objet, prep: pos.pre });
        carte.enfantsParObjet.set(pos.cibleId, liste);
        return;
      }
      if (pos.cibleType !== EClasseRacine.lieu) { return; }

      const cible = estPersonne(objet) ? personnesParLieu : objetsParLieu;
      const liste = cible.get(pos.cibleId) ?? [];
      liste.push(objet);
      cible.set(pos.cibleId, liste);
    });

    // 2) BFS cardinal depuis un lieu de départ. Les lieux non atteints restent orphelins.
    const positions = new Map<number, { x: number; y: number; }>();
    const cellulesOccupees = new Map<string, number>();

    const reserverCellule = (x: number, y: number, idLieu: number) => {
      let curX = x, curY = y, essais = 0;
      while (cellulesOccupees.has(`${curX},${curY}`) && essais < 50) {
        curX += 1;
        essais += 1;
      }
      cellulesOccupees.set(`${curX},${curY}`, idLieu);
      positions.set(idLieu, { x: curX, y: curY });
    };

    const lieuDepart = racineId != null
      ? (jeu.lieux.find(l => l.id === racineId) ?? CarteBuilder.choisirLieuDepart(jeu))
      : CarteBuilder.choisirLieuDepart(jeu);

    // Mode étendu (cardinales + haut/bas/intérieur/extérieur) si :
    //  - racineId est fourni (zoom explicite : montrer tout ce qui entoure le lieu cliqué)
    //  - OU le lieu de départ n'a aucun voisin cardinal (vue d'ensemble verticale/imbriquée pure).
    const modeZoom = racineId != null
      ? true
      : (lieuDepart != null
        ? !lieuDepart.voisins.some(v => v.type === EClasseRacine.lieu && deplacementCardinal(v.localisation) !== null)
        : false);

    if (lieuDepart) {
      reserverCellule(0, 0, lieuDepart.id);
      // Un lieu ne peut déployer ses sorties spéciales (haut/bas/intérieur/extérieur)
      // QUE s'il est la racine, OU s'il a lui-même été atteint via une sortie spéciale.
      // Ainsi un voisinage cardinal n'expose pas ses intérieurs/étages — on évite la
      // pollution croisée (ex. zoom sur le bois ne déplie pas l'intérieur de l'auberge).
      const peutEtendreSpecial = new Set<number>();
      peutEtendreSpecial.add(lieuDepart.id);

      // BFS en TROIS phases ordonnées par priorité :
      //   1) cardinaux purs (nord/sud/est/ouest)
      //   2) diagonales (NE/NO/SE/SO)
      //   3) spéciaux (haut/bas/intérieur/extérieur), uniquement en mode zoom
      // On vide la file la plus prioritaire avant de toucher la suivante. À chaque nouvel
      // ajout dans la grille, le nouveau lieu est poussé dans les trois files pour que ses
      // propres voisins soient évalués au tour suivant. Conséquence : les cardinaux sont
      // placés en premier dans leur cellule naturelle, puis les diagonales se décalent
      // par collision si besoin — au lieu de l'inverse, qui produisait des cardinaux
      // visuellement diagonaux (cf. capture utilisateur).
      const cardinalQueue: Lieu[] = [lieuDepart];
      const diagonalQueue: Lieu[] = [lieuDepart];
      const specialQueue: Lieu[] = modeZoom ? [lieuDepart] : [];

      const estDiagonale = (loc: ELocalisation): boolean =>
        loc === ELocalisation.nord_est || loc === ELocalisation.nord_ouest
        || loc === ELocalisation.sud_est || loc === ELocalisation.sud_ouest;

      while (cardinalQueue.length > 0 || diagonalQueue.length > 0 || specialQueue.length > 0) {
        if (cardinalQueue.length > 0) {
          const courant = cardinalQueue.shift()!;
          const posCourante = positions.get(courant.id);
          if (!posCourante) { continue; }
          for (const voisin of courant.voisins) {
            if (voisin.type !== EClasseRacine.lieu) { continue; }
            const lieuVoisin = lieuParId.get(voisin.id);
            if (!lieuVoisin) { continue; }
            if (positions.has(lieuVoisin.id)) { continue; }
            const dep = deplacementCardinal(voisin.localisation);
            if (!dep || estDiagonale(voisin.localisation)) { continue; }
            reserverCellule(posCourante.x + dep.dx, posCourante.y + dep.dy, lieuVoisin.id);
            cardinalQueue.push(lieuVoisin);
            diagonalQueue.push(lieuVoisin);
            if (modeZoom) { specialQueue.push(lieuVoisin); }
          }
          continue;
        }
        if (diagonalQueue.length > 0) {
          const courant = diagonalQueue.shift()!;
          const posCourante = positions.get(courant.id);
          if (!posCourante) { continue; }
          for (const voisin of courant.voisins) {
            if (voisin.type !== EClasseRacine.lieu) { continue; }
            const lieuVoisin = lieuParId.get(voisin.id);
            if (!lieuVoisin) { continue; }
            if (positions.has(lieuVoisin.id)) { continue; }
            if (!estDiagonale(voisin.localisation)) { continue; }
            const dep = deplacementCardinal(voisin.localisation)!;
            reserverCellule(posCourante.x + dep.dx, posCourante.y + dep.dy, lieuVoisin.id);
            cardinalQueue.push(lieuVoisin);
            diagonalQueue.push(lieuVoisin);
            if (modeZoom) { specialQueue.push(lieuVoisin); }
          }
          continue;
        }
        if (specialQueue.length > 0) {
          const courant = specialQueue.shift()!;
          if (!peutEtendreSpecial.has(courant.id)) { continue; }
          const posCourante = positions.get(courant.id);
          if (!posCourante) { continue; }
          for (const voisin of courant.voisins) {
            if (voisin.type !== EClasseRacine.lieu) { continue; }
            const lieuVoisin = lieuParId.get(voisin.id);
            if (!lieuVoisin) { continue; }
            if (positions.has(lieuVoisin.id)) { continue; }
            const dep = deplacementSpecial(voisin.localisation);
            if (!dep) { continue; }
            reserverCellule(posCourante.x + dep.dx, posCourante.y + dep.dy, lieuVoisin.id);
            peutEtendreSpecial.add(lieuVoisin.id);
            cardinalQueue.push(lieuVoisin);
            diagonalQueue.push(lieuVoisin);
            specialQueue.push(lieuVoisin);
          }
        }
      }
    }

    // 3) signaler les lieux orphelins (non placés)
    for (const lieu of jeu.lieux) {
      if (!positions.has(lieu.id)) {
        carte.lieuxOrphelinsIds.add(lieu.id);
      }
    }

    // 4) construire les détails pour TOUS les lieux (placés ou non).
    //    `sortiesCardinales` = voisins lieu placés sur la carte (visibles via une arête).
    //    `sortiesSpeciales`  = voisins lieu hors carte (orphelins → drill-down) + sorties vers porte/obstacle directe.
    for (const lieu of jeu.lieux) {
      const sortiesCardinales: CarteSortieCardinale[] = [];
      const sortiesSpeciales: CarteSortieSpeciale[] = [];
      const dejaListee = new Set<string>();
      for (const voisin of lieu.voisins) {
        const nomCible = CarteBuilder.nomVoisin(voisin, lieuParId, objetParId);
        const cibleType = voisin.type === EClasseRacine.lieu ? 'lieu'
          : (voisin.type === EClasseRacine.porte ? 'porte' : 'obstacle');
        const via = CarteBuilder.barriereAssociee(lieu, voisin, objetParId);

        if (voisin.type === EClasseRacine.lieu) {
          // voisin de type lieu : placé ou orphelin selon `positions`
          const cle = `l|${voisin.localisation}|${voisin.id}`;
          if (dejaListee.has(cle)) { continue; }
          dejaListee.add(cle);
          if (positions.has(voisin.id)) {
            sortiesCardinales.push({
              localisation: voisin.localisation,
              cibleId: voisin.id,
              cibleNom: nomCible,
              via,
            });
          } else {
            sortiesSpeciales.push({
              localisation: voisin.localisation,
              cibleType: 'lieu',
              cibleId: voisin.id,
              cibleNom: nomCible,
              via,
            });
          }
        } else {
          // porte/obstacle utilisée comme cible directe (sans lieu derrière) → toujours sortie spéciale
          const cle = `b|${voisin.localisation}|${voisin.id}|${cibleType}`;
          if (dejaListee.has(cle)) { continue; }
          dejaListee.add(cle);
          sortiesSpeciales.push({
            localisation: voisin.localisation,
            cibleType,
            cibleId: voisin.id,
            cibleNom: nomCible,
            via,
          });
        }
      }
      carte.detailsParLieu.set(lieu.id, {
        lieu,
        joueurPresent: idLieuJoueur === lieu.id,
        objets: objetsParLieu.get(lieu.id) ?? [],
        personnes: personnesParLieu.get(lieu.id) ?? [],
        sortiesCardinales,
        sortiesSpeciales,
      });
    }

    // 5) construire les nœuds (uniquement pour les lieux placés)
    for (const lieu of jeu.lieux) {
      const pos = positions.get(lieu.id);
      if (!pos) { continue; }
      const info = carte.detailsParLieu.get(lieu.id)!;
      carte.noeuds.push({ ...info, x: pos.x, y: pos.y });
    }

    // 6) arêtes entre lieux placés (cardinales + verticales/intérieur-extérieur en mode zoom)
    const aretesVues = new Set<string>();
    for (const lieu of jeu.lieux) {
      if (!positions.has(lieu.id)) { continue; }
      for (const voisin of lieu.voisins) {
        if (voisin.type !== EClasseRacine.lieu) { continue; }
        if (!positions.has(voisin.id)) { continue; }
        if (deplacement(voisin.localisation, modeZoom) === null) { continue; }
        const a = Math.min(lieu.id, voisin.id);
        const b = Math.max(lieu.id, voisin.id);
        const cle = `${a}-${b}`;
        if (aretesVues.has(cle)) { continue; }
        aretesVues.add(cle);
        carte.aretes.push({
          sourceId: lieu.id,
          cibleId: voisin.id,
          localisation: voisin.localisation,
          via: CarteBuilder.barriereAssociee(lieu, voisin, objetParId),
        });
      }
    }

    // 7) calculer les bornes (uniquement les noeuds placés)
    if (carte.noeuds.length > 0) {
      const xs = carte.noeuds.map(n => n.x);
      const ys = carte.noeuds.map(n => n.y);
      carte.minX = Math.min(...xs);
      carte.maxX = Math.max(...xs);
      carte.minY = Math.min(...ys);
      carte.maxY = Math.max(...ys);
    }

    return carte;
  }

  private static choisirLieuDepart(jeu: Jeu): Lieu | null {
    if (!jeu.lieux || jeu.lieux.length === 0) { return null; }
    const idLieuJoueur = jeu.joueur?.position?.cibleId;
    if (idLieuJoueur != null) {
      const trouve = jeu.lieux.find(l => l.id === idLieuJoueur);
      if (trouve) { return trouve; }
    }
    return jeu.lieux[0];
  }

  private static nomVoisin(voisin: Voisin, lieuParId: Map<number, Lieu>, objetParId: Map<number, Objet>): string {
    if (voisin.type === EClasseRacine.lieu) {
      const l = lieuParId.get(voisin.id);
      return l?.titre || l?.intitule?.toString() || l?.nom || '?';
    }
    const o = objetParId.get(voisin.id);
    return o?.intitule?.toString() || o?.nom || '?';
  }

  private static barriereAssociee(lieu: Lieu, voisinLieu: Voisin, objetParId: Map<number, Objet>): CarteBarriere | undefined {
    if (voisinLieu.type !== EClasseRacine.lieu) {
      const objet = objetParId.get(voisinLieu.id);
      if (!objet) { return undefined; }
      return {
        type: voisinLieu.type === EClasseRacine.porte ? 'porte' : 'obstacle',
        id: objet.id,
        nom: objet.intitule?.toString() || objet.nom || '?',
      };
    }
    const barriere = lieu.voisins.find(v =>
      v.localisation === voisinLieu.localisation
      && (v.type === EClasseRacine.porte || v.type === EClasseRacine.obstacle)
    );
    if (!barriere) { return undefined; }
    const objet = objetParId.get(barriere.id);
    if (!objet) { return undefined; }
    return {
      type: barriere.type === EClasseRacine.porte ? 'porte' : 'obstacle',
      id: objet.id,
      nom: objet.intitule?.toString() || objet.nom || '?',
    };
  }
}
