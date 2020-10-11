export class ExprReg {

  // Caractères réservés:
  // Ƶ et ƶ − commentaire
  static readonly caractereDebutCommentaire = 'Ƶ';
  static readonly caractereFinCommentaire = 'ƶ';
  static readonly xCaracteresCommentaire = /Ƶ|ƶ/g;
  static readonly xCaractereDebutCommentaire = /Ƶ/g;
  static readonly xCaractereFinCommentaire = /ƶ/g;
  //   Ʒ − retour à la ligne
  static readonly caractereRetourLigne = 'Ʒ';
  static readonly xCaractereRetourLigne = /Ʒ/g;


  /** élément générique simple
 * - ex1: Le (1) champignon des bois (2) odorant (3) (champignons des bois)(4) est un légume(5) mangeable(6).
 * - => Déterminant(1), Nom(2), Épithète(3), Féminin et autre forme(4), Classe(5), Attribut(6).
 */
  static readonly xDefinitionTypeElement = /^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) (?:un|une|des) (\S+)(?:(?: )(.+))?/i;

  /** élément générique positionné par rapport à complément
   * - ex1: La (1) pomme de terre(2) pourrie(3) (pommes de terre)(4) est un légume(5) pourri(6) dans le(7) jardin(8).
   * - => determinant(1), nom(2), épithète(3) féminin?(4), type(5), attributs(6), position(7), complément(8)
   */
  static readonly xPositionElementGeneriqueDefini = /^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) (?:|(?:un|une|des) (\S+?)(?:(?: )(\S+?))? )?((?:(?:à l(?:’|')intérieur|à l(?:’|')extérieur|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de la |de l(?:’|')|des ))|(?:(?:dans|sur) (?:la |le |l(?:’|')|les |un | une )|de (?:la |l(?:’|'))|du ))(.+)/i;

  /** élément générique positionné par rapport à complément :
   * - ex1: Il y a des pommes de terre anciennes (f, pomme de terre) dans le champ.
   * - => déterminant(1), nom (2), épithète (3), féminin+autre forme(4), position(9), complément(10).
   * - ex2: Une canne à pèche neuve (cannes à pèche) est sur le bord du lac.
   * - => déterminant(5), nom (6), épithète (7), féminin+autre forme(8), position(9), complément(10).
   */
  static readonly xPositionElementGeneriqueIndefini = /^(?:(?:il y a (un |une |des |du |de la |de l(?:’|')|[1-9]\d* )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)?)|(?:(un |une |des |du |de l(?:’|'))(\S+|(?:\S+ (?:à|en|de(?: la)?|du|des) \S+))(?:(?: )(\S+))?(?:(?: )(\(.+\))?)? (?:est|sont))) ((?:(?:à l(?:’|')intérieur|à l(?:’|')extérieur|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de la |de l(?:’|')|des ))|(?:(?:dans|sur) (?:la |le |l(?:’|')|les |un |une )))(.+)/i;

  /** pronom personnel position -> position(1), complément(2) */
  static readonly xPronomPersonnelPosition = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont)) (?:(?:(à l(?:’|')intérieur|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de la |de l(?:’|')|des ))|(?:(?:dans|sur) (?:la |le |les |l(?:’|')|un |une )|de (?:la |l(?:’|'))|du ))(.+)/i;


  /** pronom démonstratif -> determinant(1), type(2), attributs(3) */
  static readonly xPronomDemonstratif = /^((?:c(?:’|')est (?:un|une))|(?:ce sont des)) (\S+)( .+|)/i;

  /** pronom personnel -> attributs(1) */
  static readonly xPronomPersonnelAttribut = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont))((?!une |un |des ) (?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

  /** attribut
   *  - son|sa propriété(1) est|vaut(4) valeur(5)
   *  - la|le|l' proriété(2) du|de la|de l' complément(3) est|vaut(4) valeur(5)
   */
  static readonly xAttribut = /^(?:(?:(?:son|sa) (\S+))|(?:(?:la |le |l(?:’|'))(\S+) (?:du |de la |de l(?:’|'))(\S+))) (est|vaut)( .+|)/i;

  /** capacité -> verbe(1) complément(2) */
  static readonly xCapacite = /^(?:(?:(?:il|elle) permet)|(?:(?:ils|elles) permettent)) (?:de |d(?:’|'))(se \S+|\S+)( .+|)/i;

  /** élément générique ->
   * Les (1) pommes de terre (2) pourries (3) [(f, pomme de terre)]\(4) sont mauves, odorantes et humides (5).
   */
  static readonly xElementSimpleAttribut = /^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) ((?!une |un |des )(?:.+[^,])(?:$| et (?:.+[^,]$)|(?:, .+[^,])+ et (?:.+[^,]$)))/i;


  /** nouvelle action => verbe(1) [ ceci(2)[(?: \S+) cela(3)]] est une action[ qui concerne un|une|deux(4) typeObjetA(5) attributObjetA(6) [et un|une(7) typeObjetB(8) attributObjetB(9)]]
   * ex: Jeter est une action qui concerne un objet possédé.
   * ex: Examiner est une action qui concerne un objet visible.
   */
  static readonly xAction = /^((?:se )?\S+(?:ir|er|re))(?: (ceci)(?:(?: \S+) (cela))?)? est une action(?: qui concerne (un|une|deux) (\S+)(?: (\S+))?(?: et (un|une) (\S+)(?: (\S+))?)?)?$/i;
  /**
   * nouvelle action spéciale => mot_clé (1) est une action spéciale.
   */
  // static readonly xActionSpeciale = /^(\S+) est une action spéciale(?: )?:(.+)?$/i;
  /** Le joueur peut verbe(1) [déterminant(2) nom(3) epithete(4)]: instructions(5) */
  static readonly xActionSimple = /^Le joueur peut ((?:se )?\S+(?:ir|er|re))(?: (le |la |les |l(?:’|')|des |de l(?:’|')|de la |du )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?:(.+)?$/i;

  /** Description d'une action => [refuser|exécuter|finaliser]\(1) verbe(2) [ceci(3) [(avec|et) cela(4)]]: instructions(5) */
  static readonly xDescriptionAction = /^(refuser|exécuter|finaliser) ((?:se )?\S+(?:ir|er|re))(?: (ceci)(?:(?: \S+) (cela))?)?\s?:(.+)$/i;

  // INSTRUCTION

  /** condition/événement -> avant|après|remplacer|si\(1) {condition}(2), {conséquences}(3) */
  static readonly rAvantApresRemplacerSi = /^(avant|après|apres|remplacer|si) (.+)(?:,|:)(.+)/i;
  /** condition -> si(1) {condition}(2), {conséquence}(3) */
  static readonly rRefuser = /^(si) (.+)(?:,)(.+)/i;



}