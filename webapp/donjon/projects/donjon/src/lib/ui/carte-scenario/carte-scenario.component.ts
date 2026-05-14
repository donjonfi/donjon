import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { CarteArete, CarteBuilder, CarteLieuInfo, CarteNoeud, CarteScenario, CarteSortieCardinale, CarteSortieSpeciale } from '../../utils/jeu/carte-builder';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';
import { ElementsJeuUtils } from '../../utils/commun/elements-jeu-utils';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';
import { ObjetPresent } from '../visualisation/models/objet-present';

type Kind = 'lieu' | 'objet' | 'personne' | 'joueur' | 'sortie-lieu';

interface SegmentAscii {
  texte: string;
  kind?: Kind;
  refId?: number;
}

interface CelluleAscii {
  c: string;
  kind?: Kind;
  refId?: number;
}

@Component({
  selector: 'app-carte-scenario',
  templateUrl: './carte-scenario.component.html',
  styleUrls: ['./carte-scenario.component.scss'],
  standalone: false,
})
export class CarteScenarioComponent implements OnChanges {

  @Input() jeu: Jeu | null = null;
  @Output() lieuChoisi = new EventEmitter<Lieu>();

  public carte: CarteScenario | null = null;
  public lignesSegmentees: SegmentAscii[][] = [];

  public eju: ElementsJeuUtils | null = null;
  public objetVisible: ObjetPresent | null = null;
  public lieuSelectionneId: number | null = null;
  public objetSelectionneId: number | null = null;

  /** Pile d'IDs de lieux ayant servi de racine à un zoom. Vide = vue d'ensemble. */
  public pileRacines: number[] = [];

  /** Dimensions de cellule en caractères monospace. */
  private readonly CELL_W = 28;
  private readonly GAP_H = 11;
  private readonly GAP_V = 3;

  // ─────────────────────────────────────────
  // Cycle de vie
  // ─────────────────────────────────────────

  ngOnChanges(_changes: SimpleChanges): void {
    // remontage du composant ou nouvel input jeu → vue d'ensemble
    this.pileRacines = [];
    this.recalculer();
  }

  /**
   * Recalcule la carte depuis le `jeu` actuel.
   * Appelé en `ngOnChanges`, et donc à chaque (re)montée du composant via `@if`,
   * ce qui garantit que la carte reflète l'état courant du jeu (positions du joueur,
   * objets déplacés, etc.) lorsqu'on revient sur l'onglet.
   */
  public recalculer(reset: boolean = true): void {
    if (this.jeu) {
      const racineId = this.pileRacines.length > 0 ? this.pileRacines[this.pileRacines.length - 1] : undefined;
      this.carte = CarteBuilder.construire(this.jeu, racineId);
      this.eju = new ElementsJeuUtils(this.jeu, false);
      this.genererAscii();
    } else {
      this.carte = null;
      this.eju = null;
      this.lignesSegmentees = [];
    }
    if (reset) {
      this.objetVisible = null;
      this.lieuSelectionneId = null;
      this.objetSelectionneId = null;
    }
  }

  // ─────────────────────────────────────────
  // Helpers d'affichage
  // ─────────────────────────────────────────

  public titreLieu(lieu: Lieu): string {
    return lieu.titre || lieu.intitule?.toString() || lieu.nom || '(sans nom)';
  }

  public intituleLocalisation(loc: ELocalisation): string {
    try { return Localisation.getLocalisation(loc).toString(); } catch { return '?'; }
  }

  public titreCible(cibleId: number): string {
    if (!this.jeu) { return '?'; }
    const lieu = this.jeu.lieux.find(l => l.id === cibleId);
    if (lieu) { return this.titreLieu(lieu); }
    const objet = this.jeu.objets.find(o => o.id === cibleId);
    return objet?.intitule?.toString() ?? '?';
  }

  public flecheSpeciale(loc: ELocalisation): string {
    switch (loc) {
      case ELocalisation.haut: return '↑';
      case ELocalisation.bas: return '↓';
      case ELocalisation.interieur: return '⤓';
      case ELocalisation.exterieur: return '⤒';
      case ELocalisation.nord_est: return '↗';
      case ELocalisation.nord_ouest: return '↖';
      case ELocalisation.sud_est: return '↘';
      case ELocalisation.sud_ouest: return '↙';
      default: return '→';
    }
  }

  // ─────────────────────────────────────────
  // Sélection (carte + panneau)
  // ─────────────────────────────────────────

  public onClickSegment(seg: SegmentAscii): void {
    if (!seg.kind || seg.refId == null) { return; }
    if (seg.kind === 'lieu' || seg.kind === 'sortie-lieu') {
      this.zoomerSurLieu(seg.refId);
    } else {
      this.selectionnerObjet(seg.refId);
    }
  }

  /**
   * Sélectionner un lieu = le mettre au centre de la carte (mode auto sur ses voisins).
   * Conserver en accès public pour les liens du panneau et du mode liste.
   */
  public selectionnerLieu(id: number): void {
    this.zoomerSurLieu(id);
  }

  /** Fermer le panneau de détail (vide la sélection sans toucher au zoom). */
  public fermerDetail(): void {
    this.lieuSelectionneId = null;
    this.objetSelectionneId = null;
    this.objetVisible = null;
    // réinitialise la position du popup pour qu'il revienne en haut à droite la prochaine fois
    this.popupLeft = null;
    this.popupTop = null;
  }

  // ─────────────────────────────────────────
  // Drag & drop du popup détail
  // ─────────────────────────────────────────

  /** Position courante du popup (px, relative à `__ascii-wrap`). null = position par défaut (top-right). */
  public popupLeft: number | null = null;
  public popupTop: number | null = null;

  private dragActif = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;

  public onPopupDragStart(event: MouseEvent, popupEl: HTMLElement): void {
    // évite de démarrer un drag depuis un bouton/lien (le X notamment)
    const target = event.target as HTMLElement;
    if (target.closest('button, a')) { return; }
    this.dragActif = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    const popupRect = popupEl.getBoundingClientRect();
    const parent = popupEl.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      this.dragStartLeft = popupRect.left - parentRect.left;
      this.dragStartTop = popupRect.top - parentRect.top;
    } else {
      this.dragStartLeft = popupRect.left;
      this.dragStartTop = popupRect.top;
    }
    // bascule en positionnement explicite par left/top
    this.popupLeft = this.dragStartLeft;
    this.popupTop = this.dragStartTop;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  public onDocumentMouseMove(event: MouseEvent): void {
    if (!this.dragActif) { return; }
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;
    this.popupLeft = this.dragStartLeft + dx;
    this.popupTop = this.dragStartTop + dy;
  }

  @HostListener('document:mouseup')
  public onDocumentMouseUp(): void {
    this.dragActif = false;
  }

  // ─────────────────────────────────────────
  // Navigation zoom / dézoom
  // ─────────────────────────────────────────

  /**
   * Re-centrer la carte sur ce lieu. La pile représente la **hiérarchie courante**
   * (pas l'historique des clics) :
   *  - clic sur le lieu du joueur ALORS qu'on est zoomé (pile non vide) → retour à la vue d'ensemble.
   *  - clic sur un lieu déjà dans la pile → tronquer à ce niveau (on remonte).
   *  - clic sur un lieu inconnu (ou sur le lieu du joueur depuis la vue d'ensemble) → push (on descend d'un cran).
   *
   * NOTE : si le joueur est dans un lieu qui a une sortie intérieure (ex. il s'est déplacé dans
   * la forge), la vue d'ensemble centre déjà sur ce lieu mais SANS afficher l'intérieur. Cliquer
   * sur la forge doit alors zoomer (montrer l'arrière-boutique) — d'où la condition « pile non vide »
   * pour le raccourci de retour à la vue d'ensemble.
   */
  public zoomerSurLieu(id: number): void {
    if (!this.jeu) { return; }
    const lieu = this.jeu.lieux.find(l => l.id === id);
    if (!lieu) { return; }
    const lieuJoueurId = this.jeu.joueur?.position?.cibleId ?? null;

    let nouvellePile: number[];
    if (id === lieuJoueurId && this.pileRacines.length > 0) {
      nouvellePile = [];
    } else {
      const indexExistant = this.pileRacines.indexOf(id);
      nouvellePile = indexExistant !== -1
        ? this.pileRacines.slice(0, indexExistant + 1)
        : [...this.pileRacines, id];
    }

    const pileChange = nouvellePile.length !== this.pileRacines.length
      || nouvellePile.some((v, i) => v !== this.pileRacines[i]);

    // Toggle : second clic sur le même lieu (sans déclencher de navigation) → masquer le détail.
    if (!pileChange && this.lieuSelectionneId === id) {
      this.fermerDetail();
      this.lieuChoisi.emit(lieu);
      return;
    }

    if (pileChange) {
      this.pileRacines = nouvellePile;
      this.recalculer(false);
    }
    this.lieuSelectionneId = id;
    this.objetSelectionneId = null;
    this.objetVisible = null;
    this.lieuChoisi.emit(lieu);
  }

  /**
   * Remonter dans la hiérarchie.
   * @param index -1 = vue d'ensemble ; sinon, position dans `pileRacines` à conserver.
   */
  public revenirAuNiveau(index: number): void {
    if (index < 0) {
      this.pileRacines = [];
    } else {
      this.pileRacines = this.pileRacines.slice(0, index + 1);
    }
    this.recalculer(false);
  }

  /** Fil d'Ariane des lieux racines, du plus haut au plus profond. */
  public get breadcrumb(): { id: number; titre: string; }[] {
    if (!this.jeu) { return []; }
    return this.pileRacines.map(id => {
      const lieu = this.jeu!.lieux.find(l => l.id === id);
      return { id, titre: lieu ? this.titreLieu(lieu) : '?' };
    });
  }

  public selectionnerObjet(id: number): void {
    // Toggle : second clic sur le même objet → masquer le détail.
    if (this.objetSelectionneId === id) {
      this.fermerDetail();
      return;
    }
    if (!this.jeu) { return; }
    let objet: Objet | undefined = this.jeu.objets.find(o => o.id === id);
    if (!objet && this.jeu.joueur?.id === id) { objet = this.jeu.joueur; }
    if (!objet) { return; }
    this.objetSelectionneId = objet.id;
    this.lieuSelectionneId = null;
    this.objetVisible = new ObjetPresent(objet, undefined, undefined, undefined);
  }

  public estSelectionne(seg: SegmentAscii): boolean {
    if (!seg.kind || seg.refId == null) { return false; }
    if (seg.kind === 'lieu' || seg.kind === 'sortie-lieu') { return seg.refId === this.lieuSelectionneId; }
    return seg.refId === this.objetSelectionneId;
  }

  // ─────────────────────────────────────────
  // Données pour le template
  // ─────────────────────────────────────────

  /** Détails du lieu actuellement sélectionné (que ce lieu soit ou non sur la grille). */
  public get detailLieuSelectionne(): CarteLieuInfo | null {
    if (!this.carte || this.lieuSelectionneId == null) { return null; }
    return this.carte.detailsParLieu.get(this.lieuSelectionneId) ?? null;
  }

  /** Vrai si un panneau de détail est actuellement affiché (objet ou lieu). */
  public get aDetailAffiche(): boolean {
    return !!this.objetVisible || !!this.detailLieuSelectionne;
  }

  // ─────────────────────────────────────────
  // Génération de la matrice ASCII et de ses segments
  // ─────────────────────────────────────────

  private genererAscii(): void {
    if (!this.carte || this.carte.noeuds.length === 0) {
      this.lignesSegmentees = [];
      return;
    }
    const { minX, maxX, minY, maxY, noeuds } = this.carte;
    const nCols = maxX - minX + 1;
    const nRows = maxY - minY + 1;

    // hauteur dynamique par ligne (min 4, plafond 18)
    const rowHeights: number[] = [];
    for (let y = 0; y < nRows; y++) {
      let h = 4;
      const noeudsLigne = noeuds.filter(n => n.y === minY + y);
      for (const n of noeudsLigne) {
        const ligneJoueur = n.joueurPresent ? 1 : 0;
        let descendants = 0;
        if (n.joueurPresent && this.jeu?.joueur) {
          descendants += this.compterDescendants(this.jeu.joueur.id);
        }
        for (const p of n.personnes) { descendants += this.compterDescendants(p.id); }
        for (const o of n.objets) { descendants += this.compterDescendants(o.id); }
        const requis = 2 + 1 + ligneJoueur + n.personnes.length + n.objets.length + descendants + n.sortiesSpeciales.length;
        if (requis > h) { h = requis; }
      }
      if (h > 18) { h = 18; }
      rowHeights.push(h);
    }

    const rowOffsets: number[] = [];
    let offset = 0;
    for (let y = 0; y < nRows; y++) {
      rowOffsets.push(offset);
      offset += rowHeights[y] + (y < nRows - 1 ? this.GAP_V : 0);
    }
    const totalRows = offset;
    const totalCols = nCols * this.CELL_W + (nCols - 1) * this.GAP_H;

    const matrice: CelluleAscii[][] = [];
    for (let r = 0; r < totalRows; r++) {
      const ligne: CelluleAscii[] = [];
      for (let c = 0; c < totalCols; c++) { ligne.push({ c: ' ' }); }
      matrice.push(ligne);
    }

    const set = (r: number, c: number, ch: string, meta?: Partial<CelluleAscii>) => {
      if (r < 0 || r >= totalRows || c < 0 || c >= totalCols) { return; }
      matrice[r][c] = { c: ch, kind: meta?.kind, refId: meta?.refId };
    };
    const setStr = (r: number, c: number, s: string, meta?: Partial<CelluleAscii>) => {
      for (let i = 0; i < s.length; i++) { set(r, c + i, s[i], meta); }
    };

    // -- DESSINER CHAQUE NŒUD --
    for (const n of noeuds) {
      const gx = n.x - minX;
      const gy = n.y - minY;
      const colStart = gx * (this.CELL_W + this.GAP_H);
      const rowStart = rowOffsets[gy];
      const rowEnd = rowStart + rowHeights[gy] - 1;

      // bordures
      set(rowStart, colStart, '┌');
      set(rowStart, colStart + this.CELL_W - 1, '┐');
      set(rowEnd, colStart, '└');
      set(rowEnd, colStart + this.CELL_W - 1, '┘');
      for (let c = colStart + 1; c < colStart + this.CELL_W - 1; c++) {
        set(rowStart, c, '─');
        set(rowEnd, c, '─');
      }
      for (let r = rowStart + 1; r < rowEnd; r++) {
        set(r, colStart, '│');
        set(r, colStart + this.CELL_W - 1, '│');
      }

      // contenu
      let cr = rowStart + 1;
      const metaLieu = { kind: 'lieu' as Kind, refId: n.lieu.id };
      const titre = this.tronquer(this.titreLieu(n.lieu), this.CELL_W - 4);
      setStr(cr, colStart + 1, this.padRight(' ' + titre, this.CELL_W - 2), metaLieu);
      cr++;

      // joueur (en haut, mise en évidence) + inventaire indenté
      if (n.joueurPresent && this.jeu?.joueur) {
        const j = this.jeu.joueur;
        const t = this.tronquer('★ ' + (j.intitule?.toString() ?? j.nom ?? 'joueur'), this.CELL_W - 5);
        setStr(cr, colStart + 1, this.padRight(' ' + t, this.CELL_W - 2), { kind: 'joueur', refId: j.id });
        cr++;
        cr = this.dessinerEnfants(j.id, 1, cr, rowEnd, colStart, setStr);
      }

      for (const p of n.personnes) {
        if (cr >= rowEnd) { break; }
        const t = this.tronquer('@ ' + (p.intitule?.toString() ?? p.nom ?? ''), this.CELL_W - 5);
        setStr(cr, colStart + 1, this.padRight(' ' + t, this.CELL_W - 2), { kind: 'personne', refId: p.id });
        cr++;
        cr = this.dessinerEnfants(p.id, 1, cr, rowEnd, colStart, setStr);
      }
      for (const o of n.objets) {
        if (cr >= rowEnd) { break; }
        const t = this.tronquer('• ' + (o.intitule?.toString() ?? o.nom ?? ''), this.CELL_W - 5);
        setStr(cr, colStart + 1, this.padRight(' ' + t, this.CELL_W - 2), { kind: 'objet', refId: o.id });
        cr++;
        cr = this.dessinerEnfants(o.id, 1, cr, rowEnd, colStart, setStr);
      }
      for (const s of n.sortiesSpeciales) {
        if (cr >= rowEnd) { break; }
        const fleche = this.flecheSpeciale(s.localisation);
        const t = this.tronquer(fleche + ' ' + s.cibleNom, this.CELL_W - 5);
        const kind: Kind = s.cibleType === 'lieu' ? 'sortie-lieu' : 'objet';
        setStr(cr, colStart + 1, this.padRight(' ' + t, this.CELL_W - 2), { kind, refId: s.cibleId });
        cr++;
      }
    }

    // -- DESSINER ARÊTES --
    for (const a of this.carte.aretes) {
      this.tracerArete(matrice, a, rowOffsets, rowHeights, minX, minY, set, setStr);
    }

    // -- DÉCOUPER EN SEGMENTS --
    this.lignesSegmentees = matrice.map(ligne => this.fusionnerSegments(ligne));
  }

  private tracerArete(
    matrice: CelluleAscii[][],
    a: CarteArete,
    rowOffsets: number[],
    rowHeights: number[],
    minX: number,
    minY: number,
    set: (r: number, c: number, ch: string, meta?: Partial<CelluleAscii>) => void,
    setStr: (r: number, c: number, s: string, meta?: Partial<CelluleAscii>) => void,
  ): void {
    if (!this.carte) { return; }
    const source = this.carte.noeuds.find(n => n.lieu.id === a.sourceId);
    const cible = this.carte.noeuds.find(n => n.lieu.id === a.cibleId);
    if (!source || !cible) { return; }

    const loc = a.localisation;
    const dx = cible.x - source.x;
    const dy = cible.y - source.y;
    // tracé selon le déplacement réel sur la grille (couvre cardinales + haut/bas/int/ext en mode zoom)
    const horizontal = dy === 0 && dx !== 0;
    const vertical = dx === 0 && dy !== 0;

    if (horizontal && source.y === cible.y) {
      const gauche = source.x < cible.x ? source : cible;
      const droite = source.x < cible.x ? cible : source;
      const gyG = gauche.y - minY;
      const rowMid = rowOffsets[gyG] + Math.floor(rowHeights[gyG] / 2);
      const colA = (gauche.x - minX) * (this.CELL_W + this.GAP_H) + this.CELL_W - 1;
      const colB = (droite.x - minX) * (this.CELL_W + this.GAP_H);
      set(rowMid, colA, '┤');
      set(rowMid, colB, '├');
      for (let c = colA + 1; c < colB; c++) { set(rowMid, c, '─'); }
      const label = a.via ? `[${a.via.type === 'porte' ? 'P' : 'O'}]${a.via.nom}` : this.intituleLocalisation(loc);
      const lab = ' ' + this.tronquer(label, this.GAP_H - 2) + ' ';
      const start = Math.floor((colA + colB - lab.length) / 2);
      setStr(rowMid, start, lab);
    } else if (vertical) {
      const haut = source.y < cible.y ? source : cible;
      const bas = source.y < cible.y ? cible : source;
      const gxH = haut.x - minX;
      const gyH = haut.y - minY;
      const gyB = bas.y - minY;
      const colMid = gxH * (this.CELL_W + this.GAP_H) + Math.floor(this.CELL_W / 2);
      const rowA = rowOffsets[gyH] + rowHeights[gyH] - 1;
      const rowB = rowOffsets[gyB];
      set(rowA, colMid, '┴');
      set(rowB, colMid, '┬');
      for (let r = rowA + 1; r < rowB; r++) { set(r, colMid, '│'); }
      const label = a.via ? `[${a.via.type === 'porte' ? 'P' : 'O'}]${a.via.nom}` : this.intituleLocalisation(loc);
      const rowMid = Math.floor((rowA + rowB) / 2);
      setStr(rowMid, colMid + 2, this.tronquer(label, 12));
    } else if (
      (loc === ELocalisation.nord_est || loc === ELocalisation.nord_ouest
        || loc === ELocalisation.sud_est || loc === ELocalisation.sud_ouest)
      && dx !== 0 && dy !== 0
    ) {
      // diagonale RÉELLE (localisation NE/NO/SE/SO) : trait oblique coin-à-coin (Bresenham),
      // avec ╱ ou ╲ selon le sens. L'étiquette de direction est posée au milieu du trajet.
      //
      // Les liaisons cardinales (nord/sud/est/ouest) qui se retrouvent en grille avec dx≠0
      // ET dy≠0 (placement décalé suite à une collision) ne sont PAS tracées ici : elles
      // donneraient un trait diagonal trompeur. On les laisse tomber — le lien reste visible
      // dans le panneau de détail du lieu.
      const versEst = dx > 0;
      const versSud = dy > 0;
      const gxS = source.x - minX;
      const gyS = source.y - minY;
      const gxT = cible.x - minX;
      const gyT = cible.y - minY;
      const sCol = gxS * (this.CELL_W + this.GAP_H);
      const tCol = gxT * (this.CELL_W + this.GAP_H);
      const hS = rowHeights[gyS];
      const hT = rowHeights[gyT];
      const rsTop = rowOffsets[gyS];
      const rsBot = rsTop + hS - 1;
      const rtTop = rowOffsets[gyT];
      const rtBot = rtTop + hT - 1;
      const sColRight = sCol + this.CELL_W - 1;
      const tColLeft = tCol;
      const tColRight = tCol + this.CELL_W - 1;

      // point de départ : juste à côté du coin de la source, vers la cible
      const startRow = versSud ? rsBot + 1 : rsTop - 1;
      const startCol = versEst ? sColRight + 1 : sCol - 1;
      // point d'arrivée : juste à côté du coin de la cible, vers la source
      const endRow = versSud ? rtTop - 1 : rtBot + 1;
      const endCol = versEst ? tColLeft - 1 : tColRight + 1;

      // caractère diagonal : ╲ pour NO/SE, ╱ pour NE/SO
      const diagChar = (versEst === versSud) ? '╲' : '╱';

      // Bresenham 2D — on plote un caractère par cellule visitée
      const x1 = startCol, y1 = startRow;
      const x2 = endCol, y2 = endRow;
      const dxAbs = Math.abs(x2 - x1);
      const dyAbs = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dxAbs - dyAbs;
      let cx = x1, cy = y1;
      const cellules: { r: number; c: number }[] = [];
      for (let i = 0; i < 500; i++) {
        cellules.push({ r: cy, c: cx });
        if (cx === x2 && cy === y2) { break; }
        const e2 = 2 * err;
        if (e2 > -dyAbs) { err -= dyAbs; cx += sx; }
        if (e2 < dxAbs) { err += dxAbs; cy += sy; }
      }
      // rendu en escalier : ╱/╲ uniquement aux cellules où la ligne change de rangée,
      // ─ sur les cellules intermédiaires d'une même rangée. Pour une pente proche de 1:2
      // (équivalent ~45° en monospace) on obtient un trait fluide en marches.
      for (let i = 0; i < cellules.length; i++) {
        const p = cellules[i];
        const estPas = i === 0 || cellules[i - 1].r !== p.r;
        set(p.r, p.c, estPas ? diagChar : '─');
      }

      // étiquette de direction au milieu du trajet (horizontale)
      if (cellules.length > 0) {
        const mid = cellules[Math.floor(cellules.length / 2)];
        const label = a.via ? `[${a.via.type === 'porte' ? 'P' : 'O'}]${a.via.nom}` : this.intituleLocalisation(loc);
        const lab = ' ' + this.tronquer(label, 10) + ' ';
        const labelStart = Math.max(0, Math.floor(mid.c - lab.length / 2));
        setStr(mid.r, labelStart, lab);
      }
    }
  }

  /**
   * Compte récursivement tous les descendants d'un objet parent
   * (objets posés/contenus + items d'inventaire), à toute profondeur.
   */
  private compterDescendants(parentId: number): number {
    if (!this.carte) { return 0; }
    const enfants = this.carte.enfantsParObjet.get(parentId);
    if (!enfants || enfants.length === 0) { return 0; }
    let total = enfants.length;
    for (const e of enfants) {
      total += this.compterDescendants(e.objet.id);
    }
    return total;
  }

  /**
   * Dessine récursivement les enfants d'un parent, indentés en fonction du niveau de profondeur.
   * Retourne le `cr` après le dernier enfant dessiné.
   */
  private dessinerEnfants(
    parentId: number,
    niveau: number,
    cr: number,
    rowEnd: number,
    colStart: number,
    setStr: (r: number, c: number, s: string, meta?: Partial<CelluleAscii>) => void,
  ): number {
    if (!this.carte) { return cr; }
    const enfants = this.carte.enfantsParObjet.get(parentId);
    if (!enfants || enfants.length === 0) { return cr; }
    const indent = '  '.repeat(niveau);
    // espace utile pour le nom = contenu - leading ' ' - indent - '↳ '
    const placeNom = Math.max(3, (this.CELL_W - 2) - 1 - indent.length - 2);
    for (const e of enfants) {
      if (cr >= rowEnd) { return cr; }
      const nom = e.objet.intitule?.toString() ?? e.objet.nom ?? '';
      const t = indent + '↳ ' + this.tronquer(nom, placeNom);
      setStr(cr, colStart + 1, this.padRight(' ' + t, this.CELL_W - 2), { kind: 'objet', refId: e.objet.id });
      cr++;
      cr = this.dessinerEnfants(e.objet.id, niveau + 1, cr, rowEnd, colStart, setStr);
    }
    return cr;
  }

  private fusionnerSegments(ligne: CelluleAscii[]): SegmentAscii[] {
    const segs: SegmentAscii[] = [];
    let cur: SegmentAscii | null = null;
    for (const cel of ligne) {
      if (cur && cur.kind === cel.kind && cur.refId === cel.refId) {
        cur.texte += cel.c;
      } else {
        cur = { texte: cel.c, kind: cel.kind, refId: cel.refId };
        segs.push(cur);
      }
    }
    return segs;
  }

  private tronquer(s: string, max: number): string {
    if (s.length <= max) { return s; }
    if (max <= 1) { return s.slice(0, max); }
    return s.slice(0, max - 1) + '…';
  }

  private padRight(s: string, n: number): string {
    if (s.length >= n) { return s.slice(0, n); }
    return s + ' '.repeat(n - s.length);
  }
}
