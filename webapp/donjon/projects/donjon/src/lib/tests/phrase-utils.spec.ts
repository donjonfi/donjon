/**
 * [F095] PhraseUtils — utilitaires purs de manipulation de phrases / groupes nominaux.
 *
 * Tests d'assertion directe input -> output sur les méthodes statiques pures :
 *  - séparateurs de listes d'intitulés (virgule + et/ou, branches vide/null)
 *  - trouverDeterminant (normalisation déterminant, singulier/pluriel/élision)
 *  - getGroupeNominalDefini (décomposition d'un GN défini)
 *  - extraireLocalisationReference (locateur spatial)
 *  - obtenirLesCommandesPossibles (décomposition de commande)
 *  - separerListeNombresEntiers (cas sûrs uniquement)
 *
 * Les tournures DSL/assertions reprennent des specs déjà verts
 * (commandes.decomposer.spec.ts, instructions.spec.ts, F059-fond.spec.ts).
 */

import { PhraseUtils } from "../../public-api";

describe('[F095] PhraseUtils − fonctions pures', () => {

  // ----------------------------------------------------------------------
  // separerListeIntitulesEtOu / Et / Ou
  // ----------------------------------------------------------------------

  describe('separerListeIntitulesEtOu', () => {
    it('[F095-T001] sépare sur virgules, « et » et « ou »', () => {
      const res = PhraseUtils.separerListeIntitulesEtOu('pomme, poire et prune ou cerise', false);
      expect(res).toEqual(['pomme', 'poire', 'prune', 'cerise']);
    });

    it('[F095-T002] chaîne vide -> liste vide', () => {
      expect(PhraseUtils.separerListeIntitulesEtOu('', false)).toEqual([]);
    });

    it('[F095-T003] null -> liste vide', () => {
      expect(PhraseUtils.separerListeIntitulesEtOu(null as any, false)).toEqual([]);
    });

    it('[F095-T004] un seul intitulé -> liste à un élément', () => {
      expect(PhraseUtils.separerListeIntitulesEtOu('pomme', false)).toEqual(['pomme']);
    });
  });

  describe('separerListeIntitulesEt', () => {
    it('[F095-T005] sépare sur virgules et « et » (pas sur « ou »)', () => {
      const res = PhraseUtils.separerListeIntitulesEt('rouge, vert et bleu', false);
      expect(res).toEqual(['rouge', 'vert', 'bleu']);
    });

    it('[F095-T006] vide -> liste vide', () => {
      expect(PhraseUtils.separerListeIntitulesEt('', false)).toEqual([]);
    });
  });

  describe('separerListeIntitulesOu', () => {
    it('[F095-T007] sépare sur virgules et « ou »', () => {
      const res = PhraseUtils.separerListeIntitulesOu('nord, sud ou est', false);
      expect(res).toEqual(['nord', 'sud', 'est']);
    });

    it('[F095-T008] vide -> liste vide', () => {
      expect(PhraseUtils.separerListeIntitulesOu('', false)).toEqual([]);
    });
  });

  // ----------------------------------------------------------------------
  // trouverDeterminant
  // ----------------------------------------------------------------------

  describe('trouverDeterminant', () => {
    it('[F095-T009] formes singulier féminin -> « la »', () => {
      expect(PhraseUtils.trouverDeterminant('la')).toEqual('la ');
      expect(PhraseUtils.trouverDeterminant('de la')).toEqual('la ');
      expect(PhraseUtils.trouverDeterminant('à la')).toEqual('la ');
    });

    it('[F095-T010] formes singulier masculin -> « le »', () => {
      expect(PhraseUtils.trouverDeterminant('le')).toEqual('le ');
      expect(PhraseUtils.trouverDeterminant('au')).toEqual('le ');
      expect(PhraseUtils.trouverDeterminant('du')).toEqual('le ');
    });

    it('[F095-T011] formes pluriel -> « les »', () => {
      expect(PhraseUtils.trouverDeterminant('les')).toEqual('les ');
      expect(PhraseUtils.trouverDeterminant('aux')).toEqual('les ');
      expect(PhraseUtils.trouverDeterminant('des')).toEqual('les ');
    });

    it('[F095-T012] prépositions seules (à / de / dans) -> null', () => {
      expect(PhraseUtils.trouverDeterminant('à')).toBeNull();
      expect(PhraseUtils.trouverDeterminant('de')).toBeNull();
      expect(PhraseUtils.trouverDeterminant('dans')).toBeNull();
    });

    it('[F095-T013] chaîne vide -> chaîne vide (la garde if(retVal) saute le switch)', () => {
      // comportement actuel : '' est falsy donc le switch n'est pas atteint, on renvoie ''.
      expect(PhraseUtils.trouverDeterminant('')).toEqual('');
    });

    it('[F095-T014] null / undefined -> undefined (optional chaining)', () => {
      // comportement actuel : retVal = undefined?.trim() => undefined.
      expect(PhraseUtils.trouverDeterminant(null as any)).toBeUndefined();
      expect(PhraseUtils.trouverDeterminant(undefined as any)).toBeUndefined();
    });

    it('[F095-T015] valeur inconnue -> renvoyée telle quelle (trimée)', () => {
      // default du switch : la valeur trimée d'origine est conservée.
      expect(PhraseUtils.trouverDeterminant('un ')).toEqual('un');
    });
  });

  // ----------------------------------------------------------------------
  // getGroupeNominalDefini
  // ----------------------------------------------------------------------

  describe('getGroupeNominalDefini', () => {
    it('[F095-T016] « La cuisine » -> déterminant « La » (casse préservée), nom « cuisine »', () => {
      const gn = PhraseUtils.getGroupeNominalDefini('La cuisine', false);
      expect(gn).toBeTruthy();
      // forcerMinuscules=false : la casse d'origine du déterminant est conservée.
      expect(gn!.determinant).toEqual('La ');
      expect(gn!.nom).toEqual('cuisine');
    });

    it('[F095-T017] nom composé « La salle de bain » conservé entier', () => {
      const gn = PhraseUtils.getGroupeNominalDefini('La salle de bain', false);
      expect(gn).toBeTruthy();
      expect(gn!.determinant).toEqual('La ');
      // assertion robuste : on vérifie que l'intitulé complet contient le nom composé.
      expect(gn!.nomEpithete).toContain('salle de bain');
    });

    it('[F095-T018] « Le joueur » -> déterminant « Le » (casse préservée), nom « joueur »', () => {
      const gn = PhraseUtils.getGroupeNominalDefini('Le joueur', false);
      expect(gn).toBeTruthy();
      expect(gn!.determinant).toEqual('Le ');
      expect(gn!.nom).toEqual('joueur');
    });
  });

  // ----------------------------------------------------------------------
  // extraireLocalisationReference
  // ----------------------------------------------------------------------

  describe('extraireLocalisationReference', () => {
    it('[F095-T019] « le sol situé dans la cuisine » -> base/preposition/cible', () => {
      const loc = PhraseUtils.extraireLocalisationReference('le sol situé dans la cuisine');
      expect(loc).toBeTruthy();
      expect(loc!.base).toContain('sol');
      expect(loc!.preposition).toEqual('dans');
      expect(loc!.cible).toContain('cuisine');
    });

    it('[F095-T020] texte sans locateur -> null', () => {
      expect(PhraseUtils.extraireLocalisationReference('le caillou')).toBeNull();
    });

    it('[F095-T021] texte vide / null -> null', () => {
      expect(PhraseUtils.extraireLocalisationReference('')).toBeNull();
      expect(PhraseUtils.extraireLocalisationReference(null as any)).toBeNull();
    });
  });

  // ----------------------------------------------------------------------
  // obtenirLesCommandesPossibles (reprises de commandes.decomposer.spec.ts)
  // ----------------------------------------------------------------------

  describe('obtenirLesCommandesPossibles', () => {
    it('[F095-T022] « sauter » -> un candidat sans complément', () => {
      const res = PhraseUtils.obtenirLesCommandesPossibles('sauter');
      expect(res.length).toBe(1);
      expect(res[0].els.infinitif).toEqual('sauter');
      expect(res[0].els.sujet).toBeUndefined();
    });

    it('[F095-T023] « prendre une pomme » -> complément direct indéfini', () => {
      const res = PhraseUtils.obtenirLesCommandesPossibles('prendre une pomme');
      expect(res.length).toBe(1);
      expect(res[0].els.infinitif).toEqual('prendre');
      expect(res[0].els.sujet.determinant).toEqual('une ');
      expect(res[0].els.sujet.nom).toEqual('pomme');
    });

    it('[F095-T024] « mettre la pomme sur la table » -> deux candidats (ambigu)', () => {
      const res = PhraseUtils.obtenirLesCommandesPossibles('mettre la pomme sur la table');
      expect(res.length).toBe(2);
      // candidat 2 : compl. direct + préposition + compl. indirect
      expect(res[1].els.infinitif).toEqual('mettre');
      expect(res[1].els.sujet.nom).toEqual('pomme');
      expect(res[1].els.preposition1).toEqual('sur');
      expect(res[1].els.sujetComplement1.determinant).toEqual('la ');
      expect(res[1].els.sujetComplement1.nom).toEqual('table');
    });

    it('[F095-T025] commande inconnue (non-verbe) -> aucun candidat', () => {
      const res = PhraseUtils.obtenirLesCommandesPossibles('xyzzy');
      expect(res.length).toBe(0);
    });
  });

  // ----------------------------------------------------------------------
  // separerListeNombresEntiers (cas sûrs uniquement, cf. limites du source)
  // ----------------------------------------------------------------------

  describe('separerListeNombresEntiers', () => {
    it('[F095-T026] un seul entier positif -> liste à un élément', () => {
      expect(PhraseUtils.separerListeNombresEntiers('42', false)).toEqual([42]);
    });

    it('[F095-T027] chaîne vide -> liste vide', () => {
      expect(PhraseUtils.separerListeNombresEntiers('', false)).toEqual([]);
    });
  });

});
