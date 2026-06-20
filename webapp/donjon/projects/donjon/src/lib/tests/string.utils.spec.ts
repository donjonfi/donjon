// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
// ——————————————————————————————————————————————————————————————————————————————————————————————————————————
//    [F089] STRING-UTILS — noms de fichier/dossier sécurisés, normalisation, nombres (fonctions PURES)
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————
// VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
//
// StringUtils était à br46 (très bas) sans assertion directe. Sécurisation de noms de fichiers
// (entrée audio/ressources), normalisation (résolution de commandes) et parsing de nombres.

import { StringUtils } from "../utils/commun/string.utils";

describe('[F089] StringUtils.nomDeFichierSecuriseExtensionForcee', () => {

  it('[F089-T001] nettoie le nom + force l\'extension', () => {
    expect(StringUtils.nomDeFichierSecuriseExtensionForcee('mon image', 'png')).toBe('monimage.png');
  });

  it('[F089-T002] retire les caractères spéciaux', () => {
    expect(StringUtils.nomDeFichierSecuriseExtensionForcee('a/b:c*d', 'png')).toBe('abcd.png');
  });

  it('[F089-T003] nom ou extension manquant → undefined', () => {
    expect(StringUtils.nomDeFichierSecuriseExtensionForcee('', 'png')).toBeUndefined();
    expect(StringUtils.nomDeFichierSecuriseExtensionForcee('img', '')).toBeUndefined();
  });

  it('[F089-T004] nom entièrement non-alphanumérique → undefined', () => {
    expect(StringUtils.nomDeFichierSecuriseExtensionForcee('!!!', 'png')).toBeUndefined();
  });
});

describe('[F089] StringUtils.nomDeFichierSecurise', () => {

  it('[F089-T010] nom.extension valide', () => {
    expect(StringUtils.nomDeFichierSecurise('image.png')).toBe('image.png');
  });

  it('[F089-T011] espaces/spéciaux retirés de chaque partie', () => {
    expect(StringUtils.nomDeFichierSecurise('mon fichier.png')).toBe('monfichier.png');
  });

  it('[F089-T012] sans point → nom seul', () => {
    expect(StringUtils.nomDeFichierSecurise('sansext')).toBe('sansext');
  });

  it('[F089-T013] plus d\'un point → undefined', () => {
    expect(StringUtils.nomDeFichierSecurise('a.b.c')).toBeUndefined();
  });

  it('[F089-T014] extension vide (point final) → undefined', () => {
    expect(StringUtils.nomDeFichierSecurise('fichier.')).toBeUndefined();
  });
});

describe('[F089] StringUtils.nomDeDossierSecurise', () => {

  it('[F089-T020] retire espaces/spéciaux/points, conserve la casse', () => {
    expect(StringUtils.nomDeDossierSecurise('Mon Dossier!')).toBe('MonDossier');
    expect(StringUtils.nomDeDossierSecurise('a.b')).toBe('ab');
  });

  it('[F089-T021] entièrement non-alphanumérique → undefined', () => {
    expect(StringUtils.nomDeDossierSecurise('...')).toBeUndefined();
  });
});

describe('[F089] StringUtils.normaliserMot', () => {

  it('[F089-T030] minuscules + pliage des accents', () => {
    expect(StringUtils.normaliserMot('Épée')).toBe('epee');
    expect(StringUtils.normaliserMot('château')).toBe('chateau');
    expect(StringUtils.normaliserMot('Ça')).toBe('ca');
  });

  it('[F089-T031] ligatures œ/æ', () => {
    expect(StringUtils.normaliserMot('œuf')).toBe('oeuf');
    expect(StringUtils.normaliserMot('nævus')).toBe('naevus');
  });

  it('[F089-T032] retire le déterminant en tête (un/une/des/le/la/les/l’)', () => {
    expect(StringUtils.normaliserMot('une pomme')).toBe('pomme');
    expect(StringUtils.normaliserMot('Le Chat')).toBe('chat');
    expect(StringUtils.normaliserMot("l'épée")).toBe('epee');
  });

  it('[F089-T033] ne retire un déterminant que suivi d\'un espace (pas « lapin »)', () => {
    expect(StringUtils.normaliserMot('lapin')).toBe('lapin');
  });

  it('[F089-T034] entrée vide → chaîne vide', () => {
    expect(StringUtils.normaliserMot('')).toBe('');
  });
});

describe('[F089] StringUtils.normaliserReponse', () => {

  it('[F089-T040] minuscules + accents + trim + guillemets entourants retirés', () => {
    expect(StringUtils.normaliserReponse('  "Oui" ')).toBe('oui');
    expect(StringUtils.normaliserReponse('Héllo')).toBe('hello');
  });

  it('[F089-T041] ne retire PAS le déterminant (contrairement à normaliserMot)', () => {
    expect(StringUtils.normaliserReponse('le chat')).toBe('le chat');
  });
});

describe('[F089] StringUtils.getNombreEntierDepuisChiffresOuLettres', () => {

  it('[F089-T050] depuis des chiffres', () => {
    expect(StringUtils.getNombreEntierDepuisChiffresOuLettres('5', null, null)).toBe(5);
  });

  it('[F089-T051] depuis des lettres (0 à 10)', () => {
    expect(StringUtils.getNombreEntierDepuisChiffresOuLettres(null, 'sept', null)).toBe(7);
    expect(StringUtils.getNombreEntierDepuisChiffresOuLettres(null, 'zéro', null)).toBe(0);
  });

  it('[F089-T052] depuis « inconnu » : chiffres détectés', () => {
    expect(StringUtils.getNombreEntierDepuisChiffresOuLettres(null, null, '42')).toBe(42);
  });

  it('[F089-T053] depuis « inconnu » : lettres détectées', () => {
    expect(StringUtils.getNombreEntierDepuisChiffresOuLettres(null, null, 'trois')).toBe(3);
  });

  it('[F089-T054] lettre hors plage 0-10 → exception', () => {
    expect(() => StringUtils.getNombreEntierDepuisChiffresOuLettres(null, 'onze', null)).toThrow();
  });

  it('[F089-T055] rien de fourni → exception', () => {
    expect(() => StringUtils.getNombreEntierDepuisChiffresOuLettres(null, null, null)).toThrow();
  });
});
