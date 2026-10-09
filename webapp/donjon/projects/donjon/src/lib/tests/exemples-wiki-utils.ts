import { CompilateurV8 } from "../utils/compilation/compilateur-v8";
import { Generateur } from "../utils/compilation/generateur";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { HorlogeUtils } from "../utils/jeu/horloge-utils";
import { actions } from "./scenario_actions";

// Les .djn de ressources/scenarios/exemples/wiki/ sont servis par karma (cf. karma.conf.js, « files »).
declare const __karma__: { files: { [url: string]: string } };

/** URL (karma) de tous les exemples wiki, triées. */
export function urlsExemplesWiki(): string[] {
  return Object.keys(__karma__.files).filter(u => u.endsWith('.djn')).sort();
}

/** Chemin relatif à exemples/wiki/ (ex. « tuto-cirque/07_c_anatolette_temps.djn »). */
export function cheminExempleWiki(url: string): string {
  return decodeURIComponent(url).replace(/.*\/exemples\/wiki\//, '');
}

/** Contenu du fichier exemples/wiki/<chemin>. */
export function lireExempleWiki(chemin: string): string {
  const url = urlsExemplesWiki().find(u => cheminExempleWiki(u) === chemin);
  if (!url) {
    throw new Error(`Exemple wiki introuvable : ${chemin}`);
  }
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.overrideMimeType('text/plain; charset=utf-8');
  xhr.send();
  return xhr.responseText;
}

/**
 * Compiler l’exemple avec les actions de base (comme l’éditeur), vérifier qu’il n’y a
 * aucun message de compilation, puis commencer la partie. Renvoie le contexte et la sortie de l’intro.
 */
export function commencerExempleWiki(chemin: string): { ctx: ContextePartie, intro: string } {
  const rc = CompilateurV8.analyserScenarioEtActions(lireExempleWiki(chemin), actions, false);
  expect(rc.erreurs).withContext(chemin).toEqual([]);
  expect(rc.messages.map(m => `L${m.numeroLigne}: ${m.titre}`)).withContext(chemin).toEqual([]);
  const ctx = new ContextePartie(Generateur.genererJeu(rc));
  HorlogeUtils.reinitialiser();
  ctx.nouvelleGraineAleatoire();
  ctx.eju.majPresenceDesObjets();
  ctx.eju.majAdjacenceLieux();
  const intro = ctx.com.executerCommande('commencer le jeu', false).sortie;
  ctx.jeu.commence = true;
  expect(ctx.jeu.tamponErreurs).withContext(chemin).toEqual([]);
  return { ctx, intro };
}
