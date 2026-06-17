import { ExprReg } from "../utils/compilation/expr-reg";
import { xCommandeInfinitif1GN } from "../utils/compilation/gn-derivees";
import { decomposerResteGN } from "../models/commun/gn-fragments";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
//   [F077] COMMANDES — xCommandeInfinitif dérivée (GN « reste » en 1 groupe)
// ═══════════════════════════════════════════════════════════════════════════════════════════════
//
// Ancienne disposition : verbe(1) prép0(2) det1(3) nom1(4) épi1(5) wrapper(6) prép2(7) det2(8) nom2(9) épi2(10).
// Nouvelle disposition  : verbe(1) prép0(2) det1(3) reste1(4) wrapper(5) prép2(6) det2(7) reste2(8).

describe("[F077] Commandes — xCommandeInfinitif dérivée", () => {

  const corpus = [
    "examiner la porte",
    "utiliser la cle rouge avec la porte verte",
    "donner la piece au pirate",
    "jeter l'epee",
    "peindre sur la porte",
    "mettre le livre sur la table",
    "examiner les objets dans le coffre",
    "utiliser la clé du capitaine sur le coffre du capitaine",
    "utiliser la clé du capitaine sur le coffre",
    "fouiller",
  ];

  it("[F077-T300] caractérisation : la commande dérivée ≡ l'ancienne sur le corpus existant", () => {
    corpus.forEach(cmd => {
      const o = ExprReg.xCommandeInfinitif.exec(cmd);
      const n = xCommandeInfinitif1GN.exec(cmd);
      expect(o).withContext(`ANCIENNE doit matcher: ${cmd}`).not.toBeNull();
      expect(n).withContext(`NOUVELLE doit matcher: ${cmd}`).not.toBeNull();

      expect(n[1]).withContext(`${cmd} — verbe`).toBe(o[1]);
      expect(n[2] ?? undefined).withContext(`${cmd} — prép0`).toBe(o[2] ?? undefined);
      expect(n[3] ?? undefined).withContext(`${cmd} — det1`).toBe(o[3] ?? undefined);

      // reste1 re-découpé == ancien nom1/épi1
      if (o[4]) {
        const gn1 = decomposerResteGN(n[4], false)!;
        expect(gn1.nom).withContext(`${cmd} — nom1`).toBe(o[4]);
        expect(gn1.epithete ?? undefined).withContext(`${cmd} — épi1`).toBe(o[5] ?? undefined);
        expect(gn1.epithetesAvant).withContext(`${cmd} — pas d'avant`).toEqual([]);
      } else {
        expect(n[4] ?? undefined).toBe(undefined);
      }

      // wrapper (texte capturé identique), prép2, det2
      expect(n[5] ?? undefined).withContext(`${cmd} — wrapper`).toBe(o[6] ?? undefined);
      expect(n[6] ?? undefined).withContext(`${cmd} — prép2`).toBe(o[7] ?? undefined);
      expect(n[7] ?? undefined).withContext(`${cmd} — det2`).toBe(o[8] ?? undefined);

      if (o[9]) {
        const gn2 = decomposerResteGN(n[8], false)!;
        expect(gn2.nom).withContext(`${cmd} — nom2`).toBe(o[9]);
        expect(gn2.epithete ?? undefined).withContext(`${cmd} — épi2`).toBe(o[10] ?? undefined);
      } else {
        expect(n[8] ?? undefined).toBe(undefined);
      }
    });
  });

  it("[F077-T301] nouveau : attribut antéposé dans la commande", () => {
    const n = xCommandeInfinitif1GN.exec("examiner le grand chat poilu");
    expect(n).not.toBeNull();
    expect(n[3]).toBe("le ");
    const gn = decomposerResteGN(n[4], false)!;
    expect(gn.epithetesAvant).toEqual(["grand"]);
    expect(gn.nom).toBe("chat");
    expect(gn.epithete).toBe("poilu");
  });

  it("[F077-T302] nouveau : deux GN à attributs (avant + coordonné) de part et d'autre de la préposition", () => {
    const n = xCommandeInfinitif1GN.exec("mettre le grand livre rouge sur la petite table");
    expect(n).not.toBeNull();
    const gn1 = decomposerResteGN(n[4], false)!;
    expect(gn1.epithetesAvant).toEqual(["grand"]);
    expect(gn1.nom).toBe("livre");
    expect(gn1.epithete).toBe("rouge");
    expect(n[6]).toBe("sur");
    const gn2 = decomposerResteGN(n[8], false)!;
    expect(gn2.epithetesAvant).toEqual(["petite"]);
    expect(gn2.nom).toBe("table");
  });

  it("[F077-T303] nouveau : attributs coordonnés", () => {
    const n = xCommandeInfinitif1GN.exec("prendre le chaton rouge et blanc");
    expect(n).not.toBeNull();
    const gn = decomposerResteGN(n[4], false)!;
    expect(gn.nom).toBe("chaton");
    expect(gn.epithete).toBe("rouge et blanc");
  });
});
