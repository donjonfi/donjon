// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F148] BALAYAGE DES ACTIONS DE BASE : NI CONSEIL NI PLANTAGE
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Chaque action de base est jouée sur un éventail de cibles (objets, contenants, personne, porte,
// direction, lieu, sujet, mots inconnus) ; aucune ne doit émettre de conseil créateur
// (« État introuvable », « Ni élément ni état trouvé », etc.) ni lever d’exception.

import { CompilateurV8 } from "../../public-api";
import { ContextePartie } from "../models/jouer/contexte-partie";
import { Generateur } from "../utils/compilation/generateur";
import { actions } from "./scenario_actions";

const scenarioBalayage = `
La salle est un lieu. "Une salle."
La cave est un lieu en bas de la salle.
Le jardin est un lieu au nord de la salle.
La porte rouge est une porte fermée et verrouillée au sud de la salle.
La pomme est un objet mangeable dans la salle.
La boîte est un contenant ouvert dans la salle.
Le coffre est un contenant fermé et verrouillé dans la salle.
La clé est un objet dans la boîte.
La table est un support dans la salle.
Le livre est un objet lisible sur la table.
La tunique est un objet enfilable dans la salle.
La lampe est un objet allumable et éteint dans l’inventaire.
Le mur est un élément décoratif dans la salle.
La magicienne est une personne dans la salle.
Le chat est un animal dans la salle.
Le tissu est un sujet.
Le joueur est dans la salle.
`;

const ciblesCeci = ['la pomme', 'la boîte', 'le coffre', 'la clé', 'la table', 'le livre', 'la tunique',
  'la lampe', 'le mur', 'la magicienne', 'le chat', 'la porte rouge', 'nord', 'le jardin', 'la cave', 'l’inventaire',
  'l’aide', 'les sorties', 'le tissu', 'truc', 'moi', 'la salle'];
const ciblesCela = ['la pomme', 'la boîte', 'la clé', 'la magicienne', 'la table', 'le tissu', 'truc', 'nord'];

describe('[F148] Balayage des actions de base', () => {

  const rcBalayage = CompilateurV8.analyserScenarioEtActions(scenarioBalayage, actions, false);
  const actionsBalayage = Generateur.genererJeu(rcBalayage).actions;

  actionsBalayage.forEach((action, idx) => {
    const signature = action.infinitif + (action.ceci ? ' ceci' : '') + (action.cela ? ' cela' : '');
    it(`[F148-T${String(idx + 1).padStart(3, '0')}] ${signature}`, () => {
      const commandes: string[] = [];
      for (const c of (action.ceci ? ciblesCeci : [''])) {
        const ceci = [action.prepositionCeci, c].filter(x => x).join(' ');
        for (const d of (action.cela ? ciblesCela : [''])) {
          const cela = d ? [action.prepositionCela, d].filter(x => x).join(' ') : '';
          commandes.push([action.infinitif, ceci, cela].filter(x => x).join(' '));
        }
      }
      const ctx = new ContextePartie(Generateur.genererJeu(
        CompilateurV8.analyserScenarioEtActions(scenarioBalayage, actions, false)));
      ctx.nouvelleGraineAleatoire();
      ctx.com.executerCommande('commencer le jeu', false);
      ctx.jeu.tamponConseils.length = 0;
      const conseils: string[] = [];
      for (const cmd of commandes) {
        try {
          ctx.com.executerCommande(cmd, false);
        } catch (e) {
          conseils.push(`${cmd} → EXCEPTION ${e}`);
        }
        ctx.jeu.tamponConseils.splice(0).forEach(k => conseils.push(`${cmd} → ${k}`));
      }
      expect(conseils).toEqual([]);
    });
  });

});
