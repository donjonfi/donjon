
export enum EClasseRacine {
  intitule = 'intitule',
  element = 'element',
  lieu = 'lieu',
  objet = 'objet',
  vivant = 'vivant',
  animal = 'animal',
  personne = 'personne',
  porte = 'porte',
  contenant = 'contenant',
  support = 'support',
  // types spéciaux
  joueur = 'joueur',
  inventaire = 'inventaire',
}

export enum EEtatsBase {
  PRESENT = 'présent',
  ABSENT = 'absent',
  DECORATIF = 'décoratif',
  CACHE = 'caché',
  COUVERT = 'couvert',
  INVISIBLE = 'invisible',
  ACCESSIBLE = 'accessible',
  INACCESSIBLE = 'inaccessible',
  POSSEDE = 'possédé',
  DISPONIBLE = 'disponible',
  OCCUPE = 'occupé',
  PORTE = 'porté',
  DENOMBRABLE = 'dénombrable',
  INDENOMBRABLE = 'indénombrable',
  MANGEABLE = 'mangeable',
  BUVABLE = 'buvable',
  OUVRABLE = 'ouvrable',
  OUVERT = 'ouvert',
  FERME = 'fermé',
  VERROUILLABLE = 'verrouillable',
  VERROUILLE = 'verrouillé',
  DEVERROUILLE = 'déverrouillé',
  // LUMINEUX = 'lumineux',
  ECLAIRE = 'éclairé',
  // SOMBRE = 'sombre',
  OBSCUR = 'obscur',
  ALLUME = 'allumé',
  ETEINT = 'éteint',
  MARCHE = 'marche',
  ARRET = 'arrêt',
  PARLANT = 'parlant',
  MUET = 'muet',
  OPAQUE = 'opaque',
  TRANSPARENT = 'transparent',
  FIXE = 'fixé',
  TRANSPORTABLE = 'transportable',
}