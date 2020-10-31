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
  //   ʔ − virgule dans les comentaires
  static readonly caractereVirgule = 'ʔ';
  static readonly xCaractereVirgule = /ʔ/g;
  //   ʖ − point virgule dans les commentaires
  static readonly caracterePointVirgule = 'ʖ';
  static readonly xCaracterePointVirgule = /ʖ/g;

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


  /** pronom démonstratif
   * - C’est/sont un/des(1), type(2), attributs(3)
   * - Ex: C’est une personne fachée.
  */
  static readonly xPronomDemonstratif = /^((?:c(?:’|')est (?:un|une))|(?:ce sont des)) (\S+)( .+|)/i;

  /** pronom personnel
   * - attributs(1)
   * - Ex: Il est faché, grand et fort.
   * - Ex: Celui-ci grand.
   */
  static readonly xPronomPersonnelAttribut = /^(?:(?:(?:il|elle|celui-ci|celle-ci) est)|(?:(?:ils|elles|celles-ci|ceux-ci) sont))((?!une |un |des ) (?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

  /** attribut
   * - son|sa propriété(1) est|vaut(6) valeur(7)
   * - la|le|l' proriété(2) du|de la|de l' complément(3) est|vaut(6) valeur(7)
   * - sa réaction(1) concernant le(4) sujet(5) est|vaut(6) valeur(7)
   * - la réaction(2) du|de la|de l' complément(3) au sujet du|de la(4) sujet(5) est|vaut(6) valeur(7)
   * - Ex: Sa réaction est "Je viens avec vous.".
   * - Ex: La description du bateau est "C’est un fameux rafio.".
   * - Ex: Sa réaction à propos de la pomme est "C’est bon pour la santé.".
   * - Ex: Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !".
   * - Ex: La réaction du capitaine concernant les pirates est "Aïe aïe aïe…".
   * - Ex: La réaction du capitaine au sujet des pirates est "Aïe aïe aïe…".
   */
  static readonly xAttribut = /^(?:(?:(?:son|sa) (\S+))|(?:(?:la |le |l(?:’|'))(\S+) (?:du |de (?:la|l’|l'))(\S+))) (?:((?:(?:à propos|au sujet) (?:de (?:la |l’|l')|du |des ))|(?:concernant (?:la |le |les |l’|l')))(\S+) )?(est|vaut)(?:(?: )?\:(?: )?)?( .+|)/i;
  // static readonly xAttribut = /^(?:(?:(?:son|sa) (\S+))|(?:(?:la |le |l(?:’|'))(\S+) (?:du |de la |de l(?:’|'))(\S+))) (est|vaut)( .+|)/i;

  /** capacité -> verbe(1) complément(2) */
  static readonly xCapacite = /^(?:(?:(?:il|elle) permet)|(?:(?:ils|elles) permettent)) (?:de |d(?:’|'))(se \S+|\S+)( .+|)/i;

  /** élément générique ->
   * Les (1) pommes de terre (2) pourries (3) [(f, pomme de terre)]\(4) sont mauves, odorantes et humides (5).
   */
  static readonly xElementSimpleAttribut = /^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) ((?!une |un |des )(?:.+[^,])(?:$| et (?:.+[^,]$)|(?:, .+[^,])+ et (?:.+[^,]$)))/i;


  /** nouvelle action 
   * - verbe(1) [[à/de/…]\(2) ceci(3)[[ à/de/sur/…]\(4) cela(5)]] est une action[ qui concerne un|une|deux(6) typeObjetA(7) attributObjetA(8) [et un|une(9) typeObjetB(10) attributObjetB(11)]]
   * - ex: Jeter est une action qui concerne un objet possédé.
   * - ex: Examiner est une action qui concerne un objet visible.
   */
  // static readonly xAction = /^((?:se )?\S+(?:ir|er|re))(?:(?: \S+)? (ceci)(?:(?: \S+) (cela))?)? est une action(?: qui concerne (un|une|deux) (\S+)(?: (\S+))?(?: et (un|une) (\S+)(?: (\S+))?)?)?$/i;
  static readonly xAction = /^((?:se )?\S+(?:ir|er|re))(?:(?: (\S+))? (ceci)(?:(?: (\S+)) (cela))?)? est une action(?: qui concerne (un|une|deux) (\S+)(?: (\S+))?(?: et (un|une) (\S+)(?: (\S+))?)?)?$/i;
  /**
   * nouvelle action spéciale => mot_clé (1) est une action spéciale.
   */
  // static readonly xActionSpeciale = /^(\S+) est une action spéciale(?: )?:(.+)?$/i;
  /** Le joueur peut verbe(1) [déterminant(2) nom(3) epithete(4)]: instructions(5) */
  static readonly xActionSimple = /^Le joueur peut ((?:se )?\S+(?:ir|er|re))(?: (le |la |les |l(?:’|')|des |de l(?:’|')|de la |du )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?(?: )?:(.+)?$/i;

  /** Description d'une action => [refuser|exécuter|terminer]\(1) verbe(2) [ceci(3) [(avec|et) cela(4)]]: instructions(5) */
  static readonly xDescriptionAction = /^(refuser|exécuter|terminer) ((?:se )?\S+(?:ir|er|re))(?:(?: \S+)? (ceci)(?:(?: \S+) (cela))?)?\s?:(.+)$/i;

  // INSTRUCTION

  /** condition/événement -> avant|après|remplacer|si\(1) {condition}(2), {conséquences}(3) */
  static readonly rAvantApresRemplacerSi = /^(avant|après|apres|remplacer|si) (.+)(?:,|:)(.+)/i;
  /** condition -> si(1) {condition}(2), {conséquence}(3) */
  static readonly rRefuser = /^(si) (.+)(?:,)(.+)/i;



}