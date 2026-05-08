import * as fs from 'fs';
import * as path from 'path';

/** Une entrée du line-map : "la ligne N du blob final vient du fichier F ligne L". */
export interface LineMapEntry {
  ligneFinale: number;
  ligneOrigine: number;
  nomFichier: string;
}

export interface ResolutionResultat {
  /** Texte final (concaténation récursive de toutes les sources). */
  contenu: string;
  /** Mapping ligne du blob final → ligne d'origine + fichier. */
  lineMap: LineMapEntry[];
  /** Liste des fichiers effectivement inclus (chemins absolus). */
  fichiersInclus: string[];
  /** Erreurs de résolution (cycles, fichiers introuvables…). */
  erreurs: ErreurResolution[];
}

export interface ErreurResolution {
  /** Chemin (potentiellement non résolu) du fichier référencé. */
  cible: string;
  /** Fichier qui contient l'instruction `inclure` fautive. */
  fichierSource: string;
  /** Ligne dans le fichier source. */
  ligne: number;
  /** Type d'erreur. */
  type: 'introuvable' | 'cycle' | 'profondeur' | 'lecture';
  message: string;
}

/** Profondeur maximale de récursion pour éviter les explosions. */
const PROFONDEUR_MAX = 32;

/** Regex de détection : début de ligne (espaces optionnels), `inclure` (insensible casse), guillemets droits ou typographiques, chemin, fin. */
const RE_INCLURE = /^\s*inclure\s+["“]([^"”]+)["”]\s*\.?\s*$/i;

/**
 * Résout récursivement les instructions `inclure "X"` à partir d'un fichier racine.
 *
 * Sémantique :
 * - Récursive (un fichier inclus peut lui-même inclure d'autres).
 * - Chemins **relatifs au .djn racine** (cf. décision Phase 4 du plan).
 * - Anti-cycle : un fichier déjà inclus n'est pas réinclus.
 * - Profondeur max 32.
 * - L'instruction `inclure` est REMPLACÉE par le contenu du fichier inclus
 *   (la ligne disparaît du flux final, le moteur ne la voit jamais).
 */
export function resoudreSources(rootPath: string): ResolutionResultat {
  const rootDir = path.dirname(rootPath);
  const erreurs: ErreurResolution[] = [];
  const fichiersInclus: string[] = [];
  const dejaVus = new Set<string>();
  const lineMap: LineMapEntry[] = [];
  const lignesFinales: string[] = [];

  inclure(rootPath, rootDir, dejaVus, lineMap, lignesFinales, fichiersInclus, erreurs, 0);

  return {
    contenu: lignesFinales.join('\n'),
    lineMap,
    fichiersInclus,
    erreurs,
  };
}

function inclure(
  cheminAbs: string,
  rootDir: string,
  dejaVus: Set<string>,
  lineMap: LineMapEntry[],
  lignesFinales: string[],
  fichiersInclus: string[],
  erreurs: ErreurResolution[],
  profondeur: number,
): void {
  const cle = path.normalize(cheminAbs).toLowerCase();
  if (dejaVus.has(cle)) {
    return;
  }
  dejaVus.add(cle);

  let contenu: string;
  try {
    contenu = fs.readFileSync(cheminAbs, 'utf8');
  } catch (e: any) {
    erreurs.push({
      cible: cheminAbs,
      fichierSource: cheminAbs,
      ligne: 0,
      type: 'lecture',
      message: `Impossible de lire « ${cheminAbs} » : ${e?.message ?? e}`,
    });
    return;
  }

  fichiersInclus.push(cheminAbs);
  const nomCourt = path.relative(rootDir, cheminAbs).replace(/\\/g, '/');
  const lignes = contenu.split(/\r?\n/);

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const m = RE_INCLURE.exec(ligne);

    if (m) {
      // Résolution relative au répertoire du .djn racine (décision Phase 4).
      const cible = m[1];
      const cibleAbs = path.isAbsolute(cible) ? cible : path.join(rootDir, cible);

      if (profondeur >= PROFONDEUR_MAX) {
        erreurs.push({
          cible,
          fichierSource: cheminAbs,
          ligne: i + 1,
          type: 'profondeur',
          message: `Profondeur maximale (${PROFONDEUR_MAX}) atteinte en résolvant « ${cible} ».`,
        });
        continue;
      }

      if (!fs.existsSync(cibleAbs)) {
        erreurs.push({
          cible,
          fichierSource: cheminAbs,
          ligne: i + 1,
          type: 'introuvable',
          message: `Fichier « ${cible} » introuvable (résolu vers ${cibleAbs}).`,
        });
        continue;
      }

      if (dejaVus.has(path.normalize(cibleAbs).toLowerCase())) {
        erreurs.push({
          cible,
          fichierSource: cheminAbs,
          ligne: i + 1,
          type: 'cycle',
          message: `Cycle détecté : « ${cible} » est déjà inclus dans la chaîne.`,
        });
        continue;
      }

      // Insérer le contenu du fichier inclus à la place de l'instruction.
      inclure(cibleAbs, rootDir, dejaVus, lineMap, lignesFinales, fichiersInclus, erreurs, profondeur + 1);
    } else {
      lineMap.push({
        ligneFinale: lignesFinales.length + 1,
        ligneOrigine: i + 1,
        nomFichier: nomCourt,
      });
      lignesFinales.push(ligne);
    }
  }
}

/**
 * Traduit une ligne du blob concaténé vers `(fichier, ligneOriginale)`.
 * Retourne `null` si la ligne n'est pas mappée (ex. ligne hors blob).
 */
export function traduireLigne(lineMap: LineMapEntry[], ligneFinale: number): { nomFichier: string; ligneOrigine: number } | null {
  // Lookup direct par index (ligneFinale est 1-based, lineMap est 0-based).
  const idx = ligneFinale - 1;
  if (idx < 0 || idx >= lineMap.length) { return null; }
  const entry = lineMap[idx];
  return { nomFichier: entry.nomFichier, ligneOrigine: entry.ligneOrigine };
}
