/**
 * Résolution en mémoire des instructions `inclure "X.djn"` côté navigateur.
 *
 * Parallèle à `ressources/extensions/vscode/donjon-fi-compagnon/src/concat-resolver.ts`
 * mais lit les fichiers depuis une Map fournie par l'utilisateur (uploads navigateur)
 * au lieu du système de fichiers.
 */

export interface LineMapEntry {
  ligneFinale: number;
  ligneOrigine: number;
  nomFichier: string;
}

export interface ErreurInclure {
  cible: string;
  fichierSource: string;
  ligne: number;
  type: 'introuvable' | 'cycle' | 'profondeur';
  message: string;
}

export interface ResolutionInclure {
  contenu: string;
  lineMap: LineMapEntry[];
  fichiersInclus: string[];
  erreurs: ErreurInclure[];
}

const PROFONDEUR_MAX = 32;

const RE_INCLURE = /^\s*inclure\s+["“]([^"”]+)["”]\s*\.?\s*$/i;

const NOM_RACINE = 'scenario.djn';

/**
 * Résout récursivement les `inclure "X"` à partir du contenu racine.
 *
 * @param contenuRacine Texte du scénario racine (celui ouvert dans ACE).
 * @param fichiersDispo Map clé = nom de fichier (basename), valeur = contenu.
 * @param nomRacine Nom logique du fichier racine (par défaut `scenario.djn`).
 */
export function resoudreInclures(
  contenuRacine: string,
  fichiersDispo: Map<string, string>,
  nomRacine: string = NOM_RACINE,
): ResolutionInclure {
  const erreurs: ErreurInclure[] = [];
  const fichiersInclus: string[] = [];
  const dejaVus = new Set<string>();
  const lineMap: LineMapEntry[] = [];
  const lignesFinales: string[] = [];

  inclure(nomRacine, contenuRacine, fichiersDispo, dejaVus, lineMap, lignesFinales, fichiersInclus, erreurs, 0);

  return {
    contenu: lignesFinales.join('\n'),
    lineMap,
    fichiersInclus,
    erreurs,
  };
}

function inclure(
  nomFichier: string,
  contenu: string,
  fichiersDispo: Map<string, string>,
  dejaVus: Set<string>,
  lineMap: LineMapEntry[],
  lignesFinales: string[],
  fichiersInclus: string[],
  erreurs: ErreurInclure[],
  profondeur: number,
): void {
  const cle = nomFichier.toLowerCase();
  if (dejaVus.has(cle)) {
    return;
  }
  dejaVus.add(cle);
  fichiersInclus.push(nomFichier);

  const lignes = contenu.split(/\r?\n/);

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const m = RE_INCLURE.exec(ligne);

    if (m) {
      const cible = m[1];
      const cibleKey = cible.toLowerCase();

      if (profondeur >= PROFONDEUR_MAX) {
        erreurs.push({
          cible,
          fichierSource: nomFichier,
          ligne: i + 1,
          type: 'profondeur',
          message: `Profondeur maximale (${PROFONDEUR_MAX}) atteinte en résolvant « ${cible} ».`,
        });
        continue;
      }

      const contenuCible = trouverFichier(fichiersDispo, cible);
      if (contenuCible === undefined) {
        erreurs.push({
          cible,
          fichierSource: nomFichier,
          ligne: i + 1,
          type: 'introuvable',
          message: `Fichier « ${cible} » introuvable parmi les fichiers inclus chargés.`,
        });
        continue;
      }

      if (dejaVus.has(cibleKey)) {
        erreurs.push({
          cible,
          fichierSource: nomFichier,
          ligne: i + 1,
          type: 'cycle',
          message: `Cycle détecté : « ${cible} » est déjà inclus dans la chaîne.`,
        });
        continue;
      }

      inclure(cible, contenuCible, fichiersDispo, dejaVus, lineMap, lignesFinales, fichiersInclus, erreurs, profondeur + 1);
    } else {
      lineMap.push({
        ligneFinale: lignesFinales.length + 1,
        ligneOrigine: i + 1,
        nomFichier,
      });
      lignesFinales.push(ligne);
    }
  }
}

function trouverFichier(fichiersDispo: Map<string, string>, cible: string): string | undefined {
  if (fichiersDispo.has(cible)) {
    return fichiersDispo.get(cible);
  }
  const cibleLower = cible.toLowerCase();
  for (const [nom, contenu] of fichiersDispo.entries()) {
    if (nom.toLowerCase() === cibleLower) {
      return contenu;
    }
  }
  return undefined;
}

/** Traduit une ligne du blob concaténé vers `(fichier, ligneOriginale)`. */
export function traduireLigne(lineMap: LineMapEntry[], ligneFinale: number): { nomFichier: string; ligneOrigine: number } | null {
  const idx = ligneFinale - 1;
  if (idx < 0 || idx >= lineMap.length) { return null; }
  const entry = lineMap[idx];
  return { nomFichier: entry.nomFichier, ligneOrigine: entry.ligneOrigine };
}
