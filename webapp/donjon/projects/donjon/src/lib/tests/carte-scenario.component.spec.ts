import { CarteScenarioComponent } from "../ui/carte-scenario/carte-scenario.component";
import { TestUtils } from "../utils/test-utils";

describe('CarteScenarioComponent — débordement de cellule', () => {

  /** Compte les segments « +N de plus » et extrait le N de chacun. */
  function compterMarqueursPlus(c: CarteScenarioComponent): { count: number, totaux: number[] } {
    let count = 0;
    const totaux: number[] = [];
    for (const ligne of c.lignesSegmentees) {
      for (const seg of ligne) {
        if (seg.kind === 'plus') {
          count++;
          const m = seg.texte.match(/\+(\d+)\s+de plus/);
          if (m) { totaux.push(parseInt(m[1], 10)); }
        }
      }
    }
    return { count, totaux };
  }

  /** Concatène tout le texte de la carte pour vérifier la présence d'un nom d'objet. */
  function texteCarte(c: CarteScenarioComponent): string {
    return c.lignesSegmentees
      .map(ligne => ligne.map(seg => seg.texte).join(''))
      .join('\n');
  }

  it('[F060-T021] salle saturée : un marqueur « +N de plus » remplace les objets en surplus', () => {
    // 20 objets dans une salle → débordement du plafond (CELL_H_MAX = 18 lignes, soit ~15 lignes utiles).
    let objetsDjn = '';
    for (let i = 1; i <= 20; i++) { objetsDjn += `Le truc${i} est un objet dans la chambre.\n`; }
    const scenario = `
La chambre est un lieu.
${objetsDjn}
Le joueur est dans la chambre.
`;
    const jeu = TestUtils.genererLeJeu(scenario);

    const c = new CarteScenarioComponent();
    c.jeu = jeu;
    c.ngOnChanges({});

    const { count, totaux } = compterMarqueursPlus(c);
    expect(count).withContext('un seul marqueur « +N de plus » sur la cellule saturée').toBe(1);
    expect(totaux[0]).withContext('N reflète le nombre d\'objets cachés').toBeGreaterThan(0);

    // Les premiers objets doivent être affichés, les derniers cachés.
    const texte = texteCarte(c);
    expect(texte).withContext('truc1 visible').toContain('truc1');
    expect(texte).withContext('truc20 caché').not.toContain('truc20');
  });

  it('[F060-T022] clic sur « +N de plus » : la cellule s\'étend et tous les objets deviennent visibles', () => {
    let objetsDjn = '';
    for (let i = 1; i <= 20; i++) { objetsDjn += `Le truc${i} est un objet dans la chambre.\n`; }
    const scenario = `
La chambre est un lieu.
${objetsDjn}
Le joueur est dans la chambre.
`;
    const jeu = TestUtils.genererLeJeu(scenario);
    const chambreId = jeu.lieux.find(l => l.nom === 'chambre')!.id;

    const c = new CarteScenarioComponent();
    c.jeu = jeu;
    c.ngOnChanges({});

    // état initial : objets en surplus, marqueur présent
    expect(compterMarqueursPlus(c).count).toBe(1);
    expect(texteCarte(c)).not.toContain('truc20');

    // toggler l'expansion sur la cellule de la chambre
    c.togglerExpansionCellule(chambreId);

    // après expansion : tous les objets visibles, plus de marqueur « +N de plus » (mais éventuellement « replier »).
    const texte = texteCarte(c);
    expect(texte).withContext('truc1 visible après expansion').toContain('truc1');
    expect(texte).withContext('truc20 visible après expansion').toContain('truc20');
    // Aucun marqueur de troncature numérique n'est attendu (peut afficher « replier »).
    const { totaux } = compterMarqueursPlus(c);
    expect(totaux.length).withContext('plus de marqueur « +N »').toBe(0);

    // second toggle → repli, le marqueur « +N » revient.
    c.togglerExpansionCellule(chambreId);
    expect(compterMarqueursPlus(c).count).withContext('marqueur revient après repli').toBe(1);
  });

  it('[F060-T023] salle peu peuplée : pas de marqueur « +N de plus »', () => {
    const scenario = `
La chambre est un lieu.
Le livre est un objet dans la chambre.
La pomme est un objet dans la chambre.

Le joueur est dans la chambre.
`;
    const jeu = TestUtils.genererLeJeu(scenario);

    const c = new CarteScenarioComponent();
    c.jeu = jeu;
    c.ngOnChanges({});

    expect(compterMarqueursPlus(c).count).toBe(0);
    const texte = texteCarte(c);
    expect(texte).toContain('livre');
    expect(texte).toContain('pomme');
  });
});
