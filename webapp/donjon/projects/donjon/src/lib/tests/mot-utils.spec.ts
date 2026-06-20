// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F086] MOT-UTILS — accord en nombre/genre, pluriels, féminins, déterminants (fonctions PURES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// Quick-win du plan d'audit (docs/plan-tests-a-ajouter.md) : MotUtils était à fn100/br80 mais SANS
// aucune assertion directe (uniquement traversé par l'intégration). Ces tests verrouillent le contrat
// des règles d'accord du français. Tout est pur (pas de compilation de jeu).

import { MotUtils } from "../utils/commun/mot-utils";
import { Genre } from "../models/commun/genre.enum";
import { Nombre } from "../models/commun/nombre.enum";

describe('[F086] MotUtils.getPluriel', () => {

  it('[F086-T001] cas régulier → + s', () => {
    expect(MotUtils.getPluriel('chat')).toBe('chats');
    expect(MotUtils.getPluriel('éléphant')).toBe('éléphants');
  });

  it('[F086-T002] terminaison -al → -aux', () => {
    expect(MotUtils.getPluriel('cheval')).toBe('chevaux');
    expect(MotUtils.getPluriel('journal')).toBe('journaux');
  });

  it('[F086-T003] terminaisons -au / -eu → + x', () => {
    expect(MotUtils.getPluriel('tuyau')).toBe('tuyaux');
    expect(MotUtils.getPluriel('feu')).toBe('feux');
  });

  it('[F086-T004] exceptions -eu invariables en x → + s (pneu, bleu, émeu)', () => {
    expect(MotUtils.getPluriel('pneu')).toBe('pneus');
    expect(MotUtils.getPluriel('bleu')).toBe('bleus');
    expect(MotUtils.getPluriel('émeu')).toBe('émeus');
  });

  it('[F086-T005] terminaison -ou : 7 exceptions en x, le reste en s', () => {
    expect(MotUtils.getPluriel('bijou')).toBe('bijoux');
    expect(MotUtils.getPluriel('genou')).toBe('genoux');
    // clou n'est PAS une des 7 exceptions → pluriel régulier en s
    expect(MotUtils.getPluriel('clou')).toBe('clous');
    expect(MotUtils.getPluriel('trou')).toBe('trous');
  });

  it('[F086-T006] terminaisons -s / -x / -z → invariable', () => {
    expect(MotUtils.getPluriel('souris')).toBe('souris');
    expect(MotUtils.getPluriel('croix')).toBe('croix');
    expect(MotUtils.getPluriel('nez')).toBe('nez');
  });

  it('[F086-T007] abréviation d\'unité de mesure → invariable', () => {
    expect(MotUtils.getPluriel('km')).toBe('km');
    expect(MotUtils.getPluriel('kg')).toBe('kg');
  });

  it('[F086-T008] entrée vide ou ne se terminant pas par une lettre → inchangée', () => {
    expect(MotUtils.getPluriel('')).toBe('');
    expect(MotUtils.getPluriel('+5')).toBe('+5');
  });
});

describe('[F086] MotUtils.getSingulier', () => {

  it('[F086-T010] -aux → -al', () => {
    expect(MotUtils.getSingulier('chevaux')).toBe('cheval');
    expect(MotUtils.getSingulier('journaux')).toBe('journal');
  });

  it('[F086-T011] -eaux / -eux → retire le x', () => {
    expect(MotUtils.getSingulier('bateaux')).toBe('bateau');
    expect(MotUtils.getSingulier('cheveux')).toBe('cheveu');
  });

  it('[F086-T012] -s → retire le s', () => {
    expect(MotUtils.getSingulier('chats')).toBe('chat');
  });

  it('[F086-T013] aller-retour singulier/pluriel sur un -al', () => {
    expect(MotUtils.getSingulier(MotUtils.getPluriel('cheval'))).toBe('cheval');
  });
});

describe('[F086] MotUtils.getFeminin', () => {

  it('[F086-T020] cas régulier → + e', () => {
    expect(MotUtils.getFeminin('grand')).toBe('grande');
    expect(MotUtils.getFeminin('petit')).toBe('petite');
  });

  it('[F086-T021] -f → -ve (bref → brève)', () => {
    expect(MotUtils.getFeminin('naïf')).toBe('naïve');
    expect(MotUtils.getFeminin('bref')).toBe('brève');
  });

  it('[F086-T022] -x → -se (et exceptions doux/faux/roux/vieux)', () => {
    expect(MotUtils.getFeminin('heureux')).toBe('heureuse');
    expect(MotUtils.getFeminin('vieux')).toBe('vieille');
    expect(MotUtils.getFeminin('doux')).toBe('douce');
  });

  it('[F086-T023] -el / -en / -on → consonne doublée + e', () => {
    expect(MotUtils.getFeminin('cruel')).toBe('cruelle');
    expect(MotUtils.getFeminin('ancien')).toBe('ancienne');
    expect(MotUtils.getFeminin('bon')).toBe('bonne');
  });

  it('[F086-T024] -et : exceptions en -ète, sinon -ette', () => {
    expect(MotUtils.getFeminin('secret')).toBe('secrète');
    expect(MotUtils.getFeminin('muet')).toBe('muette');
  });

  it('[F086-T025] -ot : idiot → idiote, sinon -otte', () => {
    expect(MotUtils.getFeminin('idiot')).toBe('idiote');
    expect(MotUtils.getFeminin('sot')).toBe('sotte');
  });

  it('[F086-T026] -er → -ère ; -eau → -elle', () => {
    expect(MotUtils.getFeminin('léger')).toBe('légère');
    expect(MotUtils.getFeminin('nouveau')).toBe('nouvelle');
  });

  it('[F086-T027] -l : gentil/nul doublent, sinon + e', () => {
    expect(MotUtils.getFeminin('gentil')).toBe('gentille');
    expect(MotUtils.getFeminin('seul')).toBe('seule');
  });

  it('[F086-T028] -sec → sèche', () => {
    expect(MotUtils.getFeminin('sec')).toBe('sèche');
  });

  it('[F086-T029] -e final → invariable ; cas spéciaux (fou → folle)', () => {
    expect(MotUtils.getFeminin('rouge')).toBe('rouge');
    expect(MotUtils.getFeminin('fou')).toBe('folle');
  });

  // —— Caractérisation : limites connues de l'heuristique (cas spéciaux INATTEIGNABLES). ——
  // Ces tests figent le comportement RÉEL actuel (pas l'idéal linguistique) : ils servent de
  // garde-fou et documentent deux cas spéciaux morts dans getFeminin.
  describe('[F086] limites heuristiques connues (caractérisation)', () => {
    it('[F086-T030] « frais » : la branche -s l\'intercepte avant le cas spécial → "fraise" (idéal : « fraîche »)', () => {
      // 'frais' finit par 's' → branche -s (+e) AVANT d'atteindre le cas spécial 'frais'→'fraîche'
      // de la branche par défaut : ce cas spécial est donc du code mort.
      expect(MotUtils.getFeminin('frais')).toBe('fraise');
    });
    it('[F086-T031] « public » : le cas spécial est gardé par endsWith("ec") que "public" ne satisfait pas → "publice" (idéal : « publique »)', () => {
      // 'public' finit par 'ic', pas 'ec' → n'entre jamais dans la branche -ec → défaut (+e).
      expect(MotUtils.getFeminin('public')).toBe('publice');
    });
  });
});

describe('[F086] MotUtils.getGenre', () => {

  it('[F086-T040] déterminants masculins → Genre.m', () => {
    expect(MotUtils.getGenre('le', false)).toBe(Genre.m);
    expect(MotUtils.getGenre('un', false)).toBe(Genre.m);
    expect(MotUtils.getGenre('mon', false)).toBe(Genre.m);
  });

  it('[F086-T041] déterminants féminins → Genre.f', () => {
    expect(MotUtils.getGenre('la', false)).toBe(Genre.f);
    expect(MotUtils.getGenre('une', false)).toBe(Genre.f);
    expect(MotUtils.getGenre('sa', false)).toBe(Genre.f);
  });

  it('[F086-T042] casse / espaces du déterminant normalisés', () => {
    expect(MotUtils.getGenre('  LE ', false)).toBe(Genre.m);
  });

  it('[F086-T043] déterminant inconnu → repli sur le drapeau feminin', () => {
    expect(MotUtils.getGenre('xyz', true)).toBe(Genre.f);
    expect(MotUtils.getGenre('xyz', false)).toBe(Genre.m);
  });

  it('[F086-T044] sans déterminant → repli sur le drapeau feminin', () => {
    expect(MotUtils.getGenre('', true)).toBe(Genre.f);
    expect(MotUtils.getGenre(null as any, false)).toBe(Genre.m);
  });
});

describe('[F086] MotUtils.getNombre', () => {

  it('[F086-T050] toujoursPluriel l\'emporte sur tout → Nombre.tp', () => {
    expect(MotUtils.getNombre('le', true)).toBe(Nombre.tp);
  });

  it('[F086-T051] singulier (le/la/un/1)', () => {
    expect(MotUtils.getNombre('le', false)).toBe(Nombre.s);
    expect(MotUtils.getNombre('1', false)).toBe(Nombre.s);
  });

  it('[F086-T052] pluriel (les/des/deux)', () => {
    expect(MotUtils.getNombre('les', false)).toBe(Nombre.p);
    expect(MotUtils.getNombre('deux', false)).toBe(Nombre.p);
  });

  it('[F086-T053] indénombrable (du / de la)', () => {
    expect(MotUtils.getNombre('du', false)).toBe(Nombre.i);
    expect(MotUtils.getNombre('de la', false)).toBe(Nombre.i);
  });

  it('[F086-T054] nombre > 1 en chiffres → pluriel', () => {
    expect(MotUtils.getNombre('5', false)).toBe(Nombre.p);
    expect(MotUtils.getNombre('12', false)).toBe(Nombre.p);
  });

  it('[F086-T055] déterminant vide → singulier par défaut', () => {
    expect(MotUtils.getNombre('', false)).toBe(Nombre.s);
  });
});

describe('[F086] MotUtils.getQuantite', () => {

  it('[F086-T060] déterminants numériques explicites', () => {
    expect(MotUtils.getQuantite('le', 0)).toBe(1);
    expect(MotUtils.getQuantite('deux', 0)).toBe(2);
    expect(MotUtils.getQuantite('trois', 0)).toBe(3);
  });

  it('[F086-T061] indéfini/partitif (les/des/du) → -1', () => {
    expect(MotUtils.getQuantite('les', 0)).toBe(-1);
    expect(MotUtils.getQuantite('du', 0)).toBe(-1);
    expect(MotUtils.getQuantite('-1', 0)).toBe(-1);
  });

  it('[F086-T062] nombre > 1 en chiffres → la valeur entière', () => {
    expect(MotUtils.getQuantite('5', 0)).toBe(5);
  });

  it('[F086-T063] non reconnu → 0', () => {
    expect(MotUtils.getQuantite('cinq', 0)).toBe(0);
  });

  it('[F086-T064] aucun déterminant → valeur de repli fournie', () => {
    expect(MotUtils.getQuantite('', 7)).toBe(7);
    expect(MotUtils.getQuantite(null as any, 3)).toBe(3);
  });
});

describe('[F086] MotUtils.estFormePlurielle', () => {

  it('[F086-T070] mot simple terminé par s/x/z → vrai', () => {
    expect(MotUtils.estFormePlurielle('chats')).toBeTrue();
    expect(MotUtils.estFormePlurielle('croix')).toBeTrue();
    expect(MotUtils.estFormePlurielle('nez')).toBeTrue();
  });

  it('[F086-T071] singulier → faux', () => {
    expect(MotUtils.estFormePlurielle('chat')).toBeFalse();
  });

  it('[F086-T072] mot composé à deux têtes plurielles → vrai', () => {
    expect(MotUtils.estFormePlurielle('choux-fleurs')).toBeTrue();
  });

  it('[F086-T073] groupe avec espace non terminé par s/x/z → faux', () => {
    expect(MotUtils.estFormePlurielle('chat noir')).toBeFalse();
  });
});

describe('[F086] MotUtils pluriel/singulier « de tête » (noms composés)', () => {

  it('[F086-T080] getPlurielTete pluralise le mot de tête uniquement', () => {
    expect(MotUtils.getPlurielTete('point de vie')).toBe('points de vie');
    expect(MotUtils.getPlurielTete('pomme de terre')).toBe('pommes de terre');
  });

  it('[F086-T081] getPlurielTete idempotent si la tête est déjà au pluriel', () => {
    expect(MotUtils.getPlurielTete('points de vie')).toBe('points de vie');
  });

  it('[F086-T082] getPlurielTete sur un mot simple', () => {
    expect(MotUtils.getPlurielTete('chat')).toBe('chats');
  });

  it('[F086-T083] getSingulierTete singularise le mot de tête uniquement', () => {
    expect(MotUtils.getSingulierTete('points de vie')).toBe('point de vie');
    expect(MotUtils.getSingulierTete('pommes de terre')).toBe('pomme de terre');
  });
});
