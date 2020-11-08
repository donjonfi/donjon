
export enum EClasseRacine {
  intitule = 'intitule',
  element = 'element',
  special = 'special',
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
  /** présent (↔ absent) */
  present = 'présent',
  /** absent (↔ présent) */
  absent = 'absent',
  /** intact (≠ déplacé) */
  intact = "intact",
  /** déplacé (≠ intact) */
  deplace = "déplacé",
  /** modifié (≠ intact) */
  modifie = "modifié",
  /** caché */
  cache = 'caché',
  /** ouvert */
  couvert = 'couvert',
  /** invisible */
  invisible = 'invisible',
  /** accessible (↔ inaccessible) */
  accessible = 'accessible',
  /** inaccessible (↔ accessible) */
  inaccessible = 'inaccessible',
  /** décoratif */
  decoratif = 'décoratif',
  /** possédé */
  possede = 'possédé',
  /** disponible */
  disponible = 'disponible',
  /** occupé */
  occupe = 'occupé',
  /** porté (→ possédé) */
  porte = 'porté',
  /** dénombrable (↔ indénombrable) */
  denombrable = 'dénombrable',
  /** indénombrable (↔ dénombrable) */
  indenombrable = 'indénombrable',
  /** mangeable */
  mangeable = 'mangeable',
  /** buvable */
  buvable = 'buvable',
  /** ouvrable */
  ouvrable = 'ouvrable',
  /** ouvert (↔ fermé) : porte, contenant, … */
  ouvert = 'ouvert',
  /** fermé (↔ ouvert) : porte, contenant, … */
  ferme = 'fermé',
  /** verrouillable : porte, contenant, … */
  verrouillable = 'verrouillable',
  /** verrouillé (↔ déverrouillé) : porte, cadenas, contenant, … */
  verrouille = 'verrouillé',
  /** déverrouillé (↔ verrouillé) : porte, cadenas, contenant, … */
  deverrouille = 'déverrouillé',
  /** clair (↔ obscur) : lieu */
  clair = 'clair',
  /** obscur (↔ clair) : lieu */
  obscur = 'obscur',
  /** éclairé : lieu, contenant */
  eclaire = 'éclairé',
  /** allumé (↔ éteint) : source de lumière (lampe, bougie) */
  allume = 'allumé',
  /** éteint (↔ allumé) : source de lumière (lampe, bougie) */
  eteint = 'éteint',
  /** (en) actionné (↔ arrêté) : appareil, machine */
  actionne = 'actionné',
  /** (à l’) arrêté (↔ actionné) : appareil, machine */
  arrete = 'arrêté',
  /** parlant (↔ muet) : personne */
  parlant = 'parlant',
  /** muet (↔ parlant) : personne */
  muet = 'muet',
  /** opaque (↔ transparent) : contenant */
  opaque = 'opaque',
  /** transparent (↔ opaque) : contenant */
  transparent = 'transparent',
  /** fixé (↔ transportable) : objet */
  fixe = 'fixé',
  /** transportable (↔ fixé) : objet */
  transportable = 'transportable',
}
