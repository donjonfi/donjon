import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { actions } from "./scenario_actions";

// Les .djn de ressources/scenarios/exemples/wiki/ sont lus sur disque (vitest tourne sous Node,
// cwd = webapp/donjon, d’où ng test est lancé).
const DOSSIER_EXEMPLES_WIKI = join(process.cwd(), '../../ressources/scenarios/exemples/wiki');

/** Chemins (absolus, séparateurs « / ») de tous les exemples wiki, triés. */
export function urlsExemplesWiki(): string[] {
  return (readdirSync(DOSSIER_EXEMPLES_WIKI, { recursive: true }) as string[])
    .filter(f => f.endsWith('.djn'))
    .map(f => join(DOSSIER_EXEMPLES_WIKI, f).replace(/\\/g, '/'))
    .sort();
}

/** Chemin relatif à exemples/wiki/ (ex. « tuto-cirque/07_c_anatolette_temps.djn »). */
export function cheminExempleWiki(url: string): string {
  return url.replace(/.*\/exemples\/wiki\//, '');
}

/** Contenu du fichier exemples/wiki/<chemin>. */
export function lireExempleWiki(chemin: string): string {
  const url = urlsExemplesWiki().find(u => cheminExempleWiki(u) === chemin);
  if (!url) {
    throw new Error(`Exemple wiki introuvable : ${chemin}`);
  }
  return readFileSync(url, 'utf-8');
}

/**
 * Compiler l’exemple avec les actions de base (comme l’éditeur), vérifier qu’il n’y a
 * aucun message de compilation, puis commencer la partie. Renvoie le contexte et la sortie de l’intro.
 */
export function commencerExempleWiki(chemin: string): { ctx: ContextePartie, intro: string } {
  const rc = CompilateurV8.analyserScenarioEtActions(lireExempleWiki(chemin), actions, false);
  expect(rc.erreurs, chemin).toEqual([]);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`), chemin).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  HorlogeUtils.reinitialiser();
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  const intro = ctx.com.executerCommande('commencer le jeu', false).sortie;
  ctx.jeu.commence = true;
  expect(ctx.jeu.tamponErreurs, chemin).toEqual([]);
  return { ctx, intro };
}
