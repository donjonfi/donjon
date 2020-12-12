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


  /**
   * Verbe à l’infinitif.
   * - verbe(1)
   * - ex: marcher
   * - ex: se brosser
   * - ex: s’égosiller
   */
  static readonly xVerbeInfinitif = /^((?:se |s’|s')?\S+(?:ir|er|re))$/i;

  /**
   * Groupe nominal.
   * - Déterminant(1), Nom(2), Épithète(3)
   * - ex: la(1) pomme de terre(2) pourrie(3)
   * - ex: la(1) canne à pèche(2)
   * - ex: le(1) chapeau(2) gris(3)
   * - ex: chapeau(2)
   * - ex: le(1) chapeau(2)
   */
  static readonly xGroupeNominal = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!\(|ne |n’|n'|d’|d'|et |un |de )(\S+))?$/i;

  /** élément générique simple
 * - ex1: Le (1) champignon des bois (2) odorant (3) (champignons des bois)(4) est un légume(5) mangeable(6).
 * - => Déterminant(1), Nom(2), Épithète(3), Féminin et autre forme(4), Classe(5), Attribut(6).
 */
  static readonly xDefinitionTypeElement = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) (?:un|une|des) (\S+)(?:(?: )(.+))?/i;

  /** élément générique positionné par rapport à complément
   * - => determinant(1), nom(2), épithète(3) féminin?(4), type(5), attributs(6), position(7), complément(8)
   * - ex : La (1) {pomme de terre}(2) pourrie(3) (pommes de terre)(4) est un légume(5) pourri(6) {dans le}(7) jardin(8).
   * - ex : Les(1) {torches en bois}(2) enflamées(3) (f)(4) sont des objets(5) maudits(6) {dans le}(7) jardin(8).
   * - ex: L’allée(1) (f)(4) est un lieu(5) {au sud du}(7) départ(8)
   */
  static readonly xPositionElementGeneriqueDefini = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) (?:|(?:un|une|des) (\S+?)(?:(?: )(\S+?))? )?((?:(?:à l(?:’|')intérieur|à l(?:’|')extérieur|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de la |de l(?:’|')|des ))|(?:(?:dans|sur) (?:la |le |l(?:’|')|les |un | une )|de (?:la |l(?:’|'))|du ))(.+)/i;

  /** élément générique positionné par rapport à complément :
   * - ex1: Il y a des pommes de terre anciennes (f, pomme de terre) dans le champ.
   * - => déterminant(1), nom (2), épithète (3), féminin+autre forme(4), position(9), complément(10).
   * - ex2: Une canne à pèche neuve (cannes à pèche) est sur le bord du lac.
   * - => déterminant(5), nom (6), épithète (7), féminin+autre forme(8), position(9), complément(10).
   */
  static readonly xPositionElementGeneriqueIndefini = /^(?:(?:il y a (un |une |des |du |de la |de l(?:’|')|[1-9]\d* )(\S+|(?:\S+ (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’|\()\S+?))?(?:(?: )(\(.+\))?)?)|(?:(un |une |des |du |de l(?:’|'))(\S+|(?:\S+ (?:à|en|de(?: la)?|du|des) \S+))(?:(?: )(\S+))?(?:(?: )(\(.+\))?)? (?:est|sont))) ((?:(?:à l(?:’|')intérieur|à l(?:’|')extérieur|au sud|au nord|à l(?:’|')est|à l(?:’|')ouest|en haut|en bas) (?:du |de la |de l(?:’|')|des ))|(?:(?:dans|sur) (?:la |le |l(?:’|')|les |un |une )))(.+)/i;

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
   * - sa réaction(1) (concernant le)(4) sujet(5) est|vaut(6) valeur(7)
   * - la réaction(2) du|de la|de l' complément(3) (au sujet du|de la)(4) sujet(5) est|vaut(6) valeur(7)
   * - Ex: Sa réaction est "Je viens avec vous.".
   * - Ex: La description du bateau est "C’est un fameux rafio.".
   * - Ex: Sa réaction à propos de la pomme ou des poires est "C’est bon pour la santé.".
   * - Ex: Sa réaction concernant la pomme est : changer le joueur possède la pomme; dire "Je vous la donne !".
   * - Ex: La réaction du capitaine concernant les pirates est "Aïe aïe aïe…".
   * - Ex: La réaction du capitaine concernant les pirates, les méchants hargneux ou les malfrats est "Aïe aïe aïe…"
   * - Ex: La réaction du schérif rouge à propos des pirates, des méchants ou des malfrats est "nrstnrstnrst".
   */

  static readonly xAttribut = /^(?:(?:(?:son|sa|leur) (\S+?))|(?:(?:la |le |l(?:’|'))(\S+?) (?:du |de (?:la |l’|l')|des )(.+?))) (?:(à propos|au sujet|concernant) (?:du |de la |des |la |le |les |l’|l'|un |une |)((?:.+?)(?:(?:,|ou) (?:du |de la |des |la |le |les |l’|l'|un |une |).+?)*) )?(est|vaut)(?:(?: )?\:(?: )?)?( .+|)/i;

  // static readonly xAttribut = /^(?:(?:(?:son|sa) (\S+?))|(?:(?:la |le |l(?:’|'))(\S+?) (?:du |de (?:la |l’|l'))(\S+?))) (?:((?:(?:à propos|au sujet) (?:de (?:la |l’|l')|du |des ))|(?:concernant (?:la |le |les |l’|l')))(\S+) )?(est|vaut)(?:(?: )?\:(?: )?)?( .+|)/i;
  // static readonly xAttribut = /^(?:(?:(?:son|sa) (\S+))|(?:(?:la |le |l(?:’|'))(\S+) (?:du |de la |de l(?:’|'))(\S+))) (est|vaut)( .+|)/i;

  /** capacité -> verbe(1) complément(2) */
  static readonly xCapacite = /^(?:(?:(?:il|elle) permet)|(?:(?:ils|elles) permettent)) (?:de |d(?:’|'))(se \S+|\S+)( .+|)/i;

  /** élément générique ->
   * Les (1) pommes de terre (2) pourries (3) [(f, pomme de terre)]\(4) sont mauves, odorantes et humides (5).
   */
  static readonly xElementSimpleAttribut = /^(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?(?:(?: )(\(.+\))?)? (?:est|sont) ((?!une |un |des )(?:.+[^,])(?:$| et (?:.+[^,]$)|(?:, .+[^,])+ et (?:.+[^,]$)))/i;


  /** nouvelle action
   * - verbe(1) [[à/de/…]\(2) ceci(3)[[ à/de/sur/…]\(4) cela(5)]] est une action[ qui concerne un|une|deux(6) typeObjetA(7) attributObjetA(8) [et un|une(9) typeObjetB(10) attributObjetB(11)]]
   * - ex: Jeter est une action qui concerne un objet possédé.
   * - ex: Examiner est une action qui concerne un objet visible.
   */
  static readonly xAction = /^((?:se |s’|s')?\S+(?:ir|er|re))(?:(?: (\S+))? (ceci)(?:(?: (\S+)) (cela))?)? est une action(?: qui concerne (un|une|deux|la|le) (\S+)(?: (\S+))?(?: et (un|une|la|le) (\S+)(?: (\S+))?)?)?$/i;

  /**
   * Synonymes
   * - interpréter (synonymeA[[, synonymeBCD] et synonymeE])(1) comme original(2)
   * - ex: interpréter Alain comme le capitaine
   * - ex: interpréter Alain et le marin comme le capitaine
   * - ex: interpréter le marin, Alain et le boss comme le capitaine
   * - ex: interpréter marcher comme se déplacer
   * - ex: interpréter marcher, courrir, sauter et danser comme s’exercer
   */
  static readonly xSynonymes = /^interpréter ((?:.+?)(?:(?:, (?:.+?))*(?: et (?:.+?)))?) comme (.+)$/i;

  /** Le joueur peut verbe(1) [déterminant(2) nom(3) epithete(4)]: instructions(5) */
  static readonly xActionSimple = /^Le joueur peut ((?:se |s’|s')?\S+(?:ir|er|re))(?: (le |la |les |l(?:’|')|des |de l(?:’|')|de la |du )(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?(?: )?:(.+)?$/i;

  /** Description d'une action => [refuser|exécuter|terminer]\(1) verbe(2) [ceci(3) [(avec|et|vers) cela(4)]]: instructions(5) */
  static readonly xDescriptionAction = /^(refuser|exécuter|terminer) ((?:se |s’|s')?\S+(?:ir|er|re))(?:(?: \S+)? (ceci)(?:(?: \S+) (cela))?)?\s?:(.+)$/i;

  // INSTRUCTION

  /** condition/événement -> avant|après|remplacer|si\(1) {condition}(2), {conséquences}(3) */
  static readonly rAvantApresRemplacerSi = /^(avant|après|apres|remplacer|si) (.+?)(?:(?: )?(?:,|:))(.+)/i;
  /** condition -> si(1) {condition}(2), {conséquence}(3) */
  static readonly rRefuser = /^(si) (.+)(?:,)(.+)/i;

  /** Tester s'il s'agit d'une section: partie/chapitre/scène du livre. 
   * - ex: Partie "Description du donjon".
   * - ex: Scène "Dans la cuisine".
   */
  static readonly xSection = /^( *)(partie|chapitre|scène)( ?)$/i;

  /** 
   * Généralement, une commande est composée d’un verbe à l’infinitf
   * parfois suivit puis d’un groupe nominal:
   * - aller au nord
   * - aller nord
   * - prendre la chemise rouge
   * - prendre sac
   * - effacer
   * - utiliser la clé rouge avec la porte
   * - utiliser la clé rouge avec la porte verte
   * - donner la pièce au pirate
   * - jeter l’épée
   * - => utiliser(1) la(2) clé(3) rouge(4) \[sur(6) la(7) porte(8) verte(9)](5)
   */
  static readonly xCommandeInfinitif = /^(\S+(?:ir|er|re))(?:(?: (?:avec|sur|au|à|au|vers|dans))? (le |la |les |l'|l’|du |de la|des |un |une |au |à l'|à l’|à la |à )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’)\S+?))?( (avec|sur|au|à|au|vers|dans) (le |la |les |l'|l’|du |de la|des |un |une )?(\S+?|(?:\S+? (?:à |en |de(?: la)? |du |des |d'|d’)\S+?))(?:(?: )((?!d'|d’)\S+?))?)?)?$/i;

  /**
   * Interpréter la commande parler/demander (sens: sujet puis personne)
   * - parler de la fourchette rouge au nain jaune.
   * - discuter de la fourchette avec le nain.
   * - demander la fourchette au nain.
   * - demander fourchettte au nain.
   * - => parler(1) de la(2) clé(3) rouge(4) avec le(5) chevalier(6) blanc(7)
   */
  static readonly xCommandeParlerSujetPers = /^(demander|questionner|interroger|parler|discuter)(?: ((?:(?:(?:à propos )?de |concernant )?(?:l'|l’|la |le ))|de |du |un |une )?(\S+|(?:\S+ (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?) (au |à (?:la |l'|l’)?|avec (?:la |le |l'|l’))(\S+|(?:(?!propos)\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?$/i;

  /**
   * Interpréter la commande parler/demander (sens: personne puis sujet)
   * - parler au nain jaune
   * - parler au nain jaune de la fourchette rouge.
   * - parler au nain jaune de fourchette rouge.
   * - discuter avec nain jaune de la fourchette rouge.
   * - demander au nain jaune la fourchette rouge.
   * - interroger le nain jaune sur la fourchette rouge.
   * - questionner le nain jaune à propos de la fourchette rouge.
   * - => demander(1) au(2) chevalier(3) blanc(4) la(5) clé(6) rouge(7)
   */
  static readonly xCommandeParlerPersSujet = /^(demander|questionner|interroger|parler|discuter) (au |à (?:la |l'|l’)?|(?:avec )?(?:la |le |l'|l’))(\S+|(?:\S+ (?:à (?!propos)|en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )((?!d'|d’|du|de|des|au|à|concernant|sur|un|une|la|le|les)\S+))?(?: ((?:(?:sur |concernant |de )?(?:l'|l’|la |le ))|à propos (?:de (?:l'|l’|la )|du )|du |de |un |une )?((?!au)\S+|(?:\S+ (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)?$/i;

  /** 
   * il y a aussi des commandes spéciales:
   * - position
   * - sorties
   * - inventaire
   * - aide
   * - aide parler
   */
  static readonly xCommandeSpeciale = /^(position|sorties|inventaire|aide)(?: (\S+))?$/i;

  /**
   * [si|avant|après] (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela))(1) verbe(5) [pas|plus(6)] complément(7)
   */
  static readonly xCondition = /^(?:si |avant |après |apres )?((?:(le |la |l(?:’|')|les )(\S+|(?:\S+ (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+))(?:(?: )((?!d'|d’)\S+))?)|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|vaut|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?$/i;

  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) (ne|n’) verbe(5) (ni|soit)(6) complément1(7) (ni|soit)(8) complément2(9) [(ni|soit) complément3(10)]
   */
  static readonly xConditionNiSoit = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|contient)(?: (ni|soit) )(?:(.+?))(?: (\6) )(.+?)(?:(?: \6 )(.+?))?$/i;

  /**
   *  [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) (6)complément1(7) (et|ou)(8) complément2(9) [(et|ou) complément3(10)]
   */
  static readonly xConditionOuEt = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (est|vaut|possède|contient)( )(.+?)(?: (et|ou) )(.+?)(?:(?: \8 )(.+?))?$/i;

  /**
   * [si] (le|la|les|…(2) xxx(3) yyy(4)|(ceci|cela))(1) verbe(5) [pas]\(6) complément1(7) (ainsi que|ou bien|(mais pas|plus|bien))(8) complément2(9)
   * - Si le joueur ne possède pas le jouet mais bien la trompette
   * - le seau contient la mèche mais pas le briquet
   * - Si ceci est vivant mais pas une personne
   * - le joueur possède la mèche ou le briquet
   * - Si l’inventaire contient le sucre et la farine
   */
  static readonly xConditionMaisPasEtOu = /^(?:si )?((?:(le |la |les |l'|l’|du |de (?:la|l’|l')|des |un |une )(\S+)( (?!ne )\S+?)?)|ceci|cela) (?:n(?:'|’)|ne )?(est|vaut|possède|contient)(?: (pas))? (?:(.+?)) (et|ou|mais (?:pas|plus|bien)) (.+?)$/i;

  // /**
  //  * si (le|la|les|...(2) xxx(3) yyy(4))|(ceci|cela)(1) verbe(5) pas(6) complément(7) (:|,) conséquences(8)
  //  */
  // static readonly xSiConditionConsequences = /^(?:si )((le |la |les |l'|l’|du |de la|des |un |une )(\S+)( \S+)?|ceci|cela) (?:(?:n(?:'|’)|ne )?((?:se \S+)|est|possède|contient|commence|réagit)(?: (pas|plus))?)(?: (.+))?(?: )?(?:,|:)(.+)$/i;

  /** 
   * si aucun(1) complément(2) pour (le|la|les|...(4) xxx(5) yyy(6))|(ceci|cela)(3)
   */
  static readonly xConditionAucunPour = /^(?:si )?(aucun(?:e)?) (\S+) pour ((le |la |les |l'|l’|du |de la|des |un |une )(\S+)(?:(?: )(\S+))?|ceci|cela)$/i;


  /**
   * si (condition)(1) :|, (consequences)(2)
   */
  static readonly xSeparerSiConditionConsequences = /^si (.+?)(?: )?(?::|,)(?: )?(.+)$/i;

  /**
   * sinon(1) :|, (consequences)(2)
   */
  static readonly xSeparerSinonConsequences = /^(sinon)(?: )?(?::|,)?(?: )?(.+)$/i;

  /**
   * Instruction : verbe + complément
   * - Dire '.......'
   * - Remplacer ....... par .....
   * - Changer ..........
   */
  static readonly xInstruction = /^(\S+(?:ir|er|re)) (.+|)$/i;

  /**
   * Phrase simple avec un verbe conjugé.
   * [le|la|les|...]\(1) (nom|ceci|cela)\(2) [attribut]\(3) [ne|n’|n'] ([se] verbe conjugé)(4) [pas|plus]\(5) complément(6).
   * - la porte secrète n’est plus fermée
   * - la canne à pèche rouge est ouverte
   * - ceci n’est plus vide
   * - cela se trouve dans le jardin
   * - les chauves-souris ne sont pas fixées
   * - la porte close est ouverte
   */
  static readonly xSuiteInstructionPhraseAvecVerbeConjugue = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(?!ne|n’|n')(\S+))? (?:ne |n(?:'|’))?(?!vers)((?:se (?:trouve(?:nt)?))|(?:est|sont|vaut|valent|porte(?:nt)?|contien(?:nen)?t|possède(?:nt)?))(?: (pas|plus))?(?: (.+))?$/i;

  /**
   * - Manger tomate(2).
   * - Déplacer le(1) trésor(2) vers(4) le(5) joueur(6).
   * - Utiliser l’(1)arc à flèches(2) rouillé(3) avec(4) la(5) flèche(6) rouge(7).
   * - => déterminant(1) nom(2) épithète(3) préposition(4) déterminant(5) nom(6) épithète(7).
   */
  static readonly xComplementInstruction1ou2elements = /^(le |la |l(?:’|')|les )?(\S+?|(?:\S+? (?:à |en |aux |de (?:la |l'|l’)?|du |des |d'|d’)\S+?))(?:(?: )(\S+))?(?: (vers|avec|sur|sous) (le |la |l(?:’|')|les )?(\S+|(?:\S+ (?:à |en |de(?: la)? |du |des |d'|d’)\S+))(?:(?: )(\S+))?)?$/i;
  /**
   * Son(1) sac(2) est(3) ouvert(4)
   */
  static readonly xPhraseSimplePronom = /^(son |sa |ses )(\S+) ((?:se \S+)|\S+)( .+|)$/i;

  /** L'aide pour l'action manger(1) est  */
  static readonly xAide = /^L(?:'|’)aide pour (?:la commande|l(?:'|’)action) ((?:se |s'|s’)?.+) est(?: *)/i;

}