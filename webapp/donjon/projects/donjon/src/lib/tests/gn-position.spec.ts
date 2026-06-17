import { ExprReg } from "../utils/compilation/expr-reg";
import { xPositionElementGeneriqueDefini1GN } from "../utils/compilation/gn-derivees";
import { GroupeNominal } from "../models/commun/groupe-nominal";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//   [F077] POSITION DÉFINIE — dérivation GN en 1 groupe (caractérisation ancienne vs nouvelle)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("[F077] Position définie — regex dérivée (1 GN)", () => {

  // Corpus de définitions positionnées EXISTANTES (sans attribut antéposé) : la nouvelle regex doit
  // produire EXACTEMENT le même découpage que l'ancienne (caractérisation anti-régression).
  const corpus = [
    "Le cadenas bleu est dans le labo",
    "La pomme de terre (pommes de terre) est un légume pourri dans la grange ensorcelée",
    "L'allee principale (f) est un lieu au sud du depart",
    "Le bucheron est une personne ici",
    "Les torches en bois enflammees sont des objets maudits dans le jardin",
    "L'arbre se trouve dans la foret",
    "La gare est un lieu dans Lisbonne",
  ];

  it("[F077-T200] caractérisation : la regex dérivée ≡ l'ancienne sur le corpus existant", () => {
    corpus.forEach(phrase => {
      const o = ExprReg.xPositionElementGeneriqueDefini.exec(phrase);
      const n = xPositionElementGeneriqueDefini1GN.exec(phrase);
      expect(o).withContext(`ANCIENNE doit matcher: ${phrase}`).not.toBeNull();
      expect(n).withContext(`NOUVELLE doit matcher: ${phrase}`).not.toBeNull();

      // GN re-découpé via l'analyseur (groupe 1) doit égaler l'ancien découpage (groupes 1,2,3)
      const gn = GroupeNominal.analyser(n[1], { indefini: true })!;
      expect(gn.determinant ?? undefined).withContext(`${phrase} — déterminant`).toBe(o[1] ?? undefined);
      expect(gn.nom).withContext(`${phrase} — nom`).toBe(o[2]);
      expect(gn.epithete ?? undefined).withContext(`${phrase} — épithète`).toBe(o[3] ?? undefined);
      expect(gn.epithetesAvant).withContext(`${phrase} — pas d'attribut avant`).toEqual([]);

      // Queue : décalage de -2 (forme 4→2, type 5→3, attrs 6→4, prép 7→5, complément 8→6, ici 9→7)
      expect(n[2] ?? undefined).withContext(`${phrase} — forme`).toBe(o[4] ?? undefined);
      expect(n[3] ?? undefined).withContext(`${phrase} — type`).toBe(o[5] ?? undefined);
      expect(n[4] ?? undefined).withContext(`${phrase} — attributs`).toBe(o[6] ?? undefined);
      expect(n[5] ?? undefined).withContext(`${phrase} — préposition`).toBe(o[7] ?? undefined);
      expect(n[6] ?? undefined).withContext(`${phrase} — complément`).toBe(o[8] ?? undefined);
      expect(n[7] ?? undefined).withContext(`${phrase} — ici/dessus…`).toBe(o[9] ?? undefined);
    });
  });

  it("[F077-T201] nouvelle capacité : attribut antéposé dans une définition positionnée", () => {
    const n = xPositionElementGeneriqueDefini1GN.exec("Le grand chat poilu est un objet dans le bois");
    expect(n).not.toBeNull();
    const gn = GroupeNominal.analyser(n[1], { indefini: true })!;
    expect(gn.epithetesAvant).toEqual(["grand"]);
    expect(gn.nom).toBe("chat");
    expect(gn.epithete).toBe("poilu");
    expect(n[3]).toBe("objet");    // type
    expect(n[5]).toBe("dans le "); // préposition (inclut l'article, comme l'ancienne regex)
    expect(n[6]).toBe("bois");     // complément
  });

  it("[F077-T202] nouvelle capacité : attributs coordonnés dans une définition positionnée", () => {
    const n = xPositionElementGeneriqueDefini1GN.exec("Le chaton rouge et blanc est un objet ici");
    expect(n).not.toBeNull();
    const gn = GroupeNominal.analyser(n[1], { indefini: true })!;
    expect(gn.nom).toBe("chaton");
    expect(gn.epithete).toBe("rouge et blanc");
    expect(n[7]).toBe("ici");
  });
});
