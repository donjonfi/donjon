import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  CompilateurV8,
  CompilateurV8Utils,
  Generateur,
  Jeu,
  MessageAnalyse,
  ResultatCompilation,
} from 'donjon';

export interface CompilationState {
  resultat: ResultatCompilation | null;
  jeu: Jeu | null;
  messages: MessageAnalyse[];
  erreur: string | null;
}

const ETAT_INITIAL: CompilationState = {
  resultat: null,
  jeu: null,
  messages: [],
  erreur: null,
};

@Injectable({ providedIn: 'root' })
export class CompilationService {
  private readonly _state = new BehaviorSubject<CompilationState>(ETAT_INITIAL);

  readonly state$ = this._state.asObservable();

  get state(): CompilationState {
    return this._state.value;
  }

  reset(): void {
    this._state.next(ETAT_INITIAL);
  }

  compiler(scenarioBrut: string, actions: string): void {
    if (!scenarioBrut || scenarioBrut.trim() === '') {
      this._state.next({ ...ETAT_INITIAL, erreur: 'Pas de code source dans le scénario.' });
      return;
    }

    try {
      const scenario = CompilateurV8Utils.retirerCommentaires(scenarioBrut);
      const resultat = CompilateurV8.analyserScenarioEtActions(scenario, actions ?? '', false);
      const jeu = Generateur.genererJeu(resultat);

      this._state.next({
        resultat,
        jeu,
        messages: resultat.messages ?? [],
        erreur: null,
      });
    } catch (e: any) {
      this._state.next({
        ...ETAT_INITIAL,
        erreur: 'Erreur de compilation : ' + (e?.message ?? String(e)),
      });
    }
  }
}
