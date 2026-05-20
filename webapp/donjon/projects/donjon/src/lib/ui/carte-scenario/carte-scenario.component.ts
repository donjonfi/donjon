import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';

import { CarteArete, CarteBuilder, CarteLieuInfo, CarteNoeud, CarteScenario, CarteSortieCardinale, CarteSortieSpeciale } from '../../utils/jeu/carte-builder';
import { ELocalisation, Localisation } from '../../models/jeu/localisation';
import { ClasseUtils } from '../../utils/commun/classe-utils';
import { EClasseRacine } from '../../models/commun/constantes';
import { ElementsJeuUtils } from '../../utils/commun/elements-jeu-utils';
import { Jeu } from '../../models/jeu/jeu';
import { Lieu } from '../../models/jeu/lieu';
import { Objet } from '../../models/jeu/objet';
import { ObjetPresent } from '../visualisation/models/objet-present';
import { PrepositionSpatiale } from '../../models/jeu/position-objet';

type Kind = 'lieu' | 'objet' | 'personne' | 'joueur' | 'sortie-lieu' | 'plus';

/** Ligne de contenu à dessiner dans une cellule de lieu (collectée en amont du rendu pour pouvoir gérer le débordement). */
interface LigneContenu {
  texte: string;
  kind?: Kind;
  refId?: number;
}

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

  @ViewChild('asciiWrapEl') asciiWrapEl?: ElementRef<HTMLElement>;

  public carte: CarteScenario | null = null;
  public lignesSegmentees: SegmentAscii[][] = [];

  public eju: ElementsJeuUtils | null = null;
  public objetVisible: ObjetPresent | null = null;
  public lieuSelectionneId: number | null = null;
  public objetSelectionneId: number | null = null;

  /** Pile d'IDs de lieux ayant servi de racine à un zoom. Vide = vue d'ensemble. */
  public pileRacines: number[] = [];

  /**
   * IDs de lieux dont la cellule est étendue (clic sur « +N de plus »).
   * Quand un lieu est ici, sa cellule s'agrandit pour afficher tout son contenu —
   * la grille entière s'adapte puisque la hauteur d'une row du grid = max des cellules de cette row.
   * Réinitialisé sur `ngOnChanges` (nouveau jeu → état UI fraîche).
   */
  public cellulesEtendues = new Set<number>();

  /** La légende flottante (types/états) est-elle masquée ? Préférence d'affichage, persistée pendant la session. */
  public legendeMasquee = false;

  /** Bascule l'affichage de la légende. */
  public togglerLegende(): void {
    this.legendeMasquee = !this.legendeMasquee;
  }

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
    this.cellulesEtendues.clear();
    // nouvelle carte = on remet le popup à sa position par défaut + on réactive le repositionnement auto
    this.popupLeft = null;
    this.popupTop = null;
    this.popupPositionManuelle = false;
    this.recalculer();
  }

  /** Bascule l'expansion d'une cellule (clic sur « +N de plus » ou réduction). */
  public togglerExpansionCellule(lieuId: number): void {
    if (this.cellulesEtendues.has(lieuId)) {
      this.cellulesEtendues.delete(lieuId);
    } else {
      this.cellulesEtendues.add(lieuId);
    }
    this.genererAscii();
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

  public listeEtatsLieu(lieu: Lieu): string {
    if (!this.jeu || !lieu) { return ''; }
    return this.jeu.etats.obtenirIntitulesEtatsElementJeu(lieu);
  }

  // ASCII strict pour éviter les décalages : certains glyphes Unicode (↑↓⤓⤒↗ etc.)
  // sont en East Asian Width « ambiguous » et rendent en 2 cellules dans plusieurs
  // polices monospace courantes (Consolas, Cascadia Code selon plateforme), ce qui
  // décale tout le contenu de la ligne et désaligne la bordure droite `│` de la boîte.
  public flecheSpeciale(loc: ELocalisation): string {
    switch (loc) {
      case ELocalisation.haut: return '^';
      case ELocalisation.bas: return 'v';
      case ELocalisation.interieur: return '[';
      case ELocalisation.exterieur: return ']';
      case ELocalisation.nord_est: return '/';
      case ELocalisation.nord_ouest: return '\\';
      case ELocalisation.sud_est: return '\\';
      case ELocalisation.sud_ouest: return '/';
      default: return '>';
    }
  }

  // ─────────────────────────────────────────
  // Sélection (carte + panneau)
  // ─────────────────────────────────────────

  public onClickSegment(seg: SegmentAscii, event?: MouseEvent): void {
    if (!seg.kind || seg.refId == null) { return; }
    // « +N de plus » : déplie/replie la cellule du lieu sans toucher au popup.
    if (seg.kind === 'plus') {
      this.togglerExpansionCellule(seg.refId);
      this.focuserCarte();
      return;
    }
    // Évite que le popup masque la case cliquée : on bascule à gauche si clic à droite.
    if (event && event.currentTarget instanceof HTMLElement) {
      this.repositionnerPopupAuto(event.currentTarget);
    }
    // donne le focus à la carte pour activer la navigation au clavier
    this.focuserCarte();
    if (seg.kind === 'lieu' || seg.kind === 'sortie-lieu') {
      this.zoomerSurLieu(seg.refId);
    } else {
      this.selectionnerObjet(seg.refId);
    }
  }

  /** Donne le focus au conteneur de la carte ASCII pour activer les flèches directionnelles. */
  private focuserCarte(): void {
    this.asciiWrapEl?.nativeElement.focus({ preventScroll: true });
  }

  /**
   * Si l'utilisateur n'a pas déplacé le popup manuellement, choisit automatiquement
   * un coin opposé à la cellule cliquée pour ne pas la masquer.
   */
  private repositionnerPopupAuto(cible: HTMLElement): void {
    if (this.popupPositionManuelle) { return; }
    const wrap = this.asciiWrapEl?.nativeElement;
    if (!wrap) { return; }
    const wrapRect = wrap.getBoundingClientRect();
    const cibleRect = cible.getBoundingClientRect();
    const dxClic = cibleRect.left - wrapRect.left;
    if (dxClic > wrapRect.width / 2) {
      // clic dans la moitié droite → popup en haut-gauche
      this.popupLeft = 8;
      this.popupTop = 8;
    } else {
      // clic dans la moitié gauche → popup en haut-droite (défaut CSS)
      this.popupLeft = null;
      this.popupTop = null;
    }
  }

  /**
   * Sélectionner un lieu = le mettre au centre de la carte (mode auto sur ses voisins).
   * Conserver en accès public pour les liens du panneau et du mode liste.
   */
  public selectionnerLieu(id: number): void {
    this.zoomerSurLieu(id);
  }

  /**
   * Fermer le panneau de détail (vide la sélection sans toucher au zoom).
   * La position du popup est CONSERVÉE pour le prochain affichage — utile quand l'utilisateur
   * a déplacé le popup pour libérer une zone. Elle n'est remise à zéro qu'au chargement d'une
   * nouvelle carte (ngOnChanges).
   */
  public fermerDetail(): void {
    this.lieuSelectionneId = null;
    this.objetSelectionneId = null;
    this.objetVisible = null;
  }

  // ─────────────────────────────────────────
  // Drag & drop du popup détail
  // ─────────────────────────────────────────

  /** Position courante du popup (px, relative à `__ascii-wrap`). null = position par défaut (top-right). */
  public popupLeft: number | null = null;
  public popupTop: number | null = null;

  /** Vrai dès que l'utilisateur a déplacé le popup manuellement → on ne le repositionne plus auto. */
  private popupPositionManuelle = false;

  private dragActif = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartLeft = 0;
  private dragStartTop = 0;

  /** Pan (déplacement du scroll) de la carte par clic-glisser sur le fond ASCII. */
  public panActif = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartScrollLeft = 0;
  private panStartScrollTop = 0;
  private panEl: HTMLElement | null = null;

  public onCartePanStart(event: MouseEvent, asciiEl: HTMLElement): void {
    // ignore les clics sur un segment cliquable (lieu, objet, etc.) — laisse le click normal
    const target = event.target as HTMLElement;
    if (target.closest('.seg')) { return; }
    // ne déclenche que sur le bouton gauche
    if (event.button !== 0) { return; }
    this.panActif = true;
    this.panEl = asciiEl;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panStartScrollLeft = asciiEl.scrollLeft;
    this.panStartScrollTop = asciiEl.scrollTop;
    // donne le focus à la carte → les flèches directionnelles fonctionnent ensuite
    this.focuserCarte();
    event.preventDefault();
  }

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
    // l'utilisateur prend le contrôle : plus de repositionnement auto sur les clics suivants
    this.popupPositionManuelle = true;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  public onDocumentMouseMove(event: MouseEvent): void {
    if (this.dragActif) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      this.popupLeft = this.dragStartLeft + dx;
      this.popupTop = this.dragStartTop + dy;
      return;
    }
    if (this.panActif && this.panEl) {
      const dx = event.clientX - this.panStartX;
      const dy = event.clientY - this.panStartY;
      this.panEl.scrollLeft = this.panStartScrollLeft - dx;
      this.panEl.scrollTop = this.panStartScrollTop - dy;
    }
  }

  @HostListener('document:mouseup')
  public onDocumentMouseUp(): void {
    this.dragActif = false;
    this.panActif = false;
  }

  // ─────────────────────────────────────────
  // Navigation au clavier (flèches directionnelles)
  // ─────────────────────────────────────────

  /**
   * Déplace la sélection vers la boîte spatialement voisine sur la grille (selon la flèche).
   * Le critère est PUREMENT géométrique (gx/gy des nœuds), pas le type de lien : on suit ce
   * qui est visible à l'œil — facile à comprendre pour l'utilisateur.
   * Ignoré si la carte n'a pas le focus.
   */
  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    // On ne capte les flèches que si le focus est DANS la carte (wrap focusable ou un de ses descendants).
    const wrap = this.asciiWrapEl?.nativeElement;
    if (!wrap) { return; }
    const active = document.activeElement as HTMLElement | null;
    if (active !== wrap && !(active && wrap.contains(active))) { return; }
    if (event.ctrlKey || event.altKey || event.metaKey) { return; }

    const delta = this.deltaDeTouche(event.key);
    if (!delta || !this.carte || this.carte.noeuds.length === 0) { return; }

    // nœud courant : le lieu sélectionné si placé sur la grille, sinon celui du joueur, sinon le premier.
    const idCourant = this.lieuSelectionneId
      ?? (this.jeu?.joueur?.position?.cibleId ?? null);
    let courant = idCourant != null
      ? this.carte.noeuds.find(n => n.lieu.id === idCourant)
      : undefined;
    if (!courant) { courant = this.carte.noeuds.find(n => n.joueurPresent) ?? this.carte.noeuds[0]; }
    if (!courant) { return; }

    // Cherche le nœud le plus proche dans la direction demandée.
    // Priorité : déplacement minimal dans l'axe principal, puis écart minimal sur l'axe secondaire.
    const cible = this.trouverVoisinSpatial(courant, delta);
    if (!cible) { return; }

    event.preventDefault();
    this.zoomerSurLieu(cible.lieu.id);
  }

  private deltaDeTouche(key: string): { dx: number; dy: number } | null {
    switch (key) {
      case 'ArrowUp':    return { dx:  0, dy: -1 };
      case 'ArrowDown':  return { dx:  0, dy:  1 };
      case 'ArrowLeft':  return { dx: -1, dy:  0 };
      case 'ArrowRight': return { dx:  1, dy:  0 };
      default: return null;
    }
  }

  /**
   * Renvoie le nœud le plus proche dans la direction (dx, dy) depuis `courant`.
   * Axe principal = celui où le delta est non nul ; axe secondaire = l'autre.
   * Sélectionne le candidat qui minimise le déplacement principal, puis l'écart secondaire.
   */
  private trouverVoisinSpatial(courant: CarteNoeud, delta: { dx: number; dy: number }): CarteNoeud | null {
    if (!this.carte) { return null; }
    const axePrinc: 'x' | 'y' = delta.dx !== 0 ? 'x' : 'y';
    const axeSecond: 'x' | 'y' = axePrinc === 'x' ? 'y' : 'x';
    const sens = delta.dx !== 0 ? delta.dx : delta.dy;
    let meilleur: CarteNoeud | null = null;
    let meilleurDist = Number.POSITIVE_INFINITY;
    let meilleurEcart = Number.POSITIVE_INFINITY;
    for (const n of this.carte.noeuds) {
      if (n.lieu.id === courant.lieu.id) { continue; }
      const deltaPrinc = (n[axePrinc] - courant[axePrinc]) * sens;
      if (deltaPrinc <= 0) { continue; }  // pas dans la bonne direction
      const ecartSecond = Math.abs(n[axeSecond] - courant[axeSecond]);
      // priorité : distance principale minimale, puis écart secondaire minimal
      if (deltaPrinc < meilleurDist
          || (deltaPrinc === meilleurDist && ecartSecond < meilleurEcart)) {
        meilleur = n;
        meilleurDist = deltaPrinc;
        meilleurEcart = ecartSecond;
      }
    }
    return meilleur;
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

  /** Statistiques globales pour l'affichage en pied de légende. */
  public get stats(): { lieux: number; personnes: number; objets: number; portes: number; obstacles: number } | null {
    if (!this.jeu) { return null; }
    let personnes = 0, objets = 0, portes = 0, obstacles = 0;
    for (const o of this.jeu.objets) {
      if (this.jeu.joueur && o.id === this.jeu.joueur.id) { continue; }
      if (ClasseUtils.heriteDe(o.classe, EClasseRacine.porte)) { portes++; continue; }
      if (ClasseUtils.heriteDe(o.classe, EClasseRacine.obstacle)) { obstacles++; continue; }
      if (ClasseUtils.heriteDe(o.classe, EClasseRacine.vivant)) { personnes++; continue; }
      objets++;
    }
    return { lieux: this.jeu.lieux.length, personnes, objets, portes, obstacles };
  }

  // ─────────────────────────────────────────
  // Génération de la matrice ASCII et de ses segments
  // ─────────────────────────────────────────

  /** Plafond de hauteur d'une cellule non étendue (en lignes ASCII). */
  private readonly CELL_H_MAX = 18;

  private genererAscii(): void {
    if (!this.carte || this.carte.noeuds.length === 0) {
      this.lignesSegmentees = [];
      return;
    }
    const { minX, maxX, minY, maxY, noeuds } = this.carte;
    const nCols = maxX - minX + 1;
    const nRows = maxY - minY + 1;

    // collecter le contenu de chaque cellule en amont (réutilisé pour la hauteur de row ET le rendu)
    const lignesParNoeud = new Map<number, LigneContenu[]>();
    for (const n of noeuds) {
      lignesParNoeud.set(n.lieu.id, this.collecterLignesContenu(n));
    }

    // hauteur dynamique par row du grid (min 4, plafond CELL_H_MAX sauf si une cellule étendue
    // de cette row force une hauteur plus grande pour afficher tout son contenu).
    const rowHeights: number[] = [];
    for (let y = 0; y < nRows; y++) {
      let h = 4;
      const noeudsLigne = noeuds.filter(n => n.y === minY + y);
      for (const n of noeudsLigne) {
        const lignes = lignesParNoeud.get(n.lieu.id)!;
        const etendue = this.cellulesEtendues.has(n.lieu.id);
        // hauteur naturelle = 2 bordures + toutes les lignes de contenu
        // (+1 ligne supplémentaire pour le marqueur « replier » quand la cellule est étendue)
        let requis = 2 + lignes.length + (etendue && lignes.length > this.CELL_H_MAX - 2 ? 1 : 0);
        if (!etendue && requis > this.CELL_H_MAX) { requis = this.CELL_H_MAX; }
        if (requis > h) { h = requis; }
      }
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

      // contenu : lignes pré-collectées, troncature avec marqueur « +N de plus » si débordement
      const lignes = lignesParNoeud.get(n.lieu.id)!;
      const etendue = this.cellulesEtendues.has(n.lieu.id);
      const placeContenu = rowHeights[gy] - 2; // place entre les deux bordures (titre inclus)
      let nAAfficher = lignes.length;
      let masquees = 0;
      if (!etendue && lignes.length > placeContenu) {
        // on réserve la dernière ligne au marqueur cliquable « +N de plus »
        nAAfficher = placeContenu - 1;
        masquees = lignes.length - nAAfficher;
      }

      let cr = rowStart + 1;
      for (let i = 0; i < nAAfficher; i++) {
        const lc = lignes[i];
        setStr(cr, colStart + 1, this.padRight(lc.texte, this.CELL_W - 2), { kind: lc.kind, refId: lc.refId });
        cr++;
      }
      if (masquees > 0) {
        const t = ` … +${masquees} de plus`;
        setStr(cr, colStart + 1, this.padRight(t, this.CELL_W - 2), { kind: 'plus', refId: n.lieu.id });
      } else if (etendue && lignes.length > this.CELL_H_MAX - 2) {
        // Cellule étendue : on affiche un marqueur de repli sur la dernière ligne disponible.
        // (Si on a la place et qu'on a réellement déplié quelque chose.)
        const t = ` … replier`;
        setStr(rowEnd - 1, colStart + 1, this.padRight(t, this.CELL_W - 2), { kind: 'plus', refId: n.lieu.id });
      }
    }

    // -- DESSINER ARÊTES --
    // Set partagé des cellules occupées par les étiquettes, pour éviter qu'elles se superposent.
    const etiquettesOccupees = new Set<string>();
    for (const a of this.carte.aretes) {
      this.tracerArete(matrice, a, rowOffsets, rowHeights, minX, minY, set, setStr, etiquettesOccupees);
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
    etiquettesOccupees: Set<string>,
  ): void {
    /** Tente de poser une étiquette à (r, c) ; en cas de chevauchement avec une autre étiquette
     *  déjà posée, essaie des décalages ±1 puis ±2 rangées. Retourne true si placée. */
    const poserEtiquette = (r: number, c: number, texte: string): boolean => {
      const decalages = [0, -1, 1, -2, 2];
      for (const dr of decalages) {
        const rEssai = r + dr;
        let conflit = false;
        for (let i = 0; i < texte.length; i++) {
          if (etiquettesOccupees.has(`${rEssai},${c + i}`)) { conflit = true; break; }
        }
        if (!conflit) {
          for (let i = 0; i < texte.length; i++) {
            etiquettesOccupees.add(`${rEssai},${c + i}`);
          }
          setStr(rEssai, c, texte);
          return true;
        }
      }
      return false;
    };
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
      poserEtiquette(rowMid, start, lab);
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
      poserEtiquette(rowMid, colMid + 2, this.tronquer(label, 12));
    } else if (
      (loc === ELocalisation.nord_est || loc === ELocalisation.nord_ouest
        || loc === ELocalisation.sud_est || loc === ELocalisation.sud_ouest)
      && dx !== 0 && dy !== 0
    ) {
      // Diagonale en L : tracé en deux segments avec UN seul coude à 90°.
      // On part du coin (┌┐└┘) de la source qui pointe vers la cible, on tire un segment
      // vertical jusqu'à la rangée du coin opposé de la cible, on tourne à l'angle, puis on
      // termine par un segment horizontal jusqu'à ce coin opposé.
      //
      // NE : top-right de la source ┐ → ┤ ; bottom-left de la cible └ → ┴ ; coude ┌
      // SE : bot-right de la source ┘ → ┤ ; top-left  de la cible ┌ → ┬ ; coude └
      // NO : top-left  de la source ┌ → ├ ; bot-right de la cible ┘ → ┴ ; coude ┐
      // SO : bot-left  de la source └ → ├ ; top-right de la cible ┐ → ┬ ; coude ┘
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

      let sCornerRow: number, sCornerCol: number;
      let tCornerRow: number, tCornerCol: number;
      let safeRow: number;
      let sCornerChar: string, tCornerChar: string;
      let elbow1: string, elbow2: string;

      if (versEst && !versSud) {           // NE
        sCornerRow = rsTop; sCornerCol = sColRight; sCornerChar = '┤';
        tCornerRow = rtBot; tCornerCol = tColLeft;  tCornerChar = '├';
        safeRow = rtBot + 1;  elbow1 = '┌'; elbow2 = '┘';
      } else if (versEst && versSud) {     // SE
        sCornerRow = rsBot; sCornerCol = sColRight; sCornerChar = '┤';
        tCornerRow = rtTop; tCornerCol = tColLeft;  tCornerChar = '├';
        safeRow = rtTop - 1;  elbow1 = '└'; elbow2 = '┐';
      } else if (!versEst && !versSud) {   // NO
        sCornerRow = rsTop; sCornerCol = sCol;      sCornerChar = '├';
        tCornerRow = rtBot; tCornerCol = tColRight; tCornerChar = '┤';
        safeRow = rtBot + 1;  elbow1 = '┐'; elbow2 = '└';
      } else {                              // SO
        sCornerRow = rsBot; sCornerCol = sCol;      sCornerChar = '├';
        tCornerRow = rtTop; tCornerCol = tColRight; tCornerChar = '┤';
        safeRow = rtTop - 1;  elbow1 = '┘'; elbow2 = '┌';
      }

      // remplace les coins de la source et de la cible
      set(sCornerRow, sCornerCol, sCornerChar);
      set(tCornerRow, tCornerCol, tCornerChar);
      // coude 1 (avant la cible, dans le GAP_V) — angle principal du L
      set(safeRow, sCornerCol, elbow1);
      // coude 2 (à la colonne de la cible, dans le GAP_V)
      set(safeRow, tCornerCol, elbow2);

      // segment vertical (coin source → coude 1)
      if (versSud) {
        for (let r = sCornerRow + 1; r < safeRow; r++) { set(r, sCornerCol, '│'); }
      } else {
        for (let r = safeRow + 1; r < sCornerRow; r++) { set(r, sCornerCol, '│'); }
      }
      // segment horizontal entre les deux coudes
      if (versEst) {
        for (let c = sCornerCol + 1; c < tCornerCol; c++) { set(safeRow, c, '─'); }
      } else {
        for (let c = tCornerCol + 1; c < sCornerCol; c++) { set(safeRow, c, '─'); }
      }
      // dernier tronçon vertical entre coude 2 et coin cible
      // (en général une seule cellule entre safeRow et tCornerRow — pas de boucle si adjacents)
      if (versSud) {
        for (let r = safeRow + 1; r < tCornerRow; r++) { set(r, tCornerCol, '│'); }
      } else {
        for (let r = tCornerRow + 1; r < safeRow; r++) { set(r, tCornerCol, '│'); }
      }

      // étiquette : milieu du segment horizontal (rangée du coude principal)
      const label = a.via ? `[${a.via.type === 'porte' ? 'P' : 'O'}]${a.via.nom}` : this.intituleLocalisation(loc);
      const lab = ' ' + this.tronquer(label, 10) + ' ';
      const labelStart = Math.floor((sCornerCol + tCornerCol - lab.length) / 2);
      poserEtiquette(safeRow, labelStart, lab);
    }
  }

  /**
   * Collecte toutes les lignes à afficher dans la cellule d'un lieu (titre, joueur + inventaire,
   * personnes + descendants, objets + descendants, sorties spéciales).
   * Le rendu décide ensuite combien de lignes afficher en fonction de l'espace dispo
   * et insère un marqueur « +N de plus » si débordement.
   */
  private collecterLignesContenu(n: CarteNoeud): LigneContenu[] {
    const lignes: LigneContenu[] = [];
    // titre du lieu
    const titre = this.tronquer(this.titreLieu(n.lieu), this.CELL_W - 4);
    lignes.push({ texte: ' ' + titre, kind: 'lieu', refId: n.lieu.id });
    // joueur + inventaire
    if (n.joueurPresent && this.jeu?.joueur) {
      const j = this.jeu.joueur;
      const t = this.tronquer('* ' + (j.intitule?.toString() ?? j.nom ?? 'joueur'), this.CELL_W - 5);
      lignes.push({ texte: ' ' + t, kind: 'joueur', refId: j.id });
      this.collecterEnfantsContenu(j.id, 1, lignes);
    }
    for (const p of n.personnes) {
      const t = this.tronquer('@ ' + this.formaterIntitule(p), this.CELL_W - 5);
      lignes.push({ texte: ' ' + t, kind: 'personne', refId: p.id });
      this.collecterEnfantsContenu(p.id, 1, lignes);
    }
    for (const o of n.objets) {
      const t = this.tronquer(this.formaterIntitule(o, '• '), this.CELL_W - 5);
      lignes.push({ texte: ' ' + t, kind: 'objet', refId: o.id });
      this.collecterEnfantsContenu(o.id, 1, lignes);
    }
    for (const s of n.sortiesSpeciales) {
      const fleche = this.flecheSpeciale(s.localisation);
      const t = this.tronquer(fleche + ' ' + s.cibleNom, this.CELL_W - 5);
      const kind: Kind = s.cibleType === 'lieu' ? 'sortie-lieu' : 'objet';
      lignes.push({ texte: ' ' + t, kind, refId: s.cibleId });
    }
    return lignes;
  }

  /**
   * Collecte récursivement les enfants d'un parent (objets posés sur/sous/dans + items
   * d'inventaire), indentés selon le niveau, dans la liste `lignes` fournie.
   */
  private collecterEnfantsContenu(parentId: number, niveau: number, lignes: LigneContenu[]): void {
    if (!this.carte) { return; }
    const enfants = this.carte.enfantsParObjet.get(parentId);
    if (!enfants || enfants.length === 0) { return; }
    const indent = '  '.repeat(niveau);
    // espace utile pour le nom = contenu - leading ' ' - indent - '• '
    const placeNom = Math.max(3, (this.CELL_W - 2) - 1 - indent.length - 2);
    for (const e of enfants) {
      const t = indent + this.tronquer(this.formaterIntitule(e.objet, '• ', e.prep), placeNom);
      lignes.push({ texte: ' ' + t, kind: 'objet', refId: e.objet.id });
      this.collecterEnfantsContenu(e.objet.id, niveau + 1, lignes);
    }
  }

  /**
   * Décore l'intitulé d'un objet pour l'affichage dans une boîte :
   *  - si `prep` vaut `sur` → préfixe `+ ` (objet posé au-dessus)
   *  - si `prep` vaut `sous` → préfixe `- ` (objet posé en dessous)
   *  - sinon préfixe `{ ` si contenant, `= ` si support, sinon `prefixeParDefaut` (ex. `• ` pour les objets)
   *  - suffixe : lettres des états actifs (d=décor, f=fixé, i=invisible,
   *    a=inaccessible, s=secret, r=discret), accolées
   * Exemple : `{ la bourse fi`
   */
  private formaterIntitule(objet: Objet, prefixeParDefaut: string = '', prep?: PrepositionSpatiale): string {
    let prefixe = prefixeParDefaut;
    if (prep === PrepositionSpatiale.sur) { prefixe = '+ '; }
    else if (prep === PrepositionSpatiale.sous) { prefixe = '- '; }
    else if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.contenant)) { prefixe = '{ '; }
    else if (ClasseUtils.heriteDe(objet.classe, EClasseRacine.support)) { prefixe = '= '; }
    const nom = objet.intitule?.toString() ?? objet.nom ?? '';
    const etats = this.collecterEtatsLettres(objet);
    return prefixe + nom + (etats ? ' ' + etats : '');
  }

  /** Retourne la chaîne d'états actifs sous forme de lettres concaténées. */
  private collecterEtatsLettres(objet: Objet): string {
    if (!this.jeu) { return ''; }
    const e = this.jeu.etats;
    let s = '';
    if (e.decoratifID >= 0 && e.possedeEtatIdElement(objet, e.decoratifID, null)) { s += 'd'; }
    if (e.fixeID >= 0 && e.possedeEtatIdElement(objet, e.fixeID, null)) { s += 'f'; }
    if (e.invisibleID >= 0 && e.possedeEtatIdElement(objet, e.invisibleID, null)) { s += 'i'; }
    if (e.inaccessibleID >= 0 && e.possedeEtatIdElement(objet, e.inaccessibleID, null)) { s += 'a'; }
    if (e.secretID >= 0 && e.possedeEtatIdElement(objet, e.secretID, null)) { s += 's'; }
    if (e.discretID >= 0 && e.possedeEtatIdElement(objet, e.discretID, null)) { s += 'r'; }
    return s;
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
