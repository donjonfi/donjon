
export const version = "3.2.5"
export const versionNum = 30205;

export enum EClasseRacine {
  intitule = 'intitule',
  compteur = 'compteur',
  ressource = 'ressource',
  liste = 'liste',
  listeVide = 'listevide',
  listeNombre = 'listenombre',
  listeTexte = 'listetexte',
  listeIntitule = 'listeintitule',
  listeMixte = 'listemixte',
  direction = 'direction',
  concept = 'concept',
  element = 'element',
  special = 'special',
  lieu = 'lieu',
  objet = 'objet',
  vivant = 'vivant',
  animal = 'animal',
  personne = 'personne',
  porte = 'porte',
  obstacle = 'obstacle',
  contenant = 'contenant',
  support = 'support',
  // types spéciaux
  joueur = 'joueur',
  inventaire = 'inventaire',
}

export enum EEtatsBase {

  /** mentionné */
  mentionne = 'mentionné',
  /** vu */
  vu = 'vu',
  /** familier */
  familier = 'familier',

  /** présent (calculé) (↔ absent) */
  present = 'présent',
  /** absent (calculé) (↔ présent) */
  absent = 'absent',

  /** visité : lieu */
  visite = 'visité',

  /** intact (≠ déplacé) */
  intact = 'intact',
  /** déplacé (≠ intact) */
  deplace = 'déplacé',
  /** modifié (≠ intact) */
  modifie = 'modifié',

  /** visible (calculé) */
  visible = 'visible',
  /** invisible */
  invisible = 'invisible',
  /** secret */
  secret = 'secret',
  /** caché */
  cache = 'caché',
  /** discret */
  discret = 'discret',
  
  /** couvert */
  couvert = 'couvert',
  /** couvrant */
  couvrant = 'couvrant',

  /** accessible (calculé) */
  accessible = 'accessible',
  /** inaccessible */
  inaccessible = 'inaccessible',
  /** décoratif */
  decoratif = 'décoratif',
  /** possédé (calculé) */
  possede = 'possédé',
  /** disponible (calculé) */
  disponible = 'disponible',
  /** occupé (calculé) */
  occupe = 'occupé',
  /** porté (calculé) (→ possédé) */
  porte = 'porté',
  /** enfilé */
  enfile = 'enfilé',
  /** chaussé */
  chausse = 'chaussé',
  /** équipé */
  equipe = 'équipé',
  /** dénombrable (↔ indénombrable) */
  denombrable = 'dénombrable',
  /** indénombrable (↔ dénombrable) */
  indenombrable = 'indénombrable',

  /** unique (≠ multiple, ≠ illimité) */
  unique = 'unique',
  /** multiple (≠ unique) */
  multiple = 'multiple',
  /** illimité (≠ unique) */
  illimite = 'illimité',

  /** mangeable */
  mangeable = 'mangeable',
  /** buvable */
  buvable = 'buvable',
  /** portable (le joueur peut le mettre sur lui, s'habiller avec) */
  portable = 'portable',
  /** enfilable (le joueur peut le mettre sur lui, s'habiller avec) */
  enfilable = 'enfilable',
  /** équipable (le joueur s'équiper de cet objet) */
  equipable = 'équipable',
  /** chaussable (le joueur chausser cet objet) */
  chaussable = 'chaussable',
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
  /** lisible (livre, panneau, …) */
  lisible = 'lisible',
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
  /** adjacent : lieu */
  adjacent = 'adjacent',
  /** lu : objet */
  lu = 'lu',
  /** vide: objet */
  vide = 'vide',

  /** solide: objet (≠ liquide, ≠ gazeux)  */
  solide = 'solide',
  /** liquide (≠ solide, ≠ gazeux)  */
  liquide = 'liquide',
  /** gazeux (≠ solide, ≠ liquide)  */
  gazeux = 'gazeux',

  /** imperméable (↔ perméable) */
  impermeable = 'imperméable',
  /** perméable (↔ imperméable) */
  permeable = 'perméable',


}
